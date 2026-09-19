-- target: supabase_db1
-- ============================================================================
-- BerojgarDegreeWala v2 :: resumes table (Supabase Project 2, social/user DB)
-- Run in the SECONDARY project SQL editor. Powers the resume builder.
-- ============================================================================

DROP TABLE IF EXISTS resumes CASCADE;

CREATE TABLE resumes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  full_name    TEXT,
  headline     TEXT,
  summary      TEXT,
  location     TEXT,
  email        TEXT,
  phone        TEXT,
  education    JSONB DEFAULT '[]',
  experience   JSONB DEFAULT '[]',
  projects     JSONB DEFAULT '[]',
  skills       TEXT[] DEFAULT '{}',
  ats_score    INTEGER DEFAULT 0,
  updated_at   TIMESTAMPTZ DEFAULT now(),
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "manage own resume" ON resumes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
