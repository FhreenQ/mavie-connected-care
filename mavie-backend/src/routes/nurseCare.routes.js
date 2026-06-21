const express = require("express");
const pool = require("../db");
const authMiddleware = require("../middleware/auth.middleware");
const { requireNurseAppRole } = require("../middleware/nurseRole.middleware");
const { publishEmergencyEvent } = require("../services/emergencyRealtime.service");

const router = express.Router();
const logStatuses = new Set(["Taken", "Skipped", "Missed", "Late"]);

router.use(authMiddleware, requireNurseAppRole);

async function getPatientLink(patientId, caregiverId, permissionColumn = null) {
  const permissionClause = permissionColumn ? `AND ${permissionColumn} = TRUE` : "";
  const result = await pool.query(
    `SELECT link_id, patient_user_id, caregiver_user_id, relationship,
            can_view_schedule, can_view_logs, can_manage_schedule,
            can_receive_emergency_alerts
     FROM caregiver_patient_links
     WHERE patient_user_id = $1
       AND caregiver_user_id = $2
       AND active = TRUE
       ${permissionClause}`,
    [patientId, caregiverId]
  );

  return result.rows[0] || null;
}

async function requirePatientLink(req, res, patientId, permissionColumn = null) {
  const link = await getPatientLink(patientId, req.user.userId, permissionColumn);

  if (!link) {
    res.status(403).json({
      message: "You do not have the required active care-link permission for this patient.",
    });
    return null;
  }

  return link;
}

async function getPatientProfileForNurse(patientId, nurseId) {
  const result = await pool.query(
    `SELECT
        u.user_id,
        u.username,
        u.email,
        hp.date_of_birth,
        hp.blood_type,
        hp.allergies,
        hp.conditions,
        hp.emergency_notes,
        hp.home_address,
        np.age,
        np.gender,
        np.room,
        np.notes,
        np.emergency_contact_summary
     FROM users u
     LEFT JOIN health_profiles hp ON hp.user_id = u.user_id
     LEFT JOIN nurse_patient_notes np
       ON np.patient_user_id = u.user_id
      AND np.nurse_user_id = $2
     WHERE u.user_id = $1`,
    [patientId, nurseId]
  );

  return result.rows[0] || null;
}

