import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { Patient } from "../../data/mockNurseData";

type PatientCardProps = {
  patient: Patient;
  onPress: () => void;
};

export default function PatientCard({ patient, onPress }: PatientCardProps) {
  return (
    <TouchableOpacity style={styles.patientCard} onPress={onPress}>
      <Text style={styles.patientName}>{patient.name}</Text>

      <Text style={styles.infoText}>
        Age: {patient.age} | {patient.gender}
      </Text>

      <Text style={styles.infoText}>Condition: {patient.condition}</Text>
      <Text style={styles.infoText}>Room: {patient.room}</Text>

      <Text style={styles.statusText}>
        Medication: {patient.medicationStatus}
      </Text>

      <Text style={styles.viewText}>Tap to view patient details</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  patientCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderLeftWidth: 6,
    borderLeftColor: "#2E6F9E",
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  patientName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2E6F9E",
    marginBottom: 6,
  },
  infoText: {
    fontSize: 15,
    color: "#4B5563",
    marginBottom: 5,
  },
  statusText: {
    fontSize: 15,
    color: "#2563EB",
    fontWeight: "600",
    marginTop: 4,
  },
  viewText: {
    fontSize: 14,
    color: "#2E6F9E",
    marginTop: 10,
    fontWeight: "600",
  },
});