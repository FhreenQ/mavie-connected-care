import { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  TextInput,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { usePatients } from "../../../context/PatientContext";
import { EmergencyContact } from "../../../data/mockNurseData";
import { triggerPatientEmergencyAlert } from "../../../services/api";

export default function EmergencyContactsScreen() {
  const { id } = useLocalSearchParams();
  const patientId = Array.isArray(id) ? id[0] : String(id ?? "");

  const {
    patients,
    addEmergencyContact,
    updateEmergencyContactAtIndex,
    deleteEmergencyContact,
  } = usePatients();

  const patient = patients.find((item) => item.id === patientId);

  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [phone, setPhone] = useState("");

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

  const contacts = patient.emergencyContacts ?? [];

  const resetForm = () => {
    setName("");
    setRelationship("");
    setPhone("");
    setIsAdding(false);
    setEditingIndex(null);
  };

  const startAddContact = () => {
    setName("");
    setRelationship("");
    setPhone("");
    setEditingIndex(null);
    setIsAdding(true);
  };

  const startEditContact = (contact: EmergencyContact, index: number) => {
    setName(contact.name);
    setRelationship(contact.relationship);
    setPhone(contact.phone);
    setEditingIndex(index);
    setIsAdding(false);
  };

  const handleSaveContact = async () => {
    if (!name || !relationship || !phone) {
      Alert.alert(
        "Missing Information",
        "Please fill in name, relationship, and phone number."
      );
      return;
    }

    const contact: EmergencyContact = {
      name,
      relationship,
      phone,
    };

    try {
      if (editingIndex !== null) {
        await updateEmergencyContactAtIndex(patient.id, editingIndex, contact);
        Alert.alert("Saved", "Emergency contact has been updated.");
      } else {
        await addEmergencyContact(patient.id, contact);
        Alert.alert("Saved", "New emergency contact has been added.");
      }
      resetForm();
    } catch (error) {
      Alert.alert("Save failed", error instanceof Error ? error.message : "Unable to save emergency contact.");
    }
  };

  const handleDeleteContact = (index: number) => {
    Alert.alert(
      "Delete Contact",
      "Are you sure you want to delete this emergency contact?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteEmergencyContact(patient.id, index);
            } catch (error) {
              Alert.alert("Delete failed", error instanceof Error ? error.message : "Unable to delete emergency contact.");
            }
          },
        },
      ]
    );
  };

  const handleEmergencyAlert = async () => {
    try {
      const result = await triggerPatientEmergencyAlert(patient.id, {
        locationText: patient.room,
        details: `Emergency alert initiated by nurse for ${patient.name}.`,
      });
      Alert.alert(
        "Emergency Alert Sent",
        `Emergency event #${result.event.emergency_event_id} was recorded. ${result.alertsCreated} notification record(s) were created.`
      );
    } catch (error) {
      Alert.alert("Emergency alert failed", error instanceof Error ? error.message : "Please try again.");
    }
  };

  const handleCallEmergency = () => {
    Alert.alert(
      "Call Emergency Support",
      "Call Korean emergency services (119)?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Call 119",
          style: "destructive",
          onPress: () => {
            Linking.openURL("tel:119").catch(() => {
              Alert.alert("Call unavailable", "Emergency calling is not available on this device.");
            });
          },
        },
      ]
    );
  };

  const showForm = isAdding || editingIndex !== null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back to Patient</Text>
        </TouchableOpacity>

        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.pageTitle}>Emergency Contacts</Text>
            <Text style={styles.subtitle}>{patient.name}</Text>
          </View>

          {!showForm && (
            <TouchableOpacity style={styles.addButton} onPress={startAddContact}>
              <Text style={styles.addButtonText}>+ Add</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>Emergency Support</Text>
          <Text style={styles.warningText}>
            Add multiple emergency contacts so caregivers and family members can
            be notified quickly.
          </Text>
        </View>

        {showForm && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {editingIndex !== null ? "Edit Contact" : "Add New Contact"}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Contact name"
              value={name}
              onChangeText={setName}
            />

            <TextInput
              style={styles.input}
              placeholder="Relationship"
              value={relationship}
              onChangeText={setRelationship}
            />

            <TextInput
              style={styles.input}
              placeholder="Phone number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            <TouchableOpacity style={styles.primaryButton} onPress={handleSaveContact}>
              <Text style={styles.primaryButtonText}>Save Contact</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={resetForm}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.sectionTitle}>Saved Contacts</Text>

        {contacts.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.infoText}>No emergency contacts added yet.</Text>
          </View>
        ) : (
          contacts.map((contact, index) => (
            <View key={index} style={styles.card}>
              <View style={styles.rowBetween}>
                <View style={styles.contactInfo}>
                  <Text style={styles.cardTitle}>
                    {contact.name}
                    {index === 0 ? "  • Primary" : ""}
                  </Text>
                  <Text style={styles.infoText}>
                    Relationship: {contact.relationship}
                  </Text>
                  <Text style={styles.infoText}>Phone: {contact.phone}</Text>
                </View>
              </View>

              <View style={styles.contactActionRow}>
                <TouchableOpacity
                  style={styles.smallEditButton}
                  onPress={() => startEditContact(contact, index)}
                >
                  <Text style={styles.smallEditButtonText}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.smallDeleteButton}
                  onPress={() => handleDeleteContact(index)}
                >
                  <Text style={styles.smallDeleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Patient Emergency Info</Text>
          <Text style={styles.infoText}>Name: {patient.name}</Text>
          <Text style={styles.infoText}>Condition: {patient.condition}</Text>
          <Text style={styles.infoText}>Allergies: {patient.allergies}</Text>
          <Text style={styles.infoText}>Room: {patient.room}</Text>
        </View>

        <TouchableOpacity
          style={styles.emergencyButton}
          onPress={handleEmergencyAlert}
        >
          <Text style={styles.emergencyButtonText}>Send Emergency Alert</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.callButton} onPress={handleCallEmergency}>
          <Text style={styles.callButtonText}>Call Emergency Support</Text>
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
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  sectionTitle: {
    fontSize: 21,
    fontWeight: "bold",
    color: "#1F2937",
    marginTop: 10,
    marginBottom: 12,
  },
  warningCard: {
    backgroundColor: "#FEF2F2",
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderLeftWidth: 6,
    borderLeftColor: "#DC2626",
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#991B1B",
    marginBottom: 6,
  },
  warningText: {
    fontSize: 15,
    color: "#7F1D1D",
    lineHeight: 21,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
  },
  contactInfo: {
    flex: 1,
  },
  contactActionRow: {
    flexDirection: "row",
    marginTop: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 15,
    color: "#4B5563",
    marginBottom: 5,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    padding: 15,
    marginBottom: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  addButton: {
    backgroundColor: "#2E6F9E",
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  smallEditButton: {
    backgroundColor: "#E0F2FE",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 8,
  },
  smallEditButtonText: {
    color: "#2E6F9E",
    fontWeight: "bold",
  },
  smallDeleteButton: {
    backgroundColor: "#FEE2E2",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  smallDeleteButtonText: {
    color: "#DC2626",
    fontWeight: "bold",
  },
  primaryButton: {
    backgroundColor: "#2E6F9E",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    marginTop: 8,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  secondaryButton: {
    backgroundColor: "#E5E7EB",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    marginTop: 10,
  },
  secondaryButtonText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "bold",
  },
  emergencyButton: {
    backgroundColor: "#DC2626",
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    marginTop: 10,
  },
  emergencyButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "bold",
  },
  callButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#DC2626",
  },
  callButtonText: {
    color: "#DC2626",
    fontSize: 17,
    fontWeight: "bold",
  },
});
