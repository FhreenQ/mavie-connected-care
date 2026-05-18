const pool = require("./db");
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth.routes");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "MaVie backend is running",
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    service: "MaVie Backend",
  });
});

const PORT = process.env.PORT || 5000;

app.get("/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      message: "Database connected successfully",
      time: result.rows[0].now,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Database connection failed",
      error: error.message,
    });
  }
});

app.use("/auth", authRoutes);

app.listen(PORT, () => {
  console.log(`MaVie backend server running on port ${PORT}`);
});