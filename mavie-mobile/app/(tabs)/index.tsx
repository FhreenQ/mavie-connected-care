// import { Image } from 'expo-image';
// import { Platform, StyleSheet } from 'react-native';

// import { HelloWave } from '@/components/hello-wave';
// import ParallaxScrollView from '@/components/parallax-scroll-view';
// import { ThemedText } from '@/components/themed-text';
// import { ThemedView } from '@/components/themed-view';
// import { Link } from 'expo-router';

// export default function HomeScreen() {
//   return (
//     <ParallaxScrollView
//       headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
//       headerImage={
//         <Image
//           source={require('@/assets/images/partial-react-logo.png')}
//           style={styles.reactLogo}
//         />
//       }>
//       <ThemedView style={styles.titleContainer}>
//         <ThemedText type="title">Welcome!</ThemedText>
//         <HelloWave />
//       </ThemedView>
//       <ThemedView style={styles.stepContainer}>
//         <ThemedText type="subtitle">Step 1: Try it</ThemedText>
//         <ThemedText>
//           Edit <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> to see changes.
//           Press{' '}
//           <ThemedText type="defaultSemiBold">
//             {Platform.select({
//               ios: 'cmd + d',
//               android: 'cmd + m',
//               web: 'F12',
//             })}
//           </ThemedText>{' '}
//           to open developer tools.
//         </ThemedText>
//       </ThemedView>
//       <ThemedView style={styles.stepContainer}>
//         <Link href="/modal">
//           <Link.Trigger>
//             <ThemedText type="subtitle">Step 2: Explore</ThemedText>
//           </Link.Trigger>
//           <Link.Preview />
//           <Link.Menu>
//             <Link.MenuAction title="Action" icon="cube" onPress={() => alert('Action pressed')} />
//             <Link.MenuAction
//               title="Share"
//               icon="square.and.arrow.up"
//               onPress={() => alert('Share pressed')}
//             />
//             <Link.Menu title="More" icon="ellipsis">
//               <Link.MenuAction
//                 title="Delete"
//                 icon="trash"
//                 destructive
//                 onPress={() => alert('Delete pressed')}
//               />
//             </Link.Menu>
//           </Link.Menu>
//         </Link>

//         <ThemedText>
//           {`Tap the Explore tab to learn more about what's included in this starter app.`}
//         </ThemedText>
//       </ThemedView>
//       <ThemedView style={styles.stepContainer}>
//         <ThemedText type="subtitle">Step 3: Get a fresh start</ThemedText>
//         <ThemedText>
//           {`When you're ready, run `}
//           <ThemedText type="defaultSemiBold">npm run reset-project</ThemedText> to get a fresh{' '}
//           <ThemedText type="defaultSemiBold">app</ThemedText> directory. This will move the current{' '}
//           <ThemedText type="defaultSemiBold">app</ThemedText> to{' '}
//           <ThemedText type="defaultSemiBold">app-example</ThemedText>.
//         </ThemedText>
//       </ThemedView>
//     </ParallaxScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   titleContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//   },
//   stepContainer: {
//     gap: 8,
//     marginBottom: 8,
//   },
//   reactLogo: {
//     height: 178,
//     width: 290,
//     bottom: 0,
//     left: 0,
//     position: 'absolute',
//   },
// });

import React, { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';

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
          openScanner={() => router.push('/add-medicine' as any)}
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
});
