import { useEffect, useState } from "react";
import { getAdminEmergencyEvents } from "../services/api";

function EmergencyAlerts() {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadEvents() {
      try {
        const data = await getAdminEmergencyEvents();
        setEvents(data.events || []);
      } catch (err) {
        setError(err.message || "Failed to load emergency alerts");
      }
    }

    loadEvents();
  }, []);

  return (
    <div>
      <h1 style={styles.title}>Emergency Alerts</h1>
      <p style={styles.subtitle}>
        View recent emergency events triggered by patients.
      </p>

      {error && <p style={styles.error}>Error: {error}</p>}

      <div style={styles.list}>
        {events.map((event) => (
          <div key={event.emergency_event_id} style={styles.card}>
            <div style={styles.row}>
              <div>
                <h3 style={styles.patientName}>{event.patient_name || "Unknown Patient"}</h3>
                <p style={styles.email}>{event.patient_email || "-"}</p>
              </div>

              <span style={styles.status}>
                {event.status || "Open"}
              </span>
            </div>

            <p><strong>Location:</strong> {event.location_text || "-"}</p>
            <p><strong>Details:</strong> {event.details || "-"}</p>
            <p style={styles.time}>
              Triggered at:{" "}
              {event.created_at
                ? new Date(event.created_at).toLocaleString()
                : "-"}
            </p>
          </div>
        ))}

        {events.length === 0 && !error && (
          <div style={styles.empty}>
            No emergency alerts found.
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  title: {
    margin: "0 0 8px",
  },
  subtitle: {
    margin: "0 0 24px",
    color: "#64748b",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  card: {
    background: "white",
    padding: "20px",
    borderRadius: "16px",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "center",
  },
  patientName: {
    margin: "0 0 4px",
  },
  email: {
    margin: 0,
    color: "#64748b",
  },
  status: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "6px 10px",
    borderRadius: "999px",
    fontWeight: "700",
    fontSize: "13px",
  },
  time: {
    color: "#64748b",
    fontSize: "14px",
  },
  empty: {
    background: "white",
    padding: "24px",
    borderRadius: "16px",
    color: "#64748b",
    textAlign: "center",
  },
  error: {
    color: "#dc2626",
  },
};

export default EmergencyAlerts;