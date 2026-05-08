// import { useMemo, useState } from "react";
// import "./App.css";

// export default function App() {
//   const [activeTab, setActiveTab] = useState("dashboard");

//   const [healthProfile, setHealthProfile] = useState({
//     bloodType: "A+",
//     allergies: "Penicillin",
//     conditions: "Asthma",
//     emergencyNote: "Uses inhaler during breathing difficulty",
//   });

//   const [emergencyContacts, setEmergencyContacts] = useState([
//     { id: 1, name: "Ahmad Fahrin", relation: "Brother", phone: "+82-10-1111-2222" },
//     { id: 2, name: "Kak Siti", relation: "Caregiver", phone: "+82-10-3333-4444" },
//   ]);

//   const [newContact, setNewContact] = useState({ name: "", relation: "", phone: "" });

//   const [medications, setMedications] = useState([
//     {
//       id: 1,
//       name: "Paracetamol",
//       dosage: "500 mg",
//       time: "08:00",
//       status: "Pending",
//       takenAt: null,
//       missedCount: 0,
//     },
//     {
//       id: 2,
//       name: "Vitamin D",
//       dosage: "1 tablet",
//       time: "20:00",
//       status: "Taken",
//       takenAt: "20:05",
//       missedCount: 0,
//     },
//   ]);

//   const [newMedication, setNewMedication] = useState({
//     name: "",
//     dosage: "",
//     time: "",
//   });

//   const adherenceRate = useMemo(() => {
//     if (medications.length === 0) return 0;
//     const taken = medications.filter((m) => m.status === "Taken").length;
//     return Math.round((taken / medications.length) * 100);
//   }, [medications]);

//   const pendingCount = medications.filter((m) => m.status === "Pending").length;
//   const missedCount = medications.filter((m) => m.status === "Missed").length;

//   function addMedication(e) {
//     e.preventDefault();
//     if (!newMedication.name || !newMedication.dosage || !newMedication.time) return;

//     const item = {
//       id: Date.now(),
//       name: newMedication.name,
//       dosage: newMedication.dosage,
//       time: newMedication.time,
//       status: "Pending",
//       takenAt: null,
//       missedCount: 0,
//     };

//     setMedications((prev) => [...prev, item]);
//     setNewMedication({ name: "", dosage: "", time: "" });
//   }

//   function markTaken(id) {
//     const now = new Date();
//     const timeString = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
//     setMedications((prev) =>
//       prev.map((m) => (m.id === id ? { ...m, status: "Taken", takenAt: timeString } : m))
//     );
//   }

//   function markMissed(id) {
//     setMedications((prev) =>
//       prev.map((m) =>
//         m.id === id ? { ...m, status: "Missed", missedCount: m.missedCount + 1 } : m
//       )
//     );
//   }

//   function resetMedication(id) {
//     setMedications((prev) =>
//       prev.map((m) => (m.id === id ? { ...m, status: "Pending", takenAt: null } : m))
//     );
//   }

//   function addContact(e) {
//     e.preventDefault();
//     if (!newContact.name || !newContact.relation || !newContact.phone) return;

//     setEmergencyContacts((prev) => [...prev, { id: Date.now(), ...newContact }]);
//     setNewContact({ name: "", relation: "", phone: "" });
//   }

//   function triggerEmergency() {
//     const names = emergencyContacts.map((c) => `${c.name} (${c.phone})`).join("\n");
//     alert(`Emergency alert sent.\n\nNotified contacts:\n${names}\n\nHealth note: ${healthProfile.emergencyNote}`);
//   }

//   return (
//     <div className="app">
//       <h1>Ma Vie</h1>
//       <p className="subtitle">Connected Care Platform for Medication Monitoring and Emergency Support</p>

//       <div className="tabs">
//         <button onClick={() => setActiveTab("dashboard")}>Dashboard</button>
//         <button onClick={() => setActiveTab("medications")}>Medications</button>
//         <button onClick={() => setActiveTab("caregiver")}>Caregiver View</button>
//         <button onClick={() => setActiveTab("emergency")}>Emergency</button>
//         <button onClick={() => setActiveTab("profile")}>Health Profile</button>
//       </div>

