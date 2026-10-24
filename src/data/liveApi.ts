// Live ClinicalTrials.gov v2 API client. PUBLIC API — no key required.
// Uses the phone's internet. Normalizes the response into the same Trial shape
// the bundled data uses, so the matcher and screens work unchanged.
import type { Trial } from './matching';

const BASE = 'https://clinicaltrials.gov/api/v2/studies';

// stable id from the NCT id (so saved trials persist across refreshes)
function idFromNct(nct: string): string {
  // simple deterministic hash -> uuid-ish string
  let h = 0;
  for (let i = 0; i < nct.length; i++) h = (h * 31 + nct.charCodeAt(i)) >>> 0;
  return `live-${nct}-${h}`;
}

const STATUS_MAP: Record<string, string> = {
  RECRUITING: 'recruiting',
  ACTIVE_NOT_RECRUITING: 'active',
  COMPLETED: 'completed',
  NOT_YET_RECRUITING: 'not_yet_recruiting',
};

function normalize(study: any): Trial | null {
  const ps = study?.protocolSection;
  if (!ps) return null;
  const nct = ps.identificationModule?.nctId;
  if (!nct) return null;
  const title = ps.identificationModule?.briefTitle || nct;
  const conditions: string[] = ps.conditionsModule?.conditions || [];
  const phases: string[] = ps.designModule?.phases || [];
  const status = (ps.statusModule?.overallStatus || '').toUpperCase();
  const locs = ps.contactsLocationsModule?.locations || [];

  // Prefer a Massachusetts location; otherwise the first one with coordinates.
  const ma = locs.find((l: any) => (l.state || '').toLowerCase() === 'massachusetts');
  const withGeo = locs.find((l: any) => l.geoPoint?.lat != null);
  const chosen = ma || withGeo || locs[0] || {};
  const firstCity = chosen.city || chosen.state || 'See study';

  return {
    id: idFromNct(nct),
    nct_id: nct,
    title,
    phase: phases.length ? phases.join(', ') : null,
    conditions,
    city: firstCity,
    enrollment_status: STATUS_MAP[status] || 'recruiting',
    url: `https://clinicaltrials.gov/study/${nct}`,
    lat: chosen.geoPoint?.lat ?? null,
    lon: chosen.geoPoint?.lon ?? null,
    facility: chosen.facility ?? null,
    state: chosen.state ?? null,
    summary: ps.descriptionModule?.briefSummary ?? null,
    sponsor: ps.sponsorCollaboratorsModule?.leadSponsor?.name ?? null,
    study_type: ps.designModule?.studyType ?? null,
    enrollment: ps.designModule?.enrollmentInfo?.count ?? null,
  };
}

// Fetch recruiting trials matching the user's conditions from the live API.
// Queries each condition, merges and de-dupes. Throws on network failure so the
// UI can show an offline message.
export async function fetchLiveTrials(conditions: string[], perCondition = 50): Promise<Trial[]> {
  const terms = conditions.length ? conditions : ['clinical trial'];
  const seen = new Set<string>();
  const out: Trial[] = [];
  const fields = [
    'NCTId', 'BriefTitle', 'Phase', 'Condition',
    'OverallStatus', 'LocationCity', 'LocationState',
    'LocationGeoPoint', 'LocationFacility',
    'BriefSummary', 'StudyType', 'EnrollmentCount', 'LeadSponsorName',
  ].join(',');

  for (const term of terms.slice(0, 5)) {
    const url =
      `${BASE}?query.cond=${encodeURIComponent(term)}` +
      `&query.locn=Massachusetts` +
      `&filter.overallStatus=RECRUITING` +
      `&pageSize=${perCondition}&fields=${fields}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`API ${res.status}`);
    const data = await res.json();
    for (const study of data.studies || []) {
      const t = normalize(study);
      if (t && !seen.has(t.nct_id)) {
        seen.add(t.nct_id);
        out.push(t);
      }
    }
  }
  return out;
}
