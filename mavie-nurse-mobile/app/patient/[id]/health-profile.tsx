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

export default function HealthProfileScreen() {
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

        <Text style={styles.pageTitle}>Health Profile</Text>
        <Text style={styles.subtitle}>{patient.name}</Text>

        <View style={styles.profileHeader}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {patient.name.charAt(0).toUpperCase()}
            </Text>
          </View>

          <View>
            <Text style={styles.patientName}>{patient.name}</Text>
            <Text style={styles.patientSubtext}>
              {patient.age} years old • {patient.gender}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Basic Information</Text>
          <Text style={styles.infoText}>Name: {patient.name}</Text>
          <Text style={styles.infoText}>Age: {patient.age}</Text>
          <Text style={styles.infoText}>Gender: {patient.gender}</Text>
          <Text style={styles.infoText}>Room / Ward: {patient.room}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Medical Information</Text>
          <Text style={styles.infoText}>Condition: {patient.condition}</Text>
          <Text style={styles.infoText}>Allergies: {patient.allergies}</Text>
          <Text style={styles.infoText}>Medication Status: {patient.medicationStatus}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Nurse Notes</Text>
          <Text style={styles.infoText}>{patient.notes}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Emergency Information</Text>
          <Text style={styles.infoText}>
            Emergency Contact: {patient.emergencyContact}
          </Text>
        </View>
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
  profileHeader: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  avatarCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2E6F9E",
  },
  patientName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
  },
  patientSubtext: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 3,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 18,
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