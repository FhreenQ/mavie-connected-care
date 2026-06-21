const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const pool = require("../db");

let io;

function getTokenFromSocket(socket) {
  const authToken = socket.handshake.auth?.token;
  const headerToken = socket.handshake.headers?.authorization;
  const rawToken = authToken || headerToken;

  if (typeof rawToken !== "string") return null;
  return rawToken.replace(/^Bearer\s+/i, "");
}

function initializeEmergencyRealtime(httpServer) {
  io = new Server(httpServer, {
    cors: {
      // Local mobile/web clients can run on different development origins.
      // Production should replace this with the deployed MaVie client origins.
      origin: true,
      methods: ["GET", "POST"],
    },
  });

  io.use((socket, next) => {
    const token = getTokenFromSocket(socket);
    if (!token) return next(new Error("Authentication token is required."));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded?.userId) return next(new Error("Invalid authentication token."));

      socket.data.user = {
        userId: decoded.userId,
        role: String(decoded.role || "").toLowerCase(),
      };
      next();
    } catch {
      next(new Error("Invalid or expired authentication token."));
    }
  });

  io.on("connection", (socket) => {
    const { userId, role } = socket.data.user;
    socket.join(`user:${userId}`);

    if (role === "hospital" || role === "admin") {
      socket.join("hospital-emergency");
    }
  });

  return io;
}

async function getEmergencyPayload(eventId) {
  const result = await pool.query(
    `SELECT ee.emergency_event_id,
            ee.user_id,
            ee.triggered_by,
            ee.status,
            ee.latitude,
            ee.longitude,
            ee.location_text,
            ee.details,
            ee.created_at,
            ee.resolved_at,
            u.username AS patient_username
     FROM emergency_events ee
     JOIN users u ON u.user_id = ee.user_id
     WHERE ee.emergency_event_id = $1`,
    [eventId]
  );

  const event = result.rows[0];
  if (!event) return null;

  return {
    ...event,
    patient_user_id: event.user_id,
    patient_name: event.patient_username,
  };
}

async function getEmergencyRecipientIds(patientId) {
  const result = await pool.query(
    `SELECT DISTINCT cpl.caregiver_user_id
     FROM caregiver_patient_links cpl
     JOIN users u ON u.user_id = cpl.caregiver_user_id
     WHERE cpl.patient_user_id = $1
       AND cpl.active = TRUE
       AND cpl.can_receive_emergency_alerts = TRUE
       AND LOWER(u.role::text) IN ('nurse', 'caregiver')`,
    [patientId]
  );

  return result.rows.map((row) => row.caregiver_user_id);
}

async function publishEmergencyEvent(eventName, eventId) {
  if (!io) return;

  const event = await getEmergencyPayload(eventId);
  if (!event) return;

  const recipientIds = await getEmergencyRecipientIds(event.user_id);
  recipientIds.forEach((userId) => {
    io.to(`user:${userId}`).emit(eventName, event);
  });

  // The patient receives only events for their own record. Hospital access is
  // governed by its existing authenticated dashboard role check.
  io.to(`user:${event.user_id}`).emit(eventName, event);
  io.to("hospital-emergency").emit(eventName, event);
}

module.exports = {
  initializeEmergencyRealtime,
  publishEmergencyEvent,
};
