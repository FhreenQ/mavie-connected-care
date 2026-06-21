import { Alert } from "react-native";
import { syncMedicationReminders } from "../../services/medicationReminderNotifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { API_BASE_URL } from "../../services/api";

const TOKEN_KEY = "mavie_auth_token";

function hasBackend() {
  return Boolean(API_BASE_URL);
}

async function getCurrentUserToken() {
  const token = await AsyncStorage.getItem(TOKEN_KEY);

  if (!token) {
    throw new Error("Your login session has ended. Please log in again.");
  }

  return token;
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

  // The add-medicine screen currently has no time picker, so schedules start at 9 AM.
  // A future time-picker can pass a full ISO date-time instead.
  return `${safeDate}T09:00:00+09:00`;
}

async function apiRequest(path, options = {}) {
  if (!hasBackend()) {
    throw new Error("No backend URL configured. Please set EXPO_PUBLIC_API_BASE_URL.");
  }

  const token = await getCurrentUserToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || "Backend request failed");
    error.status = response.status;
    throw error;
  }

  return data;
}

export async function saveUserMedication(payload) {
  const rxnormId = makeManualMedicationId(
    payload.medicationName || payload.genericName,
    payload.dosageStrength
  );

  const genericName = payload.genericName || payload.medicationName;
  const brandName = payload.medicationName;
  const strength = payload.dosageStrength;

  // This catalog is intentionally shared. The schedule created below is tied to
  // the authenticated user, so each patient only sees their own medicines.
  try {
    await apiRequest("/medications", {
      method: "POST",
      body: JSON.stringify({
        rxnormId,
        genericName,
        brandName,
        form: "manual",
        strength,
      }),
    });
  } catch (error) {
    if (error.status !== 409 && !String(error.message).includes("already exists")) {
      throw error;
    }
  }

  const scheduleResponse = await apiRequest("/schedules", {
    method: "POST",
    body: JSON.stringify({
      rxnormId,
      dosage: strength || "As instructed",
      instructions: [payload.mealTiming, payload.notes]
        .filter(Boolean)
        .join(". "),
      frequencyHours: getFrequencyHours(payload.frequency),
      startDate: payload.startDate,
      endDate: payload.endDate || null,
      nextDoseTime: buildNextDoseTime(payload.startDate),
    }),
  });

  // Refresh notification reminders after saving medicine
  try {
    const latestSchedules = await getUserMedications();
    await syncMedicationReminders(latestSchedules);
  } catch (notificationError) {
    console.log("Medication saved, but reminder sync failed:", notificationError);
  }

  return scheduleResponse.schedule;
}

export async function getUserMedications() {
  const response = await apiRequest("/schedules", { method: "GET" });
  return response.schedules || [];
}

export async function getMedicationLogs() {
  const response = await apiRequest("/medication-logs", { method: "GET" });
  return response.logs || [];
}

export async function updateMedicationSchedule(scheduleId, payload) {
  const response = await apiRequest(`/schedules/${scheduleId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  return response.schedule;
}

function isSameScheduledTime(first, second) {
  return new Date(first).getTime() === new Date(second).getTime();
}

export async function recordMedicationStatus({ scheduleId, scheduledTime, status, note }) {
  try {
    const response = await apiRequest("/medication-logs", {
      method: "POST",
      body: JSON.stringify({
        scheduleId,
        scheduledTime,
        status,
        takenAt: status === "Taken" ? new Date().toISOString() : null,
        note,
      }),
    });

    return response.log;
  } catch (error) {
    if (error.status !== 409) {
      throw error;
    }

    // The schedule was already marked. Update that existing dose instead of
    // silently keeping an outdated Taken/Skipped choice in the UI.
    const logs = await getMedicationLogs();
    const existingLog = logs.find(
      (log) =>
        String(log.schedule_id) === String(scheduleId) &&
        isSameScheduledTime(log.scheduled_time, scheduledTime)
    );

    if (!existingLog) {
      throw error;
    }

    const response = await apiRequest(`/medication-logs/${existingLog.log_id}`, {
      method: "PUT",
      body: JSON.stringify({
        status,
        takenAt: status === "Taken" ? new Date().toISOString() : null,
        note,
      }),
    });

    return response.log;
  }
}

export async function markOverdueMedicationLogs() {
  const response = await apiRequest("/medication-status/auto-skip-overdue", {
    method: "POST",
  });

  return response.logs || [];
}

function getGenericAlias(name) {
  const normalized = String(name || "")
    .toLowerCase()
    .replace(/[\u2122\u00AE]/g, "")
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

  const schedules = await getUserMedications();
  const existingMedications = schedules.map((schedule) => {
    const savedName =
      schedule.generic_name ||
      schedule.brand_name ||
      schedule.medication_name ||
      schedule.name ||
      schedule.rxnorm_id;

    return {
      name: savedName,
      rawName: savedName,
      brandName: schedule.brand_name || schedule.medication_name || schedule.name || savedName,
      genericName: schedule.generic_name || getGenericAlias(savedName),
      ingredientCandidates: [
        schedule.generic_name,
        getGenericAlias(savedName),
        savedName,
      ].filter(Boolean),
      strength: schedule.dosage || schedule.strength || null,
      source: "EXISTING_SCHEDULE",
    };
  });

  formData.append("existingMedications", JSON.stringify(existingMedications));

  const token = await getCurrentUserToken();
  const response = await fetch(`${API_BASE_URL}/prescriptions/scan-and-check`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(text || "Failed to scan prescription image.");
  }

  return JSON.parse(text);
}
