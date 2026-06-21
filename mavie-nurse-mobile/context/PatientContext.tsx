import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { EmergencyContact, Medicine, Nurse, Patient } from "../data/mockNurseData";
import {
  connectPatientByEmail,
  createPatientEmergencyContact,
  createPatientMedicationLog,
  deletePatientEmergencyContact,
  deletePatientMedicationLog,
  getCurrentUser,
  getMyPatients,
  getNurseProfile,
  getPatientClinicalProfile,
  getPatientEmergencyContacts,
  getPatientMedicationLogs,
  getPatientSchedules,
  hasNurseSession,
  LinkedPatient,
  loginNurse,
  logoutNurse,
  PatientClinicalProfile,
  PatientEmergencyContact,
  updateNurseProfile,
  updatePatientClinicalProfile,
  updatePatientEmergencyContact,
  updatePatientMedicationLog,
} from "../services/api";

type NewPatientInput = { patientEmail: string };

type EditablePatientInfo = {
  name: string;
  age: string;
  gender: string;
  condition: string;
  room: string;
  allergies: string;
  emergencyContact: string;
  notes: string;
};

type PatientContextType = {
  nurse: Nurse;
  patients: Patient[];
  loading: boolean;
  error: string | null;
  initializing: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshPatients: () => Promise<void>;
  loadPatientMedicationData: (patientId: string) => Promise<void>;
  loadPatientProfileData: (patientId: string) => Promise<void>;
  addPatient: (patient: NewPatientInput) => Promise<void>;
  updateNurse: (updatedNurse: Nurse) => Promise<void>;
  updatePatient: (patientId: string, updatedInfo: EditablePatientInfo) => Promise<void>;
  updateEmergencyContact: (patientId: string, emergencyContact: string) => Promise<void>;
  addEmergencyContact: (patientId: string, emergencyContact: EmergencyContact) => Promise<void>;
  updateEmergencyContactAtIndex: (patientId: string, contactIndex: number, emergencyContact: EmergencyContact) => Promise<void>;
  deleteEmergencyContact: (patientId: string, contactIndex: number) => Promise<void>;
  updateMedicationStatus: (patientId: string, medicineIndex: number, status: Medicine["status"]) => Promise<void>;
};

const PatientContext = createContext<PatientContextType | undefined>(undefined);

const emptyNurse: Nurse = {
  name: "Nurse",
  email: "",
  phone: "Not added yet",
  department: "Home Care Unit",
  ward: "Not assigned",
  shift: "Not assigned",
};

function getMedicationSummary(medicines: Medicine[]) {
  if (medicines.length === 0) return "No medication record yet";
  const taken = medicines.filter((medicine) => medicine.status === "Taken").length;
  const missed = medicines.filter((medicine) => medicine.status === "Missed").length;
  return missed > 0 ? `${missed} missed, ${taken}/${medicines.length} taken` : `${taken}/${medicines.length} taken`;
}

function mapLinkedPatientToUi(patient: LinkedPatient): Patient {
  return {
    id: patient.patient_user_id,
    linkId: patient.link_id,
    relationship: patient.relationship,
    canViewSchedule: patient.can_view_schedule,
    canViewLogs: patient.can_view_logs,
    canManageSchedule: patient.can_manage_schedule,
    canReceiveEmergencyAlerts: patient.can_receive_emergency_alerts,
    name: patient.patient_username,
    age: "-",
    gender: "Not available",
    condition: "Connected patient",
    room: "Home care",
    medicationStatus: "Tap to load medication information",
    emergencyContact: "Not available",
    emergencyContacts: [],
    allergies: "Not available",
    notes: `Linked as ${patient.relationship}`,
    medicines: [],
  };
}

function mapStatus(status?: string): Medicine["status"] {
  if (status === "Taken") return "Taken";
  if (status === "Missed" || status === "Skipped" || status === "Late") return "Missed";
  return "Pending";
}

function mapEmergencyContact(contact: PatientEmergencyContact): EmergencyContact {
  return {
    id: String(contact.contact_id),
    name: contact.contact_name,
    relationship: contact.relationship || "Not specified",
    phone: contact.phone_number,
  };
}

function mergeClinicalProfile(patient: Patient, profile: PatientClinicalProfile): Patient {
  return {
    ...patient,
    name: profile.username || patient.name,
    age: profile.age || patient.age,
    gender: profile.gender || patient.gender,
    condition: profile.conditions || patient.condition,
    room: profile.room || patient.room,
    allergies: profile.allergies || patient.allergies,
    emergencyContact: profile.emergency_contact_summary || patient.emergencyContact,
    notes: profile.notes || patient.notes,
  };
}

function mapNurseProfile(profile: {
  username: string;
  email: string;
  phone?: string | null;
  department?: string | null;
  ward?: string | null;
  shift?: string | null;
}): Nurse {
  return {
    name: profile.username,
    email: profile.email,
    phone: profile.phone || "Not added yet",
    department: profile.department || "Home Care Unit",
    ward: profile.ward || "Not assigned",
    shift: profile.shift || "Not assigned",
  };
}

