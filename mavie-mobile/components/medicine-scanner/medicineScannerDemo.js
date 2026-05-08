export const medicineDatabase = [
  {
    id: "paracetamol-500",
    genericName: "Paracetamol / Acetaminophen",
    brandNames: ["Panadol", "Tylenol", "Calpol"],
    strength: "500mg",
    purpose: "Pain relief and fever reduction.",
    commonUsageText: "Commonly used for mild pain or fever relief. Follow the prescription label or pharmacist instructions.",
    commonMealTiming: "Usually can be taken with or without food, but follow the confirmed prescription.",
    warnings: [
      "Avoid overdose.",
      "Use extra care with liver disease.",
      "Do not combine with other acetaminophen or paracetamol products without medical advice."
    ],
    sideEffects: ["Nausea", "Rash", "Rare allergic reaction"],
    interactionWarnings: ["May interact with alcohol and some liver-affecting medicines."]
  },
  {
    id: "ibuprofen-200",
    genericName: "Ibuprofen",
    brandNames: ["Advil", "Nurofen", "Motrin"],
    strength: "200mg",
    purpose: "Pain, fever, and inflammation relief.",
    commonUsageText: "Commonly used for pain, fever, or inflammation when suitable for the person.",
    commonMealTiming: "Often taken with food or after meals to reduce stomach irritation.",
    warnings: [
      "May not be suitable for stomach ulcer history, kidney disease, some heart conditions, or certain asthma cases.",
      "Confirm before using with blood thinners or other anti-inflammatory medicines."
    ],
    sideEffects: ["Stomach discomfort", "Heartburn", "Dizziness"],
    interactionWarnings: ["Can interact with blood thinners, aspirin, some blood pressure medicines, and other NSAIDs."]
  },
  {
    id: "cetirizine-10",
    genericName: "Cetirizine",
    brandNames: ["Zyrtec", "Reactine"],
    strength: "10mg",
    purpose: "Allergy symptom relief.",
    commonUsageText: "Commonly used for sneezing, runny nose, itching, and other allergy symptoms.",
    commonMealTiming: "Commonly taken with or without food, based on confirmed label directions.",
    warnings: ["May cause drowsiness in some people.", "Confirm use for older adults or kidney disease."],
    sideEffects: ["Sleepiness", "Dry mouth", "Tiredness"],
    interactionWarnings: ["Sedating medicines or alcohol may increase drowsiness."]
  },
  {
    id: "amoxicillin-500",
    genericName: "Amoxicillin",
    brandNames: ["Amoxil", "Moxatag"],
    strength: "500mg",
    purpose: "Antibiotic used for certain bacterial infections when prescribed.",
    commonUsageText: "Only use antibiotics when prescribed and complete the course exactly as directed by a clinician.",
    commonMealTiming: "May be taken with or without food depending on the confirmed prescription label.",
    warnings: ["Do not use without a valid prescription.", "Avoid if allergic to penicillin-type antibiotics unless a clinician confirms otherwise."],
    sideEffects: ["Diarrhea", "Nausea", "Rash"],
    interactionWarnings: ["Can interact with some blood thinners and other medicines."]
  },
  {
    id: "vitamin-c-1000",
    genericName: "Vitamin C",
    brandNames: ["Redoxon", "Cebion", "Ascorbic Acid"],
    strength: "1000mg",
    purpose: "Vitamin supplement for nutritional support.",
    commonUsageText: "Used as a supplement when appropriate for a person's health needs.",
    commonMealTiming: "Often taken with food if stomach discomfort occurs.",
    warnings: ["High doses may not be suitable for people with kidney stone history."],
    sideEffects: ["Stomach upset", "Diarrhea", "Heartburn"],
    interactionWarnings: ["Can affect some lab tests and may interact with selected medicines."]
  },
  {
    id: "aspirin-100",
    genericName: "Aspirin",
    brandNames: ["Bayer", "Disprin", "Cardiprin"],
    strength: "100mg",
    purpose: "Pain relief or antiplatelet therapy when directed by a clinician.",
    commonUsageText: "Low-dose aspirin is sometimes used for heart or stroke prevention only when specifically advised.",
    commonMealTiming: "Often taken with food or after meals to reduce stomach irritation.",
    warnings: ["Can increase bleeding risk.", "Confirm before use with ulcers, bleeding disorders, surgery, pregnancy, or asthma history."],
    sideEffects: ["Stomach irritation", "Bleeding", "Ringing in the ears"],
    interactionWarnings: ["Can interact with blood thinners, other NSAIDs, steroids, and some supplements."]
  }
];

const keywordMap = [
  { keywords: ["paracetamol", "acetaminophen", "panadol", "tylenol"], medicineId: "paracetamol-500" },
  { keywords: ["ibuprofen", "advil", "nurofen", "motrin"], medicineId: "ibuprofen-200" },
  { keywords: ["cetirizine", "zyrtec", "reactine"], medicineId: "cetirizine-10" },
  { keywords: ["amoxicillin", "amoxil"], medicineId: "amoxicillin-500" },
  { keywords: ["vitamin-c", "vitamin_c", "vitaminc", "ascorbic", "redoxon"], medicineId: "vitamin-c-1000" },
  { keywords: ["aspirin", "bayer", "disprin"], medicineId: "aspirin-100" }
];

