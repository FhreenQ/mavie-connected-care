const db = require("../db");

function normalizeDrugName(name) {
  return String(name || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[™®]/g, "");
}

function makePairKey(drugA, drugB) {
  const a = normalizeDrugName(drugA);
  const b = normalizeDrugName(drugB);
  return [a, b].sort().join("||");
}

function uniqueClean(values) {
  return [...new Set(
    values
      .filter(Boolean)
      .map((v) => String(v).trim())
      .filter((v) => v.length > 0)
  )];
}

function getMedicationCandidates(med) {
  if (typeof med === "string") {
    med = { name: med };
  }

  const candidates = [];

  const rawName = med.name || med.rawName || med.raw_name;
  const brandName = med.brandName || med.brand_name;
  const genericName = med.genericName || med.generic_name;

  candidates.push(rawName);
  candidates.push(brandName);
  candidates.push(genericName);

  if (Array.isArray(med.candidates)) {
    candidates.push(...med.candidates);
  }

  if (Array.isArray(med.ingredientCandidates)) {
    candidates.push(...med.ingredientCandidates);
  }

  // Example: "Norvasc (Amlodipine)" → add "Norvasc" and "Amlodipine"
  if (rawName) {
    const value = String(rawName).trim();

    const parenthesesMatch = value.match(/\(([^)]+)\)/);
    if (parenthesesMatch && parenthesesMatch[1]) {
      candidates.push(parenthesesMatch[1].trim());
    }

    const withoutParentheses = value.replace(/\([^)]*\)/g, "").trim();
    if (withoutParentheses && withoutParentheses !== value) {
      candidates.push(withoutParentheses);
    }

    // Handles names like "Brand - Generic" or "Brand / Generic"
    const splitParts = value.split(/[-/,+]/).map((part) => part.trim());
    candidates.push(...splitParts);
  }

  return uniqueClean(candidates);
}

async function runQuery(sql, params) {
  if (typeof db.query === "function") {
    return db.query(sql, params);
  }

  if (db.pool && typeof db.pool.query === "function") {
    return db.pool.query(sql, params);
  }

  throw new Error("Database query function not found in src/db.js");
}

async function checkDrugPairFlexible(medA, medB) {
  const candidatesA = getMedicationCandidates(medA);
  const candidatesB = getMedicationCandidates(medB);

  const pairKeys = [];

  for (const a of candidatesA) {
    for (const b of candidatesB) {
      pairKeys.push(makePairKey(a, b));
    }
  }

  const uniquePairKeys = [...new Set(pairKeys)];

  const result = await runQuery(
    `
    SELECT drug1, drug2, interaction_description, pair_key
    FROM drug_interactions
    WHERE pair_key = ANY($1::text[])
    LIMIT 1;
    `,
    [uniquePairKeys]
  );

  const displayA = typeof medA === "string" ? medA : medA.name || medA.rawName;
  const displayB = typeof medB === "string" ? medB : medB.name || medB.rawName;

  if (result.rows.length > 0) {
    return {
      hasInteraction: true,
      status: "INTERACTION_FOUND",
      drugA: displayA,
      drugB: displayB,
      candidatesA,
      candidatesB,
      matchedDrug1: result.rows[0].drug1,
      matchedDrug2: result.rows[0].drug2,
      interactionDescription: result.rows[0].interaction_description,
      message: "Potential interaction found in database.",
    };
  }

  return {
    hasInteraction: false,
    status: "NO_KNOWN_INTERACTION",
    drugA: displayA,
    drugB: displayB,
    candidatesA,
    candidatesB,
    interactionDescription: null,
    message:
      "No known interaction found in this database. This does not guarantee the combination is safe. Please consult a doctor or pharmacist.",
  };
}

async function checkMedicationList(medications) {
  const cleanMeds = medications.filter(Boolean);

  const results = [];

  for (let i = 0; i < cleanMeds.length; i++) {
    for (let j = i + 1; j < cleanMeds.length; j++) {
      const result = await checkDrugPairFlexible(cleanMeds[i], cleanMeds[j]);
      results.push(result);
    }
  }

  const interactions = results.filter((item) => item.hasInteraction);

  return {
    medications: cleanMeds.map((med) =>
      typeof med === "string" ? med : med.name || med.rawName
    ),
    totalPairsChecked: results.length,
    interactionCount: interactions.length,
    interactions,
    allResults: results,
    overallStatus:
      interactions.length > 0 ? "INTERACTION_FOUND" : "NO_KNOWN_INTERACTION",
  };
}

module.exports = {
  checkDrugPair: checkDrugPairFlexible,
  checkMedicationList,
};