//       {activeTab === "dashboard" && (
//         <div>
//           <div className="card-grid">
//             <div className="card"><h3>Adherence Rate</h3><p>{adherenceRate}%</p></div>
//             <div className="card"><h3>Pending</h3><p>{pendingCount}</p></div>
//             <div className="card"><h3>Missed</h3><p>{missedCount}</p></div>
//             <div className="card"><h3>Contacts</h3><p>{emergencyContacts.length}</p></div>
//           </div>

//           <div className="section">
//             <h2>Today's Medication Schedule</h2>
//             {medications.map((med) => (
//               <div key={med.id} className="item">
//                 <div>
//                   <strong>{med.name}</strong> - {med.dosage} - {med.time}<br />
//                   Status: {med.status} | Taken at: {med.takenAt || "-"} | Missed count: {med.missedCount}
//                 </div>
//                 <div className="actions">
//                   <button onClick={() => markTaken(med.id)}>Taken</button>
//                   <button onClick={() => markMissed(med.id)}>Missed</button>
//                   <button onClick={() => resetMedication(med.id)}>Reset</button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}

//       {activeTab === "medications" && (
//         <div className="section">
//           <h2>Add Medication</h2>
//           <form onSubmit={addMedication} className="form">
//             <input
//               placeholder="Medication Name"
//               value={newMedication.name}
//               onChange={(e) => setNewMedication({ ...newMedication, name: e.target.value })}
//             />
//             <input
//               placeholder="Dosage"
//               value={newMedication.dosage}
//               onChange={(e) => setNewMedication({ ...newMedication, dosage: e.target.value })}
//             />
//             <input
//               type="time"
//               value={newMedication.time}
//               onChange={(e) => setNewMedication({ ...newMedication, time: e.target.value })}
//             />
//             <button type="submit">Save Medication</button>
//           </form>

//           <h2>Medication List</h2>
//           {medications.map((med) => (
//             <div key={med.id} className="item">
//               <div>
//                 <strong>{med.name}</strong> - {med.dosage} - {med.time}<br />
//                 Status: {med.status}
//               </div>
//             </div>
//           ))}
//         </div>
//       )}

//       {activeTab === "caregiver" && (
//         <div className="section">
//           <h2>Caregiver Monitoring</h2>
//           <table>
//             <thead>
//               <tr>
//                 <th>Medication</th>
//                 <th>Dosage</th>
//                 <th>Time</th>
//                 <th>Status</th>
//                 <th>Taken At</th>
//                 <th>Missed Count</th>
//               </tr>
//             </thead>
//             <tbody>
//               {medications.map((med) => (
//                 <tr key={med.id}>
//                   <td>{med.name}</td>
//                   <td>{med.dosage}</td>
//                   <td>{med.time}</td>
//                   <td>{med.status}</td>
//                   <td>{med.takenAt || "-"}</td>
//                   <td>{med.missedCount}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}

//       {activeTab === "emergency" && (
//         <div className="section">
//           <h2>Emergency Contacts</h2>
//           {emergencyContacts.map((contact) => (
//             <div key={contact.id} className="item">
//               <div>
//                 <strong>{contact.name}</strong><br />
//                 {contact.relation}<br />
//                 {contact.phone}
//               </div>
//             </div>
//           ))}

//           <button className="danger" onClick={triggerEmergency}>Send Emergency Alert</button>

//           <h2>Add Emergency Contact</h2>
//           <form onSubmit={addContact} className="form">
//             <input
//               placeholder="Name"
//               value={newContact.name}
//               onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
//             />
//             <input
//               placeholder="Relation"
//               value={newContact.relation}
//               onChange={(e) => setNewContact({ ...newContact, relation: e.target.value })}
//             />
//             <input
//               placeholder="Phone"
//               value={newContact.phone}
//               onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
//             />
//             <button type="submit">Add Contact</button>
//           </form>
//         </div>
//       )}

