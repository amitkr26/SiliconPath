-- ==============================================================================
-- MIGRATION B: Phase 31 Candidate Resume Studio & Multi-Version Architecture
-- Target: Supabase DB1 (aqauempuwmbizqoaolop)
-- Safe, additive & idempotent.
-- Preserves existing user_resumes records and extends with multi-version support.
-- ==============================================================================

-- 1. EXTEND CANONICAL USER_RESUMES TABLE WITH DOMAIN FIELDS
ALTER TABLE user_resumes ADD COLUMN IF NOT EXISTS headline TEXT;
ALTER TABLE user_resumes ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE user_resumes ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE user_resumes ADD COLUMN IF NOT EXISTS awards JSONB DEFAULT '[]'::jsonb;
ALTER TABLE user_resumes ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]'::jsonb;

-- Ensure RLS on canonical user_resumes
ALTER TABLE user_resumes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own resume" ON user_resumes;
CREATE POLICY "Users manage own resume" ON user_resumes
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. CREATE RESUME_VERSIONS TABLE (Multi-version, targeted semiconductor resumes)
CREATE TABLE IF NOT EXISTS resume_versions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  version_name    TEXT NOT NULL DEFAULT 'Primary Resume',
  target_domain   TEXT CHECK (target_domain IS NULL OR target_domain IN ('vlsi', 'embedded', 'pcb', 'firmware', 'hardware-qa', 'fpga', 'analog', 'robotics')),
  target_role     TEXT,
  is_master       BOOLEAN NOT NULL DEFAULT FALSE,
  structured_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  ats_score       INTEGER CHECK (ats_score IS NULL OR (ats_score >= 0 AND ats_score <= 100)),
  ats_feedback    JSONB DEFAULT '[]'::jsonb,
  ai_suggestions  JSONB DEFAULT '[]'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE resume_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own resume versions" ON resume_versions;
CREATE POLICY "Users manage own resume versions" ON resume_versions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_resume_versions_user ON resume_versions(user_id, is_master);
CREATE INDEX IF NOT EXISTS idx_resume_versions_domain ON resume_versions(target_domain);
