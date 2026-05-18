const express = require("express");
const pool = require("../db");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

// Create medication schedule
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      rxnormId,
      dosage,
      instructions,
      frequencyHours,
      startDate,
      endDate,
      nextDoseTime,
    } = req.body;

    if (!rxnormId || !dosage || !frequencyHours || !nextDoseTime) {
      return res.status(400).json({
        message:
          "rxnormId, dosage, frequencyHours, and nextDoseTime are required",
      });
    }

    const medicationResult = await pool.query(
      "SELECT rxnorm_id FROM medications WHERE rxnorm_id = $1",
      [rxnormId]
    );

    if (medicationResult.rows.length === 0) {
      return res.status(404).json({
        message: "Medication not found. Please add the medication first.",
      });
    }

    const result = await pool.query(
      `INSERT INTO schedules
       (user_id, rxnorm_id, dosage, instructions, frequency_hours, start_date, end_date, next_dose_time, created_by)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, CURRENT_DATE), $7, $8, $9)
       RETURNING schedule_id, user_id, rxnorm_id, dosage, instructions, frequency_hours,
                 start_date, end_date, next_dose_time, active, created_by, created_at`,
      [
        req.user.userId,
        rxnormId,
        dosage,
        instructions || null,
        frequencyHours,
        startDate || null,
        endDate || null,
        nextDoseTime,
        req.user.userId,
      ]
    );

    res.status(201).json({
      message: "Medication schedule created successfully",
      schedule: result.rows[0],
    });
  } catch (error) {
    console.error("Create schedule error:", error);
    res.status(500).json({
      message: "Server error while creating schedule",
      error: error.message,
    });
  }
});

// Get all active schedules for current user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
          s.schedule_id,
          s.user_id,
          s.rxnorm_id,
          m.generic_name,
          m.brand_name,
          m.form,
          m.strength,
          s.dosage,
          s.instructions,
          s.frequency_hours,
          s.start_date,
          s.end_date,
          s.next_dose_time,
          s.active,
          s.created_at
       FROM schedules s
       JOIN medications m ON s.rxnorm_id = m.rxnorm_id
       WHERE s.user_id = $1
         AND s.active = TRUE
       ORDER BY s.next_dose_time ASC`,
      [req.user.userId]
    );

    res.json({
      message: "Schedules retrieved successfully",
      count: result.rows.length,
      schedules: result.rows,
    });
  } catch (error) {
    console.error("Get schedules error:", error);
    res.status(500).json({
      message: "Server error while retrieving schedules",
      error: error.message,
    });
  }
});

// Get today's schedules
router.get("/today", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
          s.schedule_id,
          s.user_id,
          s.rxnorm_id,
          m.generic_name,
          m.brand_name,
          m.form,
          m.strength,
          s.dosage,
          s.instructions,
          s.frequency_hours,
          s.start_date,
          s.end_date,
          s.next_dose_time,
          s.active
       FROM schedules s
       JOIN medications m ON s.rxnorm_id = m.rxnorm_id
       WHERE s.user_id = $1
         AND s.active = TRUE
         AND s.next_dose_time >= date_trunc('day', NOW())
         AND s.next_dose_time < date_trunc('day', NOW()) + interval '1 day'
       ORDER BY s.next_dose_time ASC`,
      [req.user.userId]
    );

    res.json({
      message: "Today's schedules retrieved successfully",
      count: result.rows.length,
      schedules: result.rows,
    });
  } catch (error) {
    console.error("Get today's schedules error:", error);
    res.status(500).json({
      message: "Server error while retrieving today's schedules",
      error: error.message,
    });
  }
});

// Get one schedule
router.get("/:scheduleId", authMiddleware, async (req, res) => {
  try {
    const { scheduleId } = req.params;

    const result = await pool.query(
      `SELECT 
          s.schedule_id,
          s.user_id,
          s.rxnorm_id,
          m.generic_name,
          m.brand_name,
          m.form,
          m.strength,
          s.dosage,
          s.instructions,
          s.frequency_hours,
          s.start_date,
          s.end_date,
          s.next_dose_time,
          s.active,
          s.created_at
       FROM schedules s
       JOIN medications m ON s.rxnorm_id = m.rxnorm_id
       WHERE s.schedule_id = $1
         AND s.user_id = $2`,
      [scheduleId, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Schedule not found",
      });
    }

    res.json({
      message: "Schedule retrieved successfully",
      schedule: result.rows[0],
    });
  } catch (error) {
    console.error("Get schedule error:", error);
    res.status(500).json({
      message: "Server error while retrieving schedule",
      error: error.message,
    });
  }
});

// Update schedule
router.put("/:scheduleId", authMiddleware, async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const {
      dosage,
      instructions,
      frequencyHours,
      startDate,
      endDate,
      nextDoseTime,
      active,
    } = req.body;

    const existingSchedule = await pool.query(
      `SELECT schedule_id FROM schedules
       WHERE schedule_id = $1 AND user_id = $2`,
      [scheduleId, req.user.userId]
    );

    if (existingSchedule.rows.length === 0) {
      return res.status(404).json({
        message: "Schedule not found",
      });
    }

    const result = await pool.query(
      `UPDATE schedules
       SET
          dosage = COALESCE($1, dosage),
          instructions = COALESCE($2, instructions),
          frequency_hours = COALESCE($3, frequency_hours),
          start_date = COALESCE($4, start_date),
          end_date = COALESCE($5, end_date),
          next_dose_time = COALESCE($6, next_dose_time),
          active = COALESCE($7, active)
       WHERE schedule_id = $8
         AND user_id = $9
       RETURNING schedule_id, user_id, rxnorm_id, dosage, instructions,
                 frequency_hours, start_date, end_date, next_dose_time,
                 active, updated_at`,
      [
        dosage ?? null,
        instructions ?? null,
        frequencyHours ?? null,
        startDate ?? null,
        endDate ?? null,
        nextDoseTime ?? null,
        active ?? null,
        scheduleId,
        req.user.userId,
      ]
    );

    res.json({
      message: "Schedule updated successfully",
      schedule: result.rows[0],
    });
  } catch (error) {
    console.error("Update schedule error:", error);
    res.status(500).json({
      message: "Server error while updating schedule",
      error: error.message,
    });
  }
});

// Soft delete schedule
router.delete("/:scheduleId", authMiddleware, async (req, res) => {
  try {
    const { scheduleId } = req.params;

    const result = await pool.query(
      `UPDATE schedules
       SET active = FALSE
       WHERE schedule_id = $1
         AND user_id = $2
       RETURNING schedule_id, user_id, rxnorm_id, active`,
      [scheduleId, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Schedule not found",
      });
    }

    res.json({
      message: "Schedule deactivated successfully",
      schedule: result.rows[0],
    });
  } catch (error) {
    console.error("Delete schedule error:", error);
    res.status(500).json({
      message: "Server error while deleting schedule",
      error: error.message,
    });
  }
});

module.exports = router;