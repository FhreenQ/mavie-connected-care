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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://10.121.159.39:5000";
const DEV_EMAIL = import.meta.env.VITE_DEV_EMAIL || "hospital@mavie.com";
const DEV_PASSWORD = import.meta.env.VITE_DEV_PASSWORD || "hospital123";

export default function App() {
  const [token, setToken] = useState("");
  const [events, setEvents] = useState([]);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
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
  setHistoryLoading(true);

  const finalPatientId = patientId || event?.patient_user_id || event?.user_id;

  if (!finalPatientId) {
    setError("Cannot load medication history because patient ID is missing.");
    setHistoryLoading(false);
    return;
  }

  try {
    const data = await apiRequest(
      `/hospital/patients/${finalPatientId}/medication-history`
    );

    setSelectedHistory({
      patient: data.patient || {},
      history: Array.isArray(data.history) ? data.history : [],
    });

    setSelectedEvent(event || null);
  } catch (err) {
    setError(err.message || "Failed to load patient medication history");
  } finally {
    setHistoryLoading(false);
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
        await loadMedicationHistory(event.patient_user_id || event.user_id, event);
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

  const closedStatuses = ["Rejected", "Resolved", "Cancelled", "Acknowledged"];

  const activeEvents = events.filter(
    (event) => !closedStatuses.includes(event.status)
  );

  return (
    <div className="app">
      <header className="header">
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
      </header>

      {error && (
        <div className="error-box">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      <main className="layout">
        <section className="events-panel">
          <h2>Incoming Emergency Requests</h2>

          {activeEvents.length === 0 ? (
            <div className="empty-card">
              <p>No emergency requests yet.</p>
              <span>Trigger an emergency from the patient app or PowerShell test.</span>
            </div>
          ) : (
            activeEvents.map((event) => (
              <div className="event-card" key={event.emergency_event_id}>
                <div className="event-top">
                  <div>
                    <h3>{event.patient_name || "Unknown Patient"}</h3>
                    <p>{event.patient_email || "-"}</p>
                  </div>

                  <span className={`status ${String(event.status || "").toLowerCase()}`}>
                    {event.status || "Triggered"}
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
                  <span className="time">
                    Created:{" "}
                    {event.created_at
                      ? new Date(event.created_at).toLocaleString()
                      : "-"}
                  </span>
                </div>

                <div className="actions">
                  <button
                    className="accept"
                    onClick={() => respondToEvent(event, "Accepted")}
                    disabled={actionLoading}
                  >
                    <CheckCircle size={17} />
                    Accept
                  </button>

                  <button
                    className="reject"
                    onClick={() => respondToEvent(event, "Rejected")}
                    disabled={actionLoading}
                  >
                    <XCircle size={17} />
                    Reject
                  </button>

                  <button
                    className="history"
                    onClick={() => loadMedicationHistory(event.patient_user_id, event)}
                    disabled={actionLoading || historyLoading}
                  >
                    <Pill size={17} />
                    {historyLoading ? "Loading..." : "View History"}
                  </button>
                </div>
              </div>
            ))
          )}
        </section>

        <section className="history-panel">
          <h2>Patient Medication History</h2>

          {historyLoading ? (
            <div className="empty-card">
              <p>Loading patient medication history.</p>
            </div>
          ) : !selectedHistory ? (
	    <div className="empty-card">
              <p>No patient selected.</p>
	      <span>Accept an emergency request or click View History </span>
            </div>
          ) : (


            <>
              <div className="patient-summary">
                <h3>{selectedHistory.patient?.username || "Unknown Patient"}</h3>
		<p>{selectedHistory.patient?.email || "-"}</p>
                <p>
                  <strong>Event:</strong>{" "}
                  {selectedEvent?.location_text || "No location text"}
                </p>
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
                {(selectedHistory.history || []).length === 0 ? (
                  <div className="empty-card">
                    <p>No medication history found.</p>
                  </div>
                ) : (
                 (selectedHistory.history || []).map((item, index) => (
                    <div className="med-card" key={`${item.schedule_id}-${item.log_id || index}`}>
                      <h4>{item.brand_name || item.generic_name || "Medication"}</h4>
                      <p>
                        {item.generic_name || "-"} · {item.strength || "No strength"}
                      </p>

                      <div className="med-details">
                        <span>
                          <strong>Dosage:</strong> {item.dosage || "-"}
                        </span>
                        <span>
                          <strong>Instruction:</strong> {item.instructions || "-"}
                        </span>
                        <span>
                          <strong>Status:</strong> {item.log_status || "Scheduled"}
                        </span>
                        <span>
                          <strong>Scheduled:</strong>{" "}
                          {item.scheduled_time
                            ? new Date(item.scheduled_time).toLocaleString()
                            : item.next_dose_time
                              ? new Date(item.next_dose_time).toLocaleString()
                              : "-"}
                        </span>
                        {item.taken_at && (
                          <span>
                            <strong>Taken:</strong>{" "}
                            {new Date(item.taken_at).toLocaleString()}
                          </span>
                        )}
                        {item.note && (
                          <span>
                            <strong>Note:</strong> {item.note}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}