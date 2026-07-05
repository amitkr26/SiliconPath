// src/lib/academy/types.ts
// Shared TypeScript types for the VLSI Academy learning path feature

export type TrackSlug =
  | 'digital-logic'
  | 'verilog'
  | 'systemverilog'
  | 'uvm'
  | 'rtl-design'
  | 'physical-design'
  | 'interview-prep';

export interface LearningTrack {
  id: string;
  slug: TrackSlug;
  title: string;
  description: string;
  short_description: string;
  order_index: number;
  estimated_days: number;
  estimated_hours: number;
  color: string;
  icon: string;
  prerequisites: TrackSlug[];
  is_published: boolean;
}

export interface LearningDay {
  id: string;
  track_id: string;
  day_number: number;
  title: string;
  theory_summary: string | null;
  key_concepts: string[];
  estimated_minutes: number;
  practice_links: PracticeLink[] | null;
}

export interface PracticeLink {
  label: string;
  url: string;
  type: 'practice' | 'tool' | 'quiz' | 'reading';
}

export interface LearningResource {
  id: string;
  day_id: string;
  resource_type: 'youtube_video' | 'youtube_playlist_item' | 'article_link';
  youtube_video_id: string | null;
  youtube_playlist_id: string | null;
  title: string;
  channel_name: string;
  channel_url: string;
  video_url: string | null;
  duration_seconds: number | null;
  thumbnail_url: string | null;
  is_available: boolean;
  order_index: number;
  watch_from_seconds: number | null;
  watch_to_seconds: number | null;
  notes: string | null;
}

export interface LearningQuestion {
  id: string;
  day_id: string;
  question_type: 'mcq' | 'short_answer' | 'coding' | 'truefalse';
  question: string;
  options: { label: string; value: string }[] | null;
  correct_answer: string;
  explanation: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  order_index: number;
}

export interface TrackAssessment {
  id: string;
  track_id: string;
  title: string;
  description: string | null;
  passing_score_percent: number;
  time_limit_minutes: number | null;
  questions: AssessmentQuestion[];
}

export interface AssessmentQuestion {
  q: string;
  type: 'mcq' | 'short_answer';
  options?: string[];
  correct: string;
  exp: string;
}

export interface UserProgress {
  completed_day_ids: string[];
  passed_track_slugs: TrackSlug[];
}

// Composite: full day data for page render
export interface DayPageData {
  track: LearningTrack;
  day: LearningDay;
  resources: LearningResource[];
  questions: LearningQuestion[];
  prev_day: number | null;
  next_day: number | null;
  total_days: number;
  user_completed: boolean;
}
