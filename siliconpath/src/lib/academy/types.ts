export interface AcademyTrack {
  id: string;
  title: string;
  summary: string | null;
  ordinal: number;
}

export interface AcademyUnit {
  id: string;
  track_id: string;
  day_number: number;
  title: string;
  theory_md: string | null;
  practice_md: string | null;
  lab_md: string | null;
  ordinal: number;
}

export interface AcademyVideo {
  id: string;
  unit_id: string;
  youtube_id: string;
  title: string;
  creator_name: string;
  creator_url: string;
}

export interface AcademyCheckpoint {
  id: string;
  track_id: string;
  kind: "assessment" | "capstone";
  prompt_md: string;
  pass_pct: number;
}
