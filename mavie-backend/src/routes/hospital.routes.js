const express = require("express");
const pool = require("../db");
const authMiddleware = require("../middleware/auth.middleware");
const { publishEmergencyEvent } = require("../services/emergencyRealtime.service");

const router = express.Router();

async function requireHospitalUser(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT user_id, role FROM users WHERE user_id = $1`,
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "User not found" });
    }

    const role = result.rows[0].role;

    if (!["hospital", "admin"].includes(role)) {
      return res.status(403).json({
        message: "Only hospital/admin users can access this resource",
      });
    }

    next();
  } catch (error) {
    console.error("Hospital auth check error:", error);
    res.status(500).json({ message: "Server error during hospital auth check" });
  }
}

// GET all emergency events for hospital dashboard
router.get(
  "/emergency-events",
  authMiddleware,
  requireHospitalUser,
  async (req, res) => {
    try {
      const result = await pool.query(
        `
        SELECT
          ee.emergency_event_id,
          ee.user_id AS patient_user_id,
          u.username AS patient_name,
          u.email AS patient_email,
          ee.status,
          ee.latitude,
          ee.longitude,
          ee.location_text,
          ee.details,
          ee.created_at,
          ee.resolved_at,
          ee.accepted_by_user_id,
          ee.accepted_at
        FROM emergency_events ee
        JOIN users u ON u.user_id = ee.user_id
        ORDER BY ee.created_at DESC
        LIMIT 50
        `
      );

      res.json({
        events: result.rows,
      });
    } catch (error) {
      console.error("Get hospital emergency events error:", error);
      res.status(500).json({
        message: "Failed to load hospital emergency events",
        error: error.message,
      });
    }
  }
);

// Hospital Accept / Reject
router.post(
  "/emergency-events/:eventId/respond",
  authMiddleware,
  requireHospitalUser,
  async (req, res) => {
    try {
      const { eventId } = req.params;
      const { responseStatus } = req.body;

      if (!["Accepted", "Rejected"].includes(responseStatus)) {
        return res.status(400).json({
          message: "responseStatus must be Accepted or Rejected",
        });
      }

      const eventResult = await pool.query(
        `
        SELECT emergency_event_id, user_id
        FROM emergency_events
        WHERE emergency_event_id = $1
        `,
        [eventId]
      );

      if (eventResult.rows.length === 0) {
        return res.status(404).json({ message: "Emergency event not found" });
      }

      await pool.query(
        `
        INSERT INTO emergency_event_responses
          (emergency_event_id, responder_user_id, response_status)
        VALUES ($1, $2, $3)
        ON CONFLICT (emergency_event_id, responder_user_id)
        DO UPDATE SET
          response_status = EXCLUDED.response_status,
          responded_at = CURRENT_TIMESTAMP
        `,
        [eventId, req.user.userId, responseStatus]
      );

      const eventStatus = responseStatus === "Accepted" ? "Acknowledged" : "Cancelled";

await pool.query(
  `
  UPDATE emergency_events
  SET
    status = $1,
    accepted_by_user_id = CASE WHEN $2 = 'Accepted' THEN $3 ELSE accepted_by_user_id END,
    accepted_at = CASE WHEN $2 = 'Accepted' THEN CURRENT_TIMESTAMP ELSE accepted_at END,
    resolved_at = CASE WHEN $2 = 'Rejected' THEN CURRENT_TIMESTAMP ELSE resolved_at END
  WHERE emergency_event_id = $4
  `,
  [eventStatus, responseStatus, req.user.userId, eventId]
);

      publishEmergencyEvent("emergency:updated", eventId).catch((error) => {
        console.error("Emergency realtime publish failed:", error.message);
      });

      res.json({
        message: `Emergency event ${responseStatus.toLowerCase()} successfully`,
      });
    } catch (error) {
      console.error("Hospital emergency response error:", error);
      res.status(500).json({
        message: "Failed to respond to emergency event",
        error: error.message,
      });
    }
  }
);

// Hospital: view patient medication history
router.get("/patients/:patientId/medication-history", authMiddleware, requireHospitalUser, async (req, res) => {
  try {
    const { patientId } = req.params;

    const patientResult = await pool.query(
      `
      SELECT
        u.user_id,
        u.username,
        u.email,
        hp.date_of_birth,
        hp.blood_type,
        hp.allergies,
        hp.conditions,
        hp.emergency_notes,
        hp.home_address
      FROM users u
      LEFT JOIN health_profiles hp ON hp.user_id = u.user_id
      WHERE u.user_id = $1
      `,
      [patientId]
    );

    if (patientResult.rows.length === 0) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const historyResult = await pool.query(
      `
      SELECT
        s.schedule_id,
        s.rxnorm_id,
        s.dosage,
        s.instructions,
        s.frequency_hours,
        s.next_dose_time,
        s.active,

        m.generic_name,
        m.brand_name,
        m.form,
        m.strength,

        ml.log_id,
        ml.scheduled_time,
        ml.taken_at,
        ml.status AS log_status,
        ml.note
      FROM schedules s
      LEFT JOIN medications m ON m.rxnorm_id = s.rxnorm_id
      LEFT JOIN medication_logs ml ON ml.schedule_id = s.schedule_id
      WHERE s.user_id = $1
      ORDER BY
        COALESCE(ml.scheduled_time, s.next_dose_time) DESC
      LIMIT 50
      `,
      [patientId]
    );

    res.json({
      patient: patientResult.rows[0],
      history: historyResult.rows,
    });
  } catch (error) {
    console.error("Get hospital patient history error:", error);
    res.status(500).json({
      message: "Failed to load patient medication history",
      error: error.message,
    });
  }
});module.exports = router;
