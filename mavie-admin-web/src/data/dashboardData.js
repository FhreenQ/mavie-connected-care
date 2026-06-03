export const medicationSchedules = [
  {
    id: 1,
    patientId: 1,
    patientName: "Ahmad Farhan",
    medication: "Metformin",
    dosage: "500 mg",
    time: "08:00 AM",
    status: "Taken",
  },
  {
    id: 2,
    patientId: 1,
    patientName: "Ahmad Farhan",
    medication: "Amlodipine",
    dosage: "5 mg",
    time: "08:00 PM",
    status: "Pending",
  },
  {
    id: 3,
    patientId: 2,
    patientName: "Siti Aminah",
    medication: "Aspirin",
    dosage: "100 mg",
    time: "09:00 AM",
    status: "Missed",
  },
  {
    id: 4,
    patientId: 3,
    patientName: "Lee Minho",
    medication: "Salbutamol",
    dosage: "2 puffs",
    time: "07:00 AM",
    status: "Taken",
  },
  {
    id: 5,
    patientId: 2,
    patientName: "Siti Aminah",
    medication: "Atorvastatin",
    dosage: "10 mg",
    time: "09:00 PM",
    status: "Pending",
  },
];

export const emergencyAlerts = [
  {
    id: 1,
    patientName: "Siti Aminah",
    type: "Missed medication alert",
    time: "10 minutes ago",
    priority: "High",
    status: "Unresolved",
  },
  {
    id: 2,
    patientName: "Ahmad Farhan",
    type: "Emergency contact updated",
    time: "1 hour ago",
    priority: "Low",
    status: "Resolved",
  },
];

export const careTeamUsers = [
  { id: 1, name: "Nurse Kim", role: "Nurse", status: "Active" },
  { id: 2, name: "Nur Aina", role: "Caregiver", status: "Active" },
  { id: 3, name: "Muhammad Hakim", role: "Family Member", status: "Active" },
  { id: 4, name: "Lee Jisoo", role: "Caregiver", status: "Active" },
];

export const recentActivities = [
  {
    id: 1,
    text: "Siti Aminah missed her morning Aspirin dose.",
    time: "10 minutes ago",
    type: "warning",
  },
  {
    id: 2,
    text: "Ahmad Farhan marked Metformin as taken.",
    time: "35 minutes ago",
    type: "success",
  },
  {
    id: 3,
    text: "Lee Minho completed his morning medication.",
    time: "1 hour ago",
    type: "success",
  },
  {
    id: 4,
    text: "New emergency contact was registered for Ahmad Farhan.",
    time: "2 hours ago",
    type: "info",
  },
];