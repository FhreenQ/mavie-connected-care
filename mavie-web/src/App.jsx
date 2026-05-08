import { useMemo, useState } from "react";
import "./App.css";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const [healthProfile, setHealthProfile] = useState({
    bloodType: "A+",
    allergies: "Penicillin",
    conditions: "Asthma",
    emergencyNote: "Uses inhaler during breathing difficulty",
  });

  const [emergencyContacts, setEmergencyContacts] = useState([
    { id: 1, name: "Ahmad Fahrin", relation: "Brother", phone: "+82-10-1111-2222" },
    { id: 2, name: "Kak Siti", relation: "Caregiver", phone: "+82-10-3333-4444" },
  ]);

  const [newContact, setNewContact] = useState({ name: "", relation: "", phone: "" });

  const [medications, setMedications] = useState([
    {
      id: 1,
      name: "Paracetamol",
      dosage: "500 mg",
      time: "08:00",
      status: "Pending",
      takenAt: null,
      missedCount: 0,
    },
    {
      id: 2,
      name: "Vitamin D",
      dosage: "1 tablet",
      time: "20:00",
      status: "Taken",
      takenAt: "20:05",
      missedCount: 0,
    },
  ]);

  const [newMedication, setNewMedication] = useState({
    name: "",
    dosage: "",
    time: "",
  });

  const adherenceRate = useMemo(() => {
    if (medications.length === 0) return 0;
    const taken = medications.filter((m) => m.status === "Taken").length;
    return Math.round((taken / medications.length) * 100);
  }, [medications]);

  const pendingCount = medications.filter((m) => m.status === "Pending").length;
  const missedCount = medications.filter((m) => m.status === "Missed").length;

  function addMedication(e) {
    e.preventDefault();
    if (!newMedication.name || !newMedication.dosage || !newMedication.time) return;

    const item = {
      id: Date.now(),
      name: newMedication.name,
      dosage: newMedication.dosage,
      time: newMedication.time,
      status: "Pending",
      takenAt: null,
      missedCount: 0,
    };

    setMedications((prev) => [...prev, item]);
    setNewMedication({ name: "", dosage: "", time: "" });
  }

  function markTaken(id) {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMedications((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: "Taken", takenAt: timeString } : m))
    );
  }

  function markMissed(id) {
    setMedications((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, status: "Missed", missedCount: m.missedCount + 1 } : m
      )
    );
  }

  function resetMedication(id) {
    setMedications((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: "Pending", takenAt: null } : m))
    );
  }

  function addContact(e) {
    e.preventDefault();
    if (!newContact.name || !newContact.relation || !newContact.phone) return;

    setEmergencyContacts((prev) => [...prev, { id: Date.now(), ...newContact }]);
    setNewContact({ name: "", relation: "", phone: "" });
  }

  function triggerEmergency() {
    const names = emergencyContacts.map((c) => `${c.name} (${c.phone})`).join("\n");
    alert(`Emergency alert sent.\n\nNotified contacts:\n${names}\n\nHealth note: ${healthProfile.emergencyNote}`);
  }

  return (
    <div className="app">
      <h1>Ma Vie</h1>
      <p className="subtitle">Connected Care Platform for Medication Monitoring and Emergency Support</p>

      <div className="tabs">
        <button onClick={() => setActiveTab("dashboard")}>Dashboard</button>
        <button onClick={() => setActiveTab("medications")}>Medications</button>
        <button onClick={() => setActiveTab("caregiver")}>Caregiver View</button>
        <button onClick={() => setActiveTab("emergency")}>Emergency</button>
        <button onClick={() => setActiveTab("profile")}>Health Profile</button>
      </div>

      {activeTab === "dashboard" && (
        <div>
          <div className="card-grid">
            <div className="card"><h3>Adherence Rate</h3><p>{adherenceRate}%</p></div>
            <div className="card"><h3>Pending</h3><p>{pendingCount}</p></div>
            <div className="card"><h3>Missed</h3><p>{missedCount}</p></div>
            <div className="card"><h3>Contacts</h3><p>{emergencyContacts.length}</p></div>
          </div>

          <div className="section">
            <h2>Today's Medication Schedule</h2>
            {medications.map((med) => (
              <div key={med.id} className="item">
                <div>
                  <strong>{med.name}</strong> - {med.dosage} - {med.time}<br />
                  Status: {med.status} | Taken at: {med.takenAt || "-"} | Missed count: {med.missedCount}
                </div>
                <div className="actions">
                  <button onClick={() => markTaken(med.id)}>Taken</button>
                  <button onClick={() => markMissed(med.id)}>Missed</button>
                  <button onClick={() => resetMedication(med.id)}>Reset</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "medications" && (
        <div className="section">
          <h2>Add Medication</h2>
          <form onSubmit={addMedication} className="form">
            <input
              placeholder="Medication Name"
              value={newMedication.name}
              onChange={(e) => setNewMedication({ ...newMedication, name: e.target.value })}
            />
            <input
              placeholder="Dosage"
              value={newMedication.dosage}
              onChange={(e) => setNewMedication({ ...newMedication, dosage: e.target.value })}
            />
            <input
              type="time"
              value={newMedication.time}
              onChange={(e) => setNewMedication({ ...newMedication, time: e.target.value })}
            />
            <button type="submit">Save Medication</button>
          </form>

          <h2>Medication List</h2>
          {medications.map((med) => (
            <div key={med.id} className="item">
              <div>
                <strong>{med.name}</strong> - {med.dosage} - {med.time}<br />
                Status: {med.status}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "caregiver" && (
        <div className="section">
          <h2>Caregiver Monitoring</h2>
          <table>
            <thead>
              <tr>
                <th>Medication</th>
                <th>Dosage</th>
                <th>Time</th>
                <th>Status</th>
                <th>Taken At</th>
                <th>Missed Count</th>
              </tr>
            </thead>
            <tbody>
              {medications.map((med) => (
                <tr key={med.id}>
                  <td>{med.name}</td>
                  <td>{med.dosage}</td>
                  <td>{med.time}</td>
                  <td>{med.status}</td>
                  <td>{med.takenAt || "-"}</td>
                  <td>{med.missedCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "emergency" && (
        <div className="section">
          <h2>Emergency Contacts</h2>
          {emergencyContacts.map((contact) => (
            <div key={contact.id} className="item">
              <div>
                <strong>{contact.name}</strong><br />
                {contact.relation}<br />
                {contact.phone}
              </div>
            </div>
          ))}

          <button className="danger" onClick={triggerEmergency}>Send Emergency Alert</button>

          <h2>Add Emergency Contact</h2>
          <form onSubmit={addContact} className="form">
            <input
              placeholder="Name"
              value={newContact.name}
              onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
            />
            <input
              placeholder="Relation"
              value={newContact.relation}
              onChange={(e) => setNewContact({ ...newContact, relation: e.target.value })}
            />
            <input
              placeholder="Phone"
              value={newContact.phone}
              onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
            />
            <button type="submit">Add Contact</button>
          </form>
        </div>
      )}

      {activeTab === "profile" && (
        <div className="section">
          <h2>Health Profile</h2>
          <div className="form">
            <input
              placeholder="Blood Type"
              value={healthProfile.bloodType}
              onChange={(e) => setHealthProfile({ ...healthProfile, bloodType: e.target.value })}
            />
            <input
              placeholder="Allergies"
              value={healthProfile.allergies}
              onChange={(e) => setHealthProfile({ ...healthProfile, allergies: e.target.value })}
            />
            <input
              placeholder="Conditions"
              value={healthProfile.conditions}
              onChange={(e) => setHealthProfile({ ...healthProfile, conditions: e.target.value })}
            />
            <textarea
              placeholder="Emergency Note"
              value={healthProfile.emergencyNote}
              onChange={(e) => setHealthProfile({ ...healthProfile, emergencyNote: e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
