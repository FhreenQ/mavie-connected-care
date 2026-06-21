import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";
import { Socket } from "socket.io-client";

import EmergencyAlertModal from "../components/nurse/EmergencyAlertModal";
import { NurseEmergencyEvent, hasNurseSession, updateNurseEmergencyEvent } from "../services/api";
import { connectEmergencyRealtime } from "../services/emergencyRealtime";
import { usePatients } from "./PatientContext";

type EmergencyAlertContextValue = {
  emergencyRevision: number;
};

const EmergencyAlertContext = createContext<EmergencyAlertContextValue>({
  emergencyRevision: 0,
});

function getEventId(event: NurseEmergencyEvent) {
  return String(event.emergency_event_id);
}

export function EmergencyAlertProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = usePatients();
  const socketRef = useRef<Socket | null>(null);
  const [pendingAlerts, setPendingAlerts] = useState<NurseEmergencyEvent[]>([]);
  const [acknowledging, setAcknowledging] = useState(false);
  const [emergencyRevision, setEmergencyRevision] = useState(0);

  const currentAlert = pendingAlerts[0] || null;

  const removePendingAlert = useCallback((eventId: string) => {
    setPendingAlerts((current) => current.filter((event) => getEventId(event) !== String(eventId)));
  }, []);

  useEffect(() => {
    let active = true;
    let socket: Socket | null = null;

    if (!isAuthenticated) {
      setPendingAlerts([]);
      socketRef.current?.disconnect();
      socketRef.current = null;
      return undefined;
    }

    hasNurseSession()
      .then((token) => {
        if (!active || !token) return;

        socket = connectEmergencyRealtime(token);
        socketRef.current = socket;

        socket.on("emergency:new", (event: NurseEmergencyEvent) => {
          setEmergencyRevision((current) => current + 1);
          if (event.status !== "Triggered") return;

          setPendingAlerts((current) =>
            current.some((pending) => getEventId(pending) === getEventId(event))
              ? current
              : [...current, event]
          );
        });

        socket.on("emergency:updated", (event: NurseEmergencyEvent) => {
          setEmergencyRevision((current) => current + 1);
          if (event.status !== "Triggered") {
            removePendingAlert(getEventId(event));
          }
        });
      })
      .catch(() => undefined);

    return () => {
      active = false;
      socket?.disconnect();
      if (socketRef.current === socket) socketRef.current = null;
    };
  }, [isAuthenticated, removePendingAlert]);

  const openQueue = useCallback(() => {
    if (currentAlert) removePendingAlert(getEventId(currentAlert));
    router.replace("/nurse-dashboard");
  }, [currentAlert, removePendingAlert]);

  const dismiss = useCallback(() => {
    if (currentAlert) removePendingAlert(getEventId(currentAlert));
  }, [currentAlert, removePendingAlert]);

  const acknowledge = useCallback(async () => {
    if (!currentAlert) return;

    try {
      setAcknowledging(true);
      await updateNurseEmergencyEvent(getEventId(currentAlert), "acknowledge");
      removePendingAlert(getEventId(currentAlert));
      setEmergencyRevision((current) => current + 1);
      router.replace("/nurse-dashboard");
    } catch (error) {
      Alert.alert("Emergency update failed", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setAcknowledging(false);
    }
  }, [currentAlert, removePendingAlert]);

  const value = useMemo(() => ({ emergencyRevision }), [emergencyRevision]);

  return (
    <EmergencyAlertContext.Provider value={value}>
      {children}
      <EmergencyAlertModal
        event={currentAlert}
        acknowledging={acknowledging}
        onOpenQueue={openQueue}
        onAcknowledge={acknowledge}
        onDismiss={dismiss}
      />
    </EmergencyAlertContext.Provider>
  );
}

export function useEmergencyAlerts() {
  return useContext(EmergencyAlertContext);
}
