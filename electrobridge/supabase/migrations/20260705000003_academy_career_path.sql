-- ============================================================
-- SiliconPath VLSI Academy — Career Path Schema (Merged & Corrected)
-- Migration: 20260705000003_academy_career_path.sql
-- DB: Primary Supabase (db1) — aqauempuwmbizqoaolop
-- ============================================================

-- 1. Learning Tracks
CREATE TABLE IF NOT EXISTS learning_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  order_index integer NOT NULL UNIQUE,
  unlock_condition text,
  description text,
  created_at timestamptz DEFAULT now()
);

-- 2. Learning Days (Curriculum Content)
CREATE TABLE IF NOT EXISTS learning_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id uuid NOT NULL REFERENCES learning_tracks(id) ON DELETE CASCADE,
  day_number integer NOT NULL,
  title text NOT NULL,
  theory_ref text,                     -- external reference link
  theory_summary text,                 -- detailed markdown text
  video_ref text,                      -- YouTube Video ID or URL
  video_start_ts integer,              -- start seconds
  video_end_ts integer,                -- end seconds
  practice_ref text,                   -- external practice link (e.g. EDA Playground)
  coding_task text,                    -- coding lab description
  interview_qs jsonb,                  -- array of [{question, answer}]
  created_at timestamptz DEFAULT now(),
  UNIQUE(track_id, day_number)
);

-- 3. Scraped Resource Bank
CREATE TABLE IF NOT EXISTS resource_bank (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_tag text,
  resource_type text NOT NULL CHECK (resource_type IN ('video', 'playlist', 'article')),
  url text NOT NULL UNIQUE,
  channel_name text,
  channel_url text,
  quality_score numeric DEFAULT 0.0,
  difficulty_level text CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  status text NOT NULL DEFAULT 'unverified' CHECK (status IN ('unverified', 'verified', 'flagged')),
  last_checked_at timestamptz DEFAULT now()
);

-- 4. Track Checkpoints & Assessments
CREATE TABLE IF NOT EXISTS track_checkpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id uuid NOT NULL UNIQUE REFERENCES learning_tracks(id) ON DELETE CASCADE,
  assessment_questions_ref jsonb,      -- array of [{question, options, correct_answer}]
  capstone_brief text,                 -- capstone project instructions
  created_at timestamptz DEFAULT now()
);

-- 5. User Progress Tracking (Requires Login)
CREATE TABLE IF NOT EXISTS user_learning_progress (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id uuid NOT NULL REFERENCES learning_tracks(id) ON DELETE CASCADE,
  day_number integer NOT NULL,
  status text NOT NULL CHECK (status IN ('in_progress', 'completed')),
  checkpoint_score integer,
  capstone_submitted_at timestamptz,
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, track_id, day_number)
);

-- ============================================================
-- ENABLE RLS (Row Level Security)
-- ============================================================

ALTER TABLE learning_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE track_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_learning_progress ENABLE ROW LEVEL SECURITY;

-- Public read access policies
CREATE POLICY "Public read on learning_tracks" ON learning_tracks FOR SELECT USING (true);
CREATE POLICY "Public read on learning_days" ON learning_days FOR SELECT USING (true);
CREATE POLICY "Public read on resource_bank" ON resource_bank FOR SELECT USING (true);
CREATE POLICY "Public read on track_checkpoints" ON track_checkpoints FOR SELECT USING (true);

-- User-only access policies for progress tracking
CREATE POLICY "Users can manage own progress"
  ON user_learning_progress
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admin full access policies (for seeding / scraping)
CREATE POLICY "Admin write on learning_tracks" ON learning_tracks FOR ALL TO authenticated USING (auth.jwt() ->> 'email' = 'amitkr26@gmail.com' OR auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin write on learning_days" ON learning_days FOR ALL TO authenticated USING (auth.jwt() ->> 'email' = 'amitkr26@gmail.com' OR auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin write on resource_bank" ON resource_bank FOR ALL TO authenticated USING (auth.jwt() ->> 'email' = 'amitkr26@gmail.com' OR auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin write on track_checkpoints" ON track_checkpoints FOR ALL TO authenticated USING (auth.jwt() ->> 'email' = 'amitkr26@gmail.com' OR auth.jwt() ->> 'role' = 'admin');

-- ============================================================
-- SEED INITIAL TRACKS (Phase 1.3)
-- ============================================================

INSERT INTO learning_tracks (name, order_index, unlock_condition, description) VALUES
(
  'Digital Design (RTL)',
  1,
  NULL,
  'Master Digital Logic Fundamentals, combinational/sequential circuit design, finite state machines, and RTL hardware modeling using Verilog.'
),
(
  'Verification (SystemVerilog + UVM)',
  2,
  'Pass Track 1 Digital Design (RTL) Checkpoint & Capstone Project',
  'Deep dive into modern hardware verification methodologies. Master SystemVerilog OOP, testbench architecture, functional coverage, and the Universal Verification Methodology (UVM) standard.'
),
(
  'Physical Design (Backend) + Interview Prep',
  3,
  'Pass Track 2 Verification Checkpoint & Capstone Project',
  'Learn physical implementation steps: synthesis, floorplanning, placement, clock tree synthesis (CTS), routing, static timing analysis (STA), and prepare for standard core VLSI engineering interviews.'
)
ON CONFLICT (order_index) DO UPDATE
SET name = EXCLUDED.name,
    unlock_condition = EXCLUDED.unlock_condition,
    description = EXCLUDED.description;
