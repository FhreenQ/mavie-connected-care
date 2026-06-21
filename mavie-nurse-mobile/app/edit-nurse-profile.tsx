import { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { usePatients } from "../context/PatientContext";

export default function EditNurseProfileScreen() {
  const { nurse, updateNurse } = usePatients();

  const [name, setName] = useState(nurse.name);
  const [email, setEmail] = useState(nurse.email);
  const [phone, setPhone] = useState(nurse.phone);
  const [department, setDepartment] = useState(nurse.department);
  const [ward, setWard] = useState(nurse.ward);
  const [shift, setShift] = useState(nurse.shift);

  const handleSave = async () => {
    try {
      await updateNurse({ name, email, phone, department, ward, shift });
      router.replace("/nurse-dashboard");
    } catch (error) {
      Alert.alert("Save failed", error instanceof Error ? error.message : "Unable to save nurse information.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back to Dashboard</Text>
        </TouchableOpacity>

        <Text style={styles.pageTitle}>Edit Nurse Info</Text>

        <TextInput
          style={styles.input}
          placeholder="Nurse name"
          value={name}
          onChangeText={setName}
        />

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Phone"
          value={phone}
          onChangeText={setPhone}
        />

        <TextInput
          style={styles.input}
          placeholder="Department"
          value={department}
          onChangeText={setDepartment}
        />

        <TextInput
          style={styles.input}
          placeholder="Ward"
          value={ward}
          onChangeText={setWard}
        />

        <TextInput
          style={styles.input}
          placeholder="Shift"
          value={shift}
          onChangeText={setShift}
        />

        <TouchableOpacity style={styles.primaryButton} onPress={handleSave}>
          <Text style={styles.primaryButtonText}>Save Changes</Text>
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
