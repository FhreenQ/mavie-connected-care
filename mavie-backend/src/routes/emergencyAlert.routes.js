const express = require("express");
const pool = require("../db");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

// Trigger emergency alert
router.post("/trigger", authMiddleware, async (req, res) => {
  const client = await pool.connect();

  try {
    const { latitude, longitude, locationText, details } = req.body;

    await client.query("BEGIN");

    const eventResult = await client.query(
      `INSERT INTO emergency_events
       (
         user_id,
         triggered_by,
         latitude,
         longitude,
         location_text,
         details
       )
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING emergency_event_id, user_id, triggered_by, status,
                 latitude, longitude, location_text, details, created_at`,
      [
        req.user.userId,
        req.user.userId,
        latitude || null,
        longitude || null,
        locationText || null,
        details || null,
      ]
    );

    const emergencyEvent = eventResult.rows[0];

    const contactsResult = await client.query(
      `SELECT contact_id, contact_name, phone_number, email,
              notify_by_sms, notify_by_email
       FROM emergency_contacts
       WHERE user_id = $1
         AND active = TRUE
       ORDER BY priority_order ASC`,
      [req.user.userId]
    );

    const contacts = contactsResult.rows;

    const alerts = [];

    for (const contact of contacts) {
      if (contact.notify_by_sms) {
        const smsAlert = await client.query(
          `INSERT INTO emergency_alerts
           (emergency_event_id, contact_id, alert_method)
           VALUES ($1, $2, 'SMS')
           RETURNING alert_id, emergency_event_id, contact_id,
                     alert_method, alert_status, created_at`,
          [emergencyEvent.emergency_event_id, contact.contact_id]
        );

        alerts.push(smsAlert.rows[0]);
      }

      if (contact.notify_by_email && contact.email) {
        const emailAlert = await client.query(
          `INSERT INTO emergency_alerts
           (emergency_event_id, contact_id, alert_method)
           VALUES ($1, $2, 'Email')
           RETURNING alert_id, emergency_event_id, contact_id,
                     alert_method, alert_status, created_at`,
          [emergencyEvent.emergency_event_id, contact.contact_id]
        );

        alerts.push(emailAlert.rows[0]);
      }
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "Emergency alert triggered successfully",
      emergencyEvent,
      contactsCount: contacts.length,
      alertsCreated: alerts.length,
      alerts,
      note: "Alerts are saved as Pending. Real SMS/email sending can be connected later.",
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Trigger emergency alert error:", error);
    res.status(500).json({
      message: "Server error while triggering emergency alert",
      error: error.message,
    });
  } finally {
    client.release();
  }
});

// Get all emergency events for current user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT emergency_event_id, user_id, triggered_by, status,
              latitude, longitude, location_text, details,
              created_at, resolved_at
       FROM emergency_events
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.userId]
    );

    res.json({
      message: "Emergency events retrieved successfully",
      count: result.rows.length,
      events: result.rows,
    });
  } catch (error) {
    console.error("Get emergency events error:", error);
    res.status(500).json({
      message: "Server error while retrieving emergency events",
      error: error.message,
    });
  }
});

// Get one emergency event with alerts
router.get("/:eventId", authMiddleware, async (req, res) => {
  try {
    const { eventId } = req.params;

    const eventResult = await pool.query(
      `SELECT emergency_event_id, user_id, triggered_by, status,
              latitude, longitude, location_text, details,
              created_at, resolved_at
       FROM emergency_events
       WHERE emergency_event_id = $1
         AND user_id = $2`,
      [eventId, req.user.userId]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({
        message: "Emergency event not found",
      });
    }

    const alertsResult = await pool.query(
      `SELECT 
          ea.alert_id,
          ea.emergency_event_id,
          ea.contact_id,
          ec.contact_name,
          ec.relationship,
          ec.phone_number,
          ec.email,
          ea.alert_method,
          ea.alert_status,
          ea.sent_at,
          ea.delivered_at,
          ea.failure_reason,
          ea.created_at
       FROM emergency_alerts ea
       JOIN emergency_contacts ec ON ea.contact_id = ec.contact_id
       WHERE ea.emergency_event_id = $1
       ORDER BY ea.created_at ASC`,
      [eventId]
    );

    res.json({
      message: "Emergency event retrieved successfully",
      event: eventResult.rows[0],
      alerts: alertsResult.rows,
    });
  } catch (error) {
    console.error("Get emergency event error:", error);
    res.status(500).json({
      message: "Server error while retrieving emergency event",
      error: error.message,
    });
  }
});

// Acknowledge emergency event
router.put("/:eventId/acknowledge", authMiddleware, async (req, res) => {
  try {
    const { eventId } = req.params;

    const result = await pool.query(
      `UPDATE emergency_events
       SET status = 'Acknowledged'
       WHERE emergency_event_id = $1
         AND user_id = $2
       RETURNING emergency_event_id, user_id, status, created_at, resolved_at`,
      [eventId, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Emergency event not found",
      });
    }

    res.json({
      message: "Emergency event acknowledged successfully",
      event: result.rows[0],
    });
  } catch (error) {
    console.error("Acknowledge emergency event error:", error);
    res.status(500).json({
      message: "Server error while acknowledging emergency event",
      error: error.message,
    });
  }
});

// Resolve emergency event
router.put("/:eventId/resolve", authMiddleware, async (req, res) => {
  try {
    const { eventId } = req.params;

    const result = await pool.query(
      `UPDATE emergency_events
       SET status = 'Resolved',
           resolved_at = CURRENT_TIMESTAMP
       WHERE emergency_event_id = $1
         AND user_id = $2
       RETURNING emergency_event_id, user_id, status, created_at, resolved_at`,
      [eventId, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Emergency event not found",
      });
    }

    res.json({
      message: "Emergency event resolved successfully",
      event: result.rows[0],
    });
  } catch (error) {
    console.error("Resolve emergency event error:", error);
    res.status(500).json({
      message: "Server error while resolving emergency event",
      error: error.message,
    });
  }
});

// Cancel emergency event
router.put("/:eventId/cancel", authMiddleware, async (req, res) => {
  try {
    const { eventId } = req.params;

    const result = await pool.query(
      `UPDATE emergency_events
       SET status = 'Cancelled',
           resolved_at = CURRENT_TIMESTAMP
       WHERE emergency_event_id = $1
         AND user_id = $2
       RETURNING emergency_event_id, user_id, status, created_at, resolved_at`,
      [eventId, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Emergency event not found",
      });
    }

    res.json({
      message: "Emergency event cancelled successfully",
      event: result.rows[0],
    });
  } catch (error) {
    console.error("Cancel emergency event error:", error);
    res.status(500).json({
      message: "Server error while cancelling emergency event",
      error: error.message,
    });
  }
});

module.exports = router;