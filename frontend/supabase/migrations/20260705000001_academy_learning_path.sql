-- target: supabase_db1
-- ============================================================
-- BerojgarDegreeWala VLSI Academy — Learning Path Schema
-- Migration: 20260705000001_academy_learning_path.sql
-- DB: Primary Supabase (db1) — aqauempuwmbizqoaolop
-- ============================================================

-- 1. Learning Tracks (7 sequential tracks, gated progression)
CREATE TABLE IF NOT EXISTS learning_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  short_description text,
  order_index integer NOT NULL,
  estimated_days integer,
  estimated_hours integer,
  color text,                          -- hex color for UI differentiation
  icon text,                           -- lucide icon name
  prerequisites text[],                -- array of track slugs that must be passed first
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Day-wise content within a track
CREATE TABLE IF NOT EXISTS learning_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id uuid NOT NULL REFERENCES learning_tracks(id) ON DELETE CASCADE,
  day_number integer NOT NULL,
  title text NOT NULL,
  theory_summary text,                 -- markdown-formatted theory (original writing)
  key_concepts text[],                 -- array of key concept terms for this day
  estimated_minutes integer,
  practice_links jsonb,                -- [{label, url, type}] for HDLBits, EDA Playground etc.
  created_at timestamptz DEFAULT now(),
  UNIQUE(track_id, day_number)
);

-- 3. Resources per day (videos, articles — embed only, always attributed)
CREATE TABLE IF NOT EXISTS learning_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id uuid NOT NULL REFERENCES learning_days(id) ON DELETE CASCADE,
  resource_type text NOT NULL CHECK(resource_type IN ('youtube_video', 'youtube_playlist_item', 'article_link')),
  youtube_video_id text,               -- 11-char YT video ID for iframe embed
  youtube_playlist_id text,            -- optional: playlist context for the video
  title text NOT NULL,
  channel_name text NOT NULL,          -- MANDATORY attribution
  channel_url text NOT NULL,           -- MANDATORY attribution link
  video_url text,                      -- full watch URL for "Watch on YouTube" link
  duration_seconds integer,            -- cached from YT Data API
  thumbnail_url text,                  -- cached from YT Data API
  is_available boolean DEFAULT true,   -- set false when video becomes private/deleted
  last_checked_at timestamptz,         -- for weekly availability checks
  order_index integer NOT NULL DEFAULT 0,
  watch_from_seconds integer,          -- optional: deep-link start time
  watch_to_seconds integer,            -- optional: suggested stop time
  notes text,                          -- e.g. "Skip intro, start at 2:30"
  created_at timestamptz DEFAULT now()
);

-- 4. Practice questions per day
CREATE TABLE IF NOT EXISTS learning_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id uuid NOT NULL REFERENCES learning_days(id) ON DELETE CASCADE,
  question_type text NOT NULL CHECK(question_type IN ('mcq', 'short_answer', 'coding', 'truefalse')),
  question text NOT NULL,
  options jsonb,                        -- [{label, value}] for MCQ/truefalse
  correct_answer text NOT NULL,
  explanation text,
  difficulty text NOT NULL DEFAULT 'medium' CHECK(difficulty IN ('easy', 'medium', 'hard')),
  tags text[],                          -- e.g. ['timing', 'flip-flop', 'setup-hold']
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 5. End-of-track gating assessment
CREATE TABLE IF NOT EXISTS track_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id uuid NOT NULL REFERENCES learning_tracks(id) ON DELETE CASCADE UNIQUE,
  title text NOT NULL,
  description text,
  passing_score_percent integer NOT NULL DEFAULT 70,
  time_limit_minutes integer DEFAULT 30,
  questions jsonb NOT NULL,            -- [{question, options, correct_answer, explanation, difficulty}]
  created_at timestamptz DEFAULT now()
);

-- 6. User day-level progress (requires login)
CREATE TABLE IF NOT EXISTS user_learning_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id uuid NOT NULL REFERENCES learning_tracks(id),
  day_id uuid NOT NULL REFERENCES learning_days(id),
  completed_at timestamptz DEFAULT now(),
  UNIQUE(user_id, day_id)
);

-- 7. User assessment results (gating)
CREATE TABLE IF NOT EXISTS user_track_assessment_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id uuid NOT NULL REFERENCES learning_tracks(id),
  score_percent integer NOT NULL,
  passed boolean NOT NULL,
  answers_json jsonb,                  -- user's submitted answers for review
  attempted_at timestamptz DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_learning_days_track_id ON learning_days(track_id);
