/// <reference types="expo/types" />

// NOTE: This file should not be edited and should be in your git ignore// services/api.ts

// IMPORTANT:
// Do NOT use localhost when testing on your phone.
// Use your laptop Wi-Fi IPv4 address.
// Example: http://10.121.151.226:5000
export const API_BASE_URL = "http://192.168.0.26:5000";

type ApiOptions = {
  method?: string;
  body?: any;
  token?: string | null;
};

export async function apiRequest(path: string, options: ApiOptions = {}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  console.log("Calling API:", `${API_BASE_URL}${path}`);
  
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
}

export function loginRequest(email: string, password: string) {
  return apiRequest("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export function registerRequest(payload: {
  username: string;
  email: string;
  password: string;
  role: string;
  timezone: string;
}) {
  return apiRequest("/auth/register", {
    method: "POST",
    body: payload,
  });
}

export function getCurrentUser(token: string) {
  return apiRequest("/auth/me", {
    method: "GET",
    token,
  });
}

export function getHealthProfile(token: string) {
  return apiRequest("/health-profile", {
    method: "GET",
    token,
  });
}

export function createHealthProfile(
  token: string,
  payload: {
    dateOfBirth?: string;
    bloodType?: string;
    allergies?: string;
    conditions?: string;
    emergencyNotes?: string;
    homeAddress?: string;
  }
) {
  return apiRequest("/health-profile", {
    method: "POST",
    token,
    body: payload,
  });
}

export function updateHealthProfile(
  token: string,
  payload: {
    dateOfBirth?: string;
    bloodType?: string;
    allergies?: string;
    conditions?: string;
    emergencyNotes?: string;
    homeAddress?: string;
  }
) {
  return apiRequest("/health-profile", {
    method: "PUT",
    token,
    body: payload,
  });
}

export function getEmergencyContacts(token: string) {
  return apiRequest("/emergency-contacts", {
    method: "GET",
    token,
  });
}

export type EmergencyContactPayload = {
  contactName: string;
  relationship?: string;
  phoneNumber: string;
  email?: string;
  priorityOrder?: number;
  notifyBySms?: boolean;
  notifyByEmail?: boolean;
};

export function createEmergencyContact(
  token: string,
  payload: EmergencyContactPayload
) {
  return apiRequest("/emergency-contacts", {
    method: "POST",
    token,
    body: payload,
  });
}

export function updateEmergencyContact(
  token: string,
  contactId: number | string,
  payload: EmergencyContactPayload
) {
  return apiRequest(`/emergency-contacts/${contactId}`, {
    method: "PUT",
    token,
    body: payload,
  });
}

export function deleteEmergencyContact(
  token: string,
  contactId: number | string
) {
  return apiRequest(`/emergency-contacts/${contactId}`, {
    method: "DELETE",
    token,
  });
}

export function triggerEmergencyAlert(
  token: string,
  payload: {
    latitude?: number | null;
    longitude?: number | null;
    locationText?: string;
    details?: string;
  }
) {
  return apiRequest("/emergency-alerts/trigger", {
    method: "POST",
    token,
    body: payload,
  });
}