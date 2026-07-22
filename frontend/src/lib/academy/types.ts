// src/lib/academy/types.ts

export type TrackSlug = 'digital-logic' | 'verilog' | 'systemverilog' | 'uvm' | 'rtl-design' | 'physical-design' | 'interview-prep';

export interface LearningTrack {
  id: string;
  name: string;
  title: string;
  slug: TrackSlug;
  order_index: number;
  unlock_condition: string | null;
  description: string | null;
  estimated_days: number;
  estimated_hours: number;
  color: string;
  icon: string;
  prerequisites: TrackSlug[];
}

export interface LearningDay {
  id: string;
  track_id: string;
  day_number: number;
  title: string;
  theory_ref: string | null;
  theory_summary: string | null;
  video_ref: string | null;
  video_start_ts: number | null;
  video_end_ts: number | null;
  practice_ref: string | null;
  coding_task: string | null;
  interview_qs: { question: string; answer: string }[] | null;
  checkpoint_quiz: { question: string; options: string[]; correct_answer: string }[] | null;
  // Backward compatibility fields
  key_concepts?: string[];
  estimated_minutes?: number;
  practice_links?: { label: string; url: string; type: string }[];
}

export interface ResourceBankItem {
  id: string;
  topic_tag: string | null;
  resource_type: 'video' | 'playlist' | 'article';
  url: string;
  channel_name: string | null;
  channel_url: string | null;
  quality_score: number | null;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | null;
  status: 'unverified' | 'verified' | 'flagged';
  last_checked_at: string | null;
}

export interface TrackCheckpoint {
  id: string;
  track_id: string;
  assessment_questions_ref: { question: string; options: string[]; correct_answer: string }[] | null;
  capstone_brief: string | null;
}

export interface UserProgressItem {
  user_id: string;
  track_id: string;
  day_number: number;
  status: 'in_progress' | 'completed';
  checkpoint_score: number | null;
  capstone_submitted_at: string | null;
}

// Backward compatibility interfaces
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

export interface LearningResource {
  id: string;
  day_id: string;
  resource_type: 'youtube_video' | 'youtube_playlist_item' | 'article_link';
  youtube_video_id: string | null;
  title: string;
  channel_name: string;
  channel_url: string;
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
}
