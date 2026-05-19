const express = require("express");
const pool = require("../db");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

// Create health profile
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      dateOfBirth,
      bloodType,
      allergies,
      conditions,
      emergencyNotes,
      homeAddress,
    } = req.body;

    const existingProfile = await pool.query(
      "SELECT profile_id FROM health_profiles WHERE user_id = $1",
      [req.user.userId]
    );

    if (existingProfile.rows.length > 0) {
      return res.status(409).json({
        message: "Health profile already exists. Use PUT to update it.",
      });
    }

    const result = await pool.query(
      `INSERT INTO health_profiles
       (
         user_id,
         date_of_birth,
         blood_type,
         allergies,
         conditions,
         emergency_notes,
         home_address
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING profile_id, user_id, date_of_birth, blood_type,
                 allergies, conditions, emergency_notes, home_address,
                 created_at, updated_at`,
      [
        req.user.userId,
        dateOfBirth || null,
        bloodType || null,
        allergies || null,
        conditions || null,
        emergencyNotes || null,
        homeAddress || null,
      ]
    );

    res.status(201).json({
      message: "Health profile created successfully",
      healthProfile: result.rows[0],
    });
  } catch (error) {
    console.error("Create health profile error:", error);
    res.status(500).json({
      message: "Server error while creating health profile",
      error: error.message,
    });
  }
});

// Get current user's health profile
router.get("/", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT profile_id, user_id, date_of_birth, blood_type,
              allergies, conditions, emergency_notes, home_address,
              created_at, updated_at
       FROM health_profiles
       WHERE user_id = $1`,
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Health profile not found",
      });
    }

    res.json({
      message: "Health profile retrieved successfully",
      healthProfile: result.rows[0],
    });
  } catch (error) {
    console.error("Get health profile error:", error);
    res.status(500).json({
      message: "Server error while retrieving health profile",
      error: error.message,
    });
  }
});

// Update current user's health profile
router.put("/", authMiddleware, async (req, res) => {
  try {
    const {
      dateOfBirth,
      bloodType,
      allergies,
      conditions,
      emergencyNotes,
      homeAddress,
    } = req.body;

    const existingProfile = await pool.query(
      "SELECT profile_id FROM health_profiles WHERE user_id = $1",
      [req.user.userId]
    );

    if (existingProfile.rows.length === 0) {
      return res.status(404).json({
        message: "Health profile not found. Use POST to create it first.",
      });
    }

    const result = await pool.query(
      `UPDATE health_profiles
       SET
         date_of_birth = COALESCE($1, date_of_birth),
         blood_type = COALESCE($2, blood_type),
         allergies = COALESCE($3, allergies),
         conditions = COALESCE($4, conditions),
         emergency_notes = COALESCE($5, emergency_notes),
         home_address = COALESCE($6, home_address)
       WHERE user_id = $7
       RETURNING profile_id, user_id, date_of_birth, blood_type,
                 allergies, conditions, emergency_notes, home_address,
                 created_at, updated_at`,
      [
        dateOfBirth ?? null,
        bloodType ?? null,
        allergies ?? null,
        conditions ?? null,
        emergencyNotes ?? null,
        homeAddress ?? null,
        req.user.userId,
      ]
    );

    res.json({
      message: "Health profile updated successfully",
      healthProfile: result.rows[0],
    });
  } catch (error) {
    console.error("Update health profile error:", error);
    res.status(500).json({
      message: "Server error while updating health profile",
      error: error.message,
    });
  }
});

// Delete current user's health profile
router.delete("/", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM health_profiles
       WHERE user_id = $1
       RETURNING profile_id, user_id, date_of_birth, blood_type,
                 allergies, conditions, emergency_notes, home_address`,
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Health profile not found",
      });
    }

    res.json({
      message: "Health profile deleted successfully",
      healthProfile: result.rows[0],
    });
  } catch (error) {
    console.error("Delete health profile error:", error);
    res.status(500).json({
      message: "Server error while deleting health profile",
      error: error.message,
    });
  }
});

module.exports = router;