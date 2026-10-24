// OFFLINE settings api — no server. Export reads local data; the rest are no-ops.
import { readProfile, readSavedIds } from '../data/store';

export async function exportData() {
  const profile = await readProfile();
  const saved = await readSavedIds();
  return { profile, saved_trial_ids: Object.keys(saved) };
}

export async function updateFCMToken(_token: string) {
  return { ok: true };
}

export async function setNotificationPreference(_enabled: boolean) {
  return { ok: true };
}

export async function deleteAccount() {
  return { ok: true };
}