router.get("/me/profile", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.user_id, u.username, u.email, u.role, u.timezone,
              np.phone, np.department, np.ward, np.shift
       FROM users u
       LEFT JOIN nurse_profiles np ON np.user_id = u.user_id
       WHERE u.user_id = $1`,
      [req.user.userId]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ message: "Nurse profile not found." });
    }

    res.json({ message: "Nurse profile retrieved successfully", profile: result.rows[0] });
  } catch (error) {
    console.error("Get nurse profile error:", error);
    res.status(500).json({ message: "Server error while retrieving nurse profile.", error: error.message });
  }
});

router.put("/me/profile", async (req, res) => {
  const client = await pool.connect();

  try {
    const { name, email, phone, department, ward, shift } = req.body;
    await client.query("BEGIN");

    const userResult = await client.query(
      `UPDATE users
       SET username = COALESCE($1, username),
           email = COALESCE($2, email)
       WHERE user_id = $3
       RETURNING user_id, username, email, role, timezone`,
      [name?.trim() || null, email?.trim() || null, req.user.userId]
    );

    const profileResult = await client.query(
      `INSERT INTO nurse_profiles (user_id, phone, department, ward, shift)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id) DO UPDATE
       SET phone = EXCLUDED.phone,
           department = EXCLUDED.department,
           ward = EXCLUDED.ward,
           shift = EXCLUDED.shift,
           updated_at = CURRENT_TIMESTAMP
       RETURNING phone, department, ward, shift`,
      [req.user.userId, phone?.trim() || null, department?.trim() || null, ward?.trim() || null, shift?.trim() || null]
    );

    await client.query("COMMIT");
    res.json({
      message: "Nurse profile updated successfully",
      profile: { ...userResult.rows[0], ...profileResult.rows[0] },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Update nurse profile error:", error);
    res.status(error.code === "23505" ? 409 : 500).json({
      message: error.code === "23505" ? "That email is already registered." : "Server error while updating nurse profile.",
      error: error.message,
    });
  } finally {
    client.release();
  }
});

router.get("/patients/:patientId/profile", async (req, res) => {
  try {
    const { patientId } = req.params;
    const link = await requirePatientLink(req, res, patientId);
    if (!link) return;

    const patient = await getPatientProfileForNurse(patientId, req.user.userId);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found." });
    }

    res.json({ message: "Patient profile retrieved successfully", patient, link });
  } catch (error) {
    console.error("Get nurse patient profile error:", error);
    res.status(500).json({ message: "Server error while retrieving patient profile.", error: error.message });
  }
});

router.put("/patients/:patientId/profile", async (req, res) => {
  const client = await pool.connect();

  try {
    const { patientId } = req.params;
    const link = await getPatientLink(patientId, req.user.userId);
    if (!link) {
      return res.status(403).json({ message: "You do not have an active care link for this patient." });
    }

    const { name, age, gender, condition, room, allergies, emergencyContact, notes } = req.body;
    await client.query("BEGIN");

    await client.query(
      `UPDATE users
       SET username = COALESCE($1, username)
       WHERE user_id = $2`,
      [name?.trim() || null, patientId]
    );

    await client.query(
      `INSERT INTO health_profiles (user_id, allergies, conditions)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE
       SET allergies = EXCLUDED.allergies,
           conditions = EXCLUDED.conditions,
           updated_at = CURRENT_TIMESTAMP`,
      [patientId, allergies?.trim() || null, condition?.trim() || null]
    );

    await client.query(
      `INSERT INTO nurse_patient_notes
       (nurse_user_id, patient_user_id, age, gender, room, notes, emergency_contact_summary)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (nurse_user_id, patient_user_id) DO UPDATE
       SET age = EXCLUDED.age,
           gender = EXCLUDED.gender,
           room = EXCLUDED.room,
           notes = EXCLUDED.notes,
           emergency_contact_summary = EXCLUDED.emergency_contact_summary,
           updated_at = CURRENT_TIMESTAMP`,
      [
        req.user.userId,
        patientId,
        age?.trim() || null,
        gender?.trim() || null,
        room?.trim() || null,
        notes?.trim() || null,
        emergencyContact?.trim() || null,
      ]
    );

    await client.query("COMMIT");
    const patient = await getPatientProfileForNurse(patientId, req.user.userId);
    res.json({ message: "Patient profile updated successfully", patient });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Update nurse patient profile error:", error);
    res.status(500).json({ message: "Server error while updating patient profile.", error: error.message });
  } finally {
    client.release();
  }
});

router.get("/patients/:patientId/emergency-contacts", async (req, res) => {
  try {
    const { patientId } = req.params;
    const link = await requirePatientLink(req, res, patientId, "can_receive_emergency_alerts");
    if (!link) return;

    const result = await pool.query(
      `SELECT contact_id, contact_name, relationship, phone_number, email,
              priority_order, notify_by_sms, notify_by_email, active, created_at
       FROM emergency_contacts
       WHERE user_id = $1 AND active = TRUE
       ORDER BY priority_order ASC, created_at DESC`,
      [patientId]
    );

    res.json({ message: "Patient emergency contacts retrieved successfully", contacts: result.rows });
  } catch (error) {
    console.error("Get nurse patient contacts error:", error);
    res.status(500).json({ message: "Server error while retrieving emergency contacts.", error: error.message });
  }
});

router.post("/patients/:patientId/emergency-contacts", async (req, res) => {
  try {
    const { patientId } = req.params;
    const link = await requirePatientLink(req, res, patientId, "can_receive_emergency_alerts");
    if (!link) return;

    const { contactName, relationship, phoneNumber, email, priorityOrder, notifyBySms, notifyByEmail } = req.body;
    if (!contactName?.trim() || !phoneNumber?.trim()) {
      return res.status(400).json({ message: "contactName and phoneNumber are required." });
    }

    const result = await pool.query(
      `INSERT INTO emergency_contacts
       (user_id, contact_name, relationship, phone_number, email, priority_order, notify_by_sms, notify_by_email)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING contact_id, contact_name, relationship, phone_number, email,
                 priority_order, notify_by_sms, notify_by_email, active, created_at`,
      [
        patientId,
        contactName.trim(),
        relationship?.trim() || null,
        phoneNumber.trim(),
        email?.trim() || null,
        Number(priorityOrder) || 1,
        notifyBySms ?? true,
        notifyByEmail ?? false,
      ]
    );

    res.status(201).json({ message: "Patient emergency contact created successfully", contact: result.rows[0] });
  } catch (error) {
    console.error("Create nurse patient contact error:", error);
    res.status(500).json({ message: "Server error while creating emergency contact.", error: error.message });
  }
});

router.put("/patients/:patientId/emergency-contacts/:contactId", async (req, res) => {
  try {
    const { patientId, contactId } = req.params;
    const link = await requirePatientLink(req, res, patientId, "can_receive_emergency_alerts");
    if (!link) return;

    const { contactName, relationship, phoneNumber, email, priorityOrder, notifyBySms, notifyByEmail } = req.body;
    const result = await pool.query(
      `UPDATE emergency_contacts
       SET contact_name = COALESCE($1, contact_name),
           relationship = COALESCE($2, relationship),
           phone_number = COALESCE($3, phone_number),
           email = COALESCE($4, email),
           priority_order = COALESCE($5, priority_order),
           notify_by_sms = COALESCE($6, notify_by_sms),
           notify_by_email = COALESCE($7, notify_by_email)
       WHERE contact_id = $8 AND user_id = $9 AND active = TRUE
       RETURNING contact_id, contact_name, relationship, phone_number, email,
                 priority_order, notify_by_sms, notify_by_email, active, created_at`,
      [
        contactName?.trim() || null,
        relationship?.trim() || null,
        phoneNumber?.trim() || null,
        email?.trim() || null,
        priorityOrder ?? null,
        notifyBySms ?? null,
        notifyByEmail ?? null,
        contactId,
        patientId,
      ]
    );

    if (!result.rows[0]) return res.status(404).json({ message: "Emergency contact not found." });
    res.json({ message: "Patient emergency contact updated successfully", contact: result.rows[0] });
  } catch (error) {
    console.error("Update nurse patient contact error:", error);
    res.status(500).json({ message: "Server error while updating emergency contact.", error: error.message });
  }
});

router.delete("/patients/:patientId/emergency-contacts/:contactId", async (req, res) => {
  try {
    const { patientId, contactId } = req.params;
    const link = await requirePatientLink(req, res, patientId, "can_receive_emergency_alerts");
    if (!link) return;

    const result = await pool.query(
      `UPDATE emergency_contacts SET active = FALSE
       WHERE contact_id = $1 AND user_id = $2 AND active = TRUE
       RETURNING contact_id, active`,
      [contactId, patientId]
    );

    if (!result.rows[0]) return res.status(404).json({ message: "Emergency contact not found." });
    res.json({ message: "Patient emergency contact deactivated successfully", contact: result.rows[0] });
  } catch (error) {
    console.error("Delete nurse patient contact error:", error);
    res.status(500).json({ message: "Server error while deleting emergency contact.", error: error.message });
  }
});

router.post("/patients/:patientId/medication-logs", async (req, res) => {
  try {
    const { patientId } = req.params;
    const link = await requirePatientLink(req, res, patientId, "can_manage_schedule");
    if (!link) return;

    const { scheduleId, scheduledTime, status, note } = req.body;
    if (!scheduleId || !scheduledTime || !status || !logStatuses.has(status)) {
      return res.status(400).json({ message: "scheduleId, scheduledTime, and a valid status are required." });
    }

    const schedule = await pool.query(
      `SELECT schedule_id FROM schedules
       WHERE schedule_id = $1 AND user_id = $2 AND active = TRUE`,
      [scheduleId, patientId]
    );
    if (!schedule.rows[0]) return res.status(404).json({ message: "Patient schedule not found." });

    const result = await pool.query(
      `INSERT INTO medication_logs
       (schedule_id, scheduled_time, taken_at, status, recorded_by, note)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING log_id, schedule_id, scheduled_time, taken_at, status, recorded_by, note, created_at`,
      [scheduleId, scheduledTime, status === "Taken" ? new Date().toISOString() : null, status === "Missed" ? "Skipped" : status, req.user.userId, note || "Updated by nurse/caregiver"]
    );

    res.status(201).json({ message: "Patient medication log created successfully", log: result.rows[0] });
  } catch (error) {
    console.error("Create nurse patient medication log error:", error);
    res.status(error.code === "23505" ? 409 : 500).json({
      message: error.code === "23505" ? "A log already exists for this scheduled dose." : "Server error while saving medication status.",
      error: error.message,
    });
  }
});

router.put("/patients/:patientId/medication-logs/:logId", async (req, res) => {
  try {
    const { patientId, logId } = req.params;
    const link = await requirePatientLink(req, res, patientId, "can_manage_schedule");
    if (!link) return;

    const { status, note } = req.body;
    if (!status || !logStatuses.has(status)) return res.status(400).json({ message: "A valid status is required." });

    const finalStatus = status === "Missed" ? "Skipped" : status;
    const result = await pool.query(
      `UPDATE medication_logs ml
       SET status = $1,
           taken_at = CASE WHEN $1 = 'Taken' THEN CURRENT_TIMESTAMP ELSE NULL END,
           recorded_by = $2,
           note = COALESCE($3, note)
       FROM schedules s
       WHERE ml.log_id = $4
         AND ml.schedule_id = s.schedule_id
         AND s.user_id = $5
       RETURNING ml.log_id, ml.schedule_id, ml.scheduled_time, ml.taken_at,
                 ml.status, ml.recorded_by, ml.note, ml.created_at`,
      [finalStatus, req.user.userId, note || "Updated by nurse/caregiver", logId, patientId]
    );

    if (!result.rows[0]) return res.status(404).json({ message: "Medication log not found." });
    res.json({ message: "Patient medication log updated successfully", log: result.rows[0] });
  } catch (error) {
    console.error("Update nurse patient medication log error:", error);
    res.status(500).json({ message: "Server error while updating medication status.", error: error.message });
  }
});

router.delete("/patients/:patientId/medication-logs/:logId", async (req, res) => {
  try {
    const { patientId, logId } = req.params;
    const link = await requirePatientLink(req, res, patientId, "can_manage_schedule");
    if (!link) return;

    const result = await pool.query(
      `DELETE FROM medication_logs ml
       USING schedules s
       WHERE ml.log_id = $1
         AND ml.schedule_id = s.schedule_id
         AND s.user_id = $2
       RETURNING ml.log_id`,
      [logId, patientId]
    );

    if (!result.rows[0]) return res.status(404).json({ message: "Medication log not found." });
    res.json({ message: "Patient medication log removed successfully" });
  } catch (error) {
    console.error("Delete nurse patient medication log error:", error);
    res.status(500).json({ message: "Server error while resetting medication status.", error: error.message });
  }
});

router.post("/patients/:patientId/emergency-events", async (req, res) => {
  const client = await pool.connect();

  try {
    const { patientId } = req.params;
    const link = await getPatientLink(patientId, req.user.userId, "can_receive_emergency_alerts");
    if (!link) {
      return res.status(403).json({ message: "You do not have emergency-alert permission for this patient." });
    }

    const { locationText, details } = req.body;
    await client.query("BEGIN");
    const eventResult = await client.query(
      `INSERT INTO emergency_events
       (user_id, triggered_by, location_text, details)
       VALUES ($1, $2, $3, $4)
       RETURNING emergency_event_id, user_id, triggered_by, status,
                 location_text, details, created_at`,
      [patientId, req.user.userId, locationText || null, details || "Emergency alert initiated by nurse/caregiver"]
    );

    const event = eventResult.rows[0];
    const contactsResult = await client.query(
      `SELECT contact_id, email, notify_by_sms, notify_by_email
       FROM emergency_contacts
       WHERE user_id = $1 AND active = TRUE`,
      [patientId]
    );

    let alertsCreated = 0;
    for (const contact of contactsResult.rows) {
      if (contact.notify_by_sms) {
        await client.query(
          `INSERT INTO emergency_alerts (emergency_event_id, contact_id, alert_method)
           VALUES ($1, $2, 'SMS')`,
          [event.emergency_event_id, contact.contact_id]
        );
        alertsCreated += 1;
      }
      if (contact.notify_by_email && contact.email) {
        await client.query(
          `INSERT INTO emergency_alerts (emergency_event_id, contact_id, alert_method)
           VALUES ($1, $2, 'Email')`,
          [event.emergency_event_id, contact.contact_id]
        );
        alertsCreated += 1;
      }
    }

    await client.query("COMMIT");
    publishEmergencyEvent("emergency:new", event.emergency_event_id).catch((error) => {
      console.error("Emergency realtime publish failed:", error.message);
    });

    res.status(201).json({
      message: "Patient emergency event created successfully",
      event,
      alertsCreated,
      note: "Alert records are created locally. Real SMS and email delivery require a configured provider.",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Create nurse emergency event error:", error);
    res.status(500).json({ message: "Server error while creating emergency event.", error: error.message });
  } finally {
    client.release();
  }
});

router.get("/emergency-events", async (req, res) => {
  try {
    const eventResult = await pool.query(
      `SELECT ee.emergency_event_id, ee.user_id, ee.status, ee.location_text,
              ee.details, ee.created_at, ee.resolved_at, u.username AS patient_username
       FROM emergency_events ee
       JOIN caregiver_patient_links cpl ON cpl.patient_user_id = ee.user_id
       JOIN users u ON u.user_id = ee.user_id
       WHERE cpl.caregiver_user_id = $1
         AND cpl.active = TRUE
         AND cpl.can_receive_emergency_alerts = TRUE
       ORDER BY CASE WHEN ee.status = 'Resolved' THEN 1 ELSE 0 END, ee.created_at DESC`,
      [req.user.userId]
    );

    const eventIds = eventResult.rows.map((event) => event.emergency_event_id);
    const actionResult = eventIds.length === 0
      ? { rows: [] }
      : await pool.query(
          `SELECT neal.emergency_event_id, neal.action, neal.note, neal.created_at,
                  u.username AS nurse_username
           FROM nurse_emergency_event_logs neal
           JOIN users u ON u.user_id = neal.nurse_user_id
           WHERE neal.emergency_event_id = ANY($1::bigint[])
           ORDER BY neal.created_at DESC`,
          [eventIds]
        );

    const actionsByEvent = new Map();
    actionResult.rows.forEach((action) => {
      const actions = actionsByEvent.get(String(action.emergency_event_id)) || [];
      actions.push(action);
      actionsByEvent.set(String(action.emergency_event_id), actions);
    });

    const events = eventResult.rows.map((event) => ({
      ...event,
      action_logs: actionsByEvent.get(String(event.emergency_event_id)) || [],
    }));

    res.json({ message: "Nurse emergency events retrieved successfully", events });
  } catch (error) {
    console.error("Get nurse emergency events error:", error);
    res.status(500).json({ message: "Server error while retrieving emergency events.", error: error.message });
  }
});

router.put("/emergency-events/:eventId/:action", async (req, res) => {
  const client = await pool.connect();

  try {
    const { eventId, action } = req.params;
    const actionDetails = {
      acknowledge: { status: "Acknowledged", label: "Acknowledged", final: false },
      resolve: { status: "Resolved", label: "Resolved", final: true },
      reject: { status: "Cancelled", label: "Rejected", final: true },
    }[action];

    if (!actionDetails) {
      return res.status(400).json({ message: "Action must be acknowledge, resolve, or reject." });
    }

    const permissionResult = await client.query(
      `SELECT ee.emergency_event_id
       FROM emergency_events ee
       JOIN caregiver_patient_links cpl ON cpl.patient_user_id = ee.user_id
       WHERE ee.emergency_event_id = $1
         AND cpl.caregiver_user_id = $2
         AND cpl.active = TRUE
         AND cpl.can_receive_emergency_alerts = TRUE`,
      [eventId, req.user.userId]
    );

    if (!permissionResult.rows[0]) {
      return res.status(404).json({ message: "Emergency event not found or not accessible." });
    }

    await client.query("BEGIN");
    const note = req.body?.note || `${actionDetails.label} by nurse/caregiver`;

    const eventResult = await client.query(
      `UPDATE emergency_events
       SET status = $1::emergency_status_enum,
           accepted_by_user_id = CASE
             WHEN $2 = 'Acknowledged' THEN COALESCE(accepted_by_user_id, $3)
             ELSE accepted_by_user_id
           END,
           accepted_at = CASE
             WHEN $2 = 'Acknowledged' THEN COALESCE(accepted_at, CURRENT_TIMESTAMP)
             ELSE accepted_at
           END,
           resolved_at = CASE WHEN $4 THEN CURRENT_TIMESTAMP ELSE resolved_at END
       WHERE emergency_event_id = $5
       RETURNING emergency_event_id, user_id, status, created_at, resolved_at`,
      [actionDetails.status, actionDetails.label, req.user.userId, actionDetails.final, eventId]
    );

    await client.query(
      `INSERT INTO nurse_emergency_event_logs
       (emergency_event_id, nurse_user_id, action, note)
       VALUES ($1, $2, $3, $4)
       RETURNING event_log_id, emergency_event_id, nurse_user_id, action, note, created_at`,
      [eventId, req.user.userId, actionDetails.label, note]
    );

    await client.query("COMMIT");
    publishEmergencyEvent("emergency:updated", eventResult.rows[0].emergency_event_id).catch((error) => {
      console.error("Emergency realtime publish failed:", error.message);
    });

    res.json({
      message: `Emergency event ${actionDetails.label.toLowerCase()} successfully`,
      event: eventResult.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Update nurse emergency event error:", error);
    res.status(500).json({ message: "Server error while updating emergency event.", error: error.message });
  } finally {
    client.release();
  }
});

module.exports = router;