async function getMedicationSummaryForPatient(patientId: string) {
  const [schedules, logs] = await Promise.all([
    getPatientSchedules(patientId),
    getPatientMedicationLogs(patientId),
  ]);

  const medicines: Medicine[] = schedules.map((schedule) => {
    const log = logs.find(
      (item) =>
        String(item.schedule_id) === String(schedule.schedule_id) &&
        new Date(item.scheduled_time).getTime() === new Date(schedule.next_dose_time).getTime()
    );

    return {
      name: schedule.brand_name || schedule.generic_name,
      dosage: schedule.dosage,
      time: new Date(schedule.next_dose_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: mapStatus(log?.status),
      scheduleId: String(schedule.schedule_id),
      scheduledTime: schedule.next_dose_time,
      logId: log ? String(log.log_id) : undefined,
    };
  });

  return { medicines, medicationStatus: getMedicationSummary(medicines) };
}

export function PatientProvider({ children }: { children: React.ReactNode }) {
  const [nurse, setNurse] = useState<Nurse>(emptyNurse);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const refreshPatients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const linkedPatients = await getMyPatients();
      const summaries = await Promise.all(
        linkedPatients.map(async (linkedPatient) => {
          try {
            const summary = await getMedicationSummaryForPatient(linkedPatient.patient_user_id);
            return [linkedPatient.patient_user_id, summary] as const;
          } catch {
            return [linkedPatient.patient_user_id, null] as const;
          }
        })
      );
      const summariesByPatient = new Map(summaries);

      setPatients((currentPatients) =>
        linkedPatients.map((linkedPatient) => {
          const existing = currentPatients.find((patient) => patient.id === linkedPatient.patient_user_id);
          const basic = mapLinkedPatientToUi(linkedPatient);
          const summary = summariesByPatient.get(linkedPatient.patient_user_id);
          if (!existing) return summary ? { ...basic, ...summary } : basic;

          return {
            ...basic,
            age: existing.age,
            gender: existing.gender,
            condition: existing.condition,
            room: existing.room,
            medicationStatus: existing.medicationStatus,
            emergencyContact: existing.emergencyContact,
            emergencyContacts: existing.emergencyContacts,
            allergies: existing.allergies,
            notes: existing.notes,
            medicines: existing.medicines,
            ...(summary || {}),
          };
        })
      );
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Unable to retrieve assigned patients.";
      setError(message);
      throw requestError;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const token = await hasNurseSession();
        if (!token) return;

        const user = await getCurrentUser();
        const profile = await getNurseProfile().catch(() => user);
        setNurse(mapNurseProfile(profile));
        setIsAuthenticated(true);
        await refreshPatients();
      } catch {
        await logoutNurse();
        setNurse(emptyNurse);
        setPatients([]);
        setIsAuthenticated(false);
      } finally {
        setInitializing(false);
      }
    };

    restoreSession();
  }, [refreshPatients]);

  const login = async (email: string, password: string) => {
    const user = await loginNurse(email, password);
    const profile = await getNurseProfile().catch(() => user);
    setNurse(mapNurseProfile(profile));
    setIsAuthenticated(true);
    await refreshPatients();
  };

  const logout = async () => {
    await logoutNurse();
    setNurse(emptyNurse);
    setPatients([]);
    setError(null);
    setIsAuthenticated(false);
  };

  const loadPatientMedicationData = useCallback(async (patientId: string) => {
    try {
      setLoading(true);
      setError(null);
      const [schedules, logs] = await Promise.all([getPatientSchedules(patientId), getPatientMedicationLogs(patientId)]);

      const medicines: Medicine[] = schedules.map((schedule) => {
        const log = logs.find(
          (item) =>
            String(item.schedule_id) === String(schedule.schedule_id) &&
            new Date(item.scheduled_time).getTime() === new Date(schedule.next_dose_time).getTime()
        );

        return {
          name: schedule.brand_name || schedule.generic_name,
          dosage: schedule.dosage,
          time: new Date(schedule.next_dose_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          status: mapStatus(log?.status),
          scheduleId: String(schedule.schedule_id),
          scheduledTime: schedule.next_dose_time,
          logId: log ? String(log.log_id) : undefined,
        };
      });

      setPatients((currentPatients) =>
        currentPatients.map((patient) =>
          patient.id === patientId ? { ...patient, medicines, medicationStatus: getMedicationSummary(medicines) } : patient
        )
      );
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load medication information.");
      throw requestError;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPatientProfileData = useCallback(async (patientId: string) => {
    try {
      const [profile, contacts] = await Promise.all([
        getPatientClinicalProfile(patientId),
        getPatientEmergencyContacts(patientId),
      ]);

      setPatients((currentPatients) =>
        currentPatients.map((patient) => {
          if (patient.id !== patientId) return patient;
          const merged = mergeClinicalProfile(patient, profile);
          const emergencyContacts = contacts.map(mapEmergencyContact);
          return {
            ...merged,
            emergencyContacts,
            emergencyContact: profile.emergency_contact_summary || (
              emergencyContacts[0]
                ? `${emergencyContacts[0].relationship} - ${emergencyContacts[0].phone}`
                : merged.emergencyContact
            ),
          };
        })
      );
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load patient profile.");
      throw requestError;
    }
  }, []);

  const addPatient = async ({ patientEmail }: NewPatientInput) => {
    await connectPatientByEmail(patientEmail);
    await refreshPatients();
  };

  const updateNurse = async (updatedNurse: Nurse) => {
    const profile = await updateNurseProfile(updatedNurse);
    setNurse(mapNurseProfile(profile));
  };

  const updatePatient = async (patientId: string, updatedInfo: EditablePatientInfo) => {
    const profile = await updatePatientClinicalProfile(patientId, updatedInfo);
    setPatients((currentPatients) =>
      currentPatients.map((patient) => patient.id === patientId ? mergeClinicalProfile({ ...patient, ...updatedInfo }, profile) : patient)
    );
  };

  const updateEmergencyContact = async (patientId: string, emergencyContact: string) => {
    const patient = patients.find((item) => item.id === patientId);
    if (!patient) throw new Error("Patient not found.");
    await updatePatient(patientId, { ...patient, emergencyContact });
  };

  const addEmergencyContact = async (patientId: string, emergencyContact: EmergencyContact) => {
    const contact = await createPatientEmergencyContact(patientId, {
      contactName: emergencyContact.name,
      relationship: emergencyContact.relationship,
      phoneNumber: emergencyContact.phone,
      notifyBySms: true,
      notifyByEmail: false,
    });
    const mapped = mapEmergencyContact(contact);
    setPatients((currentPatients) =>
      currentPatients.map((patient) =>
        patient.id === patientId
          ? {
              ...patient,
              emergencyContacts: [...patient.emergencyContacts, mapped],
              emergencyContact: patient.emergencyContacts.length === 0 ? `${mapped.relationship} - ${mapped.phone}` : patient.emergencyContact,
            }
          : patient
      )
    );
  };

  const updateEmergencyContactAtIndex = async (patientId: string, contactIndex: number, emergencyContact: EmergencyContact) => {
    const patient = patients.find((item) => item.id === patientId);
    const currentContact = patient?.emergencyContacts[contactIndex];
    if (!patient || !currentContact?.id) throw new Error("Emergency contact not found.");

    const saved = await updatePatientEmergencyContact(patientId, currentContact.id, {
      contactName: emergencyContact.name,
      relationship: emergencyContact.relationship,
      phoneNumber: emergencyContact.phone,
    });
    const mapped = mapEmergencyContact(saved);
    setPatients((currentPatients) =>
      currentPatients.map((item) => {
        if (item.id !== patientId) return item;
        const contacts = item.emergencyContacts.map((contact, index) => index === contactIndex ? mapped : contact);
        return { ...item, emergencyContacts: contacts, emergencyContact: contactIndex === 0 ? `${mapped.relationship} - ${mapped.phone}` : item.emergencyContact };
      })
    );
  };

  const deleteEmergencyContact = async (patientId: string, contactIndex: number) => {
    const patient = patients.find((item) => item.id === patientId);
    const currentContact = patient?.emergencyContacts[contactIndex];
    if (!patient || !currentContact?.id) throw new Error("Emergency contact not found.");

    await deletePatientEmergencyContact(patientId, currentContact.id);
    setPatients((currentPatients) =>
      currentPatients.map((item) => {
        if (item.id !== patientId) return item;
        const contacts = item.emergencyContacts.filter((_, index) => index !== contactIndex);
        return { ...item, emergencyContacts: contacts, emergencyContact: contacts[0] ? `${contacts[0].relationship} - ${contacts[0].phone}` : "Not added yet" };
      })
    );
  };

  const updateMedicationStatus = async (patientId: string, medicineIndex: number, status: Medicine["status"]) => {
    const patient = patients.find((item) => item.id === patientId);
    const medicine = patient?.medicines[medicineIndex];
    if (!medicine?.scheduleId || !medicine.scheduledTime) throw new Error("Medication schedule not found.");

    if (status === "Pending") {
      if (medicine.logId) await deletePatientMedicationLog(patientId, medicine.logId);
    } else if (medicine.logId) {
      await updatePatientMedicationLog(patientId, medicine.logId, { status });
    } else {
      await createPatientMedicationLog(patientId, {
        scheduleId: medicine.scheduleId,
        scheduledTime: medicine.scheduledTime,
        status,
      });
    }

    await loadPatientMedicationData(patientId);
  };

  return (
    <PatientContext.Provider value={{
      nurse,
      patients,
      loading,
      error,
      initializing,
      isAuthenticated,
      login,
      logout,
      refreshPatients,
      loadPatientMedicationData,
      loadPatientProfileData,
      addPatient,
      updateNurse,
      updatePatient,
      updateEmergencyContact,
      addEmergencyContact,
      updateEmergencyContactAtIndex,
      deleteEmergencyContact,
      updateMedicationStatus,
    }}>
      {children}
    </PatientContext.Provider>
  );
}

export function usePatients() {
  const context = useContext(PatientContext);
  if (!context) throw new Error("usePatients must be used inside PatientProvider");
  return context;
}
