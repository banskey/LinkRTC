// Client for the teammate's Flask server (GitHub repo:
// Tanob1/Hackachusetts2026-Clinical_Trial_Matcher).
//
// IMPORTANT: a GitHub repo is code, not a running server. This client needs the
// Flask app to actually be RUNNING at `baseUrl` — either on a computer on the
// same network, or deployed to a public host. The URL is set in Settings.
//
// Endpoints (from app.py): /api/trials/search, /api/matches/<patient_id>, /health
import type { Trial } from './matching';

const STATUS_MAP: Record<string, string> = {
  RECRUITING: 'recruiting',
  ACTIVE_NOT_RECRUITING: 'active',
  COMPLETED: 'completed',
  NOT_YET_RECRUITING: 'not_yet_recruiting',
};

function normalize(t: any): Trial | null {
  const nct = t.nct_id || t.nctId || t.id;
  if (!nct) return null;
  const conditions = Array.isArray(t.conditions)
    ? t.conditions
    : (typeof t.conditions === 'string' ? t.conditions.split(',').map((s: string) => s.trim()) : []);
  return {
    id: `gh-${nct}`,
    nct_id: String(nct),
    title: t.title || t.brief_title || String(nct),
    phase: t.phase || null,
    conditions,
    city: t.city || t.location || 'See study',
    enrollment_status: STATUS_MAP[(t.status || '').toUpperCase()] || 'recruiting',
    url: t.url || `https://clinicaltrials.gov/study/${nct}`,
  };
}

// Confirm the server is reachable (used before switching).
export async function pingServer(baseUrl: string): Promise<boolean> {
  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/health`, {
      headers: { Accept: 'application/json' },
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Fetch trials from the Flask server, filtered by the user's conditions.
export async function fetchServerTrials(baseUrl: string, conditions: string[]): Promise<Trial[]> {
  const base = baseUrl.replace(/\/$/, '');
  const terms = conditions.length ? conditions : ['cancer'];
  const seen = new Set<string>();
  const out: Trial[] = [];

  for (const term of terms.slice(0, 5)) {
    const res = await fetch(`${base}/api/trials/search?q=${encodeURIComponent(term)}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`server ${res.status}`);
    const data = await res.json();
    const list = Array.isArray(data) ? data : (data.trials || data.results || []);
    for (const row of list) {
      const t = normalize(row);
      if (t && !seen.has(t.nct_id)) {
        seen.add(t.nct_id);
        out.push(t);
      }
    }
  }
  return out;
}
