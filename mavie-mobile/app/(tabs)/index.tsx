import React, { useCallback, useMemo, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { getUserMedications } from '../../components/medicine-scanner/medicineApi';

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

import { useAuth } from "@/context/AuthContext";
import { getHealthProfile, getEmergencyContacts, triggerEmergencyAlert } from "@/services/api";

import { router } from "expo-router";

const initialMedications = [];

function mapBackendScheduleToMedication(schedule: any) {
  const nextDoseDate = schedule.next_dose_time
    ? new Date(schedule.next_dose_time)
    : null;

  const time = nextDoseDate
    ? nextDoseDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'No time';

  return {
    id: String(schedule.schedule_id),
    name: schedule.brand_name || schedule.generic_name || 'Unknown medicine',
    dose: schedule.dosage || schedule.strength || 'As instructed',
    time,
    instruction: schedule.instructions || 'No instruction added',
    benefit: 'Saved from backend schedule',
    status: 'Pending',
  };
}

export default function App() {
  const router = useRouter();

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

  const { user, token, logout } = useAuth();

  const [healthProfile, setHealthProfile] = useState<any>(null);
  const [emergencyContacts, setEmergencyContacts] = useState<any[]>([]);

  const loadBackendMedications = async () => {
    try {
      const schedules = await getUserMedications();
      const backendMedications = schedules.map(mapBackendScheduleToMedication);
      setMedications(backendMedications);
    } catch (error: any) {
      console.log('Load backend medications error:', error);
      Alert.alert(
        'Backend load error',
        error.message || 'Could not load medications from backend.'
      );
    }
  };

  const loadUserProfile = async () => {
    if (!token) return;

    try {
      const profileData = await getHealthProfile(token);
      setHealthProfile(profileData.healthProfile);
    } catch (error: any) {
      console.log('No health profile yet:', error.message);
      setHealthProfile(null);
    }

    try {
      const contactsData = await getEmergencyContacts(token);
      setEmergencyContacts(contactsData.contacts || []);
    } catch (error: any) {
      console.log('No emergency contacts yet:', error.message);
      setEmergencyContacts([]);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadBackendMedications();
      loadUserProfile();
    }, [token])
  );

  const stats = useMemo(() => {
    const taken = medications.filter((med) => med.status === 'Taken').length;
    const skipped = medications.filter((med) => med.status === 'Skipped').length;
    const pending = medications.filter((med) => med.status === 'Pending').length;

    const adherence =
      medications.length > 0
        ? Math.round((taken / medications.length) * 100)
        : 0;

    return { taken, skipped, pending, adherence };
  }, [medications]);

  const markMedication = (id, status) => {
    setMedications((prev) =>
      prev.map((med) => (med.id === id ? { ...med, status } : med))
    );
  };

  const addMedication = () => {
    if (!newMed.name || !newMed.dose || !newMed.time) {
      Alert.alert(
        'Missing information',
        'Please enter medicine name, dose, and time.'
      );
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

    setNewMed({
      name: '',
      dose: '',
      time: '',
      instruction: '',
      benefit: '',
    });

    setShowAddModal(false);
  };

  const patientInfo = {
    name: user?.username || 'New MaVie User',
    email: user?.email || 'No email',
    role: user?.role || 'patient',
    bloodType: healthProfile?.blood_type || 'Not added yet',
    allergies: healthProfile?.allergies || 'Not added yet',
    condition: healthProfile?.conditions || 'Not added yet',
    address: healthProfile?.home_address || 'Not added yet',
    emergencyNotes: healthProfile?.emergency_notes || 'Not added yet',
    dateOfBirth: healthProfile?.date_of_birth || 'Not added yet',
  };

  const triggerEmergency = async () => {
    if (!token) {
      Alert.alert('Login required', 'Please log in again.');
      return;
    }

    try {
      setShowEmergencyModal(false);

      const locationText =
        patientInfo.address !== 'Not added yet'
          ? patientInfo.address
          : 'Location not provided';

      const details = `${patientInfo.name} pressed the emergency button from MaVie mobile app.`;

      const emergencyData = await triggerEmergencyAlert(token, {
        locationText,
        details,
        latitude: null,
        longitude: null,
      });

      Alert.alert(
        'Emergency Sent',
        `Emergency request #${emergencyData.emergencyEvent.emergency_event_id} was sent to the hospital dashboard.`
      );
    } catch (error: any) {
      console.log('Emergency trigger error:', error);

      Alert.alert(
        'Emergency failed',
        error.message || 'Could not send emergency request.'
      );
    }
  };

  const renderContent = () => {
    if (activeTab === 'Home') {
      return (
        <HomeScreen
          stats={stats}
          medications={medications}
          setActiveTab={setActiveTab}
          patientInfo={patientInfo}
        />
      );
    }

    if (activeTab === 'Medication') {
      return (
        <MedicationScreen
          medications={medications}
          markMedication={markMedication}
          openAddModal={() => router.push('/add-medicine' as any)}
          openScanner={() => router.push('/add-medicine' as any)}
        />
      );
    }

    if (activeTab === 'Caregiver') {
      return (
        <CaregiverScreen
          medications={medications}
          stats={stats}
          patientInfo={patientInfo}
        />
      );
    }

    if (activeTab === 'Emergency') {
      return (
        <EmergencyScreen
          openEmergency={() => setShowEmergencyModal(true)}
          emergencyContacts={emergencyContacts}
        />
      );
    }

    return <ProfileScreen patientInfo={patientInfo} logout={logout} />;
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

function HomeScreen({ stats, medications, setActiveTab, patientInfo }) {
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

function MedicationScreen({ medications, markMedication, openAddModal, openScanner }) {
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
        onPress={openScanner}
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

function CaregiverScreen({ medications, stats, patientInfo }) {
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

function EmergencyScreen({ openEmergency, emergencyContacts }) {
  return (
    <ScrollView style={styles.screen}>
      <View style={styles.emergencyCard}>
        <Text style={styles.emergencyIcon}>🚨</Text>
        <Text style={styles.emergencyTitle}>Emergency Support</Text>
        <Text style={styles.emergencyText}>
          Press the button below to alert your emergency contacts.
        </Text>

        <TouchableOpacity
          style={styles.sendEmergencyButton}
          onPress={openEmergency}
          activeOpacity={0.85}
        >
          <Text style={styles.sendEmergencyButtonIcon}>🚨</Text>
          <Text style={styles.sendEmergencyButtonText}>Send Emergency Alert</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Emergency Contacts</Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push("/emergency-contacts" as any)}
        >
          <Text style={styles.primaryButtonText}>
            Add / Manage Emergency Contacts
          </Text>
        </TouchableOpacity>

        {emergencyContacts.length === 0 ? (
          <Text style={{ marginTop: 14, color: "#6B7280", fontWeight: "700" }}>
            No emergency contacts added yet.
          </Text>
        ) : (
          emergencyContacts.map((contact: any) => {
            const id = contact.contact_id || contact.contactId || contact.id;
            const name =
              contact.contact_name ||
              contact.contactName ||
              contact.name ||
              "Unnamed contact";
            const phone =
              contact.phone_number ||
              contact.phoneNumber ||
              contact.phone ||
              "No phone";

            return (
              <View key={String(id)} style={styles.contactRow}>
                <View>
                  <Text style={styles.contactName}>{name}</Text>
                  <Text style={styles.contactPhone}>{phone}</Text>
                </View>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

function ProfileScreen({ patientInfo, logout }) {
  return (
    <ScrollView style={styles.screen}>
      <View style={styles.profileCard}>
        <Text style={styles.avatar}>👤</Text>
        <Text style={styles.profileName}>{patientInfo.name}</Text>
        <Text style={styles.profileSubtext}>{patientInfo.email}</Text>
        <Text style={styles.profileSubtext}>Role: {patientInfo.role}</Text>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Medical information</Text>

        <InfoRow label="Date of birth" value={patientInfo.dateOfBirth} />
        <InfoRow label="Blood type" value={patientInfo.bloodType} />
        <InfoRow label="Allergies" value={patientInfo.allergies} />
        <InfoRow label="Condition" value={patientInfo.condition} />
        <InfoRow label="Address" value={patientInfo.address} />
        <InfoRow label="Emergency notes" value={patientInfo.emergencyNotes} />
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => router.push("/edit-health-profile" as any)}
      >
        <Text style={styles.primaryButtonText}>Add / Edit My Information</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.dangerButton, { marginTop: 12 }]}
        onPress={logout}
      >
        <Text style={styles.dangerButtonText}>Log Out</Text>
      </TouchableOpacity>
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
    color: '#FFFFFF',
    fontWeight: '900',
  },
  emergencyConfirmButton: {
    flex: 1,
    backgroundColor: '#DC2626',
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
  },

  sendEmergencyButton: {
  marginTop: 20,
  backgroundColor: "#DC2626",
  borderRadius: 24,
  paddingVertical: 22,
  paddingHorizontal: 20,
  alignItems: "center",
  justifyContent: "center",
  shadowColor: "#DC2626",
  shadowOpacity: 0.35,
  shadowRadius: 12,
  elevation: 6,
},

sendEmergencyButtonIcon: {
  fontSize: 34,
  marginBottom: 8,
},

sendEmergencyButtonText: {
  color: "#FFFFFF",
  fontSize: 20,
  fontWeight: "900",
  textAlign: "center",
},
});
