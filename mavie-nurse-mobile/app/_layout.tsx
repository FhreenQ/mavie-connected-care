import { useEffect } from "react";
import { Stack, usePathname, useRouter } from "expo-router";
import { EmergencyAlertProvider } from "../context/EmergencyAlertContext";
import { PatientProvider, usePatients } from "../context/PatientContext";

function NurseRouteGuard({ children }: { children: React.ReactNode }) {
  const { initializing, isAuthenticated } = usePatients();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (initializing) return;

    const onLoginScreen = pathname === "/" || pathname === "/index";
    if (!isAuthenticated && !onLoginScreen) {
      router.replace("/");
    }

    if (isAuthenticated && onLoginScreen) {
      router.replace("/nurse-dashboard");
    }
  }, [initializing, isAuthenticated, pathname, router]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <PatientProvider>
      <EmergencyAlertProvider>
        <NurseRouteGuard>
          <Stack screenOptions={{ headerShown: false }} />
        </NurseRouteGuard>
      </EmergencyAlertProvider>
    </PatientProvider>
  );
}
