import { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { usePatients } from "../context/PatientContext";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = usePatients();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(
        "Missing Information",
        "Please enter your email and password."
      );
      return;
    }

    try {
      setLoading(true);

      await login(email.trim(), password);

      router.replace("/nurse-dashboard");
    } catch (error) {
      Alert.alert(
        "Login Failed",
        error instanceof Error ? error.message : "Unable to login."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.loginBox}>
        <Text style={styles.logo}>Ma Vie</Text>
        <Text style={styles.subtitle}>Nurse Care Dashboard</Text>

        <TextInput
          style={styles.input}
          placeholder="Nurse email"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#888"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Login</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.demoText}>
          Login using your registered nurse or caregiver account.
        </Text>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },
  loginBox: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  logo: {
    fontSize: 44,
    fontWeight: "bold",
    color: "#2E6F9E",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    color: "#555",
    textAlign: "center",
    marginBottom: 30,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 15,
    marginBottom: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  primaryButton: {
    backgroundColor: "#2E6F9E",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "bold",
  },
  demoText: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: 13,
    marginTop: 16,
  },
});