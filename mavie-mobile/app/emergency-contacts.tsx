// app/emergency-contacts.tsx

import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "@/context/AuthContext";
import {
  createEmergencyContact,
  deleteEmergencyContact,
  getEmergencyContacts,
  updateEmergencyContact,
} from "@/services/api";

export default function EmergencyContactsScreen() {
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [contacts, setContacts] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | string | null>(null);

  const [contactName, setContactName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [priorityOrder, setPriorityOrder] = useState("1");
  const [notifyBySms, setNotifyBySms] = useState(true);
  const [notifyByEmail, setNotifyByEmail] = useState(false);

  useEffect(() => {
    loadContacts();
  }, []);

  async function loadContacts() {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const data = await getEmergencyContacts(token);

      const list =
        data.contacts ||
        data.emergencyContacts ||
        data.emergency_contacts ||
        [];

      setContacts(list);
    } catch (error: any) {
      console.log("Failed to load emergency contacts:", error.message);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setEditingId(null);
    setContactName("");
    setRelationship("");
    setPhoneNumber("");
    setEmail("");
    setPriorityOrder("1");
    setNotifyBySms(true);
    setNotifyByEmail(false);
  }

  function startEdit(contact: any) {
    const id = contact.contact_id || contact.contactId || contact.id;

    setEditingId(id);
    setContactName(contact.contact_name || contact.contactName || contact.name || "");
    setRelationship(contact.relationship || "");
    setPhoneNumber(contact.phone_number || contact.phoneNumber || contact.phone || "");
    setEmail(contact.email || "");
    setPriorityOrder(String(contact.priority_order || contact.priorityOrder || 1));
    setNotifyBySms(
      contact.notify_by_sms !== undefined
        ? contact.notify_by_sms
        : contact.notifyBySms !== undefined
        ? contact.notifyBySms
        : true
    );
    setNotifyByEmail(
      contact.notify_by_email !== undefined
        ? contact.notify_by_email
        : contact.notifyByEmail !== undefined
        ? contact.notifyByEmail
        : false
    );
  }

  async function handleSave() {
    if (!token) {
      Alert.alert("Login required", "Please log in again.");
      return;
    }

    if (!contactName.trim() || !phoneNumber.trim()) {
      Alert.alert("Missing information", "Please enter contact name and phone number.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        contactName: contactName.trim(),
        relationship: relationship.trim(),
        phoneNumber: phoneNumber.trim(),
        email: email.trim(),
        priorityOrder: Number(priorityOrder) || 1,
        notifyBySms,
        notifyByEmail,
      };

      if (editingId) {
        await updateEmergencyContact(token, editingId, payload);
      } else {
        await createEmergencyContact(token, payload);
      }

      await loadContacts();
      resetForm();

      Alert.alert(
        "Saved",
        editingId
          ? "Emergency contact has been updated."
          : "Emergency contact has been added."
      );
    } catch (error: any) {
      Alert.alert("Save failed", error.message || "Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(contact: any) {
    const id = contact.contact_id || contact.contactId || contact.id;
    const name = contact.contact_name || contact.contactName || contact.name || "this contact";

    if (!token || !id) return;

    Alert.alert("Delete contact", `Delete ${name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteEmergencyContact(token, id);
            await loadContacts();

            if (editingId === id) {
              resetForm();
            }
          } catch (error: any) {
            Alert.alert("Delete failed", error.message || "Please try again.");
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#DC2626" />
        <Text style={styles.loadingText}>Loading emergency contacts...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backButtonText}>← Back</Text>
            </Pressable>

            <Text style={styles.title}>Emergency Contacts</Text>
            <Text style={styles.subtitle}>
              Add family members, caregivers, or nurses who should be contacted during emergencies.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              {editingId ? "Edit Contact" : "Add New Contact"}
            </Text>

            <Text style={styles.label}>Contact Name *</Text>
            <TextInput
              value={contactName}
              onChangeText={setContactName}
              placeholder="Example: Fahreen's Mother"
              style={styles.input}
            />

            <Text style={styles.label}>Relationship</Text>
            <TextInput
              value={relationship}
              onChangeText={setRelationship}
              placeholder="Example: Mother, Caregiver, Nurse"
              style={styles.input}
            />

            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="Example: +82 10-1234-5678"
              keyboardType="phone-pad"
              style={styles.input}
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Example: contact@email.com"
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />

            <Text style={styles.label}>Priority Order</Text>
            <TextInput
              value={priorityOrder}
              onChangeText={setPriorityOrder}
              placeholder="1"
              keyboardType="numeric"
              style={styles.input}
            />

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Notify by SMS</Text>
              <Switch value={notifyBySms} onValueChange={setNotifyBySms} />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Notify by Email</Text>
              <Switch value={notifyByEmail} onValueChange={setNotifyByEmail} />
            </View>

            <Pressable
              style={[styles.saveButton, saving && styles.disabledButton]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>
                  {editingId ? "Update Contact" : "Add Contact"}
                </Text>
              )}
            </Pressable>

            {editingId && (
              <Pressable style={styles.cancelButton} onPress={resetForm}>
                <Text style={styles.cancelButtonText}>Cancel Editing</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Saved Contacts</Text>

            {contacts.length === 0 ? (
              <Text style={styles.emptyText}>
                No emergency contacts added yet.
              </Text>
            ) : (
              contacts.map((contact) => {
                const id = contact.contact_id || contact.contactId || contact.id;
                const name =
                  contact.contact_name ||
                  contact.contactName ||
                  contact.name ||
                  "Unnamed contact";
                const phone =
                  contact.phone_number ||
                  contact.phoneNumber ||
                  contact.phone ||
                  "No phone";
                const relation = contact.relationship || "No relationship";
                const contactEmail = contact.email || "No email";

                return (
                  <View key={String(id)} style={styles.contactCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.contactName}>{name}</Text>
                      <Text style={styles.contactDetail}>{relation}</Text>
                      <Text style={styles.contactDetail}>{phone}</Text>
                      <Text style={styles.contactDetail}>{contactEmail}</Text>
                    </View>

                    <View style={styles.contactActions}>
                      <Pressable
                        style={styles.editSmallButton}
                        onPress={() => startEdit(contact)}
                      >
                        <Text style={styles.editSmallButtonText}>Edit</Text>
                      </Pressable>

                      <Pressable
                        style={styles.deleteSmallButton}
                        onPress={() => handleDelete(contact)}
                      >
                        <Text style={styles.deleteSmallButtonText}>Delete</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFF5F5",
  },
  container: {
    flex: 1,
    padding: 20,
  },
  center: {
    flex: 1,
    backgroundColor: "#FFF5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#6B7280",
    fontWeight: "700",
  },
  header: {
    marginTop: 12,
    marginBottom: 18,
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    color: "#DC2626",
    fontWeight: "900",
    fontSize: 16,
  },
  title: {
    fontSize: 30,
    fontWeight: "900",
    color: "#111827",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: "#6B7280",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 5,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 16,
  },
  label: {
    marginBottom: 7,
    fontSize: 13,
    fontWeight: "800",
    color: "#374151",
  },
  input: {
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    backgroundColor: "#F9FAFB",
    color: "#111827",
  },
  switchRow: {
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: "#374151",
  },
  saveButton: {
    marginTop: 8,
    backgroundColor: "#DC2626",
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.65,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 16,
  },
  cancelButton: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#DC2626",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#DC2626",
    fontWeight: "900",
    fontSize: 15,
  },
  emptyText: {
    color: "#6B7280",
    fontWeight: "700",
    lineHeight: 22,
  },
  contactCard: {
    borderWidth: 1,
    borderColor: "#FEE2E2",
    backgroundColor: "#FFF7F7",
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    gap: 12,
  },
  contactName: {
    fontSize: 16,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 4,
  },
  contactDetail: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 2,
  },
  contactActions: {
    justifyContent: "center",
    gap: 8,
  },
  editSmallButton: {
    backgroundColor: "#FDE68A",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
  },
  editSmallButtonText: {
    color: "#92400E",
    fontWeight: "900",
    fontSize: 12,
  },
  deleteSmallButton: {
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
  },
  deleteSmallButtonText: {
    color: "#991B1B",
    fontWeight: "900",
    fontSize: 12,
  },
});
