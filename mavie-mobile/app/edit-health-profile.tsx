// app/edit-health-profile.tsx

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
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "@/context/AuthContext";
import {
  createHealthProfile,
  getHealthProfile,
  updateHealthProfile,
} from "@/services/api";

export default function EditHealthProfileScreen() {
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [hasExistingProfile, setHasExistingProfile] = useState(false);

  const [dateOfBirth, setDateOfBirth] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [allergies, setAllergies] = useState("");
  const [conditions, setConditions] = useState("");
  const [emergencyNotes, setEmergencyNotes] = useState("");
  const [homeAddress, setHomeAddress] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const data = await getHealthProfile(token);
      const profile = data.healthProfile;

      if (profile) {
        setHasExistingProfile(true);

        setDateOfBirth(profile.date_of_birth || "");
        setBloodType(profile.blood_type || "");
        setAllergies(profile.allergies || "");
        setConditions(profile.conditions || "");
        setEmergencyNotes(profile.emergency_notes || "");
        setHomeAddress(profile.home_address || "");
      }
    } catch (error) {
      setHasExistingProfile(false);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!token) {
      Alert.alert("Login required", "Please log in again.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        dateOfBirth,
        bloodType,
        allergies,
        conditions,
        emergencyNotes,
        homeAddress,
      };

      if (hasExistingProfile) {
        await updateHealthProfile(token, payload);
      } else {
        await createHealthProfile(token, payload);
      }

      Alert.alert("Saved", "Your health profile has been updated.", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      Alert.alert("Save failed", error.message || "Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#0F766E" />
        <Text style={styles.loadingText}>Loading your profile...</Text>
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

            <Text style={styles.title}>Edit Personal Information</Text>
            <Text style={styles.subtitle}>
              Add your medical details so MaVie can show the correct information for your account.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Date of Birth</Text>
            <TextInput
              value={dateOfBirth}
              onChangeText={setDateOfBirth}
              placeholder="Example: 2001-05-20"
              style={styles.input}
            />

            <Text style={styles.label}>Blood Type</Text>
            <TextInput
              value={bloodType}
              onChangeText={setBloodType}
              placeholder="Example: O+"
              style={styles.input}
            />

            <Text style={styles.label}>Allergies</Text>
            <TextInput
              value={allergies}
              onChangeText={setAllergies}
              placeholder="Example: Penicillin, peanuts"
              style={styles.input}
            />

            <Text style={styles.label}>Medical Conditions</Text>
            <TextInput
              value={conditions}
              onChangeText={setConditions}
              placeholder="Example: Diabetes, hypertension"
              style={[styles.input, styles.textArea]}
              multiline
            />

            <Text style={styles.label}>Home Address</Text>
            <TextInput
              value={homeAddress}
              onChangeText={setHomeAddress}
              placeholder="Example: Seoul, South Korea"
              style={[styles.input, styles.textArea]}
              multiline
            />

            <Text style={styles.label}>Emergency Notes</Text>
            <TextInput
              value={emergencyNotes}
              onChangeText={setEmergencyNotes}
              placeholder="Example: Please contact my caregiver immediately."
              style={[styles.input, styles.textArea]}
              multiline
            />

            <Pressable
              style={[styles.saveButton, saving && styles.disabledButton]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Save Information</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F4F7FB",
  },
  container: {
    flex: 1,
    padding: 20,
  },
  center: {
    flex: 1,
    backgroundColor: "#F4F7FB",
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
    color: "#0F766E",
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
    marginBottom: 30,
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
  textArea: {
    minHeight: 86,
    textAlignVertical: "top",
  },
  saveButton: {
    marginTop: 8,
    backgroundColor: "#0F766E",
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
});