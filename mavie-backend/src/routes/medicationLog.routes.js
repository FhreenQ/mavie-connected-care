const express = require("express");
const pool = require("../db");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

// Create medication intake log
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { scheduleId, scheduledTime, status, takenAt, note } = req.body;

    if (!scheduleId || !scheduledTime || !status) {
      return res.status(400).json({
        message: "scheduleId, scheduledTime, and status are required",
      });
    }

    const allowedStatuses = ["Taken", "Missed", "Skipped", "Late"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status. Use Taken, Missed, Skipped, or Late",
      });
    }

    const scheduleResult = await pool.query(
      `SELECT schedule_id
       FROM schedules
       WHERE schedule_id = $1
         AND user_id = $2
         AND active = TRUE`,
      [scheduleId, req.user.userId]
    );

    if (scheduleResult.rows.length === 0) {
      return res.status(404).json({
        message: "Active schedule not found for this user",
      });
    }

    const finalTakenAt =
      status === "Taken" ? takenAt || new Date().toISOString() : null;

    const result = await pool.query(
      `INSERT INTO medication_logs
       (schedule_id, scheduled_time, taken_at, status, recorded_by, note)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING log_id, schedule_id, scheduled_time, taken_at, status,
                 recorded_by, note, created_at`,
      [
        scheduleId,
        scheduledTime,
        finalTakenAt,
        status,
        req.user.userId,
        note || null,
      ]
    );

    res.status(201).json({
      message: "Medication log created successfully",
      log: result.rows[0],
    });
  } catch (error) {
    console.error("Create medication log error:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        message: "A log already exists for this scheduled dose",
      });
    }

    res.status(500).json({
      message: "Server error while creating medication log",
      error: error.message,
    });
  }
});

// Get all medication logs for current user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
          ml.log_id,
          ml.schedule_id,
          ml.scheduled_time,
          ml.taken_at,
          ml.status,
          ml.note,
          ml.created_at,
          s.rxnorm_id,
          s.dosage,
          s.instructions,
          m.generic_name,
          m.brand_name,
          m.form,
          m.strength
       FROM medication_logs ml
       JOIN schedules s ON ml.schedule_id = s.schedule_id
       JOIN medications m ON s.rxnorm_id = m.rxnorm_id
       WHERE s.user_id = $1
       ORDER BY ml.scheduled_time DESC`,
      [req.user.userId]
    );

    res.json({
      message: "Medication logs retrieved successfully",
      count: result.rows.length,
      logs: result.rows,
    });
  } catch (error) {
    console.error("Get medication logs error:", error);
    res.status(500).json({
      message: "Server error while retrieving medication logs",
      error: error.message,
    });
  }
});

// Get logs for one schedule
router.get("/schedule/:scheduleId", authMiddleware, async (req, res) => {
  try {
    const { scheduleId } = req.params;

    const result = await pool.query(
      `SELECT 
          ml.log_id,
          ml.schedule_id,
          ml.scheduled_time,
          ml.taken_at,
          ml.status,
          ml.note,
          ml.created_at,
          s.rxnorm_id,
          s.dosage,
          m.generic_name,
          m.brand_name
       FROM medication_logs ml
       JOIN schedules s ON ml.schedule_id = s.schedule_id
       JOIN medications m ON s.rxnorm_id = m.rxnorm_id
       WHERE ml.schedule_id = $1
         AND s.user_id = $2
       ORDER BY ml.scheduled_time DESC`,
      [scheduleId, req.user.userId]
    );

    res.json({
      message: "Medication logs for schedule retrieved successfully",
      count: result.rows.length,
      logs: result.rows,
    });
  } catch (error) {
    console.error("Get schedule logs error:", error);
    res.status(500).json({
      message: "Server error while retrieving schedule logs",
      error: error.message,
    });
  }
});

// Get one medication log
router.get("/:logId", authMiddleware, async (req, res) => {
  try {
    const { logId } = req.params;

    const result = await pool.query(
      `SELECT 
          ml.log_id,
          ml.schedule_id,
          ml.scheduled_time,
          ml.taken_at,
          ml.status,
          ml.note,
          ml.created_at,
          s.rxnorm_id,
          s.dosage,
          m.generic_name,
          m.brand_name
       FROM medication_logs ml
       JOIN schedules s ON ml.schedule_id = s.schedule_id
       JOIN medications m ON s.rxnorm_id = m.rxnorm_id
       WHERE ml.log_id = $1
         AND s.user_id = $2`,
      [logId, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Medication log not found",
      });
    }

    res.json({
      message: "Medication log retrieved successfully",
      log: result.rows[0],
    });
  } catch (error) {
    console.error("Get medication log error:", error);
    res.status(500).json({
      message: "Server error while retrieving medication log",
      error: error.message,
    });
  }
});

// Update medication log
router.put("/:logId", authMiddleware, async (req, res) => {
  try {
    const { logId } = req.params;
    const { status, takenAt, note } = req.body;

    const allowedStatuses = ["Taken", "Missed", "Skipped", "Late"];

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status. Use Taken, Missed, Skipped, or Late",
      });
    }

    const existingLog = await pool.query(
      `SELECT ml.log_id
       FROM medication_logs ml
       JOIN schedules s ON ml.schedule_id = s.schedule_id
       WHERE ml.log_id = $1
         AND s.user_id = $2`,
      [logId, req.user.userId]
    );

    if (existingLog.rows.length === 0) {
      return res.status(404).json({
        message: "Medication log not found",
      });
    }

    let finalTakenAt = takenAt ?? null;

    if (status === "Taken" && !takenAt) {
      finalTakenAt = new Date().toISOString();
    }

    if (status && status !== "Taken") {
      finalTakenAt = null;
    }

    const result = await pool.query(
      `UPDATE medication_logs
       SET
          status = COALESCE($1, status),
          taken_at = CASE
            WHEN $1 = 'Taken' THEN $2
            WHEN $1 IN ('Missed', 'Skipped', 'Late') THEN NULL
            ELSE taken_at
          END,
          note = COALESCE($3, note)
       WHERE log_id = $4
       RETURNING log_id, schedule_id, scheduled_time, taken_at, status,
                 recorded_by, note, created_at`,
      [status ?? null, finalTakenAt, note ?? null, logId]
    );

    res.json({
      message: "Medication log updated successfully",
      log: result.rows[0],
    });
  } catch (error) {
    console.error("Update medication log error:", error);
    res.status(500).json({
      message: "Server error while updating medication log",
      error: error.message,
    });
  }
});

module.exports = router;