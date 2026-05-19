const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./db");
const authRoutes = require("./routes/auth.routes");
const medicationRoutes = require("./routes/medication.routes");
const scheduleRoutes = require("./routes/schedule.routes");
const medicationLogRoutes = require("./routes/medicationLog.routes");
const careLinkRoutes = require("./routes/careLink.routes");
const emergencyContactRoutes = require("./routes/emergencyContact.routes");
const emergencyAlertRoutes = require("./routes/emergencyAlert.routes");
const healthProfileRoutes = require("./routes/healthProfile.routes");

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
app.use("/medications", medicationRoutes);
app.use("/schedules", scheduleRoutes);
app.use("/medication-logs", medicationLogRoutes);
app.use("/care-links", careLinkRoutes);
app.use("/emergency-contacts", emergencyContactRoutes);
app.use("/emergency-alerts", emergencyAlertRoutes);
app.use("/health-profile", healthProfileRoutes);

app.listen(PORT, () => {
  console.log(`MaVie backend server running on port ${PORT}`);
});