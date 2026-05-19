import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { usePatients } from "../../../context/PatientContext";

export default function IntakeLogScreen() {
  const { id } = useLocalSearchParams();
  const patientId = Array.isArray(id) ? id[0] : String(id ?? "");

  const { patients } = usePatients();
  const patient = patients.find((item) => item.id === patientId);

  if (!patient) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerBox}>
          <Text style={styles.pageTitle}>Patient not found</Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.replace("/nurse-dashboard")}
          >
            <Text style={styles.primaryButtonText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const takenCount = patient.medicines.filter(
    (medicine) => medicine.status === "Taken"
  ).length;

  const missedCount = patient.medicines.filter(
    (medicine) => medicine.status === "Missed"
  ).length;

  const pendingCount = patient.medicines.filter(
    (medicine) => medicine.status === "Pending"
  ).length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back to Patient</Text>
        </TouchableOpacity>

        <Text style={styles.pageTitle}>Intake Log</Text>
        <Text style={styles.subtitle}>{patient.name}</Text>

        <View style={styles.summaryCard}>
          <Text style={styles.cardTitle}>Today’s Intake Summary</Text>
          <Text style={styles.infoText}>Taken: {takenCount}</Text>
          <Text style={styles.infoText}>Pending: {pendingCount}</Text>
          <Text style={styles.infoText}>Missed: {missedCount}</Text>
        </View>

        <Text style={styles.sectionTitle}>Medication Records</Text>

        {patient.medicines.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.infoText}>No intake log available yet.</Text>
          </View>
        ) : (
          patient.medicines.map((medicine, index) => (
            <View key={index} style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={styles.cardTitle}>{medicine.name}</Text>
                <Text style={styles.statusBadge}>{medicine.status}</Text>
              </View>

              <Text style={styles.infoText}>Dosage: {medicine.dosage}</Text>
              <Text style={styles.infoText}>Scheduled Time: {medicine.time}</Text>
              <Text style={styles.infoText}>
                Recorded by: Nurse / Caregiver
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },
  scrollContent: {
    padding: 20,
  },
  centerBox: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  backText: {
    color: "#2E6F9E",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1F2937",
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 4,
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: "bold",
    color: "#1F2937",
    marginTop: 10,
    marginBottom: 12,
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderLeftWidth: 6,
    borderLeftColor: "#2E6F9E",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 6,
  },
  infoText: {
    fontSize: 15,
    color: "#4B5563",
    marginBottom: 5,
  },
  statusBadge: {
    backgroundColor: "#E0F2FE",
    color: "#2E6F9E",
    fontSize: 13,
    fontWeight: "bold",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    overflow: "hidden",
  },
  primaryButton: {
    backgroundColor: "#2E6F9E",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginTop: 18,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "bold",
  },
});