export async function scanMedicineImage(imageAsset) {
  const cnnResult = classifyMedicineImage(imageAsset);
  const ocrResult = extractTextFromMedicineImage(imageAsset);
  const matchResult = matchMedicine({
    cnnPredictions: cnnResult.predictions,
    ocrText: ocrResult.text,
    ocrResult
  });

  return {
    cnnPredictions: cnnResult.predictions,
    modelType: cnnResult.modelType,
    ocrResult,
    matchedMedicine: matchResult.matchedMedicine,
    matchSource: matchResult.matchSource,
    confidence: matchResult.confidence,
    warnings: matchResult.warnings,
    safetyDisclaimer:
      "This feature provides AI-assisted medicine recognition only. It may be incorrect. Always confirm with your prescription, doctor, pharmacist, or caregiver before taking or changing medication."
  };
}

export function classifyMedicineImage(imageAsset) {
  const name = normalizeText(`${imageAsset?.fileName || ""} ${imageAsset?.uri || ""}`);
  const matched = keywordMap.find((entry) => entry.keywords.some((keyword) => name.includes(keyword)));

  if (!matched) {
    return {
      predictions: [
        { medicineId: "unknown", label: "Unknown", confidence: 0.42 },
        { medicineId: "paracetamol-500", label: "Paracetamol / Acetaminophen 500mg", confidence: 0.08 },
        { medicineId: "vitamin-c-1000", label: "Vitamin C 1000mg", confidence: 0.05 }
      ],
      modelType: "DEMO_FILENAME_CLASSIFIER"
    };
  }

  const medicine = findMedicineById(matched.medicineId);
  const secondaryId = matched.medicineId === "vitamin-c-1000" ? "paracetamol-500" : "vitamin-c-1000";
  const secondary = findMedicineById(secondaryId);

  return {
    predictions: [
      { medicineId: medicine.id, label: `${medicine.genericName} ${medicine.strength}`, confidence: 0.89 },
      { medicineId: secondary.id, label: `${secondary.genericName} ${secondary.strength}`, confidence: 0.08 },
      { medicineId: "unknown", label: "Unknown", confidence: 0.03 }
    ],
    modelType: "DEMO_FILENAME_CLASSIFIER"
  };
}

export function extractTextFromMedicineImage(imageAsset) {
  const name = normalizeText(`${imageAsset?.fileName || ""} ${imageAsset?.uri || ""}`);
  const matched = keywordMap.find((entry) => entry.keywords.some((keyword) => name.includes(keyword)));
  const medicine = matched ? findMedicineById(matched.medicineId) : null;
  const demoText = medicine
    ? `${medicine.genericName} ${medicine.strength}. Follow the prescription label.`
    : "";

  return {
    text: demoText,
    possibleMedicineName: medicine?.genericName || "",
    possibleStrength: medicine?.strength || parseStrength(demoText),
    possibleInstruction: parseInstruction(demoText),
    possibleFrequency: parseFrequency(demoText),
    possibleMealTiming: parseMealTiming(demoText),
    engine: demoText ? "DEMO_FILENAME_OCR" : "MANUAL_ENTRY"
  };
}

export function matchMedicine({ cnnPredictions = [], ocrText = "", ocrResult = {} }) {
  const ocrMatch = findOcrMatch(ocrText || ocrResult.text || "");

  if (ocrMatch.confidence >= 0.6) {
    return {
      matchedMedicine: ocrMatch.medicine,
      matchSource: "OCR",
      confidence: ocrMatch.confidence,
      warnings: ["Possible match only. Please review every field before saving."]
    };
  }

  const topPrediction = cnnPredictions
    .filter((prediction) => prediction.medicineId !== "unknown")
    .sort((a, b) => b.confidence - a.confidence)[0];

  if (topPrediction?.confidence >= 0.7) {
    return {
      matchedMedicine: findMedicineById(topPrediction.medicineId),
      matchSource: "CNN",
      confidence: topPrediction.confidence,
      warnings: ["Possible match only. Please confirm with a prescription, pharmacist, doctor, nurse, or caregiver."]
    };
  }

  return {
    matchedMedicine: null,
    matchSource: "MANUAL_REQUIRED",
    confidence: Math.max(ocrMatch.confidence, topPrediction?.confidence || 0),
    warnings: [
      "We could not confidently identify this medicine. Please enter the information manually or ask a pharmacist, caregiver, nurse, or doctor."
    ]
  };
}

function findMedicineById(id) {
  return medicineDatabase.find((medicine) => medicine.id === id) || null;
}

function findOcrMatch(text) {
  const normalized = normalizeText(text);
  let best = { medicine: null, confidence: 0 };

  for (const medicine of medicineDatabase) {
    const names = [medicine.genericName, ...medicine.brandNames];
    const nameMatched = names.some((name) => normalized.includes(normalizeText(name).split(" ")[0]));
    const strengthMatched = normalized.includes(normalizeText(medicine.strength));
    const confidence = nameMatched && strengthMatched ? 0.92 : nameMatched ? 0.72 : 0;

    if (confidence > best.confidence) {
      best = { medicine, confidence };
    }
  }

  return best;
}

function parseStrength(text) {
  return text.match(/\b\d+(?:\.\d+)?\s?(?:mg|g|mcg|ug|ml|iu)\b/i)?.[0]?.replace(/\s+/g, "") || "";
}

function parseInstruction(text) {
  return text
    .split(/(?<=[.!?])\s+/)
    .find((sentence) => /\b(take|use|follow|after meals|before meals|with food)\b/i.test(sentence)) || "";
}

function parseFrequency(text) {
  return text.match(/\b(once daily|twice daily|three times daily|3 times daily|once weekly)\b/i)?.[0]?.toLowerCase() || "";
}

function parseMealTiming(text) {
  return text.match(/\b(before meals?|after meals?|with food|with meals?)\b/i)?.[0]?.toLowerCase() || "";
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/acetaminophen/g, "paracetamol")
    .replace(/vitamin\s*c/g, "vitaminc")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
