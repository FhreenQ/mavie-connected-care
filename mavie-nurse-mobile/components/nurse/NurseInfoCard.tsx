import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Nurse } from "../../data/mockNurseData";

type NurseInfoCardProps = {
  nurse: Nurse;
  patientCount: number;
  onEdit: () => void;
  onLogout: () => void;
};

export default function NurseInfoCard({
  nurse,
  patientCount,
  onEdit,
  onLogout,
}: NurseInfoCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.rowBetween}>
        <Text style={styles.cardTitle}>Nurse Information</Text>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.editButton} onPress={onEdit}>
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
            <Text style={styles.logoutButtonText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.infoText}>Name: {nurse.name}</Text>
      <Text style={styles.infoText}>Email: {nurse.email}</Text>
      <Text style={styles.infoText}>Phone: {nurse.phone}</Text>
      <Text style={styles.infoText}>Department: {nurse.department}</Text>
      <Text style={styles.infoText}>Ward: {nurse.ward}</Text>
      <Text style={styles.infoText}>Shift: {nurse.shift}</Text>
      <Text style={styles.infoText}>Assigned Patients: {patientCount}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#1F2937",
  },
  editButton: {
    backgroundColor: "#E0F2FE",
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  editButtonText: {
    color: "#2E6F9E",
    fontWeight: "bold",
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  logoutButton: {
    backgroundColor: "#FEE2E2",
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  logoutButtonText: {
    color: "#B91C1C",
    fontWeight: "bold",
  },
  infoText: {
    fontSize: 15,
    color: "#4B5563",
    marginBottom: 5,
  },
});
