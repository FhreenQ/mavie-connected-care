import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { usePatients } from "../../../context/PatientContext";
import { unlinkPatient, updateCareLink } from "../../../services/api";

export default function CareLinkScreen() {
  const { id } = useLocalSearchParams();
  const patientId = Array.isArray(id) ? id[0] : String(id ?? "");
  const { patients, refreshPatients } = usePatients();
  const patient = patients.find((item) => item.id === patientId);

  const [relationship, setRelationship] = useState(patient?.relationship || "Nurse");
  const [canViewSchedule, setCanViewSchedule] = useState(patient?.canViewSchedule ?? true);
  const [canViewLogs, setCanViewLogs] = useState(patient?.canViewLogs ?? true);
  const [canManageSchedule, setCanManageSchedule] = useState(patient?.canManageSchedule ?? true);
  const [canReceiveEmergencyAlerts, setCanReceiveEmergencyAlerts] = useState(patient?.canReceiveEmergencyAlerts ?? true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!patient) return;
    setRelationship(patient.relationship || "Nurse");
    setCanViewSchedule(patient.canViewSchedule ?? true);
    setCanViewLogs(patient.canViewLogs ?? true);
    setCanManageSchedule(patient.canManageSchedule ?? true);
    setCanReceiveEmergencyAlerts(patient.canReceiveEmergencyAlerts ?? true);
  }, [patient]);

  if (!patient || !patient.linkId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerBox}>
          <Text style={styles.pageTitle}>Care link not found</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace("/nurse-dashboard")}>
            <Text style={styles.primaryButtonText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const savePermissions = async () => {
    if (!relationship.trim()) {
      Alert.alert("Missing information", "Please enter the care relationship.");
      return;
    }

    try {
      setSaving(true);
      await updateCareLink(patient.linkId!, {
        relationship: relationship.trim(),
        canViewSchedule,
        canViewLogs,
        canManageSchedule,
        canReceiveEmergencyAlerts,
      });
      await refreshPatients();
      router.back();
    } catch (error) {
      Alert.alert("Save failed", error instanceof Error ? error.message : "Unable to update the care link.");
    } finally {
      setSaving(false);
    }
  };

  const removePatientLink = () => {
    Alert.alert(
      "Unlink Patient",
      `Remove ${patient.name} from your nurse dashboard? Their medication data will not be deleted.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unlink",
          style: "destructive",
          onPress: async () => {
            try {
              setSaving(true);
              await unlinkPatient(patient.linkId!);
              await refreshPatients();
              router.replace("/nurse-dashboard");
            } catch (error) {
              Alert.alert("Unlink failed", error instanceof Error ? error.message : "Unable to remove the care link.");
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back to Patient</Text>
        </TouchableOpacity>

        <Text style={styles.pageTitle}>Care Link Permissions</Text>
        <Text style={styles.subtitle}>{patient.name}</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Care Relationship</Text>
          <TextInput
            style={styles.input}
            value={relationship}
            onChangeText={setRelationship}
            placeholder="Nurse, Caregiver, Family, Guardian, or Other"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Permissions</Text>
          <PermissionSwitch label="View medication schedule" value={canViewSchedule} onChange={setCanViewSchedule} />
          <PermissionSwitch label="View intake logs" value={canViewLogs} onChange={setCanViewLogs} />
          <PermissionSwitch label="Manage medication status" value={canManageSchedule} onChange={setCanManageSchedule} />
          <PermissionSwitch label="Receive emergency alerts" value={canReceiveEmergencyAlerts} onChange={setCanReceiveEmergencyAlerts} />
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={savePermissions} disabled={saving}>
          {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Save Permissions</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.unlinkButton} onPress={removePatientLink} disabled={saving}>
          <Text style={styles.unlinkButtonText}>Unlink Patient</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function PermissionSwitch({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return (
    <View style={styles.permissionRow}>
      <Text style={styles.permissionLabel}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ false: "#D1D5DB", true: "#93C5FD" }} thumbColor={value ? "#2E6F9E" : "#F9FAFB"} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FB" },
  scrollContent: { padding: 20 },
  centerBox: { flex: 1, justifyContent: "center", padding: 24 },
  backText: { color: "#2E6F9E", fontSize: 16, fontWeight: "bold", marginBottom: 16 },
  pageTitle: { fontSize: 28, fontWeight: "bold", color: "#1F2937" },
  subtitle: { fontSize: 16, color: "#6B7280", marginTop: 4, marginBottom: 18 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 18, padding: 18, marginBottom: 14 },
  cardTitle: { fontSize: 19, fontWeight: "bold", color: "#1F2937", marginBottom: 12 },
  input: { backgroundColor: "#F9FAFB", borderRadius: 14, padding: 15, fontSize: 16, borderWidth: 1, borderColor: "#E5E7EB" },
  permissionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  permissionLabel: { flex: 1, color: "#374151", fontSize: 15, fontWeight: "600", paddingRight: 12 },
  primaryButton: { backgroundColor: "#2E6F9E", borderRadius: 14, padding: 16, alignItems: "center", marginTop: 8 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 17, fontWeight: "bold" },
  unlinkButton: { backgroundColor: "#FFFFFF", borderRadius: 14, padding: 16, alignItems: "center", marginTop: 12, borderWidth: 1, borderColor: "#DC2626" },
  unlinkButtonText: { color: "#DC2626", fontSize: 16, fontWeight: "bold" },
});
