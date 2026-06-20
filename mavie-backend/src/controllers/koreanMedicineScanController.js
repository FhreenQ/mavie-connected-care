const fs = require("fs");
const pool = require("../db");

const {
  extractKoreanMedicineLabelFromImage,
} = require("../services/openaiKoreanMedicineLabelService");

const {
  confirmDetectedDrug,
} = require("../services/mfdsDrug.service");

const {
  checkMedicationList,
} = require("../services/drugInteractionService");

async function scanKoreanMedicineLabel(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Medicine label image is required.",
      });
    }

    const detected = await extractKoreanMedicineLabelFromImage(
      req.file.path,
      req.file.mimetype
    );

    removeUploadedFile(req.file.path);

    return res.json({
      message: "Korean medicine label scanned successfully.",
      detected,
      nextStep:
        "User must confirm or edit detected text before MFDS lookup and saving.",
      safetyNote:
        "This is AI-assisted text extraction only. The user must confirm with the medicine label, doctor, pharmacist, nurse, or caregiver.",
    });
  } catch (error) {
    if (req.file?.path) {
      removeUploadedFile(req.file.path);
    }

    console.error("Korean medicine label scan error:", error);
    return res.status(500).json({
      message: "Failed to scan Korean medicine label.",
      error: error.message,
    });
  }
}

async function confirmKoreanMedicineLabel(req, res) {
  try {
    const {
      visibleProductName,
      strength,
      visibleIngredient,
      rawVisibleText,
      itemSeq,
      confirmedByUser,
      schedule,
    } = req.body;

    if (!confirmedByUser) {
      return res.status(400).json({
        message: "confirmedByUser must be true before saving medicine.",
      });
    }

    if (!visibleProductName && !visibleIngredient && !rawVisibleText && !itemSeq) {
      return res.status(400).json({
        message:
          "visibleProductName, visibleIngredient, rawVisibleText, or itemSeq is required.",
      });
    }

    const mfdsConfirmation = await confirmDetectedDrug({
      visibleProductName,
      strength,
      visibleIngredient,
      rawVisibleText,
      itemSeq,
    });

    if (!mfdsConfirmation.bestMatch) {
      return res.status(404).json({
        message: "No official MFDS product match found.",
        mfdsConfirmation,
        safetyNote:
          "Ask the user to manually confirm the Korean product name or try another scan.",
      });
    }

    const mfdsProduct = mfdsConfirmation.bestMatch;

    if ((mfdsProduct.matchConfidence ?? mfdsConfirmation.confidence ?? 0) < 0.6) {
  return res.status(422).json({
    message: "MFDS returned candidates, but no confident product match was found.",
    mfdsConfirmation,
    safetyNote:
      "The user should manually select the correct official MFDS product before saving.",
  });
}

    const existingMedications = await getCurrentUserMedicationCandidates(
      req.user.userId
    );
    const newMedicationCandidate = buildDdiMedicationCandidate(mfdsProduct);

    const interactionCheck = existingMedications.length
      ? await checkMedicationList([
          newMedicationCandidate,
          ...existingMedications,
        ])
      : {
          medications: [newMedicationCandidate.name],
          totalPairsChecked: 0,
          interactionCount: 0,
          interactions: [],
          allResults: [],
          overallStatus: "NO_EXISTING_MEDICATIONS",
        };

    const savedMedication = await upsertMfdsMedication({
      mfdsProduct,
      fallbackStrength: strength,
    });

    let savedSchedule = null;

    if (schedule) {
      savedSchedule = await createMedicationSchedule({
        userId: req.user.userId,
        rxnormId: savedMedication.rxnorm_id,
        schedule,
      });
    }

    return res.status(201).json({
      message: "Korean medicine confirmed with MFDS and saved successfully.",
      mfdsProduct,
      savedMedication,
      savedSchedule,
      existingMedicationCount: existingMedications.length,
      interactionCheck: summarizeInteractionCheck(interactionCheck),
      durCheck: {
        status: "NOT_IMPLEMENTED",
        message:
          "MFDS DUR 병용금기 API check is optional and not connected yet.",
      },
      safetyNote:
        "MFDS lookup and local interaction checks do not replace medical advice. Confirm with a doctor or pharmacist before taking or changing medication.",
    });
  } catch (error) {
    console.error("Korean medicine confirmation error:", error);
    return res.status(500).json({
      message: "Failed to confirm Korean medicine workflow.",
      error: error.message,
    });
  }
}

async function getCurrentUserMedicationCandidates(userId) {
  const result = await pool.query(
    `SELECT
        s.schedule_id,
        s.rxnorm_id,
        m.generic_name,
        m.brand_name,
        m.form,
        m.strength,
        s.dosage,
        s.instructions
     FROM schedules s
     JOIN medications m ON s.rxnorm_id = m.rxnorm_id
     WHERE s.user_id = $1
       AND s.active = TRUE
     ORDER BY s.created_at DESC`,
    [userId]
  );

  return result.rows.map((row) => ({
    name: row.brand_name || row.generic_name,
    rawName: row.brand_name || row.generic_name,
    brandName: row.brand_name,
    genericName: row.generic_name,
    strength: row.strength || row.dosage,
    ingredientCandidates: uniqueClean([
      row.generic_name,
      row.brand_name,
      row.instructions,
    ]),
  }));
}

