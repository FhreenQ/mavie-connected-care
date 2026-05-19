const express = require("express");
const pool = require("../db");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

// Create emergency contact
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      contactName,
      relationship,
      phoneNumber,
      email,
      priorityOrder,
      notifyBySms,
      notifyByEmail,
    } = req.body;

    if (!contactName || !phoneNumber) {
      return res.status(400).json({
        message: "contactName and phoneNumber are required",
      });
    }

    const result = await pool.query(
      `INSERT INTO emergency_contacts
       (
         user_id,
         contact_name,
         relationship,
         phone_number,
         email,
         priority_order,
         notify_by_sms,
         notify_by_email
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING contact_id, user_id, contact_name, relationship, phone_number,
                 email, priority_order, notify_by_sms, notify_by_email,
                 active, created_at`,
      [
        req.user.userId,
        contactName,
        relationship || null,
        phoneNumber,
        email || null,
        priorityOrder || 1,
        notifyBySms ?? true,
        notifyByEmail ?? true,
      ]
    );

    res.status(201).json({
      message: "Emergency contact created successfully",
      contact: result.rows[0],
    });
  } catch (error) {
    console.error("Create emergency contact error:", error);
    res.status(500).json({
      message: "Server error while creating emergency contact",
      error: error.message,
    });
  }
});

// Get all emergency contacts for current user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT contact_id, user_id, contact_name, relationship, phone_number,
              email, priority_order, notify_by_sms, notify_by_email,
              active, created_at
       FROM emergency_contacts
       WHERE user_id = $1
         AND active = TRUE
       ORDER BY priority_order ASC, created_at DESC`,
      [req.user.userId]
    );

    res.json({
      message: "Emergency contacts retrieved successfully",
      count: result.rows.length,
      contacts: result.rows,
    });
  } catch (error) {
    console.error("Get emergency contacts error:", error);
    res.status(500).json({
      message: "Server error while retrieving emergency contacts",
      error: error.message,
    });
  }
});

// Get one emergency contact
router.get("/:contactId", authMiddleware, async (req, res) => {
  try {
    const { contactId } = req.params;

    const result = await pool.query(
      `SELECT contact_id, user_id, contact_name, relationship, phone_number,
              email, priority_order, notify_by_sms, notify_by_email,
              active, created_at
       FROM emergency_contacts
       WHERE contact_id = $1
         AND user_id = $2`,
      [contactId, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Emergency contact not found",
      });
    }

    res.json({
      message: "Emergency contact retrieved successfully",
      contact: result.rows[0],
    });
  } catch (error) {
    console.error("Get emergency contact error:", error);
    res.status(500).json({
      message: "Server error while retrieving emergency contact",
      error: error.message,
    });
  }
});

// Update emergency contact
router.put("/:contactId", authMiddleware, async (req, res) => {
  try {
    const { contactId } = req.params;

    const {
      contactName,
      relationship,
      phoneNumber,
      email,
      priorityOrder,
      notifyBySms,
      notifyByEmail,
      active,
    } = req.body;

    const existingContact = await pool.query(
      `SELECT contact_id
       FROM emergency_contacts
       WHERE contact_id = $1
         AND user_id = $2`,
      [contactId, req.user.userId]
    );

    if (existingContact.rows.length === 0) {
      return res.status(404).json({
        message: "Emergency contact not found",
      });
    }

    const result = await pool.query(
      `UPDATE emergency_contacts
       SET
         contact_name = COALESCE($1, contact_name),
         relationship = COALESCE($2, relationship),
         phone_number = COALESCE($3, phone_number),
         email = COALESCE($4, email),
         priority_order = COALESCE($5, priority_order),
         notify_by_sms = COALESCE($6, notify_by_sms),
         notify_by_email = COALESCE($7, notify_by_email),
         active = COALESCE($8, active)
       WHERE contact_id = $9
         AND user_id = $10
       RETURNING contact_id, user_id, contact_name, relationship, phone_number,
                 email, priority_order, notify_by_sms, notify_by_email,
                 active, created_at`,
      [
        contactName ?? null,
        relationship ?? null,
        phoneNumber ?? null,
        email ?? null,
        priorityOrder ?? null,
        notifyBySms ?? null,
        notifyByEmail ?? null,
        active ?? null,
        contactId,
        req.user.userId,
      ]
    );

    res.json({
      message: "Emergency contact updated successfully",
      contact: result.rows[0],
    });
  } catch (error) {
    console.error("Update emergency contact error:", error);
    res.status(500).json({
      message: "Server error while updating emergency contact",
      error: error.message,
    });
  }
});

// Soft delete emergency contact
router.delete("/:contactId", authMiddleware, async (req, res) => {
  try {
    const { contactId } = req.params;

    const result = await pool.query(
      `UPDATE emergency_contacts
       SET active = FALSE
       WHERE contact_id = $1
         AND user_id = $2
       RETURNING contact_id, contact_name, active`,
      [contactId, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Emergency contact not found",
      });
    }

    res.json({
      message: "Emergency contact deactivated successfully",
      contact: result.rows[0],
    });
  } catch (error) {
    console.error("Delete emergency contact error:", error);
    res.status(500).json({
      message: "Server error while deleting emergency contact",
      error: error.message,
    });
  }
});

module.exports = router;