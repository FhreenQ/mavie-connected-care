const express = require("express");
const multer = require("multer");

const {
  scanPrescriptionAndCheck,
} = require("../controllers/prescriptionScanController");

const router = express.Router();

const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

router.post(
  "/scan-and-check",
  upload.single("prescriptionImage"),
  scanPrescriptionAndCheck
);

module.exports = router;