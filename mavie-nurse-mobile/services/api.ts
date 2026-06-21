import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "mavie_nurse_token";
const NURSE_APP_ROLES = new Set(["nurse", "caregiver"]);

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

export type NurseProfile = {
  user_id: string;
  username: string;
  email: string;
  role: string;
  timezone?: string;
  phone?: string | null;
  department?: string | null;
  ward?: string | null;
  shift?: string | null;
};

export type PatientClinicalProfile = {
  user_id: string;
  username: string;
  email: string;
  date_of_birth?: string | null;
  blood_type?: string | null;
  allergies?: string | null;
  conditions?: string | null;
  emergency_notes?: string | null;
  home_address?: string | null;
  age?: string | null;
  gender?: string | null;
  room?: string | null;
  notes?: string | null;
  emergency_contact_summary?: string | null;
};

export type PatientEmergencyContact = {
  contact_id: string;
  contact_name: string;
  relationship?: string | null;
  phone_number: string;
  email?: string | null;
  priority_order?: number;
  notify_by_sms?: boolean;
  notify_by_email?: boolean;
};

export type NurseEmergencyEvent = {
  emergency_event_id: string;
  user_id: string;
  patient_username: string;
  status: string;
  location_text?: string | null;
  details?: string | null;
  created_at: string;
  resolved_at?: string | null;
  action_logs?: NurseEmergencyActionLog[];
};

export type NurseEmergencyActionLog = {
  emergency_event_id: string;
  action: "Acknowledged" | "Resolved" | "Rejected";
  note?: string | null;
  created_at: string;
  nurse_username: string;
};

function assertNurseAppRole(user: LoggedInUser) {
  if (!NURSE_APP_ROLES.has(String(user.role || "").toLowerCase())) {
    throw new Error("This account is not a nurse or caregiver account. Please use the MaVie patient app.");
  }
}

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

  assertNurseAppRole(result.user);
  await SecureStore.setItemAsync(TOKEN_KEY, result.token);

  return result.user;
}

export async function logoutNurse(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export function hasNurseSession(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function getCurrentUser(): Promise<LoggedInUser> {
  const result = await apiRequest<{ user: LoggedInUser }>("/auth/me");
  assertNurseAppRole(result.user);
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
      canManageSchedule: true,
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

export async function getNurseProfile(): Promise<NurseProfile> {
  const result = await apiRequest<{ profile: NurseProfile }>("/nurse-care/me/profile");
  return result.profile;
}

export async function updateNurseProfile(payload: {
  name: string;
  email: string;
  phone: string;
  department: string;
  ward: string;
  shift: string;
}): Promise<NurseProfile> {
  const result = await apiRequest<{ profile: NurseProfile }>("/nurse-care/me/profile", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return result.profile;
}

export async function getPatientClinicalProfile(patientId: string): Promise<PatientClinicalProfile> {
  const result = await apiRequest<{ patient: PatientClinicalProfile }>(
    `/nurse-care/patients/${patientId}/profile`
  );
  return result.patient;
}

export async function updatePatientClinicalProfile(
  patientId: string,
  payload: {
    name: string;
    age: string;
    gender: string;
    condition: string;
    room: string;
    allergies: string;
    emergencyContact: string;
    notes: string;
  }
): Promise<PatientClinicalProfile> {
  const result = await apiRequest<{ patient: PatientClinicalProfile }>(
    `/nurse-care/patients/${patientId}/profile`,
    { method: "PUT", body: JSON.stringify(payload) }
  );
  return result.patient;
}

export async function getPatientEmergencyContacts(patientId: string): Promise<PatientEmergencyContact[]> {
  const result = await apiRequest<{ contacts: PatientEmergencyContact[] }>(
    `/nurse-care/patients/${patientId}/emergency-contacts`
  );
  return result.contacts;
}

export async function createPatientEmergencyContact(
  patientId: string,
  payload: {
    contactName: string;
    relationship: string;
    phoneNumber: string;
    email?: string;
    priorityOrder?: number;
    notifyBySms?: boolean;
    notifyByEmail?: boolean;
  }
): Promise<PatientEmergencyContact> {
  const result = await apiRequest<{ contact: PatientEmergencyContact }>(
    `/nurse-care/patients/${patientId}/emergency-contacts`,
    { method: "POST", body: JSON.stringify(payload) }
  );
  return result.contact;
}

export async function updatePatientEmergencyContact(
  patientId: string,
  contactId: string,
  payload: Partial<{
    contactName: string;
    relationship: string;
    phoneNumber: string;
    email: string;
    priorityOrder: number;
    notifyBySms: boolean;
    notifyByEmail: boolean;
  }>
): Promise<PatientEmergencyContact> {
  const result = await apiRequest<{ contact: PatientEmergencyContact }>(
    `/nurse-care/patients/${patientId}/emergency-contacts/${contactId}`,
    { method: "PUT", body: JSON.stringify(payload) }
  );
  return result.contact;
}

export async function deletePatientEmergencyContact(patientId: string, contactId: string): Promise<void> {
  await apiRequest(`/nurse-care/patients/${patientId}/emergency-contacts/${contactId}`, {
    method: "DELETE",
  });
}

export async function createPatientMedicationLog(
  patientId: string,
  payload: { scheduleId: string; scheduledTime: string; status: "Taken" | "Missed"; note?: string }
): Promise<PatientMedicationLog> {
  const result = await apiRequest<{ log: PatientMedicationLog }>(
    `/nurse-care/patients/${patientId}/medication-logs`,
    { method: "POST", body: JSON.stringify(payload) }
  );
  return result.log;
}

export async function updatePatientMedicationLog(
  patientId: string,
  logId: string,
  payload: { status: "Taken" | "Missed"; note?: string }
): Promise<PatientMedicationLog> {
  const result = await apiRequest<{ log: PatientMedicationLog }>(
    `/nurse-care/patients/${patientId}/medication-logs/${logId}`,
    { method: "PUT", body: JSON.stringify(payload) }
  );
  return result.log;
}

export async function deletePatientMedicationLog(patientId: string, logId: string): Promise<void> {
  await apiRequest(`/nurse-care/patients/${patientId}/medication-logs/${logId}`, {
    method: "DELETE",
  });
}

export async function getNurseEmergencyEvents(): Promise<NurseEmergencyEvent[]> {
  const result = await apiRequest<{ events: NurseEmergencyEvent[] }>("/nurse-care/emergency-events");
  return result.events;
}

export async function triggerPatientEmergencyAlert(
  patientId: string,
  payload: { locationText?: string; details?: string }
): Promise<{ event: NurseEmergencyEvent; alertsCreated: number; note: string }> {
  return apiRequest(`/nurse-care/patients/${patientId}/emergency-events`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateNurseEmergencyEvent(
  eventId: string,
  action: "acknowledge" | "resolve" | "reject"
): Promise<NurseEmergencyEvent> {
  const result = await apiRequest<{ event: NurseEmergencyEvent }>(
    `/nurse-care/emergency-events/${eventId}/${action}`,
    { method: "PUT" }
  );
  return result.event;
}

export async function updateCareLink(
  linkId: string,
  payload: Partial<{
    relationship: string;
    canViewSchedule: boolean;
    canViewLogs: boolean;
    canManageSchedule: boolean;
    canReceiveEmergencyAlerts: boolean;
    active: boolean;
  }>
): Promise<LinkedPatient> {
  const result = await apiRequest<{ link: LinkedPatient }>(`/care-links/${linkId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return result.link;
}

export async function unlinkPatient(linkId: string): Promise<void> {
  await apiRequest(`/care-links/${linkId}`, { method: "DELETE" });
}
