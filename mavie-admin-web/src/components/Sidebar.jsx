import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Pill,
  CalendarClock,
  Siren,
  UserCog,
  ClipboardList,
  Settings,
  HeartPulse,
} from "lucide-react";

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">
          <HeartPulse size={25} />
        </div>

        <div>
          <h2>Ma Vie</h2>
          <p>Admin Portal</p>
        </div>
      </div>

      <p className="nav-section-title">MONITORING</p>

      <nav className="nav-links">
        <NavLink to="/" end>
          <LayoutDashboard size={20} />
          Dashboard
        </NavLink>

        <NavLink to="/patients">
          <Users size={20} />
          Patients
        </NavLink>

        <NavLink to="/medications">
          <Pill size={20} />
          Medications
        </NavLink>

        <NavLink to="/schedules">
          <CalendarClock size={20} />
          Schedules
        </NavLink>

        <NavLink to="/emergency-alerts">
          <Siren size={20} />
          Emergency Alerts
          <span className="alert-count">1</span>
        </NavLink>
      </nav>

      <p className="nav-section-title second-section">MANAGEMENT</p>

      <nav className="nav-links">
        <div className="disabled-nav">
          <UserCog size={20} />
          Care Team Users
        </div>

        <div className="disabled-nav">
          <ClipboardList size={20} />
          Activity Logs
        </div>

        <div className="disabled-nav">
          <Settings size={20} />
          Settings
        </div>
      </nav>

      <div className="sidebar-footer">
        <p>System status</p>
        <div className="system-online">
          <span></span>
          All systems active
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;