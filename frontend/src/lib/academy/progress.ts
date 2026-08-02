// ponytail: localStorage progress, per-device by design; server-side accounts if cross-device sync is ever needed
import type { TrackSlug } from "./types";

const KEY = "siliconpath_academy_progress";

export interface AcademyProgress {
  completedDays: string[];
  passedTracks: string[];
}

function load(): AcademyProgress {
  if (typeof window === "undefined") return { completedDays: [], passedTracks: [] };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { completedDays: [], passedTracks: [] };
    const parsed = JSON.parse(raw);
    return {
      completedDays: Array.isArray(parsed.completedDays) ? parsed.completedDays : [],
      passedTracks: Array.isArray(parsed.passedTracks) ? parsed.passedTracks : [],
    };
  } catch {
    return { completedDays: [], passedTracks: [] };
  }
}

function save(p: AcademyProgress) {
  localStorage.setItem(KEY, JSON.stringify(p));
}

export function getCompletedDays(): string[] {
  return load().completedDays;
}

export function getPassedTracks(): TrackSlug[] {
  return load().passedTracks as TrackSlug[];
}

export function markDayComplete(dayId: string): AcademyProgress {
  const p = load();
  if (!p.completedDays.includes(dayId)) {
    p.completedDays.push(dayId);
    save(p);
  }
  return p;
}

export function setTrackStatus(trackSlug: string, passed: boolean): AcademyProgress {
  const p = load();
  if (passed) {
    if (!p.passedTracks.includes(trackSlug)) {
      p.passedTracks.push(trackSlug);
      save(p);
    }
  } else {
    p.passedTracks = p.passedTracks.filter((s) => s !== trackSlug);
    save(p);
  }
  return p;
}
