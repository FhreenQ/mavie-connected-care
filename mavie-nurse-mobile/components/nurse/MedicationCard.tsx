import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Medicine } from "../../data/mockNurseData";

type MedicationCardProps = {
  medicine: Medicine;
  showActions?: boolean;
  onStatusChange?: (status: Medicine["status"]) => void;
};

export default function MedicationCard({
  medicine,
  showActions = false,
  onStatusChange,
}: MedicationCardProps) {
  return (
    <View style={styles.medicineCard}>
      <Text style={styles.medicineName}>{medicine.name}</Text>
      <Text style={styles.infoText}>Dosage: {medicine.dosage}</Text>
      <Text style={styles.infoText}>Time: {medicine.time}</Text>
      <Text style={styles.statusText}>Status: {medicine.status}</Text>

      {showActions && onStatusChange && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.statusButton, styles.takenButton]}
            onPress={() => onStatusChange("Taken")}
          >
            <Text style={styles.statusButtonText}>Taken</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statusButton, styles.pendingButton]}
            onPress={() => onStatusChange("Pending")}
          >
            <Text style={styles.statusButtonText}>Pending</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statusButton, styles.missedButton]}
            onPress={() => onStatusChange("Missed")}
          >
            <Text style={styles.statusButtonText}>Missed</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  medicineCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  medicineName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
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
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 3,
  },
  takenButton: {
    backgroundColor: "#16A34A",
  },
  pendingButton: {
    backgroundColor: "#F59E0B",
  },
  missedButton: {
    backgroundColor: "#DC2626",
  },
  statusButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 13,
  },
});