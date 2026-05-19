import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";

import { usePatients } from "../context/PatientContext";
import NurseInfoCard from "../components/nurse/NurseInfoCard";
import PatientCard from "../components/nurse/PatientCard";

export default function NurseDashboardScreen() {
  const { nurse, patients } = usePatients();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerBox}>
          <Text style={styles.pageTitle}>Nurse Dashboard</Text>
          <Text style={styles.subtitle}>Monitor and manage your patients</Text>
        </View>

        <NurseInfoCard
          nurse={nurse}
          patientCount={patients.length}
          onEdit={() => router.push("/edit-nurse-profile")}
        />

        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>Patients</Text>

          <TouchableOpacity
            style={styles.smallButton}
            onPress={() => router.push("/add-patient")}
          >
            <Text style={styles.smallButtonText}>+ Add Patient</Text>
          </TouchableOpacity>
        </View>

        {patients.map((patient) => (
          <PatientCard
            key={patient.id}
            patient={patient}
            onPress={() =>
              router.push({
                pathname: "/patient/[id]",
                params: { id: patient.id },
              })
            }
          />
        ))}
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
  headerBox: {
    marginBottom: 8,
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
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  smallButton: {
    backgroundColor: "#2E6F9E",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  smallButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
});