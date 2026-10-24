// Maps a bundled trial (6 CSV fields) into the full object shape the screens
// expect from the old server. Fields the CSV lacks are left empty/null so the
// UI simply omits those sections.
import type { Trial } from './matching';

export function toFullTrial(t: Trial, extras?: Partial<Record<string, any>>): any {
  return {
    id: t.id,
    nct_id: t.nct_id,
    title: t.title,
    phase: t.phase,
    conditions: t.conditions,
    enrollment_status: t.enrollment_status,
    locations: t.city ? [{ city: t.city, state: 'Massachusetts', country: 'United States', facility: null }] : [],
    eligibility_inclusion: null,
    eligibility_exclusion: null,
    eligibility_sex: null,
    eligibility_min_age: null,
    eligibility_max_age: null,
    contact_name: null,
    contact_phone: null,
    contact_email: null,
    url: t.url,
    nearest_distance_miles: null,
    lat: t.lat ?? null,
    lon: t.lon ?? null,
    facility: t.facility ?? null,
    locationState: t.state ?? null,
    brief_summary: t.summary ?? null,
    sponsor: t.sponsor ?? null,
    study_type: t.study_type ?? null,
    enrollment: t.enrollment ?? null,
    ...extras,
  };
}
