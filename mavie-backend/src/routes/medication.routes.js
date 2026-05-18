const express = require("express");
const pool = require("../db");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

// Create medication
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { rxnormId, genericName, brandName, form, strength } = req.body;

    if (!rxnormId || !genericName) {
      return res.status(400).json({
        message: "rxnormId and genericName are required",
      });
    }

    const existingMedication = await pool.query(
      "SELECT rxnorm_id FROM medications WHERE rxnorm_id = $1",
      [rxnormId]
    );

    if (existingMedication.rows.length > 0) {
      return res.status(409).json({
        message: "Medication already exists",
      });
    }

    const result = await pool.query(
      `INSERT INTO medications 
       (rxnorm_id, generic_name, brand_name, form, strength)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING rxnorm_id, generic_name, brand_name, form, strength, created_at`,
      [
        rxnormId,
        genericName,
        brandName || null,
        form || null,
        strength || null,
      ]
    );

    res.status(201).json({
      message: "Medication created successfully",
      medication: result.rows[0],
    });
  } catch (error) {
    console.error("Create medication error:", error);
    res.status(500).json({
      message: "Server error while creating medication",
      error: error.message,
    });
  }
});

// Get all medications
router.get("/", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT rxnorm_id, generic_name, brand_name, form, strength, created_at
       FROM medications
       ORDER BY created_at DESC`
    );

    res.json({
      message: "Medications retrieved successfully",
      count: result.rows.length,
      medications: result.rows,
    });
  } catch (error) {
    console.error("Get medications error:", error);
    res.status(500).json({
      message: "Server error while retrieving medications",
      error: error.message,
    });
  }
});

// Get one medication by rxnormId
router.get("/:rxnormId", authMiddleware, async (req, res) => {
  try {
    const { rxnormId } = req.params;

    const result = await pool.query(
      `SELECT rxnorm_id, generic_name, brand_name, form, strength, created_at
       FROM medications
       WHERE rxnorm_id = $1`,
      [rxnormId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Medication not found",
      });
    }

    res.json({
      message: "Medication retrieved successfully",
      medication: result.rows[0],
    });
  } catch (error) {
    console.error("Get medication error:", error);
    res.status(500).json({
      message: "Server error while retrieving medication",
      error: error.message,
    });
  }
});

// Update medication
router.put("/:rxnormId", authMiddleware, async (req, res) => {
  try {
    const { rxnormId } = req.params;
    const { genericName, brandName, form, strength } = req.body;

    const existingMedication = await pool.query(
      "SELECT * FROM medications WHERE rxnorm_id = $1",
      [rxnormId]
    );

    if (existingMedication.rows.length === 0) {
      return res.status(404).json({
        message: "Medication not found",
      });
    }

    const result = await pool.query(
      `UPDATE medications
       SET 
         generic_name = COALESCE($1, generic_name),
         brand_name = COALESCE($2, brand_name),
         form = COALESCE($3, form),
         strength = COALESCE($4, strength)
       WHERE rxnorm_id = $5
       RETURNING rxnorm_id, generic_name, brand_name, form, strength, created_at`,
      [
        genericName ?? null,
        brandName ?? null,
        form ?? null,
        strength ?? null,
        rxnormId,
      ]
    );

    res.json({
      message: "Medication updated successfully",
      medication: result.rows[0],
    });
  } catch (error) {
    console.error("Update medication error:", error);
    res.status(500).json({
      message: "Server error while updating medication",
      error: error.message,
    });
  }
});

// Delete medication
router.delete("/:rxnormId", authMiddleware, async (req, res) => {
  try {
    const { rxnormId } = req.params;

    const result = await pool.query(
      `DELETE FROM medications
       WHERE rxnorm_id = $1
       RETURNING rxnorm_id, generic_name, brand_name, form, strength`,
      [rxnormId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Medication not found",
      });
    }

    res.json({
      message: "Medication deleted successfully",
      medication: result.rows[0],
    });
  } catch (error) {
    console.error("Delete medication error:", error);

    if (error.code === "23503") {
      return res.status(409).json({
        message:
          "Cannot delete this medication because it is already used in a schedule",
      });
    }

    res.status(500).json({
      message: "Server error while deleting medication",
      error: error.message,
    });
  }
});

module.exports = router;