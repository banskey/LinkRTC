import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert,
  Switch, ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { exportData, setNotificationPreference, deleteAccount } from '../api/settings';
import { loadProfileFromUrl } from '../api/profile';
import {
  readDataSource, writeDataSource, readServerUrl, writeServerUrl, type DataSource,
} from '../data/store';
import { pingServer } from '../data/githubServer';
import { TextInput } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export default function SettingsScreen({ navigation }: { navigation: NativeStackNavigationProp<any> }) {
  const { user, logout } = useAuth();
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [dataSource, setDataSource] = useState<DataSource>('demo');
  const [serverUrl, setServerUrl] = useState('');
  const [checking, setChecking] = useState(false);
  const [patientUrl, setPatientUrl] = useState('');
  const [loadingPatient, setLoadingPatient] = useState(false);

  useEffect(() => {
    readDataSource().then(setDataSource);
    readServerUrl().then(setServerUrl);
  }, []);

  const chooseSource = async (src: DataSource) => {
    if (src === 'server') {
      const url = serverUrl.trim();
      if (!url) {
        Alert.alert('Server address needed', 'Enter the clinical server address below first (e.g. http://10.0.0.5:5000).');
        return;
      }
      setChecking(true);
      await writeServerUrl(url);
      const ok = await pingServer(url);
      setChecking(false);
      if (!ok) {
        Alert.alert('Can\u2019t reach the server', `No response from ${url}. Make sure the server is running and your phone is on the same network, then try again.`);
        return;
      }
    }
    setDataSource(src);
    await writeDataSource(src);
    const msg: Record<DataSource, string> = {
      demo: 'Matches now come from the built-in trial set. No internet needed.',
      live: 'Matches now come from ClinicalTrials.gov over your internet connection. Open Matches to load fresh trials.',
      server: 'Connected to the clinical server. Open Matches to load its trials.',
    };
    Alert.alert('Data source changed', msg[src]);
  };

  const loadPatient = async () => {
    const url = patientUrl.trim();
    if (!url) {
      Alert.alert('Patient link needed', 'Paste a patient link from the LinkRTC website first.');
      return;
    }
    setLoadingPatient(true);
    try {
      const { name } = await loadProfileFromUrl(url);
      Alert.alert('Patient loaded', `${name}'s medical profile is now on this device. Open "Edit Medical Profile" to see it.`);
    } catch (e: any) {
      Alert.alert('Could not load patient', e?.message || 'Please check the link and try again.');
    } finally {
      setLoadingPatient(false);
    }
  };

  const handleExport = async () => {
    try {
      const data = await exportData();
      Alert.alert('Data Export', JSON.stringify(data, null, 2).substring(0, 5000));
    } catch (e) {
      Alert.alert('Error', 'Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Account',
      'This permanently deletes your account and ALL medical data. This cannot be undone. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever', style: 'destructive', onPress: async () => {
            try {
              await deleteAccount();
              logout();
            } catch {
              Alert.alert('Error', 'Failed to delete account');
            }
          }
        }
      ]
    );
  };

  const toggleNotifications = async (value: boolean) => {
    setNotifEnabled(value);
    try {
      await setNotificationPreference(value);
    } catch { /* best-effort */ }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
      <Text style={styles.header}>Settings</Text>

      {/* Data source selector */}
      <Text style={styles.sectionTitle}>Trial Data Source</Text>
      <View style={styles.sourceRow}>
        <TouchableOpacity
          style={[styles.sourceBtn, dataSource === 'demo' && styles.sourceBtnActive]}
          onPress={() => chooseSource('demo')}
          accessibilityRole="radio"
          accessibilityState={{ selected: dataSource === 'demo' }}
          accessibilityLabel="Demo data source. Built-in trials, works offline."
        >
          <Text style={[styles.sourceText, dataSource === 'demo' && styles.sourceTextActive]}>Demo</Text>
          <Text style={styles.sourceSub}>Built-in · offline</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sourceBtn, dataSource === 'live' && styles.sourceBtnActive]}
          onPress={() => chooseSource('live')}
          accessibilityRole="radio"
          accessibilityState={{ selected: dataSource === 'live' }}
          accessibilityLabel="Live data source. ClinicalTrials.gov, uses the internet."
        >
          <Text style={[styles.sourceText, dataSource === 'live' && styles.sourceTextActive]}>Live</Text>
          <Text style={styles.sourceSub}>ClinicalTrials.gov</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sourceBtn, dataSource === 'server' && styles.sourceBtnActive]}
          onPress={() => chooseSource('server')}
          accessibilityRole="radio"
          accessibilityState={{ selected: dataSource === 'server' }}
          accessibilityLabel="Clinical server data source. Connects to the project server."
        >
          {checking
            ? <ActivityIndicator size="small" color="#0F7B7B" />
            : <Text style={[styles.sourceText, dataSource === 'server' && styles.sourceTextActive]}>Server</Text>}
          <Text style={styles.sourceSub}>Project server</Text>
        </TouchableOpacity>
      </View>

      {/* Server address — only relevant for the Server source */}
      <Text style={styles.fieldLabel}>Clinical server address</Text>
      <TextInput
        style={styles.urlInput}
        placeholder="http://10.0.0.5:5000"
        placeholderTextColor="#999"
        value={serverUrl}
        onChangeText={setServerUrl}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        accessibilityLabel="Clinical server address"
      />
      <Text style={styles.helperText}>
        Demo = trials saved in the app (no internet). Live = fresh trials from
        ClinicalTrials.gov. Server = the project's own clinical server (enter its
        address, then tap Server; your phone must be able to reach it).
      </Text>

      {/* Load a patient from the LinkRTC website */}
      <Text style={styles.sectionTitle}>Load Patient From Website</Text>
      <TextInput
        style={styles.urlInput}
        placeholder="https://you.github.io/linkrtc-web/patients/patient-5.json"
        placeholderTextColor="#999"
        value={patientUrl}
        onChangeText={setPatientUrl}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        accessibilityLabel="Patient link from the LinkRTC website"
      />
      <TouchableOpacity
        style={styles.loadPatientBtn}
        onPress={loadPatient}
        disabled={loadingPatient}
        accessibilityRole="button"
        accessibilityLabel="Load this patient's profile from the link"
      >
        {loadingPatient
          ? <ActivityIndicator size="small" color="#fff" />
          : <Text style={styles.loadPatientText}>Load Patient</Text>}
      </TouchableOpacity>
      <Text style={styles.helperText}>
        Pick a patient on the LinkRTC website, copy the link it shows, paste it
        here, then tap Load Patient. That patient's medical profile is copied onto
        this phone.
      </Text>

      {/* Profile section */}
      <Text style={styles.sectionTitle}>Profile</Text>
      <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('MedicalProfile')}>
        <Text style={styles.rowText}>Edit Medical Profile</Text>
        <Text style={styles.chevron}>→</Text>
      </TouchableOpacity>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>Location</Text>
        <Text style={styles.rowValue}>{user?.location_text || 'Not set'}</Text>
      </View>

      {/* Notifications */}
      <Text style={styles.sectionTitle}>Notifications</Text>
      <View style={styles.row}>
        <Text style={styles.rowText}>Push notifications</Text>
        <Switch
          value={notifEnabled}
          onValueChange={toggleNotifications}
          trackColor={{ false: '#ccc', true: '#0F7B7B' }}
        />
      </View>
      <Text style={styles.helperText}>
        Get notified when a new trial matches your profile or a saved trial changes status.
      </Text>

      {/* Privacy */}
      <Text style={styles.sectionTitle}>Privacy & Data</Text>
      <TouchableOpacity style={styles.row} onPress={handleExport} disabled={exporting}>
        <Text style={styles.rowText}>{exporting ? 'Exporting...' : 'Export My Data'}</Text>
        {exporting && <ActivityIndicator size="small" color="#0F7B7B" />}
      </TouchableOpacity>
      <TouchableOpacity style={styles.row} onPress={handleDelete}>
        <Text style={[styles.rowText, { color: '#C62828' }]}>Delete Account</Text>
      </TouchableOpacity>

      {/* Privacy notice */}
      <View style={styles.privacyBox}>
        <Text style={styles.privacyTitle}>Privacy Notice</Text>
        <Text style={styles.privacyText}>
          Your medical profile is stored in a separate, encrypted database from your login info.
          We never share your medical data with third parties. Your data is never used for advertising.
        </Text>
      </View>

      {/* About */}
      <Text style={styles.sectionTitle}>About</Text>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>Version</Text>
        <Text style={styles.rowValue}>1.0.0</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>Data source</Text>
        <Text style={styles.rowValue}>ClinicalTrials.gov</Text>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>LinkRTC is not a medical device or diagnostic tool.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { fontSize: 28, fontWeight: 'bold', padding: 20, color: '#0F7B7B' },
  sourceRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 4 },
  sourceBtn: { flex: 1, borderWidth: 2, borderColor: '#ddd', borderRadius: 12, padding: 14, alignItems: 'center' },
  sourceBtnActive: { borderColor: '#0F7B7B', backgroundColor: '#E0F7F7' },
  sourceText: { fontSize: 16, fontWeight: '700', color: '#666' },
  sourceTextActive: { color: '#0F7B7B' },
  sourceSub: { fontSize: 11, color: '#555', marginTop: 2, textAlign: 'center' },
  fieldLabel: { fontSize: 15, fontWeight: '600', color: '#333', paddingHorizontal: 20, marginTop: 14, marginBottom: 6 },
  urlInput: {
    marginHorizontal: 20, borderWidth: 1, borderColor: '#bbb', borderRadius: 10,
    padding: 14, fontSize: 16, color: '#222',
  },
  loadPatientBtn: {
    marginHorizontal: 20, marginTop: 10, backgroundColor: '#0F7B7B', borderRadius: 10,
    padding: 14, alignItems: 'center', minHeight: 50, justifyContent: 'center',
  },
  loadPatientText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#0F7B7B', textTransform: 'uppercase',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', minHeight: 50 },
  rowText: { fontSize: 16, color: '#333' },
  rowLabel: { fontSize: 16, color: '#666' },
  rowValue: { fontSize: 16, color: '#999' },
  chevron: { fontSize: 18, color: '#ccc' },
  helperText: { fontSize: 13, color: '#999', paddingHorizontal: 20, paddingBottom: 8 },
  privacyBox: { margin: 16, backgroundColor: '#F5F5F5', borderRadius: 10, padding: 16 },
  privacyTitle: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 6 },
  privacyText: { fontSize: 14, color: '#666', lineHeight: 20 },
  logoutBtn: { margin: 20, backgroundColor: '#f5f5f5', borderRadius: 12, padding: 16, alignItems: 'center', minHeight: 50 },
  logoutText: { fontSize: 17, color: '#C62828', fontWeight: '600' },
  footer: { textAlign: 'center', fontSize: 12, color: '#bbb', paddingBottom: 10 },
});
