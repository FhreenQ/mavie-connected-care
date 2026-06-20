import { Alert } from "react-native";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const DEV_EMAIL = process.env.EXPO_PUBLIC_DEV_EMAIL;
const DEV_PASSWORD = process.env.EXPO_PUBLIC_DEV_PASSWORD;

let cachedToken = null;

function hasBackend() {
  return Boolean(API_BASE_URL);
}

function getFrequencyHours(frequency) {
  const value = String(frequency || "").toLowerCase();

  if (value.includes("once weekly")) return 168;
  if (value.includes("three times")) return 8;
  if (value.includes("twice")) return 12;
  if (value.includes("once daily")) return 24;

  return 24;
}

function makeManualMedicationId(medicineName, strength) {
  const safeName = String(medicineName || "MED")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const safeStrength = String(strength || "GEN")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return `MANUAL-${safeName}-${safeStrength}`.slice(0, 20);
}

function buildNextDoseTime(startDate) {
  const safeDate = startDate || new Date().toISOString().slice(0, 10);

  // For now, we set first dose time to 9 AM Korea time.
  // Later, we can add a time picker in the app.
  return `${safeDate}T09:00:00+09:00`;
}

async function loginForDevToken() {
  if (cachedToken) {
    return cachedToken;
  }

  if (!DEV_EMAIL || !DEV_PASSWORD) {
    throw new Error("Missing EXPO_PUBLIC_DEV_EMAIL or EXPO_PUBLIC_DEV_PASSWORD in mavie-mobile/.env");
  }

  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: DEV_EMAIL,
      password: DEV_PASSWORD,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Login failed");
  }

  cachedToken = data.token;
  return cachedToken;
}

async function apiRequest(path, options = {}) {
  if (!hasBackend()) {
    throw new Error("No backend URL configured. Please set EXPO_PUBLIC_API_BASE_URL.");
  }

  console.log("API request:", `${API_BASE_URL}${path}`);

  const token = await loginForDevToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Backend request failed");
  }

  return data;
}

export async function saveUserMedication(payload) {
  Alert.alert("Backend test", `Using API: ${API_BASE_URL}`);
  console.log("saveUserMedication called with:", payload);
  console.log("API_BASE_URL:", API_BASE_URL);

  const rxnormId = makeManualMedicationId(
    payload.medicationName || payload.genericName,
    payload.dosageStrength
  );

  const genericName = payload.genericName || payload.medicationName;
  const brandName = payload.medicationName;
  const strength = payload.dosageStrength;
  const form = "manual";

  // Step 1: Save medicine into medication catalog
  try {
    await apiRequest("/medications", {
      method: "POST",
      body: JSON.stringify({
        rxnormId,
        genericName,
        brandName,
        form,
        strength,
      }),
    });
  } catch (error) {
    // If medication already exists, continue to create schedule.
    if (!String(error.message).includes("already exists")) {
      throw error;
    }
  }

  // Step 2: Save user schedule
  const frequencyHours = getFrequencyHours(payload.frequency);
  const nextDoseTime = buildNextDoseTime(payload.startDate);

  const scheduleResponse = await apiRequest("/schedules", {
    method: "POST",
    body: JSON.stringify({
      rxnormId,
      dosage: strength || "As instructed",
      instructions: [payload.mealTiming, payload.notes]
        .filter(Boolean)
        .join(". "),
      frequencyHours,
      startDate: payload.startDate,
      endDate: payload.endDate || null,
      nextDoseTime,
    }),
  });

  return scheduleResponse.schedule;
}

export async function getUserMedications() {
  const response = await apiRequest("/schedules", {
    method: "GET",
  });

  return response.schedules || [];
}

function getGenericAlias(name) {
  const normalized = String(name || "")
    .toLowerCase()
    .replace(/[™®]/g, "")
    .trim();

  const aliases = {
    glucophage: "Metformin",
    glucohage: "Metformin",
    norvasc: "Amlodipine",
    tenormin: "Atenolol",
    lipitor: "Atorvastatin",
    plavix: "Clopidogrel",
  };

  return aliases[normalized] || null;
}

export async function scanMedicineImageWithBackend(imageAsset) {
  if (!hasBackend()) {
    throw new Error("No backend URL configured. Please set EXPO_PUBLIC_API_BASE_URL.");
  }

  if (!imageAsset?.uri) {
    throw new Error("No image selected.");
  }

  const formData = new FormData();

  const fileName = imageAsset.fileName || "prescription.jpg";
  const fileType = imageAsset.mimeType || imageAsset.type || "image/jpeg";

  formData.append("prescriptionImage", {
    uri: imageAsset.uri,
    name: fileName,
    type: fileType,
  });

  const token = await loginForDevToken();

  const schedulesResponse = await apiRequest("/schedules", {
    method: "GET",
  });

  const existingMedications = (schedulesResponse.schedules || []).map((schedule) => {
    const savedName =
      schedule.genericName ||
      schedule.brandName ||
      schedule.medicationName ||
      schedule.name ||
      schedule.rxnormId;

    return {
      name: savedName,
      rawName: savedName,
      brandName: schedule.brandName || schedule.medicationName || schedule.name || savedName,
      genericName: schedule.genericName || getGenericAlias(savedName),
      ingredientCandidates: [
        schedule.genericName,
        getGenericAlias(savedName),
        savedName,
      ].filter(Boolean),
      strength: schedule.dosage || schedule.strength || null,
      source: "EXISTING_SCHEDULE",
    };
  });

  formData.append("existingMedications", JSON.stringify(existingMedications));

  console.log("Uploading prescription image to:", `${API_BASE_URL}/prescriptions/scan-and-check`);

  const response = await fetch(`${API_BASE_URL}/prescriptions/scan-and-check`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(text || "Failed to scan prescription image.");
  }

  return JSON.parse(text);
}
