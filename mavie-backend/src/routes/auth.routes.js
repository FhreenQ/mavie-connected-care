const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();


// Register new user
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, role, timezone } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        message: "Username, email, and password are required",
      });
    }

    const existingUser = await pool.query(
      "SELECT user_id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        message: "Email already registered",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, role, timezone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING user_id, username, email, role, timezone, created_at`,
      [
        username,
        email,
        passwordHash,
        role || "patient",
        timezone || "UTC",
      ]
    );

    res.status(201).json({
      message: "User registered successfully",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      message: "Server error during registration",
      error: error.message,
    });
  }
});

// Login user
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const user = result.rows[0];

    const isPasswordValid = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        userId: user.user_id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        userId: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role,
        timezone: user.timezone,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "Server error during login",
      error: error.message,
    });
  }
});

// Get current logged-in user
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT user_id, username, email, role, timezone, created_at
       FROM users
       WHERE user_id = $1`,
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json({
      message: "Current user retrieved successfully",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({
      message: "Server error while retrieving current user",
      error: error.message,
    });
  }
});

module.exports = router;

