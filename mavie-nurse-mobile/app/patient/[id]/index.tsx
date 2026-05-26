import { useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { usePatients } from "../../../context/PatientContext";
import MedicationCard from "../../../components/nurse/MedicationCard";

export default function PatientDetailScreen() {
  const { id } = useLocalSearchParams();
  const {
  patients,
  loadPatientMedicationData,
  updateMedicationStatus,
} = usePatients();

  const patient = patients.find((item) => item.id === String(id));

  useEffect(() => {
   if (id) {
     loadPatientMedicationData(String(id));
   }
  }, [id, loadPatientMedicationData]);

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

  const openPatientPage = (page: string) => {
    router.push({
      pathname: page as any,
      params: { id: patient.id },
    });
  };

  const handleEmergencyAlert = () => {
    Alert.alert(
      "Emergency Alert",
      `Emergency alert sent for ${patient.name}.`
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity onPress={() => router.replace("/nurse-dashboard")}>
          <Text style={styles.backText}>← Back to Dashboard</Text>
        </TouchableOpacity>

        <Text style={styles.pageTitle}>{patient.name}</Text>
        <Text style={styles.subtitle}>Patient care overview</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Patient Bio</Text>

          <Text style={styles.infoText}>Age: {patient.age}</Text>
          <Text style={styles.infoText}>Gender: {patient.gender}</Text>
          <Text style={styles.infoText}>Condition: {patient.condition}</Text>
          <Text style={styles.infoText}>Room: {patient.room}</Text>
          <Text style={styles.infoText}>Allergies: {patient.allergies}</Text>
          <Text style={styles.infoText}>
            Emergency Contacts: {patient.emergencyContacts?.length ?? 0}
          </Text>
          <Text style={styles.infoText}>Nurse Notes: {patient.notes}</Text>
        </View>

        <Text style={styles.sectionTitle}>Today’s Medication</Text>

        {patient.medicines.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.infoText}>No medication added yet.</Text>
          </View>
        ) : (
          patient.medicines.map((medicine, index) => (
            <MedicationCard
              key={index}
              medicine={medicine}
              showActions
              onStatusChange={(status) =>
                updateMedicationStatus(patient.id, index, status)
              }
            />
          ))
        )}

        <Text style={styles.sectionTitle}>Patient Features</Text>

        <View style={styles.featureGrid}>
          <TouchableOpacity
            style={styles.featureButton}
            onPress={() => openPatientPage("/patient/[id]/add-medicine")}
          >
            <Text style={styles.featureText}>Add Medicine</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.featureButton}
            onPress={() => openPatientPage("/patient/[id]/ai-medicine-scanner")}
          >
            <Text style={styles.featureText}>AI Medicine Scanner</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.featureButton}
            onPress={() => openPatientPage("/patient/[id]/manual-medicine-input")}
          >
            <Text style={styles.featureText}>Manual Medicine Input</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.featureButton}
            onPress={() => openPatientPage("/patient/[id]/medication-schedule")}
          >
            <Text style={styles.featureText}>Medication Schedule</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.featureButton}
            onPress={() => openPatientPage("/patient/[id]/intake-log")}
          >
            <Text style={styles.featureText}>Intake Log</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.featureButton}
            onPress={() => openPatientPage("/patient/[id]/health-profile")}
          >
            <Text style={styles.featureText}>Health Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.featureButton}
            onPress={() => openPatientPage("/patient/[id]/emergency-contacts")}
          >
            <Text style={styles.featureText}>Emergency Contacts</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.emergencyButton}
          onPress={handleEmergencyAlert}
        >
          <Text style={styles.emergencyButtonText}>Send Emergency Alert</Text>
        </TouchableOpacity>
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
    fontSize: 15,
    color: "#6B7280",
    marginTop: 4,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: "bold",
    color: "#1F2937",
    marginTop: 18,
    marginBottom: 12,
  },
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
  cardTitle: {
    fontSize: 19,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#1F2937",
  },
  infoText: {
    fontSize: 15,
    color: "#4B5563",
    marginBottom: 5,
  },
  featureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  featureButton: {
    backgroundColor: "#FFFFFF",
    width: "48%",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  featureText: {
    color: "#1F2937",
    fontWeight: "bold",
    textAlign: "center",
  },
  emergencyButton: {
    backgroundColor: "#DC2626",
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    marginTop: 10,
  },
  emergencyButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "bold",
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
  editButton: {
  backgroundColor: "#E0F2FE",
  borderRadius: 12,
  padding: 12,
  alignItems: "center",
  marginTop: 12,
  },
  editButtonText: {
  color: "#2E6F9E",
  fontWeight: "bold",
  },
});