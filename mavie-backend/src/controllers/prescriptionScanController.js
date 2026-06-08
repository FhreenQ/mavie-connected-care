const fs = require("fs");

const {
  extractMedicationsFromImage,
} = require("../services/openaiPrescriptionService");

const {
  checkMedicationList,
} = require("../services/drugInteractionService");

async function scanPrescriptionAndCheck(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Prescription image is required.",
      });
    }

    const extracted = await extractMedicationsFromImage(
      req.file.path,
      req.file.mimetype
    );

    let existingMedications = [];

    try {
      if (req.body.existingMedications) {
        existingMedications = JSON.parse(req.body.existingMedications);
      }
    } catch (error) {
      console.log("Could not parse existingMedications:", error.message);
      existingMedications = [];
    }

    const scannedMedications = extracted.medications.filter(
      (med) => med && (med.name || med.rawName || med.genericName || med.brandName)
    );

    const medicationsForChecking = [
      ...scannedMedications,
      ...existingMedications,
    ];

    let interactionResult = null;

    if (medicationsForChecking.length >= 2) {
      interactionResult = await checkMedicationList(medicationsForChecking);
    } else {
      interactionResult = {
        medications: medicationsForChecking.map(
          (med) => med.name || med.rawName || med.genericName || med.brandName
        ),
        totalPairsChecked: 0,
        interactionCount: 0,
        interactions: [],
        allResults: [],
        overallStatus: "NOT_ENOUGH_MEDICATIONS",
      };
    }

    fs.unlinkSync(req.file.path);

    const cleanInteractions = (interactionResult.interactions || []).map((item) => ({
      status: item.status,
      drugA: item.drugA,
      drugB: item.drugB,
      matchedDrug1: item.matchedDrug1,
      matchedDrug2: item.matchedDrug2,
      interactionDescription: item.interactionDescription,
      message: item.message,
    }));

    return res.json({
      message: "Prescription scanned successfully.",
      extractedMedications: extracted.medications,
      interactionCheck: {
        overallStatus: interactionResult.overallStatus,
        totalPairsChecked: interactionResult.totalPairsChecked,
        interactionCount: interactionResult.interactionCount,
        interactions: cleanInteractions,
      },
      safetyNote:
        "This result is based on extracted text and the local interaction database. It does not replace advice from a doctor or pharmacist.",
    });
  } catch (error) {
    console.error("Prescription scan error:", error);

    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(500).json({
      message: "Failed to scan prescription.",
      error: error.message,
    });
  }
}

module.exports = {
  scanPrescriptionAndCheck,
};