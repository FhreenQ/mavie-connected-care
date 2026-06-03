import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Hospital,
  MapPin,
  Pill,
} from "lucide-react";
import "./App.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const DEV_EMAIL = import.meta.env.VITE_DEV_EMAIL;
const DEV_PASSWORD = import.meta.env.VITE_DEV_PASSWORD;

export default function App() {
  const [token, setToken] = useState("");
  const [events, setEvents] = useState([]);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  async function apiRequest(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "Request failed");
    }

    return data;
  }

  async function loginHospital() {
    setError("");

    if (!API_BASE_URL || !DEV_EMAIL || !DEV_PASSWORD) {
      setError("Missing VITE_API_BASE_URL, VITE_DEV_EMAIL, or VITE_DEV_PASSWORD.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: DEV_EMAIL,
          password: DEV_PASSWORD,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Hospital login failed");
      }

      setToken(data.token);
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadEvents(authToken = token) {
    if (!authToken && !token) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/hospital/emergency-events`, {
        headers: {
          Authorization: `Bearer ${authToken || token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load emergency events");
      }

      setEvents(data.events || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadMedicationHistory(patientId, event) {
    setError("");

    try {
      const data = await apiRequest(`/hospital/patients/${patientId}/medication-history`);
      setSelectedHistory(data);
      setSelectedEvent(event);
    } catch (err) {
      setError(err.message);
    }
  }

  async function respondToEvent(event, responseStatus) {
    setActionLoading(true);
    setError("");

    try {
      await apiRequest(`/hospital/emergency-events/${event.emergency_event_id}/respond`, {
        method: "POST",
        body: JSON.stringify({ responseStatus }),
      });

      await loadEvents();

      if (responseStatus === "Accepted") {
        await loadMedicationHistory(event.patient_user_id, event);
      }

      if (responseStatus === "Rejected") {
        setSelectedHistory(null);
        setSelectedEvent(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  useEffect(() => {
    loginHospital();
  }, []);

  useEffect(() => {
    if (!token) return;

    loadEvents(token);

    const interval = setInterval(() => {
      loadEvents(token);
    }, 5000);

    return () => clearInterval(interval);
  }, [token]);

  const activeEvents = events.filter(
    (event) => event.status !== "Rejected" && event.status !== "Resolved"
  );

  return (
    <main className="app">
      <section className="header">
        <div>
          <div className="title-row">
            <Hospital size={34} />
            <h1>MaVie Hospital Emergency Desk</h1>
          </div>
          <p>
            Simulated hospital responder dashboard for emergency requests and
            patient medication history review.
          </p>
        </div>

        <button className="refresh-btn" onClick={() => loadEvents()} disabled={loading}>
          <RefreshCw size={18} />
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </section>

      {error && (
        <div className="error-box">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      <section className="layout">
        <div className="events-panel">
          <h2>Incoming Emergency Requests</h2>

          {activeEvents.length === 0 ? (
            <div className="empty-card">
              <p>No emergency requests yet.</p>
              <span>Trigger an emergency from the patient app or PowerShell test.</span>
            </div>
          ) : (
            activeEvents.map((event) => (
              <article key={event.emergency_event_id} className="event-card">
                <div className="event-top">
                  <div>
                    <h3>{event.patient_name}</h3>
                    <p>{event.patient_email}</p>
                  </div>

                  <span className={`status ${event.status.toLowerCase()}`}>
                    {event.status}
                  </span>
                </div>

                <div className="event-info">
                  <p>
                    <MapPin size={16} />
                    {event.location_text || "No location text provided"}
                  </p>
                  <p>
                    <AlertTriangle size={16} />
                    {event.details || "No emergency details provided"}
                  </p>
                </div>

                <p className="time">
                  Created: {new Date(event.created_at).toLocaleString()}
                </p>

                <div className="actions">
                  <button
                    className="accept"
                    disabled={actionLoading}
                    onClick={() => respondToEvent(event, "Accepted")}
                  >
                    <CheckCircle size={18} />
                    Accept
                  </button>

                  <button
                    className="reject"
                    disabled={actionLoading}
                    onClick={() => respondToEvent(event, "Rejected")}
                  >
                    <XCircle size={18} />
                    Reject
                  </button>

                  <button
                    className="history"
                    onClick={() =>
                      loadMedicationHistory(event.patient_user_id, event)
                    }
                  >
                    <Pill size={18} />
                    View History
                  </button>
                </div>
              </article>
            ))
          )}
        </div>

        <div className="history-panel">
          <h2>Patient Medication History</h2>

          {!selectedHistory ? (
            <div className="empty-card">
              <p>No patient selected.</p>
              <span>Accept an emergency request to view medication history.</span>
            </div>
          ) : (
            <>
              <div className="patient-summary">
                <h3>{selectedHistory.patient.username}</h3>
                <p>{selectedHistory.patient.email}</p>
                <p>
                  <strong>Blood Type:</strong>{" "}
                  {selectedHistory.patient.blood_type || "Not provided"}
                </p>
                <p>
                  <strong>Allergies:</strong>{" "}
                  {selectedHistory.patient.allergies || "Not provided"}
                </p>
                <p>
                  <strong>Conditions:</strong>{" "}
                  {selectedHistory.patient.conditions || "Not provided"}
                </p>
                <p>
                  <strong>Emergency Notes:</strong>{" "}
                  {selectedHistory.patient.emergency_notes || "Not provided"}
                </p>
              </div>

              <div className="history-list">
                {selectedHistory.history.length === 0 ? (
                  <div className="empty-card">
                    <p>No medication history found.</p>
                  </div>
                ) : (
                  selectedHistory.history.map((item, index) => (
                    <div className="med-card" key={`${item.schedule_id}-${item.log_id || index}`}>
                      <div>
                        <h4>{item.brand_name || item.generic_name}</h4>
                        <p>
                          {item.generic_name} · {item.strength || "No strength"}
                        </p>
                      </div>

                      <div className="med-details">
                        <span>Dosage: {item.dosage}</span>
                        <span>Instruction: {item.instructions || "-"}</span>
                        <span>Status: {item.log_status || "Scheduled"}</span>
                        <span>
                          Scheduled:{" "}
                          {item.scheduled_time
                            ? new Date(item.scheduled_time).toLocaleString()
                            : new Date(item.next_dose_time).toLocaleString()}
                        </span>
                        {item.taken_at && (
                          <span>
                            Taken: {new Date(item.taken_at).toLocaleString()}
                          </span>
                        )}
                        {item.note && <span>Note: {item.note}</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}