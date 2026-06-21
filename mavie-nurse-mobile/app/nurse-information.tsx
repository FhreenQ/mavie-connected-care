import { Alert, SafeAreaView, ScrollView, StyleSheet, Text } from "react-native";
import { router } from "expo-router";

import NurseBottomNavigation from "../components/nurse/NurseBottomNavigation";
import NurseInfoCard from "../components/nurse/NurseInfoCard";
import { usePatients } from "../context/PatientContext";

export default function NurseInformationScreen() {
  const { nurse, patients, logout } = usePatients();

  const handleLogout = () => {
    Alert.alert("Log Out", "Log out of the nurse dashboard?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/");
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.pageTitle}>Nurse Information</Text>
        <Text style={styles.subtitle}>Manage your professional profile and session</Text>

        <NurseInfoCard
          nurse={nurse}
          patientCount={patients.length}
          onEdit={() => router.push("/edit-nurse-profile")}
          onLogout={handleLogout}
        />
      </ScrollView>
      <NurseBottomNavigation activeTab="nurse-information" />
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
    paddingBottom: 110,
  },
  pageTitle: {
    color: "#1F2937",
    fontSize: 28,
    fontWeight: "bold",
  },
  subtitle: {
    color: "#6B7280",
    fontSize: 15,
    marginTop: 4,
    marginBottom: 20,
  },
});
