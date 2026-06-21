import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  getMedicationLogs,
  getUserMedications,
  markOverdueMedicationLogs,
} from "../components/medicine-scanner/medicineApi";

type ListItem = {
  id: string;
  name: string;
  dose: string;
  scheduledTime: string;
  statusTime?: string;
};

function isStillWithinDeadline(scheduledTime?: string) {
  if (!scheduledTime) return false;
  const time = new Date(scheduledTime).getTime();
  return Number.isFinite(time) && Date.now() <= time + 60 * 60 * 1000;
}

function formatDateTime(value?: string) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MedicationStatusScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ status?: string }>();
  const status = params.status === "Skipped" ? "Skipped" : "Pending";
  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadItems = useCallback(async () => {
    try {
      setError("");
      await markOverdueMedicationLogs();
      const [schedules, logs] = await Promise.all([getUserMedications(), getMedicationLogs()]);

      if (status === "Skipped") {
        const skippedItems = logs
          .filter((log: any) => log.status === "Skipped")
          .map((log: any) => ({
            id: String(log.log_id),
            name: log.brand_name || log.generic_name || "Unknown medicine",
            dose: log.dosage || log.strength || "As instructed",
            scheduledTime: log.scheduled_time,
            statusTime: log.created_at || log.scheduled_time,
          }));
        setItems(skippedItems);
        return;
      }

      const pendingItems = schedules
        .filter((schedule: any) => {
          const alreadyRecorded = logs.some(
            (log: any) =>
              String(log.schedule_id) === String(schedule.schedule_id) &&
              new Date(log.scheduled_time).getTime() === new Date(schedule.next_dose_time).getTime()
          );
          return !alreadyRecorded && isStillWithinDeadline(schedule.next_dose_time);
        })
        .map((schedule: any) => ({
          id: String(schedule.schedule_id),
          name: schedule.brand_name || schedule.generic_name || "Unknown medicine",
          dose: schedule.dosage || schedule.strength || "As instructed",
          scheduledTime: schedule.next_dose_time,
        }));
      setItems(pendingItems);
    } catch (loadError: any) {
      setError(loadError.message || "Could not load medication status.");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadItems();
    }, [loadItems])
  );

  const heading = status === "Skipped" ? "Skipped medications" : "Medication still due";
  const emptyMessage = status === "Skipped" ? "No medication has been skipped." : "No medication is still due within its deadline.";

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity accessibilityLabel="Go back" onPress={() => router.back()}>
          <Text style={styles.backButton}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{heading}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>
          {status === "Skipped"
            ? "Review doses marked as skipped and the recorded date."
            : "These doses can still be marked as taken or skipped from the Medication page."}
        </Text>

        {loading ? (
          <ActivityIndicator style={styles.loader} size="large" color="#0F766E" />
        ) : error ? (
          <View style={styles.messageCard}><Text style={styles.errorText}>{error}</Text></View>
        ) : items.length === 0 ? (
          <View style={styles.messageCard}><Text style={styles.emptyText}>{emptyMessage}</Text></View>
        ) : (
          items.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <Text style={styles.medicationName}>{item.name}</Text>
              <Text style={styles.details}>{item.dose}</Text>
              <Text style={styles.timeLabel}>
                {status === "Skipped" ? "Skipped on: " : "Scheduled for: "}
                {formatDateTime(status === "Skipped" ? item.statusTime : item.scheduledTime)}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F4F7FB" },
  header: { backgroundColor: "#FFFFFF", paddingHorizontal: 18, paddingVertical: 15, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  backButton: { color: "#0F766E", fontWeight: "800", width: 54 },
  title: { flex: 1, textAlign: "center", color: "#111827", fontSize: 19, fontWeight: "900" },
  headerSpacer: { width: 54 },
  content: { padding: 18 },
  subtitle: { color: "#6B7280", lineHeight: 20, marginBottom: 16 },
  loader: { marginTop: 34 },
  messageCard: { backgroundColor: "#FFFFFF", padding: 18, borderRadius: 12 },
  emptyText: { color: "#6B7280" },
  errorText: { color: "#B91C1C" },
  itemCard: { backgroundColor: "#FFFFFF", padding: 18, borderRadius: 12, marginBottom: 12, elevation: 2 },
  medicationName: { fontSize: 19, fontWeight: "900", color: "#111827" },
  details: { marginTop: 5, color: "#374151" },
  timeLabel: { marginTop: 11, color: "#0F766E", fontWeight: "700" },
});
