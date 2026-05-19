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
import MedicationCard from "../../../components/nurse/MedicationCard";

export default function MedicationScheduleScreen() {
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back to Patient</Text>
        </TouchableOpacity>

        <Text style={styles.pageTitle}>Medication Schedule</Text>
        <Text style={styles.subtitle}>{patient.name}</Text>

        <View style={styles.summaryCard}>
          <Text style={styles.cardTitle}>Today’s Overview</Text>
          <Text style={styles.infoText}>Medication Status: {patient.medicationStatus}</Text>
          <Text style={styles.infoText}>Room: {patient.room}</Text>
        </View>

        <Text style={styles.sectionTitle}>Scheduled Medicines</Text>

        {patient.medicines.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.infoText}>No medication schedule added yet.</Text>
          </View>
        ) : (
          patient.medicines.map((medicine, index) => (
            <MedicationCard key={index} medicine={medicine} />
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
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 15,
    color: "#4B5563",
    marginBottom: 5,
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