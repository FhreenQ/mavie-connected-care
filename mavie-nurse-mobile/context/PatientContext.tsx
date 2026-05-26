import React, {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";

import {
  EmergencyContact,
  Medicine,
  Nurse,
  Patient,
} from "../data/mockNurseData";

import {
  connectPatientByEmail,
  getCurrentUser,
  getMyPatients,
  getPatientMedicationLogs,
  getPatientSchedules,
  LinkedPatient,
  loginNurse,
  logoutNurse,
} from "../services/api";

type NewPatientInput = {
  patientEmail: string;
};

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

  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshPatients: () => Promise<void>;
  loadPatientMedicationData: (patientId: string) => Promise<void>;
  addPatient: (patient: NewPatientInput) => Promise<void>;

  updateNurse: (updatedNurse: Nurse) => void;
  updatePatient: (
    patientId: string,
    updatedInfo: EditablePatientInfo
  ) => void;
  updateEmergencyContact: (
    patientId: string,
    emergencyContact: string
  ) => void;
  addEmergencyContact: (
    patientId: string,
    emergencyContact: EmergencyContact
  ) => void;
  updateEmergencyContactAtIndex: (
    patientId: string,
    contactIndex: number,
    emergencyContact: EmergencyContact
  ) => void;
  deleteEmergencyContact: (
    patientId: string,
    contactIndex: number
  ) => void;
  updateMedicationStatus: (
    patientId: string,
    medicineIndex: number,
    status: Medicine["status"]
  ) => void;
};

const PatientContext = createContext<PatientContextType | undefined>(
  undefined
);

const emptyNurse: Nurse = {
  name: "Nurse",
  email: "",
  phone: "Not added yet",
  department: "Home Care Unit",
  ward: "Not assigned",
  shift: "Not assigned",
};

function getMedicationSummary(medicines: Medicine[]) {
  if (medicines.length === 0) {
    return "No medication record yet";
  }

  const taken = medicines.filter(
    (medicine) => medicine.status === "Taken"
  ).length;

  const missed = medicines.filter(
    (medicine) => medicine.status === "Missed"
  ).length;

  if (missed > 0) {
    return `${missed} missed, ${taken}/${medicines.length} taken`;
  }

  return `${taken}/${medicines.length} taken`;
}

