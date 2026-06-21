import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";

import { usePatients } from "../context/PatientContext";
import { useEmergencyAlerts } from "../context/EmergencyAlertContext";
import PatientCard from "../components/nurse/PatientCard";
import NurseBottomNavigation from "../components/nurse/NurseBottomNavigation";
import { getNurseEmergencyEvents, NurseEmergencyEvent, updateNurseEmergencyEvent } from "../services/api";

export default function NurseDashboardScreen() {
  const { patients, loading, refreshPatients } = usePatients();
  const { emergencyRevision } = useEmergencyAlerts();
  const [emergencyEvents, setEmergencyEvents] = useState<NurseEmergencyEvent[]>([]);
  const [updatingEventId, setUpdatingEventId] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    const [, events] = await Promise.all([
      refreshPatients(),
      getNurseEmergencyEvents(),
    ]);
    setEmergencyEvents(events);
  }, [refreshPatients]);

  useFocusEffect(
    useCallback(() => {
      loadDashboard().catch(() => undefined);
    }, [loadDashboard])
  );

  useEffect(() => {
    if (emergencyRevision > 0) {
      loadDashboard().catch(() => undefined);
    }
  }, [emergencyRevision, loadDashboard]);

  const handleEmergencyAction = async (
    eventId: string,
    action: "acknowledge" | "resolve" | "reject"
  ) => {
    try {
      setUpdatingEventId(eventId);
      await updateNurseEmergencyEvent(eventId, action);
      await loadDashboard();
    } catch (error) {
      Alert.alert("Emergency update failed", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setUpdatingEventId(null);
    }
  };

  const attentionPatients = patients.filter((patient) =>
    patient.medicines.some((medicine) => medicine.status === "Missed" || medicine.status === "Pending")
  );
  const activeEmergencyEvents = emergencyEvents.filter(
    (event) => event.status !== "Resolved" && event.status !== "Cancelled"
  );
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadDashboard} />}
      >
        <View style={styles.headerBox}>
          <Text style={styles.pageTitle}>Nurse Dashboard</Text>
          <Text style={styles.subtitle}>Monitor and manage your patients</Text>
        </View>

        <Text style={styles.sectionTitle}>Needs Attention</Text>
        {attentionPatients.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No pending or missed medication needs attention right now.</Text>
          </View>
        ) : (
          attentionPatients.map((patient) => {
            const missed = patient.medicines.filter((medicine) => medicine.status === "Missed").length;
            const pending = patient.medicines.filter((medicine) => medicine.status === "Pending").length;
            return (
              <TouchableOpacity
                key={`attention-${patient.id}`}
                style={styles.attentionCard}
                onPress={() => router.push({ pathname: "/patient/[id]", params: { id: patient.id } })}
              >
                <Text style={styles.attentionName}>{patient.name}</Text>
                <Text style={styles.attentionText}>Missed: {missed} | Pending: {pending}</Text>
              </TouchableOpacity>
            );
          })
        )}

        <Text style={styles.sectionTitle}>Emergency Queue</Text>
        {activeEmergencyEvents.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No active emergency events for your linked patients.</Text>
          </View>
        ) : (
          activeEmergencyEvents.map((event) => (
            <View key={event.emergency_event_id} style={styles.emergencyCard}>
              <View style={styles.rowBetween}>
                <Text style={styles.emergencyPatient}>{event.patient_username}</Text>
                <Text style={styles.emergencyStatus}>{event.status}</Text>
              </View>
              <Text style={styles.emergencyDetails}>{event.details || "Emergency alert received."}</Text>
              <Text style={styles.emergencyMeta}>{event.location_text || "Location not provided"}</Text>
              <Text style={styles.emergencyMeta}>{new Date(event.created_at).toLocaleString()}</Text>
              <View style={styles.emergencyActions}>
                {event.status !== "Acknowledged" && (
                  <TouchableOpacity
                    style={styles.acknowledgeButton}
                    disabled={updatingEventId === event.emergency_event_id}
                    onPress={() => handleEmergencyAction(event.emergency_event_id, "acknowledge")}
                  >
                    <Text style={styles.acknowledgeButtonText}>Acknowledge</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.resolveButton}
                  disabled={updatingEventId === event.emergency_event_id}
                  onPress={() => handleEmergencyAction(event.emergency_event_id, "resolve")}
                >
                  <Text style={styles.resolveButtonText}>Resolve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.rejectButton}
                  disabled={updatingEventId === event.emergency_event_id}
                  onPress={() => handleEmergencyAction(event.emergency_event_id, "reject")}
                >
                  <Text style={styles.rejectButtonText}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

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
      <NurseBottomNavigation activeTab="home" />
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
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 4,
  },
  emptyText: {
    color: "#6B7280",
    lineHeight: 20,
  },
  attentionCard: {
    backgroundColor: "#FFF7ED",
    borderLeftWidth: 6,
    borderLeftColor: "#F59E0B",
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
  },
  attentionName: {
    color: "#1F2937",
    fontSize: 17,
    fontWeight: "bold",
  },
  attentionText: {
    color: "#92400E",
    marginTop: 5,
    fontWeight: "600",
  },
  emergencyCard: {
    backgroundColor: "#FFF1F2",
    borderLeftWidth: 6,
    borderLeftColor: "#DC2626",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  emergencyPatient: {
    color: "#991B1B",
    fontSize: 17,
    fontWeight: "bold",
  },
  emergencyStatus: {
    color: "#991B1B",
    fontSize: 12,
    fontWeight: "bold",
  },
  emergencyDetails: {
    color: "#7F1D1D",
    marginTop: 8,
  },
  emergencyMeta: {
    color: "#9F1239",
    fontSize: 13,
    marginTop: 4,
  },
  emergencyActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  acknowledgeButton: {
    flex: 1,
    backgroundColor: "#FDE68A",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  acknowledgeButtonText: {
    color: "#92400E",
    fontWeight: "bold",
  },
  resolveButton: {
    flex: 1,
    backgroundColor: "#16A34A",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  resolveButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  rejectButton: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DC2626",
  },
  rejectButtonText: {
    color: "#B91C1C",
    fontWeight: "bold",
  },
});
