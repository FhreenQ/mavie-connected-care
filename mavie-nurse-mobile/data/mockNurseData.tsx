export type Nurse = {
  name: string;
  email: string;
  phone: string;
  department: string;
  ward: string;
  shift: string;
};

export type Medicine = {
  name: string;
  dosage: string;
  time: string;
  status: "Taken" | "Pending" | "Missed";
};

export type EmergencyContact = {
  name: string;
  relationship: string;
  phone: string;
};

export type Patient = {
  id: string;
  name: string;
  age: string;
  gender: string;
  condition: string;
  room: string;
  medicationStatus: string;
  emergencyContact: string;
  emergencyContacts: EmergencyContact[];
  allergies: string;
  notes: string;
  medicines: Medicine[];
};

export const mockNurse: Nurse = {
  name: "Nurse Asha",
  email: "asha.nurse@mavie.com",
  phone: "010-1234-5678",
  department: "Home Care Unit",
  ward: "General Ward",
  shift: "Morning Shift",
};

export const initialPatients: Patient[] = [
  {
    id: "1",
    name: "Amina Hassan",
    age: "72",
    gender: "Female",
    condition: "Diabetes, Hypertension",
    room: "Room 201",
    medicationStatus: "2/3 taken today",
    emergencyContact: "Daughter - 0101234567",
    allergies: "Penicillin",
    notes: "Needs assistance when walking.",
    medicines: [
      {
        name: "Metformin",
        dosage: "500mg",
        time: "8:00 AM",
        status: "Taken",
      },
      {
        name: "Amlodipine",
        dosage: "5mg",
        time: "1:00 PM",
        status: "Pending",
      },
      {
        name: "Insulin",
        dosage: "10 units",
        time: "8:00 PM",
        status: "Pending",
      },
    ],
  },
  {
    id: "2",
    name: "Kim Minji",
    age: "68",
    gender: "Female",
    condition: "Early Dementia",
    room: "Room 204",
    medicationStatus: "Missed morning dose",
    emergencyContact: "Son - 0109876543",
    allergies: "None",
    notes: "Sometimes forgets medication schedule.",
    medicines: [
      {
        name: "Donepezil",
        dosage: "5mg",
        time: "9:00 AM",
        status: "Missed",
      },
      {
        name: "Vitamin D",
        dosage: "1000 IU",
        time: "2:00 PM",
        status: "Pending",
      },
    ],
  },
  {
    id: "3",
    name: "Lee Junho",
    age: "75",
    gender: "Male",
    condition: "Heart Disease",
    room: "Room 305",
    medicationStatus: "All taken today",
    emergencyContact: "Wife - 01055556666",
    allergies: "Seafood",
    notes: "Monitor blood pressure every morning.",
    medicines: [
      {
        name: "Aspirin",
        dosage: "100mg",
        time: "8:30 AM",
        status: "Taken",
      },
      {
        name: "Atorvastatin",
        dosage: "20mg",
        time: "9:00 PM",
        status: "Pending",
      },
    ],
  },
];