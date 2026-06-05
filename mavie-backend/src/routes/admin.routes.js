const express = require("express");
const pool = require("../db");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

async function requireAdmin(req, res, next) {
  try {
    const result = await pool.query(
      "SELECT user_id, role FROM users WHERE user_id = $1",
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "User not found" });
    }

    const role = result.rows[0].role;

    if (role !== "admin") {
      return res.status(403).json({
        message: "Only admin users can access this resource",
      });
    }

    next();
  } catch (error) {
    console.error("Admin auth check error:", error);
    res.status(500).json({ message: "Server error during admin auth check" });
  }
}

// Admin dashboard statistics
router.get("/dashboard", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const users = await pool.query("SELECT COUNT(*) FROM users");
    const patients = await pool.query(
      "SELECT COUNT(*) FROM users WHERE role = 'patient'"
    );
    const caregivers = await pool.query(
      "SELECT COUNT(*) FROM users WHERE role IN ('caregiver', 'nurse')"
    );
    const medications = await pool.query("SELECT COUNT(*) FROM medications");
    const activeSchedules = await pool.query(
      "SELECT COUNT(*) FROM schedules WHERE active = TRUE"
    );
    const emergencyEvents = await pool.query(
      "SELECT COUNT(*) FROM emergency_events"
    );
    const missedLogs = await pool.query(
      "SELECT COUNT(*) FROM medication_logs WHERE status = 'Missed'"
    );

    res.json({
      users: Number(users.rows[0].count),
      patients: Number(patients.rows[0].count),
      caregivers: Number(caregivers.rows[0].count),
      medications: Number(medications.rows[0].count),
      activeSchedules: Number(activeSchedules.rows[0].count),
      emergencyEvents: Number(emergencyEvents.rows[0].count),
      missedLogs: Number(missedLogs.rows[0].count),
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    res.status(500).json({
      message: "Failed to load admin dashboard",
      error: error.message,
    });
  }
});

// Admin: list all patients
router.get("/patients", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        u.user_id,
        u.username,
        u.email,
        u.role,
        u.created_at,
        hp.blood_type,
        hp.allergies,
        hp.conditions,
        hp.emergency_notes,
        hp.home_address,
        COUNT(DISTINCT s.schedule_id) AS schedule_count,
        COUNT(DISTINCT ec.contact_id) AS emergency_contact_count
      FROM users u
      LEFT JOIN health_profiles hp ON hp.user_id = u.user_id
      LEFT JOIN schedules s ON s.user_id = u.user_id AND s.active = TRUE
      LEFT JOIN emergency_contacts ec ON ec.user_id = u.user_id AND ec.active = TRUE
      WHERE u.role = 'patient'
      GROUP BY
        u.user_id,
        u.username,
        u.email,
        u.role,
        u.created_at,
        hp.blood_type,
        hp.allergies,
        hp.conditions,
        hp.emergency_notes,
        hp.home_address
      ORDER BY u.created_at DESC
    `);

    res.json({
      count: result.rows.length,
      patients: result.rows,
    });
  } catch (error) {
    console.error("Admin patients error:", error);
    res.status(500).json({
      message: "Failed to load patients",
      error: error.message,
    });
  }
});

// Admin: patient detail
router.get("/patients/:patientId", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { patientId } = req.params;

    const patientResult = await pool.query(
      `
      SELECT
        u.user_id,
        u.username,
        u.email,
        u.role,
        u.created_at,
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

    const schedulesResult = await pool.query(
      `
      SELECT
        s.schedule_id,
        s.rxnorm_id,
        m.generic_name,
        m.brand_name,
        m.form,
        m.strength,
        s.dosage,
        s.instructions,
        s.frequency_hours,
        s.next_dose_time,
        s.active,
        s.created_at
      FROM schedules s
      JOIN medications m ON m.rxnorm_id = s.rxnorm_id
      WHERE s.user_id = $1
      ORDER BY s.next_dose_time ASC
      `,
      [patientId]
    );

    const logsResult = await pool.query(
      `
      SELECT
        ml.log_id,
        ml.schedule_id,
        ml.scheduled_time,
        ml.taken_at,
        ml.status,
        ml.note,
        ml.created_at,
        m.generic_name,
        m.brand_name,
        s.dosage
      FROM medication_logs ml
      JOIN schedules s ON s.schedule_id = ml.schedule_id
      JOIN medications m ON m.rxnorm_id = s.rxnorm_id
      WHERE s.user_id = $1
      ORDER BY ml.scheduled_time DESC
      LIMIT 50
      `,
      [patientId]
    );

    res.json({
      patient: patientResult.rows[0],
      schedules: schedulesResult.rows,
      logs: logsResult.rows,
    });
  } catch (error) {
    console.error("Admin patient detail error:", error);
    res.status(500).json({
      message: "Failed to load patient detail",
      error: error.message,
    });
  }
});

// Admin: emergency events
router.get("/emergency-events", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        ee.emergency_event_id,
        ee.user_id AS patient_user_id,
        u.username AS patient_name,
        u.email AS patient_email,
        ee.status,
        ee.location_text,
        ee.details,
        ee.created_at,
        ee.resolved_at
      FROM emergency_events ee
      JOIN users u ON u.user_id = ee.user_id
      ORDER BY ee.created_at DESC
      LIMIT 100
    `);

    res.json({
      count: result.rows.length,
      events: result.rows,
    });
  } catch (error) {
    console.error("Admin emergency events error:", error);
    res.status(500).json({
      message: "Failed to load emergency events",
      error: error.message,
    });
  }
});

module.exports = router;