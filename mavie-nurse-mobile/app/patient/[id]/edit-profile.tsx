import { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { usePatients } from "../../../context/PatientContext";

export default function EditPatientProfileScreen() {
  const { id } = useLocalSearchParams();
  const patientId = Array.isArray(id) ? id[0] : String(id ?? "");

  const { patients, updatePatient } = usePatients();
  const patient = patients.find((item) => item.id === patientId);

  const [name, setName] = useState(patient?.name ?? "");
  const [age, setAge] = useState(patient?.age ?? "");
  const [gender, setGender] = useState(patient?.gender ?? "");
  const [condition, setCondition] = useState(patient?.condition ?? "");
  const [room, setRoom] = useState(patient?.room ?? "");
  const [allergies, setAllergies] = useState(patient?.allergies ?? "");
  const [emergencyContact, setEmergencyContact] = useState(
    patient?.emergencyContact ?? ""
  );
  const [notes, setNotes] = useState(patient?.notes ?? "");

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

  const handleSave = async () => {
    if (!name || !age || !condition) {
      Alert.alert("Missing Information", "Please fill in name, age, and condition.");
      return;
    }

    try {
      await updatePatient(patient.id, {
        name,
        age,
        gender,
        condition,
        room,
        allergies,
        emergencyContact,
        notes,
      });
      router.replace(`/patient/${patient.id}` as any);
    } catch (error) {
      Alert.alert("Save failed", error instanceof Error ? error.message : "Unable to save patient information.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back to Patient</Text>
        </TouchableOpacity>

        <Text style={styles.pageTitle}>Edit Patient Info</Text>
        <Text style={styles.subtitle}>{patient.name}</Text>

        <TextInput
          style={styles.input}
          placeholder="Patient name"
          value={name}
          onChangeText={setName}
        />

        <TextInput
          style={styles.input}
          placeholder="Age"
          value={age}
          onChangeText={setAge}
          keyboardType="numeric"
        />

        <TextInput
          style={styles.input}
          placeholder="Gender"
          value={gender}
          onChangeText={setGender}
        />

        <TextInput
          style={styles.input}
          placeholder="Condition"
          value={condition}
          onChangeText={setCondition}
        />

        <TextInput
          style={styles.input}
          placeholder="Room / Ward"
          value={room}
          onChangeText={setRoom}
        />

        <TextInput
          style={styles.input}
          placeholder="Allergies"
          value={allergies}
          onChangeText={setAllergies}
        />

        <TextInput
          style={styles.input}
          placeholder="Emergency contact"
          value={emergencyContact}
          onChangeText={setEmergencyContact}
        />

        <TextInput
          style={[styles.input, styles.notesInput]}
          placeholder="Nurse notes"
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        <TouchableOpacity style={styles.primaryButton} onPress={handleSave}>
          <Text style={styles.primaryButtonText}>Save Patient Info</Text>
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
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 15,
    marginBottom: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  notesInput: {
    minHeight: 100,
    textAlignVertical: "top",
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
