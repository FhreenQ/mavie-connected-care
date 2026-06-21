const express = require("express");
const http = require("http");
const cors = require("cors");
require("dotenv").config();

const pool = require("./db");
const authRoutes = require("./routes/auth.routes");
const medicationRoutes = require("./routes/medication.routes");
const scheduleRoutes = require("./routes/schedule.routes");
const medicationLogRoutes = require("./routes/medicationLog.routes");
const medicationStatusRoutes = require("./routes/medicationStatus.routes");
const careLinkRoutes = require("./routes/careLink.routes");
const emergencyContactRoutes = require("./routes/emergencyContact.routes");
const emergencyAlertRoutes = require("./routes/emergencyAlert.routes");
const healthProfileRoutes = require("./routes/healthProfile.routes");
const hospitalRoutes = require("./routes/hospital.routes");
const adminRoutes = require("./routes/admin.routes");
const drugInteractionRoutes = require("./routes/drugInteractionRoutes");
const prescriptionScanRoutes = require("./routes/prescriptionScanRoutes");
const mfdsRoutes = require("./routes/mfds.routes");
const koreanMedicineScanRoutes = require("./routes/koreanMedicineScan.routes");
const nurseCareRoutes = require("./routes/nurseCare.routes");
const { markOverdueMedicationDoses } = require("./services/medicationStatus.service");
const { initializeEmergencyRealtime } = require("./services/emergencyRealtime.service");

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.use("/drug-interactions", drugInteractionRoutes);
app.use("/prescriptions", prescriptionScanRoutes);

app.get("/", (req, res) => {
  res.json({ message: "MaVie backend is running" });
});

app.get("/health", (req, res) => {
  res.json({ status: "OK", service: "MaVie Backend" });
});

app.get("/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ message: "Database connected successfully", time: result.rows[0].now });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Database connection failed", error: error.message });
  }
});

app.use("/auth", authRoutes);
app.use("/medications", medicationRoutes);
app.use("/schedules", scheduleRoutes);
app.use("/medication-logs", medicationLogRoutes);
app.use("/medication-status", medicationStatusRoutes);
app.use("/care-links", careLinkRoutes);
app.use("/emergency-contacts", emergencyContactRoutes);
app.use("/emergency-alerts", emergencyAlertRoutes);
app.use("/health-profile", healthProfileRoutes);
app.use("/hospital", hospitalRoutes);
app.use("/admin", adminRoutes);
app.use("/mfds", mfdsRoutes);
app.use("/korean-medicine-label", koreanMedicineScanRoutes);
app.use("/nurse-care", nurseCareRoutes);

const PORT = Number(process.env.PORT) || 5000;

async function runOverdueMedicationCheck() {
  try {
    const logs = await markOverdueMedicationDoses();
    if (logs.length > 0) {
      console.log(`Automatically marked ${logs.length} overdue medication dose(s) as skipped.`);
    }
  } catch (error) {
    console.error("Automatic overdue medication check failed:", error.message);
  }
}

const server = http.createServer(app);
initializeEmergencyRealtime(server);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`MaVie backend server running on http://0.0.0.0:${PORT}`);
  runOverdueMedicationCheck();
});

server.on("error", (error) => {
  console.error("Server error:", error);
});

const medicationStatusTimer = setInterval(runOverdueMedicationCheck, 60 * 1000);
const keepAlive = setInterval(() => {}, 1000 * 60 * 60);

process.on("SIGINT", () => {
  console.log("Shutting down MaVie backend...");
  clearInterval(medicationStatusTimer);
  clearInterval(keepAlive);
  server.close(() => {
    process.exit(0);
  });
});
