import React, { createContext, useContext, useState } from "react";
import {
  initialPatients,
  Patient,
  mockNurse,
  Nurse,
  Medicine,
} from "../data/mockNurseData";

type NewPatientInput = {
  name: string;
  age: string;
  gender: string;
  condition: string;
  room: string;
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
  updateNurse: (updatedNurse: Nurse) => void;
  addPatient: (patient: NewPatientInput) => void;
  updatePatient: (patientId: string, updatedInfo: EditablePatientInfo) => void;
  updateEmergencyContact: (patientId: string, emergencyContact: string) => void;
  updateMedicationStatus: (
    patientId: string,
    medicineIndex: number,
    status: Medicine["status"]
  ) => void;
};

const PatientContext = createContext<PatientContextType | undefined>(undefined);

function getMedicationSummary(medicines: Medicine[]) {
  if (medicines.length === 0) {
    return "No medication record yet";
  }

  const taken = medicines.filter((medicine) => medicine.status === "Taken").length;
  const missed = medicines.filter((medicine) => medicine.status === "Missed").length;

  if (missed > 0) {
    return `${missed} missed, ${taken}/${medicines.length} taken today`;
  }

  return `${taken}/${medicines.length} taken today`;
}

export function PatientProvider({ children }: { children: React.ReactNode }) {
  const [nurse, setNurse] = useState<Nurse>(mockNurse);
  const [patients, setPatients] = useState<Patient[]>(initialPatients);

  const updateNurse = (updatedNurse: Nurse) => {
    setNurse(updatedNurse);
  };

  const addPatient = (patient: NewPatientInput) => {
    const newPatient: Patient = {
      id: Date.now().toString(),
      name: patient.name,
      age: patient.age,
      gender: patient.gender || "Not specified",
      condition: patient.condition,
      room: patient.room || "Not assigned",
      medicationStatus: "No medication record yet",
      emergencyContact: "Not added yet",
      allergies: "Not added yet",
      notes: "No nurse notes yet.",
      medicines: [],
    };

    setPatients((prevPatients) => [...prevPatients, newPatient]);
  };

  const updatePatient = (patientId: string, updatedInfo: EditablePatientInfo) => {
    setPatients((prevPatients) =>
      prevPatients.map((patient) =>
        patient.id === patientId
          ? {
              ...patient,
              ...updatedInfo,
            }
          : patient
      )
    );
  };

  const updateEmergencyContact = (
    patientId: string,
    emergencyContact: string
  ) => {
    setPatients((prevPatients) =>
      prevPatients.map((patient) =>
        patient.id === patientId
          ? {
              ...patient,
              emergencyContact,
            }
          : patient
      )
    );
  };

  const updateMedicationStatus = (
    patientId: string,
    medicineIndex: number,
    status: Medicine["status"]
  ) => {
    setPatients((prevPatients) =>
      prevPatients.map((patient) => {
        if (patient.id !== patientId) {
          return patient;
        }

        const updatedMedicines = patient.medicines.map((medicine, index) =>
          index === medicineIndex
            ? {
                ...medicine,
                status,
              }
            : medicine
        );

        return {
          ...patient,
          medicines: updatedMedicines,
          medicationStatus: getMedicationSummary(updatedMedicines),
        };
      })
    );
  };

  return (
    <PatientContext.Provider
      value={{
        nurse,
        patients,
        updateNurse,
        addPatient,
        updatePatient,
        updateEmergencyContact,
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