//       {activeTab === "profile" && (
//         <div className="section">
//           <h2>Health Profile</h2>
//           <div className="form">
//             <input
//               placeholder="Blood Type"
//               value={healthProfile.bloodType}
//               onChange={(e) => setHealthProfile({ ...healthProfile, bloodType: e.target.value })}
//             />
//             <input
//               placeholder="Allergies"
//               value={healthProfile.allergies}
//               onChange={(e) => setHealthProfile({ ...healthProfile, allergies: e.target.value })}
//             />
//             <input
//               placeholder="Conditions"
//               value={healthProfile.conditions}
//               onChange={(e) => setHealthProfile({ ...healthProfile, conditions: e.target.value })}
//             />
//             <textarea
//               placeholder="Emergency Note"
//               value={healthProfile.emergencyNote}
//               onChange={(e) => setHealthProfile({ ...healthProfile, emergencyNote: e.target.value })}
//             />
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const initialMedications = [
  {
    id: '1',
    name: 'Metformin',
    dose: '500 mg',
    time: '08:00 AM',
    instruction: 'After breakfast',
    benefit: 'Helps control blood sugar level',
    status: 'Pending',
  },
  {
    id: '2',
    name: 'Amlodipine',
    dose: '5 mg',
    time: '09:00 PM',
    instruction: 'Before sleeping',
    benefit: 'Helps control blood pressure',
    status: 'Pending',
  },
];

const emergencyContacts = [
  { id: '1', name: 'Family Member', phone: '+82 10-1234-5678' },
  { id: '2', name: 'Caregiver', phone: '+82 10-9876-5432' },
  { id: '3', name: 'Nurse', phone: '+82 10-5555-2222' },
];

const patientInfo = {
  name: 'Asha',
  age: 23,
  bloodType: 'O+',
  allergies: 'Penicillin',
  condition: 'Long-term medication monitoring',
  address: 'Seoul, South Korea',
};

export default function App() {
  const [activeTab, setActiveTab] = useState('Home');
  const [medications, setMedications] = useState(initialMedications);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [newMed, setNewMed] = useState({
    name: '',
    dose: '',
    time: '',
    instruction: '',
    benefit: '',
  });

  const stats = useMemo(() => {
    const taken = medications.filter((med) => med.status === 'Taken').length;
    const skipped = medications.filter((med) => med.status === 'Skipped').length;
    const pending = medications.filter((med) => med.status === 'Pending').length;
    const adherence = medications.length > 0 ? Math.round((taken / medications.length) * 100) : 0;
    return { taken, skipped, pending, adherence };
  }, [medications]);

  const markMedication = (id, status) => {
    setMedications((prev) =>
      prev.map((med) => (med.id === id ? { ...med, status } : med))
    );
  };

  const addMedication = () => {
    if (!newMed.name || !newMed.dose || !newMed.time) {
      Alert.alert('Missing information', 'Please enter medicine name, dose, and time.');
      return;
    }

    const medication = {
      id: Date.now().toString(),
      name: newMed.name,
      dose: newMed.dose,
      time: newMed.time,
      instruction: newMed.instruction || 'No instruction added',
      benefit: newMed.benefit || 'No benefit added',
      status: 'Pending',
    };

    setMedications((prev) => [medication, ...prev]);
    setNewMed({ name: '', dose: '', time: '', instruction: '', benefit: '' });
    setShowAddModal(false);
  };

  const triggerEmergency = () => {
    setShowEmergencyModal(false);
    Alert.alert(
      'Emergency Alert Sent',
      'Emergency support and all registered contacts have been notified. This is a prototype alert.'
    );
  };

  const renderContent = () => {
    if (activeTab === 'Home') {
      return <HomeScreen stats={stats} medications={medications} setActiveTab={setActiveTab} />;
    }

    if (activeTab === 'Medication') {
      return (
        <MedicationScreen
          medications={medications}
          markMedication={markMedication}
          openAddModal={() => setShowAddModal(true)}
        />
      );
    }

    if (activeTab === 'Caregiver') {
      return <CaregiverScreen medications={medications} stats={stats} />;
    }

    if (activeTab === 'Emergency') {
      return <EmergencyScreen openEmergency={() => setShowEmergencyModal(true)} />;
    }

    return <ProfileScreen />;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.appContainer}>
        {renderContent()}
        <BottomNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
      </View>

      <AddMedicationModal
        visible={showAddModal}
        newMed={newMed}
        setNewMed={setNewMed}
        onClose={() => setShowAddModal(false)}
        onSave={addMedication}
      />

      <EmergencyModal
        visible={showEmergencyModal}
        onCancel={() => setShowEmergencyModal(false)}
        onConfirm={triggerEmergency}
      />
    </SafeAreaView>
  );
}