function mapLinkedPatientToUi(patient: LinkedPatient): Patient {
  return {
    id: patient.patient_user_id,
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
  if (status === "Missed" || status === "Skipped" || status === "Late") {
    return "Missed";
  }
  return "Pending";
}

function formatPrimaryContact(contact: EmergencyContact) {
  return `${contact.relationship} - ${contact.phone}`;
}

export function PatientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [nurse, setNurse] = useState<Nurse>(emptyNurse);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshPatients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const linkedPatients = await getMyPatients();

      setPatients((currentPatients) =>
        linkedPatients.map((linkedPatient) => {
          const existingPatient = currentPatients.find(
            (patient) => patient.id === linkedPatient.patient_user_id
          );

          const basicPatient = mapLinkedPatientToUi(linkedPatient);

          if (!existingPatient) {
            return basicPatient;
          }

          return {
            ...basicPatient,
            medicines: existingPatient.medicines,
            medicationStatus: existingPatient.medicationStatus,
          };
        })
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to retrieve assigned patients."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const user = await loginNurse(email, password);

    setNurse({
      ...emptyNurse,
      name: user.username,
      email: user.email,
    });

    await refreshPatients();
  };

  const logout = async () => {
    await logoutNurse();
    setNurse(emptyNurse);
    setPatients([]);
  };

  const loadCurrentNurse = async () => {
    const user = await getCurrentUser();

    setNurse({
      ...emptyNurse,
      name: user.username,
      email: user.email,
    });
  };

  const loadPatientMedicationData = useCallback(
    async (patientId: string) => {
      try {
        setLoading(true);
        setError(null);

        const [schedules, logs] = await Promise.all([
          getPatientSchedules(patientId),
          getPatientMedicationLogs(patientId),
        ]);

        const latestStatus = new Map<string, string>();

        logs.forEach((log) => {
          if (!latestStatus.has(log.schedule_id)) {
            latestStatus.set(log.schedule_id, log.status);
          }
        });

        const medicines: Medicine[] = schedules.map((schedule) => ({
          name: schedule.brand_name || schedule.generic_name,
          dosage: schedule.dosage,
          time: new Date(schedule.next_dose_time).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          status: mapStatus(latestStatus.get(schedule.schedule_id)),
        }));

        setPatients((currentPatients) =>
          currentPatients.map((patient) =>
            patient.id === patientId
              ? {
                  ...patient,
                  medicines,
                  medicationStatus: getMedicationSummary(medicines),
                }
              : patient
          )
        );
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load medication information."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const addPatient = async ({ patientEmail }: NewPatientInput) => {
    await connectPatientByEmail(patientEmail);
    await refreshPatients();
  };

  /*
    These update functions currently update the mobile UI only.
    Backend write access for a nurse editing another patient's data
    needs additional protected routes before these become permanent.
  */

  const updateNurse = (updatedNurse: Nurse) => {
    setNurse(updatedNurse);
  };

  const updatePatient = (
    patientId: string,
    updatedInfo: EditablePatientInfo
  ) => {
    setPatients((currentPatients) =>
      currentPatients.map((patient) =>
        patient.id === patientId
          ? { ...patient, ...updatedInfo }
          : patient
      )
    );
  };

  const updateEmergencyContact = (
    patientId: string,
    emergencyContact: string
  ) => {
    setPatients((currentPatients) =>
      currentPatients.map((patient) =>
        patient.id === patientId
          ? { ...patient, emergencyContact }
          : patient
      )
    );
  };

  const addEmergencyContact = (
    patientId: string,
    emergencyContact: EmergencyContact
  ) => {
    setPatients((currentPatients) =>
      currentPatients.map((patient) => {
        if (patient.id !== patientId) {
          return patient;
        }

        const contacts = [
          ...(patient.emergencyContacts ?? []),
          emergencyContact,
        ];

        return {
          ...patient,
          emergencyContacts: contacts,
          emergencyContact:
            contacts.length === 1
              ? formatPrimaryContact(emergencyContact)
              : patient.emergencyContact,
        };
      })
    );
  };

  const updateEmergencyContactAtIndex = (
    patientId: string,
    contactIndex: number,
    emergencyContact: EmergencyContact
  ) => {
    setPatients((currentPatients) =>
      currentPatients.map((patient) => {
        if (patient.id !== patientId) {
          return patient;
        }

        const contacts = patient.emergencyContacts.map((contact, index) =>
          index === contactIndex ? emergencyContact : contact
        );

        return {
          ...patient,
          emergencyContacts: contacts,
          emergencyContact:
            contactIndex === 0
              ? formatPrimaryContact(emergencyContact)
              : patient.emergencyContact,
        };
      })
    );
  };

  const deleteEmergencyContact = (
    patientId: string,
    contactIndex: number
  ) => {
    setPatients((currentPatients) =>
      currentPatients.map((patient) => {
        if (patient.id !== patientId) {
          return patient;
        }

        const contacts = patient.emergencyContacts.filter(
          (_, index) => index !== contactIndex
        );

        return {
          ...patient,
          emergencyContacts: contacts,
          emergencyContact:
            contacts.length > 0
              ? formatPrimaryContact(contacts[0])
              : "Not added yet",
        };
      })
    );
  };

  const updateMedicationStatus = (
    patientId: string,
    medicineIndex: number,
    status: Medicine["status"]
  ) => {
    setPatients((currentPatients) =>
      currentPatients.map((patient) => {
        if (patient.id !== patientId) {
          return patient;
        }

        const medicines = patient.medicines.map((medicine, index) =>
          index === medicineIndex
            ? { ...medicine, status }
            : medicine
        );

        return {
          ...patient,
          medicines,
          medicationStatus: getMedicationSummary(medicines),
        };
      })
    );
  };

  return (
    <PatientContext.Provider
      value={{
        nurse,
        patients,
        loading,
        error,
        login,
        logout,
        refreshPatients,
        loadPatientMedicationData,
        addPatient,
        updateNurse,
        updatePatient,
        updateEmergencyContact,
        addEmergencyContact,
        updateEmergencyContactAtIndex,
        deleteEmergencyContact,
        updateMedicationStatus,
      }}
    >
      {children}
    </PatientContext.Provider>
  );
}

export function usePatients() {
  const context = useContext(PatientContext);

  if (!context) {
    throw new Error("usePatients must be used inside PatientProvider");
  }

  return context;
}