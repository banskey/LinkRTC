// OFFLINE profile api — reads/writes the on-device profile. No server.
import { readProfile, writeProfile, type OfflineProfile } from '../data/store';

export async function getProfile() {
  return readProfile();
}

// Pull ONE patient from the LinkRTC web "Patient Sender" and make it this
// device's medical profile. `url` is a patient link copied from the website,
// e.g. https://<you>.github.io/linkrtc-web/patients/patient-5.json
// The file's shape is { id, name, age, sex, profile: {...} }.
export async function loadProfileFromUrl(url: string): Promise<{ name: string; profile: OfflineProfile }> {
  const clean = url.trim();
  if (!/^https?:\/\//i.test(clean)) {
    throw new Error('Enter a full link that starts with http:// or https://');
  }
  const res = await fetch(clean, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Could not load the patient (server said ${res.status}).`);
  const data = await res.json();
  const p = data && data.profile ? data.profile : data; // tolerate either shape
  if (!p || typeof p !== 'object') throw new Error('That link did not return a patient.');

  const current = await readProfile();
  const merged: OfflineProfile = {
    ...current,
    conditions: Array.isArray(p.conditions) ? p.conditions : current.conditions,
    medications: Array.isArray(p.medications) ? p.medications : current.medications,
    allergies: Array.isArray(p.allergies) ? p.allergies : current.allergies,
    medical_history: typeof p.medical_history === 'string' ? p.medical_history : current.medical_history,
    biomarkers: typeof p.biomarkers === 'string' ? p.biomarkers : current.biomarkers,
    smoking_status: typeof p.smoking_status === 'string' ? p.smoking_status : current.smoking_status,
    alcohol_use: typeof p.alcohol_use === 'string' ? p.alcohol_use : current.alcohol_use,
    pregnancy_status: typeof p.pregnancy_status === 'string' ? p.pregnancy_status : current.pregnancy_status,
    travel_radius_miles: typeof p.travel_radius_miles === 'number' ? p.travel_radius_miles : current.travel_radius_miles,
  };
  await writeProfile(merged);
  return { name: (data && data.name) || 'Patient', profile: merged };
}

export async function updateProfile(data: {
  conditions: string[];
  medications: string[];
  allergies: string[];
  medical_history?: string;
  biomarkers?: string;
  smoking_status?: string;
  alcohol_use?: string;
  pregnancy_status?: string;
  travel_radius_miles: number;
}) {
  const current = await readProfile();
  return writeProfile({
    ...current,
    conditions: data.conditions,
    medications: data.medications,
    allergies: data.allergies,
    medical_history: data.medical_history ?? '',
    biomarkers: data.biomarkers ?? '',
    smoking_status: data.smoking_status ?? '',
    alcohol_use: data.alcohol_use ?? '',
    pregnancy_status: data.pregnancy_status ?? '',
    travel_radius_miles: data.travel_radius_miles,
  });
}
