import { Link } from "react-router-dom";

function Sidebar() {
  return (
    <aside className="sidebar">
      <h2 className="logo">Ma Vie</h2>

      <nav className="nav-links">
        <Link to="/">Dashboard</Link>
        <Link to="/patients">Patients</Link>
        <Link to="/medications">Medications</Link>
        <Link to="/schedules">Schedules</Link>
        <Link to="/emergency-alerts">Emergency Alerts</Link>
      </nav>
    </aside>
  );
}

export default Sidebar;