const {
  checkDrugPair,
  checkMedicationList,
} = require("../services/drugInteractionService");

async function checkPair(req, res) {
  try {
    const { drugA, drugB } = req.body;

    if (!drugA || !drugB) {
      return res.status(400).json({
        message: "drugA and drugB are required.",
      });
    }

    const result = await checkDrugPair(drugA, drugB);
    return res.json(result);
  } catch (error) {
    console.error("Check pair error:", error);
    return res.status(500).json({
      message: "Failed to check drug interaction.",
      error: error.message,
    });
  }
}

async function checkList(req, res) {
  try {
    const { medications } = req.body;

    if (!Array.isArray(medications) || medications.length < 2) {
      return res.status(400).json({
        message: "medications must be an array with at least 2 medicines.",
      });
    }

    const result = await checkMedicationList(medications);
    return res.json(result);
  } catch (error) {
    console.error("Check list error:", error);
    return res.status(500).json({
      message: "Failed to check medication list.",
      error: error.message,
    });
  }
}

module.exports = {
  checkPair,
  checkList,
};