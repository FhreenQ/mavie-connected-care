const express = require("express");
const pool = require("../db");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

const allowedRelationships = ["Family", "Caregiver", "Nurse", "Guardian", "Other"];

// Create caregiver-patient link
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      patientEmail,
      relationship,
      canViewSchedule,
      canViewLogs,
      canManageSchedule,
      canReceiveEmergencyAlerts,
    } = req.body;

    if (!patientEmail || !relationship) {
      return res.status(400).json({
        message: "patientEmail and relationship are required",
      });
    }

    if (!allowedRelationships.includes(relationship)) {
      return res.status(400).json({
        message:
          "Invalid relationship. Use Family, Caregiver, Nurse, Guardian, or Other",
      });
    }

    const patientResult = await pool.query(
      `SELECT user_id, username, email, role
       FROM users
       WHERE email = $1`,
      [patientEmail]
    );

    if (patientResult.rows.length === 0) {
      return res.status(404).json({
        message: "Patient user not found",
      });
    }

    const patient = patientResult.rows[0];

    if (patient.user_id === req.user.userId) {
      return res.status(400).json({
        message: "Caregiver and patient cannot be the same user",
      });
    }

    const result = await pool.query(
      `INSERT INTO caregiver_patient_links
       (
         patient_user_id,
         caregiver_user_id,
         relationship,
         can_view_schedule,
         can_view_logs,
         can_manage_schedule,
         can_receive_emergency_alerts
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING link_id, patient_user_id, caregiver_user_id, relationship,
                 can_view_schedule, can_view_logs, can_manage_schedule,
                 can_receive_emergency_alerts, active, created_at`,
      [
        patient.user_id,
        req.user.userId,
        relationship,
        canViewSchedule ?? true,
        canViewLogs ?? true,
        canManageSchedule ?? false,
        canReceiveEmergencyAlerts ?? true,
      ]
    );

    res.status(201).json({
      message: "Caregiver-patient link created successfully",
      link: result.rows[0],
      patient,
    });
  } catch (error) {
    console.error("Create care link error:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        message: "This caregiver-patient link already exists",
      });
    }

    res.status(500).json({
      message: "Server error while creating care link",
      error: error.message,
    });
  }
});

// Get patients monitored by current caregiver
router.get("/my-patients", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
          cpl.link_id,
          cpl.patient_user_id,
          u.username AS patient_username,
          u.email AS patient_email,
          u.role AS patient_role,
          cpl.relationship,
          cpl.can_view_schedule,
          cpl.can_view_logs,
          cpl.can_manage_schedule,
          cpl.can_receive_emergency_alerts,
          cpl.active,
          cpl.created_at
       FROM caregiver_patient_links cpl
       JOIN users u ON cpl.patient_user_id = u.user_id
       WHERE cpl.caregiver_user_id = $1
         AND cpl.active = TRUE
       ORDER BY cpl.created_at DESC`,
      [req.user.userId]
    );

    res.json({
      message: "Patients retrieved successfully",
      count: result.rows.length,
      patients: result.rows,
    });
  } catch (error) {
    console.error("Get my patients error:", error);
    res.status(500).json({
      message: "Server error while retrieving patients",
      error: error.message,
    });
  }
});

// Get caregivers connected to current patient
router.get("/my-caregivers", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
          cpl.link_id,
          cpl.caregiver_user_id,
          u.username AS caregiver_username,
          u.email AS caregiver_email,
          u.role AS caregiver_role,
          cpl.relationship,
          cpl.can_view_schedule,
          cpl.can_view_logs,
          cpl.can_manage_schedule,
          cpl.can_receive_emergency_alerts,
          cpl.active,
          cpl.created_at
       FROM caregiver_patient_links cpl
       JOIN users u ON cpl.caregiver_user_id = u.user_id
       WHERE cpl.patient_user_id = $1
         AND cpl.active = TRUE
       ORDER BY cpl.created_at DESC`,
      [req.user.userId]
    );

    res.json({
      message: "Caregivers retrieved successfully",
      count: result.rows.length,
      caregivers: result.rows,
    });
  } catch (error) {
    console.error("Get my caregivers error:", error);
    res.status(500).json({
      message: "Server error while retrieving caregivers",
      error: error.message,
    });
  }
});