CREATE INDEX IF NOT EXISTS idx_learning_resources_day_id ON learning_resources(day_id);
CREATE INDEX IF NOT EXISTS idx_learning_questions_day_id ON learning_questions(day_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_track ON user_learning_progress(user_id, track_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_day ON user_learning_progress(user_id, day_id);
CREATE INDEX IF NOT EXISTS idx_assessment_results_user ON user_track_assessment_results(user_id, track_id);
CREATE INDEX IF NOT EXISTS idx_resources_available ON learning_resources(is_available) WHERE is_available = false;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE learning_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE track_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_track_assessment_results ENABLE ROW LEVEL SECURITY;

-- Public read access (browse without login — consistent with rest of platform)
CREATE POLICY "Public can read published tracks"
  ON learning_tracks FOR SELECT USING (is_published = true);

CREATE POLICY "Public can read days of published tracks"
  ON learning_days FOR SELECT USING (
    EXISTS (SELECT 1 FROM learning_tracks lt WHERE lt.id = track_id AND lt.is_published = true)
  );

CREATE POLICY "Public can read resources"
  ON learning_resources FOR SELECT USING (true);

CREATE POLICY "Public can read questions"
  ON learning_questions FOR SELECT USING (true);

CREATE POLICY "Public can read assessments"
  ON track_assessments FOR SELECT USING (true);

-- User progress — owner only
CREATE POLICY "Users manage own progress"
  ON user_learning_progress FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own assessment results"
  ON user_track_assessment_results FOR ALL USING (auth.uid() = user_id);

-- Admin write access (service role bypasses RLS)
-- No explicit admin policies needed — service role key has full access

-- ============================================================
-- SEED: 7 Learning Tracks
-- ============================================================
INSERT INTO learning_tracks (slug, title, description, short_description, order_index, estimated_days, estimated_hours, color, icon, prerequisites, is_published) VALUES
(
  'digital-logic',
  'Digital Logic Fundamentals',
  'Master the foundational building blocks of all digital systems: number systems, Boolean algebra, combinational circuits (MUX, decoder, adder), sequential circuits (flip-flops, registers, counters), and Finite State Machine design. This track is the prerequisite for everything else — complete it first.',
  'Number systems, Boolean algebra, combinational & sequential logic, FSMs',
  1, 30, 45, '#00E5FF', 'Cpu', ARRAY[]::text[], true
),
(
  'verilog',
  'Verilog HDL',
  'Learn Hardware Description Language from the ground up. Cover gate-level, dataflow, and behavioral modeling, write synthesizable RTL code, build testbenches, and simulate designs with industry-standard tools. Based on NPTEL/IIT Kharagpur curriculum + structured practice.',
  'Gate-level, behavioral modeling, testbenches, simulation',
  2, 30, 50, '#A855F7', 'Code2', ARRAY['digital-logic'], true
),
(
  'systemverilog',
  'SystemVerilog for Verification',
  'Extend Verilog with SystemVerilog constructs used in modern verification: OOP classes, randomization with constraints, virtual interfaces, functional coverage, SystemVerilog Assertions (SVA), and basic verification architecture patterns.',
  'OOP, randomization, SVA assertions, functional coverage',
  3, 30, 55, '#EC4899', 'Shield', ARRAY['verilog'], true
),
(
  'uvm',
  'Universal Verification Methodology (UVM)',
  'Industry-standard verification framework used in 95% of VLSI companies. Learn UVM component hierarchy (agent, driver, monitor, scoreboard), factory override, sequences, TLM ports, and end-to-end testbench architecture. Includes hands-on EDA Playground exercises.',
  'UVM hierarchy, sequences, factory, TLM, full testbench',
  4, 30, 60, '#F59E0B', 'TestTube', ARRAY['systemverilog'], true
),
(
  'rtl-design',
  'RTL Design & Synthesis',
  'Design synthesizable RTL for real chip flows: coding style best practices, synchronous design principles, clock domain crossing (CDC), timing constraints (SDC), logic synthesis with open-source tools (Yosys), and reading synthesis reports.',
  'Synthesizable RTL, CDC, SDC constraints, Yosys synthesis',
  5, 25, 45, '#10B981', 'Layers', ARRAY['verilog'], true
),
(
  'physical-design',
  'Physical Design & Backend',
  'The complete chip implementation flow from netlist to GDSII using open-source tools (OpenLane, Magic, ngspice, SkyWater 130nm PDK — no paid license required). Covers floorplanning, placement, clock tree synthesis (CTS), routing, STA signoff, DRC/LVS.',
  'OpenLane flow, floorplan, CTS, routing, STA, DRC/LVS',
  6, 35, 70, '#F97316', 'Layers3', ARRAY['rtl-design'], true
),
(
  'interview-prep',
  'VLSI Interview Preparation',
  'Structured preparation for VLSI job interviews at companies like Intel, Qualcomm, MediaTek, Samsung, NVIDIA, and Indian semiconductor startups. Covers technical topics (digital design, verification, PD), behavioral questions, and company-specific patterns.',
  'Technical MCQs, coding rounds, behavioral prep, company patterns',
  7, 20, 35, '#6366F1', 'Trophy', ARRAY['digital-logic'], true
)
ON CONFLICT (slug) DO NOTHING;
