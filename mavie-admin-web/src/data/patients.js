export const defaultPatients = [
  {
    id: 1,
    name: "Ahmad Farhan",
    age: 72,
    gender: "Male",
    phone: "010-1234-5678",
    condition: "Hypertension, Diabetes",
    status: "Stable",
    lastMedication: "Taken",
    emergencyContact: "Nur Aina",
  },
  {
    id: 2,
    name: "Siti Aminah",
    age: 68,
    gender: "Female",
    phone: "010-9876-5432",
    condition: "Heart Disease",
    status: "Needs Attention",
    lastMedication: "Missed",
    emergencyContact: "Muhammad Hakim",
  },
  {
    id: 3,
    name: "Lee Minho",
    age: 59,
    gender: "Male",
    phone: "010-5555-1111",
    condition: "Asthma",
    status: "Stable",
    lastMedication: "Pending",
    emergencyContact: "Lee Jisoo",
  }, 
];

export function getPatients() {
  const storedPatients = localStorage.getItem("mavie_patients");

  if (storedPatients) {
    return JSON.parse(storedPatients);
  }

  localStorage.setItem("mavie_patients", JSON.stringify(defaultPatients));
  return defaultPatients;
}

export function savePatients(patients) {
  localStorage.setItem("mavie_patients", JSON.stringify(patients));
}

export function getPatientById(id) {
  const patients = getPatients();
  return patients.find((patient) => patient.id === Number(id));
} 