import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { AuthProvider } from "@/context/AuthContext";
import { useColorScheme } from "@/hooks/use-color-scheme";

import { useEffect } from "react";
import { setupMedicationNotifications } from "../services/medicationReminderNotifications";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    setupMedicationNotifications();
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="medication-status" options={{ headerShown: false }} />
          <Stack.Screen name="edit-health-profile" options={{ headerShown: false }} />
          <Stack.Screen name="emergency-contacts" options={{ headerShown: false }} />
          <Stack.Screen name="add-medicine" options={{ headerShown: false }} />
          <Stack.Screen name="ai-medicine-scanner" options={{ headerShown: false }} />
          <Stack.Screen name="manual-medicine-input" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: "modal", title: "Modal" }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}