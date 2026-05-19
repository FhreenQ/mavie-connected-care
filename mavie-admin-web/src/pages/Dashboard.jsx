function Dashboard() {
  return (
    <div className="page">
      <h1>Dashboard</h1>
      <p>Welcome to the Ma Vie admin control panel.</p>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Patients</h3>
          <p>0</p>
        </div>

        <div className="stat-card">
          <h3>Today’s Schedules</h3>
          <p>0</p>
        </div>

        <div className="stat-card">
          <h3>Missed Medications</h3>
          <p>0</p>
        </div>

        <div className="stat-card">
          <h3>Emergency Alerts</h3>
          <p>0</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;