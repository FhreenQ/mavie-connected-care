import { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { usePatients } from "../context/PatientContext";

export default function AddPatientScreen() {
  const { addPatient } = usePatients();

  const [patientEmail, setPatientEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!patientEmail.trim()) {
      Alert.alert(
        "Missing Information",
        "Please enter the registered patient's email address."
      );
      return;
    }

    try {
      setLoading(true);

      await addPatient({
        patientEmail: patientEmail.trim(),
      });

      Alert.alert(
        "Patient Connected",
        "The patient has been connected to your nurse account."
      );

      router.replace("/nurse-dashboard");
    } catch (error) {
      Alert.alert(
        "Unable to Connect Patient",
        error instanceof Error
          ? error.message
          : "An unexpected error occurred."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back to Dashboard</Text>
        </TouchableOpacity>

        <Text style={styles.pageTitle}>Connect Patient</Text>

        <Text style={styles.description}>
          Enter the email address of a patient who already registered in the
          Ma Vie patient app.
        </Text>

        <TextInput
          style={styles.input}
          value={patientEmail}
          onChangeText={setPatientEmail}
          placeholder="Patient email address"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Connect Patient</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.secondaryButtonText}>Cancel</Text>
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
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: "#6B7280",
    lineHeight: 22,
    marginBottom: 18,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 15,
    marginBottom: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  primaryButton: {
    backgroundColor: "#2E6F9E",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "bold",
  },
  secondaryButton: {
    backgroundColor: "#E5E7EB",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginTop: 12,
  },
  secondaryButtonText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "bold",
  },
});