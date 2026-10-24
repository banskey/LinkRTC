import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
  Alert, Linking, Share,
} from 'react-native';
import { getTrial, saveTrial, unsaveTrial } from '../api/trials';
import TrialMap from '../components/TrialMap';

export default function TrialDetailScreen({ route }: { route: any }) {
  const { trialId } = route.params;
  const [trial, setTrial] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadTrial(); }, [trialId]);

  const loadTrial = async () => {
    try {
      const data = await getTrial(trialId);
      setTrial(data);
    } catch (e) {
      Alert.alert('Error', 'Failed to load trial');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (interested = false) => {
    setSaving(true);
    try {
      if (trial.is_saved) {
        await unsaveTrial(trialId);
        setTrial({ ...trial, is_saved: false, is_interested: false });
      } else {
        await saveTrial(trialId, interested);
        setTrial({ ...trial, is_saved: true, is_interested: interested });
        if (interested) {
          Alert.alert('✅', 'Your interest has been noted. The trial team will contact you if you may qualify.');
        }
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const shareTrial = async () => {
    if (!trial?.url) return;
    try {
      await Share.share({ url: trial.url, message: `${trial.title}\n${trial.url}` });
    } catch {}
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#0F7B7B" /></View>;
  if (!trial) return <View style={styles.center}><Text>Trial not found</Text></View>;

  const inclusionLines = (trial.eligibility_inclusion || '')
    .split('\n').map((l: string) => l.trim()).filter((l: string) => l);
  const exclusionLines = (trial.eligibility_exclusion || '')
    .split('\n').map((l: string) => l.trim()).filter((l: string) => l);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
      {/* Title + status */}
      <View style={styles.header}>
        {trial.phase && <Text style={styles.phaseBadge}>{trial.phase}</Text>}
        <Text style={[styles.statusBadge, { backgroundColor: '#2E7D3215' }]}>
          {trial.enrollment_status?.replace(/_/g, ' ')}
        </Text>
      </View>
      <Text style={styles.title}>{trial.title}</Text>
      <Text style={styles.nctId}>{trial.nct_id}</Text>

      {/* Sponsor */}
      {trial.sponsor && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sponsor</Text>
          <Text style={styles.sectionBody}>{trial.sponsor}</Text>
        </View>
      )}

      {/* Conditions */}
      {trial.conditions?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conditions</Text>
          <View style={styles.tagRow}>
            {trial.conditions.map((c: string, i: number) => (
              <Text key={i} style={styles.tag}>{c}</Text>
            ))}
          </View>
        </View>
      )}

      {/* About this trial — real study info (replaces empty eligibility criteria) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About this trial</Text>
        {trial.brief_summary ? (
          <Text style={styles.sectionBody}>{trial.brief_summary}</Text>
        ) : (
          <Text style={styles.sectionBody}>
            This study is currently {(trial.enrollment_status || 'recruiting').replace(/_/g, ' ')}.
            Open it on ClinicalTrials.gov below for the full description and eligibility details.
          </Text>
        )}
        <View style={styles.eligibilityRow}>
          {trial.phase && <Text style={styles.eligChip}>Phase: {trial.phase}</Text>}
          {trial.study_type && <Text style={styles.eligChip}>Type: {trial.study_type}</Text>}
          {typeof trial.enrollment === 'number' && <Text style={styles.eligChip}>Enrollment: {trial.enrollment}</Text>}
          {trial.enrollment_status && <Text style={styles.eligChip}>Status: {trial.enrollment_status.replace(/_/g, ' ')}</Text>}
        </View>
      </View>

      {/* Locations */}
      {trial.locations?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Locations ({trial.locations.length})</Text>
          {trial.locations.map((loc: any, i: number) => (
            <Text key={i} style={styles.location}>📍 {loc.facility || 'Facility'}{'\n'}
              {loc.city}{loc.city && loc.state ? ', ' : ''}{loc.state}{loc.country ? `, ${loc.country}` : ''}
            </Text>
          ))}
        </View>
      )}

      {/* Location map — only for trials that have coordinates (live data) */}
      {typeof trial.lat === 'number' && typeof trial.lon === 'number' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location Map</Text>
          <TrialMap lat={trial.lat} lon={trial.lon} facility={trial.facility} city={trial.locations?.[0]?.city || trial.locationState} />
        </View>
      )}

      {/* Contact */}
      {(trial.contact_name || trial.contact_phone || trial.contact_email) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact</Text>
          {trial.contact_name && <Text style={styles.sectionBody}>{trial.contact_name}</Text>}
          {trial.contact_phone && <Text style={styles.sectionBody}>📞 {trial.contact_phone}</Text>}
          {trial.contact_email && <Text style={styles.sectionBody}>✉ {trial.contact_email}</Text>}
        </View>
      )}

      {/* Disclaimer — required wording */}
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          This is informational matching, not medical advice. It does not diagnose,
          treat, or tell you to join any study. Talk to your doctor or the study team
          before acting.
        </Text>
      </View>

      {/* Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, trial.is_saved ? styles.buttonSaved : styles.buttonOutline]}
          onPress={() => handleSave(false)} disabled={saving}
        >
          <Text style={[styles.buttonText, trial.is_saved ? styles.buttonTextSaved : styles.buttonTextOutline]}>
            {trial.is_saved ? '★ Saved' : '☆ Save'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonInterested]}
          onPress={() => handleSave(true)} disabled={saving || trial.is_saved}
        >
          <Text style={styles.buttonText}>I'm Interested</Text>
        </TouchableOpacity>
      </View>

      {/* Share + external link — full-width accessible buttons */}
      <View style={styles.linkCol}>
        {trial.url && (
          <TouchableOpacity
            style={styles.linkBtn}
            onPress={() => Linking.openURL(trial.url)}
            accessibilityRole="link"
            accessibilityLabel="Open this trial on the ClinicalTrials.gov website"
          >
            <Text style={styles.linkBtnText}>View on ClinicalTrials.gov →</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.linkBtnOutline}
          onPress={shareTrial}
          accessibilityRole="button"
          accessibilityLabel="Share this trial"
        >
          <Text style={styles.linkBtnOutlineText}>Share this trial</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', gap: 8, padding: 20, paddingBottom: 0 },
  phaseBadge: { fontSize: 13, fontWeight: '600', color: '#0F7B7B', backgroundColor: '#E0F7F7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusBadge: { fontSize: 13, fontWeight: '600', color: '#2E7D32', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  title: { fontSize: 23, fontWeight: 'bold', color: '#1a1a1a', padding: 20, paddingBottom: 4 },
  nctId: { fontSize: 14, color: '#555', paddingHorizontal: 20, marginBottom: 8 },
  section: { paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#e4e4e4' },
  sectionTitle: { fontSize: 19, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 8 },
  sectionBody: { fontSize: 16, color: '#333', lineHeight: 24 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { fontSize: 15, color: '#0B5A5A', backgroundColor: '#D5F0F0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  subHeader: { fontSize: 16, fontWeight: '600', color: '#222', marginTop: 8, marginBottom: 4 },
  bullet: { fontSize: 15, color: '#1B5E20', paddingLeft: 12, marginBottom: 3, lineHeight: 22 },
  bulletRed: { fontSize: 15, color: '#B71C1C', paddingLeft: 12, marginBottom: 3, lineHeight: 22 },
  eligibilityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  eligChip: { fontSize: 14, color: '#333', backgroundColor: '#ececec', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  location: { fontSize: 15, color: '#333', lineHeight: 22, marginBottom: 8 },
  disclaimer: { marginHorizontal: 20, marginTop: 12, backgroundColor: '#FFF8E1', borderRadius: 10, padding: 12, borderLeftWidth: 4, borderLeftColor: '#FFC107' },
  disclaimerText: { fontSize: 13, color: '#795548', lineHeight: 18 },
  buttonRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginTop: 16 },
  button: { flex: 1, borderRadius: 12, padding: 16, alignItems: 'center', minHeight: 50 },
  buttonOutline: { borderWidth: 2, borderColor: '#0F7B7B', backgroundColor: '#fff' },
  buttonSaved: { backgroundColor: '#E0F7F7', borderWidth: 2, borderColor: '#0F7B7B' },
  buttonInterested: { backgroundColor: '#0F7B7B' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  buttonTextOutline: { color: '#0F7B7B', fontSize: 16, fontWeight: '600' },
  buttonTextSaved: { color: '#0F7B7B', fontSize: 16, fontWeight: '600' },
  linkCol: { paddingHorizontal: 20, marginTop: 16, marginBottom: 12, gap: 10 },
  linkBtn: { backgroundColor: '#0B5A5A', borderRadius: 12, padding: 16, alignItems: 'center', minHeight: 52 },
  linkBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  linkBtnOutline: { borderWidth: 2, borderColor: '#0B5A5A', borderRadius: 12, padding: 14, alignItems: 'center', minHeight: 52 },
  linkBtnOutlineText: { color: '#0B5A5A', fontSize: 16, fontWeight: '600' },
});
