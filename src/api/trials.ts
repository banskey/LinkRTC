// Trials api with a DATA SOURCE switch:
//   'demo' -> bundled trials.json (offline, no internet)
//   'live' -> fresh fetch from ClinicalTrials.gov over the phone's internet
// Same function names/shapes either way, so the screens are unchanged.
import trialsData from '../data/trials.json';
import { getMatches as runMatch, type Trial } from '../data/matching';
import { toFullTrial } from '../data/mapTrial';
import { fetchLiveTrials } from '../data/liveApi';
import { fetchServerTrials } from '../data/githubServer';
import { getUserLocation } from '../data/userLocation';
import {
  readProfile, readSavedIds, setSaved, removeSaved, readDataSource, readServerUrl,
} from '../data/store';

const DEMO_TRIALS = trialsData as unknown as Trial[];
const demoById = new Map(DEMO_TRIALS.map((t) => [t.id, t]));

// Cache of the most recent LIVE/SERVER pull so detail/saved screens resolve by id.
let remoteById = new Map<string, Trial>();

async function activeTrials(): Promise<{ trials: Trial[]; source: DataSourceResult }> {
  const source = await readDataSource();
  const profile = await readProfile();
  if (source === 'live') {
    const live = await fetchLiveTrials(profile.conditions); // throws if offline
    remoteById = new Map(live.map((t) => [t.id, t]));
    return { trials: live, source: 'live' };
  }
  if (source === 'server') {
    const url = await readServerUrl();
    if (!url) throw new Error('No server URL set');
    const srv = await fetchServerTrials(url, profile.conditions); // throws if unreachable
    remoteById = new Map(srv.map((t) => [t.id, t]));
    return { trials: srv, source: 'server' };
  }
  return { trials: DEMO_TRIALS, source: 'demo' };
}

type DataSourceResult = 'demo' | 'live' | 'server';

export async function getMatches(limit = 50) {
  const profile = await readProfile();
  const saved = await readSavedIds();
  const { trials, source } = await activeTrials();
  // Distance sorting only when the active data has coordinates (live).
  const userLoc = source === 'live' ? await getUserLocation() : null;
  const matches = runMatch(trials, profile.conditions, limit, userLoc);
  return matches.map((m) =>
    toFullTrial(m.trial, {
      match_group: m.group,
      matched_conditions: m.matched_conditions,
      eligibility_summary: m.eligibility_summary,
      nearest_distance_miles: m.nearest_distance_miles,
      is_saved: Object.prototype.hasOwnProperty.call(saved, m.trial.id),
    }),
  );
}

function lookup(id: string): Trial | undefined {
  return demoById.get(id) || remoteById.get(id);
}

export async function getTrial(id: string) {
  const t = lookup(id);
  if (!t) throw new Error('Trial not found');
  const saved = await readSavedIds();
  const isSaved = Object.prototype.hasOwnProperty.call(saved, id);
  return toFullTrial(t, { is_saved: isSaved, is_interested: saved[id] === true });
}

export async function saveTrial(id: string, interested = false) {
  await setSaved(id, interested);
  return { ok: true };
}

export async function unsaveTrial(id: string) {
  await removeSaved(id);
  return { ok: true };
}

export async function getSaved() {
  const saved = await readSavedIds();
  return Object.keys(saved)
    .map((id) => lookup(id))
    .filter((t): t is Trial => !!t)
    .map((t) => ({
      id: t.id,
      trial: toFullTrial(t, { is_saved: true, is_interested: saved[t.id] === true }),
      interested: saved[t.id] === true,
      last_known_status: t.enrollment_status,
      status_changed: false,
      created_at: new Date().toISOString(),
    }));
}
