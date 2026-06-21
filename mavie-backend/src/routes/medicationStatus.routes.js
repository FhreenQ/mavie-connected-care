const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const { markOverdueMedicationDoses } = require("../services/medicationStatus.service");

const router = express.Router();

// Records one skipped log for each of today's active doses that is more than
// one hour overdue. The NOT EXISTS guard makes this safe to call repeatedly
// from a mobile app whenever it becomes active.
router.post("/auto-skip-overdue", authMiddleware, async (req, res) => {
  try {
    const logs = await markOverdueMedicationDoses(req.user.userId);

    res.json({
      message: "Overdue medication doses checked successfully",
      count: logs.length,
      logs,
    });
  } catch (error) {
    console.error("Auto-skip overdue medication error:", error);
    res.status(500).json({
      message: "Server error while checking overdue medication doses",
      error: error.message,
    });
  }
});

module.exports = router;
