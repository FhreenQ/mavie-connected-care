import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getAdminPatientDetail } from "../services/api";

function PatientDetails() {
  const { patientId } = useParams();

  const [patient, setPatient] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPatient() {
      try {
        const data = await getAdminPatientDetail(patientId);
        setPatient(data.patient);
        setSchedules(data.schedules || []);
        setLogs(data.logs || []);
      } catch (err) {
        setError(err.message || "Failed to load patient details");
      }
    }

    loadPatient();
  }, [patientId]);

  if (error) {
    return (
      <div>
        <Link to="/patients" style={styles.backLink}>← Back to patients</Link>
        <h1>Patient Details</h1>
        <p style={styles.error}>Error: {error}</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div>
        <Link to="/patients" style={styles.backLink}>← Back to patients</Link>
        <h1>Patient Details</h1>
        <p>Loading patient details...</p>
      </div>
    );
  }

  return (
    <div>
      <Link to="/patients" style={styles.backLink}>← Back to patients</Link>

      <h1 style={styles.title}>{patient.username}</h1>
      <p style={styles.subtitle}>{patient.email}</p>

      <section style={styles.card}>
        <h2>Health Profile</h2>

        <div style={styles.infoGrid}>
          <Info label="Date of Birth" value={patient.date_of_birth} />
          <Info label="Blood Type" value={patient.blood_type} />
          <Info label="Allergies" value={patient.allergies} />
          <Info label="Conditions" value={patient.conditions} />
          <Info label="Emergency Notes" value={patient.emergency_notes} />
          <Info label="Home Address" value={patient.home_address} />
        </div>
      </section>

      <section style={styles.card}>
        <h2>Medication Schedules</h2>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Medication</th>
              <th style={styles.th}>Dosage</th>
              <th style={styles.th}>Frequency</th>
              <th style={styles.th}>Next Dose</th>
              <th style={styles.th}>Status</th>
            </tr>
          </thead>

          <tbody>
            {schedules.map((schedule) => (
              <tr key={schedule.schedule_id}>
                <td style={styles.td}>
                  {schedule.brand_name || schedule.generic_name || "-"}
                </td>
                <td style={styles.td}>{schedule.dosage || "-"}</td>
                <td style={styles.td}>
                  {schedule.frequency_hours
                    ? `Every ${schedule.frequency_hours} hours`
                    : "-"}
                </td>
                <td style={styles.td}>
                  {schedule.next_dose_time
                    ? new Date(schedule.next_dose_time).toLocaleString()
                    : "-"}
                </td>
                <td style={styles.td}>
                  {schedule.active ? "Active" : "Inactive"}
                </td>
              </tr>
            ))}

            {schedules.length === 0 && (
              <tr>
                <td style={styles.empty} colSpan="5">
                  No medication schedules found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section style={styles.card}>
        <h2>Recent Medication Logs</h2>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Medication</th>
              <th style={styles.th}>Scheduled Time</th>
              <th style={styles.th}>Taken At</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Note</th>
            </tr>
          </thead>

          <tbody>
            {logs.map((log) => (
              <tr key={log.log_id}>
                <td style={styles.td}>
                  {log.brand_name || log.generic_name || "-"}
                </td>
                <td style={styles.td}>
                  {log.scheduled_time
                    ? new Date(log.scheduled_time).toLocaleString()
                    : "-"}
                </td>
                <td style={styles.td}>
                  {log.taken_at
                    ? new Date(log.taken_at).toLocaleString()
                    : "-"}
                </td>
                <td style={styles.td}>{log.status || "-"}</td>
                <td style={styles.td}>{log.note || "-"}</td>
              </tr>
            ))}

            {logs.length === 0 && (
              <tr>
                <td style={styles.empty} colSpan="5">
                  No medication logs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p style={styles.infoLabel}>{label}</p>
      <p style={styles.infoValue}>{value || "-"}</p>
    </div>
  );
}

const styles = {
  backLink: {
    display: "inline-block",
    marginBottom: "18px",
    color: "#2563eb",
    fontWeight: "700",
    textDecoration: "none",
  },
  title: {
    margin: "0 0 8px",
  },
  subtitle: {
    margin: "0 0 24px",
    color: "#64748b",
  },
  card: {
    background: "white",
    padding: "22px",
    borderRadius: "16px",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
    marginBottom: "22px",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
  },
  infoLabel: {
    margin: "0 0 6px",
    color: "#64748b",
    fontWeight: "700",
  },
  infoValue: {
    margin: 0,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    padding: "12px",
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    color: "#334155",
  },
  td: {
    padding: "12px",
    borderBottom: "1px solid #e2e8f0",
  },
  empty: {
    padding: "20px",
    textAlign: "center",
    color: "#64748b",
  },
  error: {
    color: "#dc2626",
  },
};

export default PatientDetails;