// Caregiver views patient's schedules
router.get("/patients/:patientId/schedules", authMiddleware, async (req, res) => {
  try {
    const { patientId } = req.params;

    const permissionResult = await pool.query(
      `SELECT link_id
       FROM caregiver_patient_links
       WHERE patient_user_id = $1
         AND caregiver_user_id = $2
         AND active = TRUE
         AND can_view_schedule = TRUE`,
      [patientId, req.user.userId]
    );

    if (permissionResult.rows.length === 0) {
      return res.status(403).json({
        message: "You do not have permission to view this patient's schedules",
      });
    }

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
      [patientId]
    );

    res.json({
      message: "Patient schedules retrieved successfully",
      count: result.rows.length,
      schedules: result.rows,
    });
  } catch (error) {
    console.error("Get patient schedules error:", error);
    res.status(500).json({
      message: "Server error while retrieving patient schedules",
      error: error.message,
    });
  }
});

// Caregiver views patient's medication logs
router.get("/patients/:patientId/logs", authMiddleware, async (req, res) => {
  try {
    const { patientId } = req.params;

    const permissionResult = await pool.query(
      `SELECT link_id
       FROM caregiver_patient_links
       WHERE patient_user_id = $1
         AND caregiver_user_id = $2
         AND active = TRUE
         AND can_view_logs = TRUE`,
      [patientId, req.user.userId]
    );

    if (permissionResult.rows.length === 0) {
      return res.status(403).json({
        message: "You do not have permission to view this patient's logs",
      });
    }

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
      [patientId]
    );

    res.json({
      message: "Patient medication logs retrieved successfully",
      count: result.rows.length,
      logs: result.rows,
    });
  } catch (error) {
    console.error("Get patient logs error:", error);
    res.status(500).json({
      message: "Server error while retrieving patient logs",
      error: error.message,
    });
  }
});

// Update caregiver-patient link permissions
router.put("/:linkId", authMiddleware, async (req, res) => {
  try {
    const { linkId } = req.params;
    const {
      relationship,
      canViewSchedule,
      canViewLogs,
      canManageSchedule,
      canReceiveEmergencyAlerts,
      active,
    } = req.body;

    if (relationship && !allowedRelationships.includes(relationship)) {
      return res.status(400).json({
        message:
          "Invalid relationship. Use Family, Caregiver, Nurse, Guardian, or Other",
      });
    }

    const existingLink = await pool.query(
      `SELECT link_id
       FROM caregiver_patient_links
       WHERE link_id = $1
         AND caregiver_user_id = $2`,
      [linkId, req.user.userId]
    );

    if (existingLink.rows.length === 0) {
      return res.status(404).json({
        message: "Caregiver-patient link not found",
      });
    }

    const result = await pool.query(
      `UPDATE caregiver_patient_links
       SET
         relationship = COALESCE($1, relationship),
         can_view_schedule = COALESCE($2, can_view_schedule),
         can_view_logs = COALESCE($3, can_view_logs),
         can_manage_schedule = COALESCE($4, can_manage_schedule),
         can_receive_emergency_alerts = COALESCE($5, can_receive_emergency_alerts),
         active = COALESCE($6, active)
       WHERE link_id = $7
         AND caregiver_user_id = $8
       RETURNING link_id, patient_user_id, caregiver_user_id, relationship,
                 can_view_schedule, can_view_logs, can_manage_schedule,
                 can_receive_emergency_alerts, active, created_at`,
      [
        relationship ?? null,
        canViewSchedule ?? null,
        canViewLogs ?? null,
        canManageSchedule ?? null,
        canReceiveEmergencyAlerts ?? null,
        active ?? null,
        linkId,
        req.user.userId,
      ]
    );

    res.json({
      message: "Caregiver-patient link updated successfully",
      link: result.rows[0],
    });
  } catch (error) {
    console.error("Update care link error:", error);
    res.status(500).json({
      message: "Server error while updating care link",
      error: error.message,
    });
  }
});

// Soft delete caregiver-patient link
router.delete("/:linkId", authMiddleware, async (req, res) => {
  try {
    const { linkId } = req.params;

    const result = await pool.query(
      `UPDATE caregiver_patient_links
       SET active = FALSE
       WHERE link_id = $1
         AND caregiver_user_id = $2
       RETURNING link_id, patient_user_id, caregiver_user_id, active`,
      [linkId, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Caregiver-patient link not found",
      });
    }

    res.json({
      message: "Caregiver-patient link deactivated successfully",
      link: result.rows[0],
    });
  } catch (error) {
    console.error("Delete care link error:", error);
    res.status(500).json({
      message: "Server error while deleting care link",
      error: error.message,
    });
  }
});

module.exports = router;