import { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { usePatients } from "../../../context/PatientContext";

export default function EmergencyContactsScreen() {
  const { id } = useLocalSearchParams();
  const patientId = Array.isArray(id) ? id[0] : String(id ?? "");

  const { patients, updateEmergencyContact } = usePatients();
  const patient = patients.find((item) => item.id === patientId);

  const [isEditing, setIsEditing] = useState(false);
  const [contact, setContact] = useState(patient?.emergencyContact ?? "");

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

  const handleSaveContact = () => {
    updateEmergencyContact(patient.id, contact);
    setIsEditing(false);
    Alert.alert("Saved", "Emergency contact has been updated.");
  };

  const handleEmergencyAlert = () => {
    Alert.alert(
      "Emergency Alert Sent",
      `Emergency alert sent for ${patient.name}.\n\nContact notified:\n${patient.emergencyContact}`
    );
  };

  const handleCallEmergency = () => {
    Alert.alert(
      "Emergency Call",
      "This is a demo button. Later, this can connect to emergency calling or hospital alert API."
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back to Patient</Text>
        </TouchableOpacity>

        <Text style={styles.pageTitle}>Emergency Contacts</Text>
        <Text style={styles.subtitle}>{patient.name}</Text>

        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>Emergency Support</Text>
          <Text style={styles.warningText}>
            Use this page when the patient needs urgent help or when emergency
            contacts must be notified quickly.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>Primary Emergency Contact</Text>

            <TouchableOpacity
              style={styles.smallEditButton}
              onPress={() => setIsEditing(!isEditing)}
            >
              <Text style={styles.smallEditButtonText}>
                {isEditing ? "Cancel" : "Edit"}
              </Text>
            </TouchableOpacity>
          </View>

          {isEditing ? (
            <>
              <TextInput
                style={styles.input}
                value={contact}
                onChangeText={setContact}
                placeholder="Emergency contact"
              />

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleSaveContact}
              >
                <Text style={styles.primaryButtonText}>Save Contact</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.infoText}>{patient.emergencyContact}</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Patient Emergency Info</Text>
          <Text style={styles.infoText}>Name: {patient.name}</Text>
          <Text style={styles.infoText}>Condition: {patient.condition}</Text>
          <Text style={styles.infoText}>Allergies: {patient.allergies}</Text>
          <Text style={styles.infoText}>Room: {patient.room}</Text>
        </View>

        <TouchableOpacity
          style={styles.emergencyButton}
          onPress={handleEmergencyAlert}
        >
          <Text style={styles.emergencyButtonText}>Send Emergency Alert</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.callButton} onPress={handleCallEmergency}>
          <Text style={styles.callButtonText}>Call Emergency Support</Text>
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
    fontSize: 16,
    color: "#6B7280",
    marginTop: 4,
    marginBottom: 18,
  },
  warningCard: {
    backgroundColor: "#FEF2F2",
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderLeftWidth: 6,
    borderLeftColor: "#DC2626",
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#991B1B",
    marginBottom: 6,
  },
  warningText: {
    fontSize: 15,
    color: "#7F1D1D",
    lineHeight: 21,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
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
    marginBottom: 8,
  },
  infoText: {
    fontSize: 15,
    color: "#4B5563",
    marginBottom: 5,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    padding: 15,
    marginTop: 8,
    marginBottom: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  smallEditButton: {
    backgroundColor: "#E0F2FE",
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  smallEditButtonText: {
    color: "#2E6F9E",
    fontWeight: "bold",
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
  callButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#DC2626",
  },
  callButtonText: {
    color: "#DC2626",
    fontSize: 17,
    fontWeight: "bold",
  },
  primaryButton: {
    backgroundColor: "#2E6F9E",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    marginTop: 8,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});