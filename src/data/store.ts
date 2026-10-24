// Local on-device store for the offline build.
// Profile + saved trials live in AsyncStorage — no server.
import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_KEY = 'offline_profile';
const SAVED_KEY = 'offline_saved';
const SOURCE_KEY = 'data_source'; // 'demo' | 'live' | 'server'
const SERVER_URL_KEY = 'server_url';

export type DataSource = 'demo' | 'live' | 'server';

export async function readDataSource(): Promise<DataSource> {
  const v = await AsyncStorage.getItem(SOURCE_KEY);
  if (v === 'live' || v === 'server') return v;
  return 'demo';
}

export async function writeDataSource(src: DataSource): Promise<void> {
  await AsyncStorage.setItem(SOURCE_KEY, src);
}

// URL of the teammate's Flask server (GitHub repo). Must be a RUNNING server —
// a LAN address like http://192.168.1.100:5000, or a deployed https URL.
export async function readServerUrl(): Promise<string> {
  return (await AsyncStorage.getItem(SERVER_URL_KEY)) || '';
}

export async function writeServerUrl(url: string): Promise<void> {
  await AsyncStorage.setItem(SERVER_URL_KEY, url.trim());
}

export interface OfflineProfile {
  conditions: string[];
  medications: string[];
  allergies: string[];
  medical_history: string;
  biomarkers: string;
  smoking_status: string;
  alcohol_use: string;
  pregnancy_status: string;
  travel_radius_miles: number;
}

const DEFAULT_PROFILE: OfflineProfile = {
  conditions: [],
  medications: [],
  allergies: [],
  medical_history: '',
  biomarkers: '',
  smoking_status: '',
  alcohol_use: '',
  pregnancy_status: '',
  travel_radius_miles: 50,
};

export async function readProfile(): Promise<OfflineProfile> {
  const raw = await AsyncStorage.getItem(PROFILE_KEY);
  if (!raw) {
    // First launch: seed a realistic demo profile. Conditions are chosen from
    // the most common ones in the bundled dataset so Matches is full on sign-in.
    const seeded: OfflineProfile = {
      ...DEFAULT_PROFILE,
      conditions: ['Breast Cancer', 'Diabetes', 'Hypertension'],
      medications: ['Metformin', 'Lisinopril'],
      allergies: ['Penicillin'],
      medical_history: 'Breast cancer diagnosed 2023. Type 2 diabetes since 2019.',
      biomarkers: 'A1C 7.1, HER2 positive',
      smoking_status: 'former',
      alcohol_use: 'occasional',
      pregnancy_status: 'not_applicable',
      travel_radius_miles: 50,
    };
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(seeded));
    return seeded;
  }
  try {
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export async function writeProfile(p: OfflineProfile): Promise<OfflineProfile> {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(p));
  return p;
}

export async function readSavedIds(): Promise<Record<string, boolean>> {
  const raw = await AsyncStorage.getItem(SAVED_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export async function setSaved(id: string, interested: boolean): Promise<void> {
  const saved = await readSavedIds();
  saved[id] = interested;
  await AsyncStorage.setItem(SAVED_KEY, JSON.stringify(saved));
}

export async function removeSaved(id: string): Promise<void> {
  const saved = await readSavedIds();
  delete saved[id];
  await AsyncStorage.setItem(SAVED_KEY, JSON.stringify(saved));
}
