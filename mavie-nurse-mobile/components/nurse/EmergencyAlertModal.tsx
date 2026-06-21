import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { NurseEmergencyEvent } from "../../services/api";

type EmergencyAlertModalProps = {
  event: NurseEmergencyEvent | null;
  acknowledging: boolean;
  onOpenQueue: () => void;
  onAcknowledge: () => void;
  onDismiss: () => void;
};

export default function EmergencyAlertModal({
  event,
  acknowledging,
  onOpenQueue,
  onAcknowledge,
  onDismiss,
}: EmergencyAlertModalProps) {
  return (
    <Modal
      animationType="fade"
      transparent
      visible={Boolean(event)}
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.card} accessibilityViewIsModal>
          <Text style={styles.icon}>🚨</Text>
          <Text style={styles.eyebrow}>EMERGENCY ALERT</Text>
          <Text style={styles.title}>{event?.patient_username || "Linked patient"}</Text>
          <Text style={styles.message}>{event?.details || "A patient pressed the MaVie emergency button."}</Text>
          <Text style={styles.location}>Location: {event?.location_text || "Not provided"}</Text>
          <Text style={styles.time}>
            {event?.created_at ? new Date(event.created_at).toLocaleString() : "Just now"}
          </Text>

          <TouchableOpacity style={styles.acknowledgeButton} disabled={acknowledging} onPress={onAcknowledge}>
            <Text style={styles.acknowledgeButtonText}>{acknowledging ? "Acknowledging..." : "Acknowledge"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.queueButton} disabled={acknowledging} onPress={onOpenQueue}>
            <Text style={styles.queueButtonText}>Open Emergency Queue</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dismissButton} disabled={acknowledging} onPress={onDismiss}>
            <Text style={styles.dismissButtonText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.48)",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 22,
    borderTopWidth: 6,
    borderTopColor: "#DC2626",
  },
  icon: {
    fontSize: 30,
    marginBottom: 6,
  },
  eyebrow: {
    color: "#B91C1C",
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 0.4,
  },
  title: {
    color: "#1F2937",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 4,
  },
  message: {
    color: "#4B5563",
    fontSize: 16,
    lineHeight: 23,
    marginTop: 12,
  },
  location: {
    color: "#7F1D1D",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 14,
  },
  time: {
    color: "#6B7280",
    fontSize: 13,
    marginTop: 5,
    marginBottom: 20,
  },
  acknowledgeButton: {
    alignItems: "center",
    backgroundColor: "#15803D",
    borderRadius: 12,
    paddingVertical: 14,
  },
  acknowledgeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  queueButton: {
    alignItems: "center",
    backgroundColor: "#E0F2FE",
    borderRadius: 12,
    marginTop: 10,
    paddingVertical: 14,
  },
  queueButtonText: {
    color: "#2E6F9E",
    fontSize: 16,
    fontWeight: "bold",
  },
  dismissButton: {
    alignItems: "center",
    paddingVertical: 13,
  },
  dismissButtonText: {
    color: "#6B7280",
    fontSize: 15,
    fontWeight: "bold",
  },
});