function HomeScreen({ stats, medications, setActiveTab }) {
  const nextMedication = medications.find((med) => med.status === 'Pending');

  return (
    <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
      <View style={styles.headerCard}>
        <Text style={styles.logo}>MaVie</Text>
        <Text style={styles.subtitle}>Medication monitoring and emergency support</Text>
      </View>

      <View style={styles.welcomeCard}>
        <Text style={styles.greeting}>Hello, {patientInfo.name}</Text>
        <Text style={styles.description}>
          Today we will help you manage your medication safely and keep your care network connected.
        </Text>
      </View>

      <View style={styles.statsGrid}>
        <StatCard label="Taken" value={stats.taken} emoji="✅" />
        <StatCard label="Pending" value={stats.pending} emoji="⏰" />
        <StatCard label="Skipped" value={stats.skipped} emoji="⚠️" />
        <StatCard label="Adherence" value={`${stats.adherence}%`} emoji="📊" />
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Next medication</Text>
        {nextMedication ? (
          <View style={styles.nextMedBox}>
            <Text style={styles.medName}>{nextMedication.name}</Text>
            <Text style={styles.medDetails}>{nextMedication.dose} • {nextMedication.time}</Text>
            <Text style={styles.medInstruction}>{nextMedication.instruction}</Text>
          </View>
        ) : (
          <Text style={styles.emptyText}>All medication has been completed for today.</Text>
        )}
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.primaryButton} onPress={() => setActiveTab('Medication')}>
          <Text style={styles.primaryButtonText}>View medication</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dangerButton} onPress={() => setActiveTab('Emergency')}>
          <Text style={styles.dangerButtonText}>Emergency</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function MedicationScreen({ medications, markMedication, openAddModal }) {
  return (
    <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.pageTitle}>Medication</Text>
          <Text style={styles.pageSubtitle}>Track today&apos;s intake schedule</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.scanCard}
        onPress={() => Alert.alert('Coming soon', 'Medicine photo detection can be added later using camera + medicine database/API.')}
      >
        <Text style={styles.scanEmoji}>📷</Text>
        <View style={styles.scanTextBox}>
          <Text style={styles.scanTitle}>Scan medicine</Text>
          <Text style={styles.scanSubtitle}>Take a picture to detect medicine information</Text>
        </View>
      </TouchableOpacity>

      {medications.map((med) => (
        <View key={med.id} style={styles.medCard}>
          <View style={styles.medHeaderRow}>
            <View>
              <Text style={styles.medName}>{med.name}</Text>
              <Text style={styles.medDetails}>{med.dose} • {med.time}</Text>
            </View>
            <StatusPill status={med.status} />
          </View>
          <Text style={styles.medInstruction}>When: {med.instruction}</Text>
          <Text style={styles.medBenefit}>Benefit: {med.benefit}</Text>

          <View style={styles.medActionRow}>
            <TouchableOpacity
              style={styles.takenButton}
              onPress={() => markMedication(med.id, 'Taken')}
            >
              <Text style={styles.takenButtonText}>Taken</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.skipButton}
              onPress={() => markMedication(med.id, 'Skipped')}
            >
              <Text style={styles.skipButtonText}>Skipped</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function CaregiverScreen({ medications, stats }) {
  const missedMeds = medications.filter((med) => med.status === 'Skipped');

  return (
    <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageTitle}>Caregiver Dashboard</Text>
      <Text style={styles.pageSubtitle}>Monitor patient medication status</Text>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Patient summary</Text>
        <Text style={styles.infoText}>Name: {patientInfo.name}</Text>
        <Text style={styles.infoText}>Condition: {patientInfo.condition}</Text>
        <Text style={styles.infoText}>Today&apos;s adherence: {stats.adherence}%</Text>
      </View>

      <View style={styles.statsGrid}>
        <StatCard label="Taken" value={stats.taken} emoji="✅" />
        <StatCard label="Pending" value={stats.pending} emoji="⏰" />
        <StatCard label="Skipped" value={stats.skipped} emoji="⚠️" />
        <StatCard label="Total" value={medications.length} emoji="💊" />
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Missed medication alerts</Text>
        {missedMeds.length === 0 ? (
          <Text style={styles.emptyText}>No missed medication recorded.</Text>
        ) : (
          missedMeds.map((med) => (
            <View key={med.id} style={styles.alertBox}>
              <Text style={styles.alertTitle}>{med.name} was skipped</Text>
              <Text style={styles.alertText}>{med.dose} scheduled at {med.time}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function EmergencyScreen({ openEmergency }) {
  return (
    <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageTitle}>Emergency Support</Text>
      <Text style={styles.pageSubtitle}>Fast alert for ambulance and registered contacts</Text>

      <View style={styles.emergencyCard}>
        <Text style={styles.emergencyEmoji}>🚨</Text>
        <Text style={styles.emergencyTitle}>Need urgent help?</Text>
        <Text style={styles.emergencyText}>
          Press the button below to send an emergency alert to all registered contacts.
        </Text>
        <TouchableOpacity style={styles.bigEmergencyButton} onPress={openEmergency}>
          <Text style={styles.bigEmergencyText}>Send Emergency Alert</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Emergency contacts</Text>
        {emergencyContacts.map((contact) => (
          <View key={contact.id} style={styles.contactRow}>
            <View>
              <Text style={styles.contactName}>{contact.name}</Text>
              <Text style={styles.contactPhone}>{contact.phone}</Text>
            </View>
            <Text style={styles.contactIcon}>📞</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function ProfileScreen() {
  return (
    <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageTitle}>Health Profile</Text>
      <Text style={styles.pageSubtitle}>Important information for caregivers and emergency support</Text>

      <View style={styles.profileCard}>
        <Text style={styles.avatar}>👤</Text>
        <Text style={styles.profileName}>{patientInfo.name}</Text>
        <Text style={styles.profileSubtext}>{patientInfo.condition}</Text>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Medical information</Text>
        <InfoRow label="Age" value={patientInfo.age} />
        <InfoRow label="Blood type" value={patientInfo.bloodType} />
        <InfoRow label="Allergies" value={patientInfo.allergies} />
        <InfoRow label="Address" value={patientInfo.address} />
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>App purpose</Text>
        <Text style={styles.description}>
          MaVie helps users manage medication schedules, allows caregivers to monitor intake, and supports faster emergency communication.
        </Text>
      </View>
    </ScrollView>
  );
}

function AddMedicationModal({ visible, newMed, setNewMed, onClose, onSave }) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Add medication</Text>
          <Input label="Medicine name" value={newMed.name} onChangeText={(text) => setNewMed({ ...newMed, name: text })} placeholder="Example: Paracetamol" />
          <Input label="Dose" value={newMed.dose} onChangeText={(text) => setNewMed({ ...newMed, dose: text })} placeholder="Example: 500 mg" />
          <Input label="Time" value={newMed.time} onChangeText={(text) => setNewMed({ ...newMed, time: text })} placeholder="Example: 08:00 AM" />
          <Input label="Instruction" value={newMed.instruction} onChangeText={(text) => setNewMed({ ...newMed, instruction: text })} placeholder="Example: After meal" />
          <Input label="Benefit" value={newMed.benefit} onChangeText={(text) => setNewMed({ ...newMed, benefit: text })} placeholder="Example: Reduces fever" />

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={onSave}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function EmergencyModal({ visible, onCancel, onConfirm }) {
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.emergencyEmoji}>🚨</Text>
          <Text style={styles.modalTitle}>Confirm emergency alert</Text>
          <Text style={styles.description}>
            This will notify all registered emergency contacts. In a real app, this can also connect to emergency services.
          </Text>
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.emergencyConfirmButton} onPress={onConfirm}>
              <Text style={styles.saveButtonText}>Send Alert</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function BottomNavigation({ activeTab, setActiveTab }) {
  const tabs = [
    { name: 'Home', icon: '🏠' },
    { name: 'Medication', icon: '💊' },
    { name: 'Caregiver', icon: '👩‍⚕️' },
    { name: 'Emergency', icon: '🚨' },
    { name: 'Profile', icon: '👤' },
  ];

  return (
    <View style={styles.bottomNav}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.name;
        return (
          <TouchableOpacity key={tab.name} style={styles.navItem} onPress={() => setActiveTab(tab.name)}>
            <Text style={styles.navIcon}>{tab.icon}</Text>
            <Text style={[styles.navText, isActive && styles.navTextActive]}>{tab.name}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function StatCard({ emoji, label, value }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function StatusPill({ status }) {
  const style =
    status === 'Taken'
      ? styles.statusTaken
      : status === 'Skipped'
      ? styles.statusSkipped
      : styles.statusPending;

  return (
    <View style={[styles.statusPill, style]}>
      <Text style={styles.statusText}>{status}</Text>
    </View>
  );
}

function Input({ label, value, onChangeText, placeholder }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        style={styles.input}
        placeholderTextColor="#9CA3AF"
      />
    </View>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },
  appContainer: {
    flex: 1,
  },
  screen: {
    flex: 1,
    padding: 18,
    marginBottom: 78,
  },
  headerCard: {
    backgroundColor: '#DFF6F0',
    padding: 22,
    borderRadius: 26,
    marginBottom: 16,
  },
  logo: {
    fontSize: 38,
    fontWeight: '800',
    color: '#0F766E',
  },
  subtitle: {
    fontSize: 15,
    color: '#115E59',
    marginTop: 6,
  },
  welcomeCard: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 22,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 21,
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 22,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 3,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 22,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },
  nextMedBox: {
    backgroundColor: '#F0FDFA',
    padding: 14,
    borderRadius: 16,
  },
  medName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  medDetails: {
    fontSize: 14,
    color: '#374151',
    marginTop: 4,
  },
  medInstruction: {
    fontSize: 14,
    color: '#0F766E',
    marginTop: 8,
  },
  medBenefit: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 6,
    lineHeight: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#0F766E',
    padding: 15,
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  dangerButton: {
    flex: 1,
    backgroundColor: '#FEE2E2',
    padding: 15,
    borderRadius: 16,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#B91C1C',
    fontWeight: '800',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#111827',
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: '#0F766E',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  scanCard: {
    backgroundColor: '#ECFEFF',
    padding: 16,
    borderRadius: 22,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  scanEmoji: {
    fontSize: 34,
    marginRight: 12,
  },
  scanTextBox: {
    flex: 1,
  },
  scanTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#155E75',
  },
  scanSubtitle: {
    fontSize: 13,
    color: '#0E7490',
    marginTop: 3,
  },
  medCard: {
    backgroundColor: '#FFFFFF',
    padding: 17,
    borderRadius: 22,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  medHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  statusTaken: {
    backgroundColor: '#DCFCE7',
  },
  statusSkipped: {
    backgroundColor: '#FEE2E2',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#111827',
  },
  medActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  takenButton: {
    flex: 1,
    backgroundColor: '#DCFCE7',
    padding: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  takenButtonText: {
    color: '#166534',
    fontWeight: '800',
  },
  skipButton: {
    flex: 1,
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#991B1B',
    fontWeight: '800',
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 7,
  },
  alertBox: {
    backgroundColor: '#FEF2F2',
    padding: 13,
    borderRadius: 16,
    marginBottom: 10,
  },
  alertTitle: {
    fontSize: 15,
    color: '#991B1B',
    fontWeight: '800',
  },
  alertText: {
    fontSize: 13,
    color: '#7F1D1D',
    marginTop: 3,
  },
  emergencyCard: {
    backgroundColor: '#FEF2F2',
    padding: 24,
    borderRadius: 26,
    alignItems: 'center',
    marginBottom: 16,
  },
  emergencyEmoji: {
    fontSize: 48,
    marginBottom: 8,
    textAlign: 'center',
  },
  emergencyTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#991B1B',
  },
  emergencyText: {
    fontSize: 14,
    color: '#7F1D1D',
    textAlign: 'center',
    lineHeight: 21,
    marginTop: 8,
  },
  bigEmergencyButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 18,
    marginTop: 18,
    width: '100%',
    alignItems: 'center',
  },
  bigEmergencyText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 13,
    borderRadius: 16,
    marginBottom: 10,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  contactPhone: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 3,
  },
  contactIcon: {
    fontSize: 22,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 26,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    fontSize: 54,
    marginBottom: 8,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111827',
  },
  profileSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingVertical: 11,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '700',
    maxWidth: '58%',
    textAlign: 'right',
  },
  bottomNav: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
  },
  navIcon: {
    fontSize: 20,
  },
  navText: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 3,
    fontWeight: '700',
  },
  navTextActive: {
    color: '#0F766E',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '800',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '800',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#0F766E',
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#f9a8a8',
    fontWeight: '900',
  },
  emergencyConfirmButton: {
    flex: 1,
    backgroundColor: '#DC2626',
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
});
