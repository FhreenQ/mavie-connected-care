import { useCallback, useEffect, useState } from "react";
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";

import NurseBottomNavigation from "../components/nurse/NurseBottomNavigation";
import { useEmergencyAlerts } from "../context/EmergencyAlertContext";
import { getNurseEmergencyEvents, NurseEmergencyEvent } from "../services/api";

export default function EmergencyLogScreen() {
  const [events, setEvents] = useState<NurseEmergencyEvent[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { emergencyRevision } = useEmergencyAlerts();

  const loadEmergencyLog = useCallback(async () => {
    setRefreshing(true);
    try {
      const allEvents = await getNurseEmergencyEvents();
      setEvents(allEvents.filter((event) => event.status === "Resolved" || event.status === "Cancelled"));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadEmergencyLog().catch(() => undefined);
    }, [loadEmergencyLog])
  );

  useEffect(() => {
    if (emergencyRevision > 0) {
      loadEmergencyLog().catch(() => undefined);
    }
  }, [emergencyRevision, loadEmergencyLog]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadEmergencyLog} />}
      >
        <Text style={styles.pageTitle}>Emergency Log</Text>
        <Text style={styles.subtitle}>Resolved and rejected alerts for your linked patients</Text>

        {events.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No resolved or rejected emergency events have been recorded yet.</Text>
          </View>
        ) : (
          events.map((event) => {
            const latestAction = event.action_logs?.[0];
            const outcome = event.status === "Cancelled" ? "Rejected" : "Resolved";
            const eventTime = latestAction?.created_at || event.resolved_at || event.created_at;

            return (
              <View key={event.emergency_event_id} style={styles.historyCard}>
                <View style={styles.rowBetween}>
                  <Text style={styles.patientName}>{event.patient_username}</Text>
                  <Text style={styles.outcome}>{outcome}</Text>
                </View>
                <Text style={styles.details}>{event.details || "Emergency alert received."}</Text>
                <Text style={styles.meta}>Location: {event.location_text || "Not provided"}</Text>
                <Text style={styles.meta}>Outcome: {latestAction?.action || outcome}</Text>
                {latestAction?.note ? <Text style={styles.meta}>Note: {latestAction.note}</Text> : null}
                <Text style={styles.meta}>{new Date(eventTime).toLocaleString()}</Text>
              </View>
            );
          })
        )}
      </ScrollView>
      <NurseBottomNavigation activeTab="emergency-log" />
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
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
  },
  emptyText: {
    color: "#6B7280",
    lineHeight: 20,
  },
  historyCard: {
    backgroundColor: "#FFFFFF",
    borderLeftWidth: 6,
    borderLeftColor: "#64748B",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  patientName: {
    color: "#1F2937",
    fontSize: 17,
    fontWeight: "bold",
  },
  outcome: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "bold",
  },
  details: {
    color: "#4B5563",
    marginTop: 8,
  },
  meta: {
    color: "#6B7280",
    fontSize: 13,
    marginTop: 4,
  },
});
