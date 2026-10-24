import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  Alert, ActivityIndicator, Modal, FlatList,
} from 'react-native';
import { getProfile, updateProfile } from '../api/profile';
import { COMMON_CONDITIONS } from '../utils/conditions';

const SMOKING_OPTIONS = ['never', 'former', 'current'];
const ALCOHOL_OPTIONS = ['none', 'occasional', 'moderate', 'heavy'];
const PREGNANCY_OPTIONS = ['not_pregnant', 'pregnant', 'unsure', 'not_applicable'];
const DISTANCE_OPTIONS = [5, 10, 25, 50, 100, 250];

export default function MedicalProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [conditions, setConditions] = useState<string[]>([]);
  const [conditionInput, setConditionInput] = useState('');
  const [showConditionPicker, setShowConditionPicker] = useState(false);
  const [medications, setMedications] = useState<string[]>([]);
  const [medInput, setMedInput] = useState('');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [allergyInput, setAllergyInput] = useState('');
  const [history, setHistory] = useState('');
  const [biomarkers, setBiomarkers] = useState('');
  const [smoking, setSmoking] = useState('');
  const [alcohol, setAlcohol] = useState('');
  const [pregnancy, setPregnancy] = useState('');
  const [travelRadius, setTravelRadius] = useState(50);

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      const p = await getProfile();
      setConditions(p.conditions || []);
      setMedications(p.medications || []);
      setAllergies(p.allergies || []);
      setHistory(p.medical_history || '');
      setBiomarkers(p.biomarkers || '');
      setSmoking(p.smoking_status || '');
      setAlcohol(p.alcohol_use || '');
      setPregnancy(p.pregnancy_status || '');
      setTravelRadius(p.travel_radius_miles || 50);
    } catch (e) {
      // New profile — leave blank
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      // Fold in any text typed but not yet turned into a tag (common demo slip).
      const finalConditions = conditionInput.trim() && !conditions.includes(conditionInput.trim())
        ? [...conditions, conditionInput.trim()] : conditions;
      const finalMeds = medInput.trim() && !medications.includes(medInput.trim())
        ? [...medications, medInput.trim()] : medications;
      const finalAllergies = allergyInput.trim() && !allergies.includes(allergyInput.trim())
        ? [...allergies, allergyInput.trim()] : allergies;
      setConditions(finalConditions);
      setMedications(finalMeds);
      setAllergies(finalAllergies);
      setConditionInput(''); setMedInput(''); setAllergyInput('');
      await updateProfile({
        conditions: finalConditions, medications: finalMeds, allergies: finalAllergies,
        medical_history: history, biomarkers,
        smoking_status: smoking, alcohol_use: alcohol, pregnancy_status: pregnancy,
        travel_radius_miles: travelRadius,
      });
      Alert.alert('Saved', 'Your medical profile has been updated.');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.detail || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const addTag = (value: string, list: string[], setter: (v: string[]) => void) => {
    const trimmed = value.trim();
    if (trimmed && !list.includes(trimmed)) {
      setter([...list, trimmed]);
    }
  };

  const filteredConditions = COMMON_CONDITIONS.filter(c =>
    c.toLowerCase().includes(conditionInput.toLowerCase()) && !conditions.includes(c)
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#0F7B7B" /></View>;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Medical Profile</Text>

      {/* Conditions */}
      <Text style={styles.label}>Conditions / Diagnoses</Text>
      <View style={styles.tagRow}>
        {conditions.map(c => (
          <TouchableOpacity key={c} style={styles.tag} onPress={() => setConditions(conditions.filter(x => x !== c))}>
            <Text style={styles.tagText}>{c} ✕</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.addRow}>
        <TextInput
          style={styles.addInput} placeholder="Add a condition" value={conditionInput}
          onChangeText={setConditionInput}
          onSubmitEditing={() => { addTag(conditionInput, conditions, setConditions); setConditionInput(''); }}
        />
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowConditionPicker(true)}>
          <Text style={styles.addBtnText}>📋</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showConditionPicker} animationType="slide">
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Select Conditions</Text>
          <TouchableOpacity onPress={() => setShowConditionPicker(false)}>
            <Text style={styles.modalClose}>Done</Text>
          </TouchableOpacity>
        </View>
        <TextInput style={styles.searchInput} placeholder="Search..." value={conditionInput}
          onChangeText={setConditionInput} />
        <FlatList
          data={filteredConditions.slice(0, 50)}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.listItem} onPress={() => {
              setConditions([...conditions, item]);
              setConditionInput('');
            }}>
              <Text style={styles.listItemText}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </Modal>

      {/* Medications */}
      <Text style={styles.label}>Current Medications</Text>
      <View style={styles.tagRow}>
        {medications.map(m => (
          <TouchableOpacity key={m} style={styles.tag} onPress={() => setMedications(medications.filter(x => x !== m))}>
            <Text style={styles.tagText}>{m} ✕</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.addRow}>
        <TextInput style={styles.addInput} placeholder="Add a medication" value={medInput}
          onChangeText={setMedInput}
          onSubmitEditing={() => { addTag(medInput, medications, setMedications); setMedInput(''); }}
        />
      </View>

      {/* Allergies */}
      <Text style={styles.label}>Allergies</Text>
      <View style={styles.tagRow}>
        {allergies.map(a => (
          <TouchableOpacity key={a} style={styles.tag} onPress={() => setAllergies(allergies.filter(x => x !== a))}>
            <Text style={styles.tagText}>{a} ✕</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.addRow}>
        <TextInput style={styles.addInput} placeholder="Add an allergy" value={allergyInput}
          onChangeText={setAllergyInput}
          onSubmitEditing={() => { addTag(allergyInput, allergies, setAllergies); setAllergyInput(''); }}
        />
      </View>

      {/* History */}
      <Text style={styles.label}>Medical History (surgeries, hospitalizations)</Text>
      <TextInput style={styles.textArea} multiline value={history} onChangeText={setHistory}
        placeholder="e.g. Appendectomy 2018, Hospitalized for pneumonia 2020" placeholderTextColor="#999" />

      {/* Biomarkers */}
      <Text style={styles.label}>Biomarkers / Lab Values (optional)</Text>
      <TextInput style={styles.textArea} multiline value={biomarkers} onChangeText={setBiomarkers}
        placeholder="e.g. A1C 7.2, Cholesterol 180" placeholderTextColor="#999" />

      {/* Smoking */}
      <Text style={styles.label}>Smoking Status</Text>
      <View style={styles.chipRow}>
        {SMOKING_OPTIONS.map(s => (
          <TouchableOpacity key={s} style={[styles.chip, smoking === s && styles.chipActive]} onPress={() => setSmoking(smoking === s ? '' : s)}>
            <Text style={[styles.chipText, smoking === s && styles.chipTextActive]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Alcohol */}
      <Text style={styles.label}>Alcohol Use</Text>
      <View style={styles.chipRow}>
        {ALCOHOL_OPTIONS.map(a => (
          <TouchableOpacity key={a} style={[styles.chip, alcohol === a && styles.chipActive]} onPress={() => setAlcohol(alcohol === a ? '' : a)}>
            <Text style={[styles.chipText, alcohol === a && styles.chipTextActive]}>{a}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Pregnancy */}
      <Text style={styles.label}>Pregnancy Status</Text>
      <View style={styles.chipRow}>
        {PREGNANCY_OPTIONS.map(p => (
          <TouchableOpacity key={p} style={[styles.chip, pregnancy === p && styles.chipActive]} onPress={() => setPregnancy(pregnancy === p ? '' : p)}>
            <Text style={[styles.chipText, pregnancy === p && styles.chipTextActive]}>{p.replace(/_/g, ' ')}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Travel radius */}
      <Text style={styles.label}>Distance Willing to Travel</Text>
      <View style={styles.chipRow}>
        {DISTANCE_OPTIONS.map(d => (
          <TouchableOpacity key={d} style={[styles.chip, travelRadius === d && styles.chipActive]} onPress={() => setTravelRadius(d)}>
            <Text style={[styles.chipText, travelRadius === d && styles.chipTextActive]}>{d} mi</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saving}>
        <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Profile'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, color: '#0F7B7B' },
  label: { fontSize: 16, fontWeight: '600', marginTop: 14, marginBottom: 6, color: '#333' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: '#E0F7F7', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 4 },
  tagText: { color: '#0F7B7B', fontSize: 14 },
  addRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 },
  addInput: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 16 },
  addBtn: { padding: 12, backgroundColor: '#E0F7F7', borderRadius: 10 },
  addBtnText: { fontSize: 20 },
  textArea: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 16, minHeight: 80 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { padding: 10, borderRadius: 20, borderWidth: 1, borderColor: '#ddd' },
  chipActive: { borderColor: '#0F7B7B', backgroundColor: '#E0F7F7' },
  chipText: { fontSize: 14, color: '#666' },
  chipTextActive: { color: '#0F7B7B', fontWeight: '600' },
  saveBtn: { backgroundColor: '#0F7B7B', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24, marginBottom: 20, minHeight: 50 },
  saveBtnText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, paddingTop: 50, backgroundColor: '#0F7B7B' },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  modalClose: { color: '#fff', fontSize: 16 },
  searchInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 16, margin: 16 },
  listItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#eee' },
  listItemText: { fontSize: 16 },
});
