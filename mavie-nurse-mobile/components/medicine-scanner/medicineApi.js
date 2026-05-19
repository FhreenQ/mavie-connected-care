const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "";
let localMedicationStore = [];

function hasBackend() {
  return Boolean(API_BASE_URL && !API_BASE_URL.includes("YOUR_BACKEND_URL_HERE"));
}

export async function saveUserMedication(payload) {
  if (!hasBackend()) {
    const saved = {
      id: `local-${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...payload
    };
    localMedicationStore = [saved, ...localMedicationStore];
    return saved;
  }

  const response = await fetch(`${API_BASE_URL}/api/user-medications`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error("Could not save medicine to schedule.");
  }

  return response.json();
}

export async function getUserMedications() {
  if (!hasBackend()) {
    return localMedicationStore;
  }

  const response = await fetch(`${API_BASE_URL}/api/user-medications`);

  if (!response.ok) {
    throw new Error("Could not load medicines.");
  }

  return response.json();
}

export async function scanMedicineImageWithBackend(imageAsset) {
  if (!hasBackend()) {
    throw new Error("No backend URL configured. Using local demo scanner instead.");
  }

  const formData = new FormData();
  formData.append("image", {
    uri: imageAsset.uri,
    name: imageAsset.fileName || "medicine-photo.jpg",
    type: imageAsset.mimeType || "image/jpeg"
  });

  const response = await fetch(`${API_BASE_URL}/api/medicine-scanner/scan`, {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    throw new Error("Could not scan medicine image.");
  }

  return response.json();
}
