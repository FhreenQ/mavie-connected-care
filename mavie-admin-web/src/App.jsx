import { Routes, Route } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import PatientDetails from "./pages/PatientDetails";
import AddPatient from "./pages/AddPatient";
import Medications from "./pages/Medications";
import Schedules from "./pages/Schedules";
import EmergencyAlerts from "./pages/EmergencyAlerts";

function App() {
  return (
    <div className="admin-layout">
      <Sidebar />

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/patients/add" element={<AddPatient />} />
          <Route path="/patients/:id" element={<PatientDetails />} />
          <Route path="/medications" element={<Medications />} />
          <Route path="/schedules" element={<Schedules />} />
          <Route path="/emergency-alerts" element={<EmergencyAlerts />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;