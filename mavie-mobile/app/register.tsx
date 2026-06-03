// app/register.tsx

import { Link, router } from "expo-router";
import React, { useState } from "react";
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

export default function RegisterScreen() {
  const { register } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"patient" | "caregiver">("patient");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);

  async function handleRegister() {
    if (!username.trim() || !email.trim() || !password) {
      Alert.alert("Missing information", "Please fill in all required fields.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Weak password", "Password should be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Password mismatch", "Please confirm your password correctly.");
      return;
    }

    try {
      setSubmitting(true);

      await register({
        username,
        email,
        password,
        role,
        timezone: "Asia/Seoul",
      });

      Alert.alert("Account created", "Please log in using your new account.", [
        {
          text: "Go to login",
          onPress: () => router.replace("/login"),
        },
      ]);
    } catch (error: any) {
      Alert.alert("Registration failed", error.message || "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.logo}>MaVie</Text>
            <Text style={styles.subtitle}>Create your connected care account</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Register</Text>
            <Text style={styles.description}>
              Create an account so your MaVie mobile app can save data through the backend.
            </Text>

            <Text style={styles.label}>Username</Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="Example: Asha"
              autoCapitalize="words"
              style={styles.input}
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="example@email.com"
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />

            <Text style={styles.label}>Role</Text>
            <View style={styles.roleRow}>
              <Pressable
                style={[
                  styles.roleButton,
                  role === "patient" && styles.roleButtonActive,
                ]}
                onPress={() => setRole("patient")}
              >
                <Text
                  style={[
                    styles.roleText,
                    role === "patient" && styles.roleTextActive,
                  ]}
                >
                  Patient
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.roleButton,
                  role === "caregiver" && styles.roleButtonActive,
                ]}
                onPress={() => setRole("caregiver")}
              >
                <Text
                  style={[
                    styles.roleText,
                    role === "caregiver" && styles.roleTextActive,
                  ]}
                >
                  Caregiver
                </Text>
              </Pressable>
            </View>

            <Text style={styles.label}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Create a password"
              secureTextEntry
              style={styles.input}
            />

            <Text style={styles.label}>Confirm password</Text>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm your password"
              secureTextEntry
              style={styles.input}
            />

            <Pressable
              style={[styles.button, submitting && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
              )}
            </Pressable>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Link href="/login" style={styles.footerLink}>
                Log in
              </Link>
            </View>
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
    padding: 22,
  },
  header: {
    marginTop: 24,
    marginBottom: 24,
  },
  logo: {
    fontSize: 44,
    fontWeight: "900",
    color: "#0F766E",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 15,
    color: "#115E59",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 22,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 5,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#111827",
  },
  description: {
    marginTop: 8,
    marginBottom: 22,
    fontSize: 14,
    lineHeight: 21,
    color: "#6B7280",
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
  roleRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 15,
  },
  roleButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    paddingVertical: 13,
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  roleButtonActive: {
    backgroundColor: "#DFF6F0",
    borderColor: "#0F766E",
  },
  roleText: {
    fontWeight: "800",
    color: "#6B7280",
  },
  roleTextActive: {
    color: "#0F766E",
  },
  button: {
    marginTop: 8,
    backgroundColor: "#0F766E",
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 16,
  },
  footer: {
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "center",
  },
  footerText: {
    color: "#6B7280",
  },
  footerLink: {
    color: "#0F766E",
    fontWeight: "900",
  },
});