async function upsertMfdsMedication({ mfdsProduct, fallbackStrength }) {
  const rxnormId = `MFDS-${mfdsProduct.itemSeq}`;
  const genericName =
    mfdsProduct.activeIngredients?.[0] ||
    mfdsProduct.mainIngredientEn ||
    mfdsProduct.itemName;
  const brandName = mfdsProduct.itemName;
  const strength = extractStrength(mfdsProduct, fallbackStrength);
  const form = inferForm(mfdsProduct);

  const result = await pool.query(
    `INSERT INTO medications
       (rxnorm_id, generic_name, brand_name, form, strength)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (rxnorm_id)
     DO UPDATE SET
       generic_name = EXCLUDED.generic_name,
       brand_name = EXCLUDED.brand_name,
       form = EXCLUDED.form,
       strength = EXCLUDED.strength
     RETURNING rxnorm_id, generic_name, brand_name, form, strength, created_at`,
    [rxnormId, genericName, brandName, form, strength]
  );

  return result.rows[0];
}

async function createMedicationSchedule({ userId, rxnormId, schedule }) {
  const {
    dosage,
    instructions,
    frequencyHours,
    startDate,
    endDate,
    nextDoseTime,
  } = schedule;

  if (!dosage || !frequencyHours || !nextDoseTime) {
    throw new Error(
      "schedule.dosage, schedule.frequencyHours, and schedule.nextDoseTime are required when schedule is provided."
    );
  }

  const result = await pool.query(
    `INSERT INTO schedules
       (user_id, rxnorm_id, dosage, instructions, frequency_hours, start_date, end_date, next_dose_time, created_by)
     VALUES ($1, $2, $3, $4, $5, COALESCE($6, CURRENT_DATE), $7, $8, $9)
     RETURNING schedule_id, user_id, rxnorm_id, dosage, instructions,
               frequency_hours, start_date, end_date, next_dose_time,
               active, created_by, created_at`,
    [
      userId,
      rxnormId,
      dosage,
      instructions || null,
      frequencyHours,
      startDate || null,
      endDate || null,
      nextDoseTime,
      userId,
    ]
  );

  return result.rows[0];
}

function buildDdiMedicationCandidate(mfdsProduct) {
  return {
    name: mfdsProduct.itemName,
    rawName: mfdsProduct.itemName,
    brandName: mfdsProduct.itemName,
    genericName:
      mfdsProduct.activeIngredients?.[0] || mfdsProduct.mainIngredientEn,
    strength: extractStrength(mfdsProduct),
    ingredientCandidates: uniqueClean([
      ...(mfdsProduct.activeIngredients || []),
      ...(mfdsProduct.activeIngredientDetails || []).map((item) => item.name),
      ...(mfdsProduct.activeIngredientDetails || []).map((item) => item.raw),
      mfdsProduct.mainIngredientEn,
      mfdsProduct.itemName,
      mfdsProduct.itemNameEn,
    ]),
  };
}

function summarizeInteractionCheck(interactionCheck) {
  return {
    overallStatus: interactionCheck.overallStatus,
    totalPairsChecked: interactionCheck.totalPairsChecked,
    interactionCount: interactionCheck.interactionCount,
    interactions: (interactionCheck.interactions || []).map((item) => ({
      status: item.status,
      drugA: item.drugA,
      drugB: item.drugB,
      matchedDrug1: item.matchedDrug1,
      matchedDrug2: item.matchedDrug2,
      interactionDescription: item.interactionDescription,
      message: item.message,
    })),
  };
}

function extractStrength(mfdsProduct, fallbackStrength = "") {
  const material = mfdsProduct.materialDetails?.[0];

  if (material?.amount && material?.unit) {
    return `${material.amount} ${material.unit}`;
  }

  if (fallbackStrength) {
    return fallbackStrength;
  }

  const nameMatch = String(mfdsProduct.itemName || "").match(
    /\d+(?:\.\d+)?\s*(?:mg|g|mcg|μg|밀리그램|그램)/i
  );

  return nameMatch?.[0] || "";
}

function inferForm(mfdsProduct) {
  const text = `${mfdsProduct.itemName || ""} ${mfdsProduct.chart || ""}`;

  if (/정제|정\b|tablet/i.test(text)) return "정제";
  if (/캡슐|capsule/i.test(text)) return "캡슐";
  if (/시럽|syrup/i.test(text)) return "시럽";
  if (/산제|가루|powder/i.test(text)) return "산제";
  if (/주사|injection/i.test(text)) return "주사제";

  return "";
}

function uniqueClean(values) {
  return [
    ...new Set(
      values
        .filter(Boolean)
        .map((value) => String(value).trim())
        .filter(Boolean)
    ),
  ];
}

function removeUploadedFile(filePath) {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

module.exports = {
  scanKoreanMedicineLabel,
  confirmKoreanMedicineLabel,
};
