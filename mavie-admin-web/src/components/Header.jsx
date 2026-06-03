import { Bell, Search } from "lucide-react";

function Header() {
  return (
    <header className="top-header">
      <div className="search-box">
        <Search size={18} />
        <input type="text" placeholder="Search patients, medication, alerts..." />
      </div>

      <div className="header-actions">
        <button className="notification-btn">
          <Bell size={20} />
          <span className="notification-dot"></span>
        </button>

        <div className="admin-profile">
          <div className="admin-avatar">AD</div>
          <div>
            <p className="admin-name">Admin</p>
            <p className="admin-role">Ma Vie Manager</p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;