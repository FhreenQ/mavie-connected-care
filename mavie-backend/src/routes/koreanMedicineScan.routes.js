const express = require("express");
const multer = require("multer");
const authMiddleware = require("../middleware/auth.middleware");

const {
  scanKoreanMedicineLabel,
  confirmKoreanMedicineLabel,
} = require("../controllers/koreanMedicineScanController");

const router = express.Router();

const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

router.post(
  "/scan",
  authMiddleware,
  upload.single("medicineImage"),
  scanKoreanMedicineLabel
);

router.post("/confirm", authMiddleware, confirmKoreanMedicineLabel);

module.exports = router;
