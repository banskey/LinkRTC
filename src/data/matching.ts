// On-device matching engine.
// Ported from the server's app/matching.py (core logic). Because the bundled
// CSV carries only nct_id/title/phase/conditions/city/status, the offline
// matcher uses the fields that exist: condition overlap (hard filter) and
// recruiting-first ordering. Distance/age/sex filters from the server are not
// applied here because the bundled data does not include that detail.

export interface Trial {
  id: string;
  nct_id: string;
  title: string;
  phase: string | null;
  conditions: string[];
  city: string;
  enrollment_status: string;
  url: string;
  // Optional — only populated by LIVE data (ClinicalTrials.gov). Demo data omits these.
  lat?: number | null;
  lon?: number | null;
  facility?: string | null;
  state?: string | null;
  summary?: string | null;
  sponsor?: string | null;
  study_type?: string | null;
  enrollment?: number | null;
}

export interface Match {
  trial: Trial;
  score: number;
  matched_conditions: string[];
  group: string;
  eligibility_summary: string;
  nearest_distance_miles: number | null;
}

const STOP = new Set([
  'the','and','or','of','to','in','for','with','without','a','an','is','are',
  'be','must','have','has','who','which','that','this','all','any','no','not',
]);

function tokenize(text: string | null | undefined): Set<string> {
  if (!text) return new Set();
  const toks = text.toLowerCase().match(/[a-z0-9]+/g) || [];
  return new Set(toks.filter((t) => t.length > 2 && !STOP.has(t)));
}

function neutralGroup(matched: string[]): string {
  if (matched.length === 0) return 'Related study';
  if (matched.length === 1) return `Matches your condition: ${matched[0]}`;
  return `Matches your conditions: ${matched.join(', ')}`;
}

function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a1 = (lat1 * Math.PI) / 180;
  const a2 = (lat2 * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a1) * Math.cos(a2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Score one trial. `userConditions` are the person's OWN condition strings;
// we report back only those, never the trial's full condition list, so the
// card says exactly which of the USER's conditions this trial is relevant to.
function scoreTrial(
  trial: Trial,
  userConditions: string[],
  userLoc: { lat: number; lon: number } | null,
): Match | null {
  const trialTokens = new Set<string>();
  for (const c of trial.conditions) for (const t of tokenize(c)) trialTokens.add(t);

  // Which of the USER's conditions does this trial touch? (phrase-level)
  const matched: string[] = [];
  for (const uc of userConditions) {
    const ucTokens = [...tokenize(uc)];
    if (ucTokens.length && ucTokens.some((t) => trialTokens.has(t))) matched.push(uc);
  }
  if (matched.length === 0) return null; // hard filter: must touch a user condition

  let score = matched.length * 40;
  if (trial.enrollment_status === 'recruiting') score += 10;
  else if (trial.enrollment_status === 'not_yet_recruiting') score += 5;

  // Distance (only when both the trial and the user have coordinates — live data)
  let distance: number | null = null;
  if (userLoc && typeof trial.lat === 'number' && typeof trial.lon === 'number') {
    distance = haversineMiles(userLoc.lat, userLoc.lon, trial.lat, trial.lon);
    // closer = higher score
    if (distance <= 10) score += 30;
    else if (distance <= 25) score += 20;
    else if (distance <= 50) score += 12;
    else if (distance <= 100) score += 6;
  }

  const parts: string[] = [];
  if (trial.city) parts.push(trial.city);
  if (trial.phase) parts.push(trial.phase);

  return {
    trial,
    score,
    matched_conditions: matched,
    group: neutralGroup(matched),
    eligibility_summary: parts.join(' · '),
    nearest_distance_miles: distance != null ? Math.round(distance) : null,
  };
}

export function getMatches(
  trials: Trial[],
  conditions: string[],
  limit = 50,
  userLoc: { lat: number; lon: number } | null = null,
): Match[] {
  const cleaned = conditions.map((c) => c.trim()).filter(Boolean);
  if (cleaned.length === 0) return [];

  const results: Match[] = [];
  for (const trial of trials) {
    const m = scoreTrial(trial, cleaned, userLoc);
    if (m) results.push(m);
  }
  // Sort: recruiting first, then NEAREST first (when distance known), then score.
  results.sort((a, b) => {
    const ar = a.trial.enrollment_status === 'recruiting' ? 0 : 1;
    const br = b.trial.enrollment_status === 'recruiting' ? 0 : 1;
    if (ar !== br) return ar - br;
    const ad = a.nearest_distance_miles ?? Infinity;
    const bd = b.nearest_distance_miles ?? Infinity;
    if (ad !== bd) return ad - bd;
    return b.score - a.score;
  });
  return results.slice(0, limit);
}
