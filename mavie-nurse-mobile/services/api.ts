import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "mavie_nurse_token";

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");

if (!API_URL) {
  throw new Error(
    "EXPO_PUBLIC_API_URL is missing. Add it to mavie-nurse-mobile/.env."
  );
}

export type LoggedInUser = {
  userId: string;
  username: string;
  email: string;
  role: string;
  timezone?: string;
};

export type LinkedPatient = {
  link_id: string;
  patient_user_id: string;
  patient_username: string;
  patient_email: string;
  patient_role: string;
  relationship: string;
  can_view_schedule: boolean;
  can_view_logs: boolean;
  can_manage_schedule: boolean;
  can_receive_emergency_alerts: boolean;
  active: boolean;
};

export type PatientSchedule = {
  schedule_id: string;
  user_id: string;
  rxnorm_id: string;
  generic_name: string;
  brand_name?: string | null;
  form?: string | null;
  strength?: string | null;
  dosage: string;
  instructions?: string | null;
  frequency_hours: number;
  next_dose_time: string;
};

export type PatientMedicationLog = {
  log_id: string;
  schedule_id: string;
  scheduled_time: string;
  taken_at?: string | null;
  status: "Taken" | "Missed" | "Skipped" | "Late";
  note?: string | null;
  generic_name: string;
  brand_name?: string | null;
  dosage: string;
};

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  requiresAuth = true
): Promise<T> {
  const token = requiresAuth
    ? await SecureStore.getItemAsync(TOKEN_KEY)
    : null;

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message ?? `Request failed: ${response.status}`);
  }

  return data as T;
}

export async function loginNurse(
  email: string,
  password: string
): Promise<LoggedInUser> {
  const result = await apiRequest<{
    token: string;
    user: LoggedInUser;
  }>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    },
    false
  );

  await SecureStore.setItemAsync(TOKEN_KEY, result.token);

  return result.user;
}

export async function logoutNurse(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function getCurrentUser(): Promise<LoggedInUser> {
  const result = await apiRequest<{ user: LoggedInUser }>("/auth/me");
  return result.user;
}

export async function getMyPatients(): Promise<LinkedPatient[]> {
  const result = await apiRequest<{ patients: LinkedPatient[] }>(
    "/care-links/my-patients"
  );

  return result.patients;
}

export async function connectPatientByEmail(
  patientEmail: string
): Promise<void> {
  await apiRequest("/care-links", {
    method: "POST",
    body: JSON.stringify({
      patientEmail,
      relationship: "Nurse",
      canViewSchedule: true,
      canViewLogs: true,
      canManageSchedule: false,
      canReceiveEmergencyAlerts: true,
    }),
  });
}

export async function getPatientSchedules(
  patientId: string
): Promise<PatientSchedule[]> {
  const result = await apiRequest<{ schedules: PatientSchedule[] }>(
    `/care-links/patients/${patientId}/schedules`
  );

  return result.schedules;
}

export async function getPatientMedicationLogs(
  patientId: string
): Promise<PatientMedicationLog[]> {
  const result = await apiRequest<{ logs: PatientMedicationLog[] }>(
    `/care-links/patients/${patientId}/logs`
  );

  return result.logs;
}