// src/lib/academy/progress-local.ts
// localStorage abstraction for anonymous user progress tracking.

export interface LocalProgress {
  completedDays: Record<string, string[]>; // trackSlug -> [dayId, ...]
  passedTracks: string[]; // track slugs
  lastActivity: Record<string, string>; // trackSlug -> ISO date
}

const STORAGE_KEY = "bdw_academy_progress_v1";
const ASSESSMENT_KEY = "bdw_academy_assessments_v1";

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage unavailable or full — silent fail
  }
}

function getRaw(): LocalProgress {
  return safeGet<LocalProgress>(STORAGE_KEY, {
    completedDays: {},
    passedTracks: [],
    lastActivity: {},
  });
}

function saveRaw(data: LocalProgress): void {
  safeSet(STORAGE_KEY, data);
}

export function getLocalProgress(): LocalProgress {
  return getRaw();
}

export function markDayCompleteLocal(trackSlug: string, dayId: string): void {
  const data = getRaw();
  const existing = data.completedDays[trackSlug] || [];
  if (!existing.includes(dayId)) {
    existing.push(dayId);
  }
  data.completedDays[trackSlug] = existing;
  data.lastActivity[trackSlug] = new Date().toISOString();
  saveRaw(data);
}

export function markTrackPassedLocal(trackSlug: string): void {
  const data = getRaw();
  if (!data.passedTracks.includes(trackSlug)) {
    data.passedTracks.push(trackSlug);
  }
  data.lastActivity[trackSlug] = new Date().toISOString();
  saveRaw(data);
}

export function getCompletedDaysLocal(trackSlug: string): string[] {
  return getRaw().completedDays[trackSlug] || [];
}

export function getPassedTracksLocal(): string[] {
  return getRaw().passedTracks;
}

export function getLastActivityLocal(trackSlug: string): string | null {
  return getRaw().lastActivity[trackSlug] || null;
}

// --- Assessment results (separate key) ---

export interface LocalAssessmentResult {
  scorePercent: number;
  passed: boolean;
  trackSlug: string;
  completedAt: string; // ISO date
}

function getAssessmentsRaw(): LocalAssessmentResult[] {
  return safeGet<LocalAssessmentResult[]>(ASSESSMENT_KEY, []);
}

export function saveAssessmentResultLocal(result: LocalAssessmentResult): void {
  const results = getAssessmentsRaw();
  // Replace existing result for this track if present
  const filtered = results.filter((r) => r.trackSlug !== result.trackSlug);
  filtered.push(result);
  safeSet(ASSESSMENT_KEY, filtered);
}

export function getAssessmentResultLocal(trackSlug: string): LocalAssessmentResult | null {
  return getAssessmentsRaw().find((r) => r.trackSlug === trackSlug) || null;
}
