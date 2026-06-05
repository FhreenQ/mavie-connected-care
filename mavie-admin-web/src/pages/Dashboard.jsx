import { useEffect, useState } from "react";
import { getAdminDashboard } from "../services/api";

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const data = await getAdminDashboard();
        setStats(data);
      } catch (err) {
        setError(err.message || "Failed to load dashboard");
      }
    }

    loadDashboard();
  }, []);

  if (error) {
    return (
      <div>
        <h1>Dashboard</h1>
        <p style={styles.error}>Error: {error}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div>
        <h1>Dashboard</h1>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  const cards = [
    { label: "Total Users", value: stats.users },
    { label: "Patients", value: stats.patients },
    { label: "Caregivers / Nurses", value: stats.caregivers },
    { label: "Medications", value: stats.medications },
    { label: "Active Schedules", value: stats.activeSchedules },
    { label: "Emergency Events", value: stats.emergencyEvents },
    { label: "Missed Medication Logs", value: stats.missedLogs },
  ];

  return (
    <div>
      <h1 style={styles.title}>Dashboard</h1>
      <p style={styles.subtitle}>System overview from the MaVie backend database.</p>

      <div style={styles.grid}>
        {cards.map((card) => (
          <div key={card.label} style={styles.card}>
            <p style={styles.label}>{card.label}</p>
            <h2 style={styles.value}>{card.value ?? 0}</h2>
          </div>
        ))}
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
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "18px",
  },
  card: {
    background: "white",
    padding: "22px",
    borderRadius: "16px",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
  },
  label: {
    margin: "0 0 10px",
    color: "#64748b",
    fontWeight: "600",
  },
  value: {
    margin: 0,
    fontSize: "34px",
  },
  error: {
    color: "#dc2626",
  },
};

export default Dashboard;