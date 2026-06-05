import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminPatients } from "../services/api";

function Patients() {
  const [patients, setPatients] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPatients() {
      try {
        const data = await getAdminPatients();
        setPatients(data.patients || []);
      } catch (err) {
        setError(err.message || "Failed to load patients");
      }
    }

    loadPatients();
  }, []);

  return (
    <div>
      <h1 style={styles.title}>Patients</h1>
      <p style={styles.subtitle}>View registered patients and their care status.</p>

      {error && <p style={styles.error}>Error: {error}</p>}

      <div style={styles.tableCard}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Blood Type</th>
              <th style={styles.th}>Schedules</th>
              <th style={styles.th}>Emergency Contacts</th>
              <th style={styles.th}>Action</th>
            </tr>
          </thead>

          <tbody>
            {patients.map((patient) => (
              <tr key={patient.user_id}>
                <td style={styles.td}>{patient.username || "-"}</td>
                <td style={styles.td}>{patient.email || "-"}</td>
                <td style={styles.td}>{patient.blood_type || "-"}</td>
                <td style={styles.td}>{patient.schedule_count || 0}</td>
                <td style={styles.td}>{patient.emergency_contact_count || 0}</td>
                <td style={styles.td}>
                  <Link to={`/patients/${patient.user_id}`} style={styles.actionLink}>
                    View
                  </Link>
                </td>
              </tr>
            ))}

            {patients.length === 0 && !error && (
              <tr>
                <td style={styles.empty} colSpan="6">
                  No patients found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
  tableCard: {
    background: "white",
    borderRadius: "16px",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
    overflow: "hidden",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    padding: "14px",
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    color: "#334155",
  },
  td: {
    padding: "14px",
    borderBottom: "1px solid #e2e8f0",
  },
  actionLink: {
    color: "#2563eb",
    fontWeight: "700",
    textDecoration: "none",
  },
  empty: {
    padding: "24px",
    textAlign: "center",
    color: "#64748b",
  },
  error: {
    color: "#dc2626",
  },
};

export default Patients;