import { Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import PatientDetails from "./pages/PatientDetails";
import EmergencyAlerts from "./pages/EmergencyAlerts";
import Login from "./pages/Login";
import { getToken, logout } from "./services/api";

function ProtectedLayout({ children }) {
  const navigate = useNavigate();
  const token = getToken();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div style={styles.app}>
      <aside style={styles.sidebar}>
        <h2 style={styles.logo}>MaVie Admin</h2>

        <nav style={styles.nav}>
          <Link style={styles.link} to="/">Dashboard</Link>
          <Link style={styles.link} to="/patients">Patients</Link>
          <Link style={styles.link} to="/emergency-alerts">Emergency Alerts</Link>
        </nav>

        <button style={styles.logoutButton} onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <main style={styles.main}>
        {children}
      </main>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <ProtectedLayout>
            <Dashboard />
          </ProtectedLayout>
        }
      />

      <Route
        path="/patients"
        element={
          <ProtectedLayout>
            <Patients />
          </ProtectedLayout>
        }
      />

      <Route
        path="/patients/:patientId"
        element={
          <ProtectedLayout>
            <PatientDetails />
          </ProtectedLayout>
        }
      />

      <Route
        path="/emergency-alerts"
        element={
          <ProtectedLayout>
            <EmergencyAlerts />
          </ProtectedLayout>
        }
      />
    </Routes>
  );
}

const styles = {
  app: {
    minHeight: "100vh",
    display: "flex",
    background: "#f5f7fb",
  },
  sidebar: {
    width: "250px",
    background: "#0f172a",
    color: "white",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
  },
  logo: {
    margin: "0 0 32px",
    fontSize: "22px",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  link: {
    color: "white",
    textDecoration: "none",
    padding: "10px 12px",
    borderRadius: "10px",
    background: "rgba(255, 255, 255, 0.08)",
  },
  logoutButton: {
    marginTop: "auto",
    padding: "10px 12px",
    borderRadius: "10px",
    border: "none",
    background: "#ef4444",
    color: "white",
    fontWeight: "700",
    cursor: "pointer",
  },
  main: {
    flex: 1,
    padding: "32px",
  },
};

export default App;