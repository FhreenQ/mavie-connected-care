import { Stack } from "expo-router";
import { PatientProvider } from "../context/PatientContext";

export default function RootLayout() {
  return (
    <PatientProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </PatientProvider>
  );
}