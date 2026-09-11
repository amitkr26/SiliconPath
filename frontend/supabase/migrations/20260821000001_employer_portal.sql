-- Employer Portal Schema Extensions
-- Phase 7.9: Employer Portal Rebuild
-- Purpose: Additive schema changes supporting the employer portal feature set.
-- DO NOT modify existing columns/types. All changes are opt-in via RLS policies.
-- Apply via: supabase db push (or run migration SQL against production DB).

-- 1. opportunities: ownership + status + screening questions
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS job_status text DEFAULT 'active' CHECK (job_status IN ('draft','active','paused','closed'));
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS screening_questions jsonb DEFAULT '[]';
-- Index for employer ownership queries
CREATE INDEX IF NOT EXISTS idx_opportunities_created_by ON opportunities(created_by);

-- 2. company_claims: formal organization claim workflow
-- Employer requests claim → Admin reviews → Approved/Rejected → org ownership established.
CREATE TABLE IF NOT EXISTS company_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  claimed_by uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE company_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access on company_claims" ON company_claims FOR ALL USING (true) WITH CHECK (true);
-- Employer can view own pending claims
CREATE POLICY "Employer own pending claims" ON company_claims FOR SELECT USING (claimed_by = auth.uid() AND status = 'pending');
-- Admin can review any claim
CREATE POLICY "Admin review claims" ON company_claims FOR ALL USING (true);

-- 3. recruiter_saved_candidates: recruiter collections of candidates
-- employer_id → candidate_id pair, reusable across hiring cycles.
CREATE TABLE IF NOT EXISTS recruiter_saved_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  candidate_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  note text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(employer_id, candidate_id)
);
ALTER TABLE recruiter_saved_candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Employer own saved candidates" ON recruiter_saved_candidates FOR SELECT USING (employer_id = auth.uid());
CREATE POLICY "Admin full access on recruiter_saved_candidates" ON recruiter_saved_candidates FOR ALL USING (true);

-- 4. Unique case-insensitive username index
-- Ensures global username uniqueness; used by /api/username/check endpoint.
CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_username_lower_key ON user_profiles (lower(username));

-- 5. Screening questions help text default empty array (already handled above via column)
-- Ensure RLS is on
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
-- Policy: anyone can view active opportunities (existing policy preserved)

-- 6. Migration verification checklist
--   - [ ] Apply migration with supabase db push
--   - [ ] Verify created_by populated for existing employer-posted jobs (set NULL, OK)
--   - [ ] Verify job_status defaults to 'active' for existing active jobs
--   - [ ] Verify lower(username) index does not break existing usernames
--   - [ ] Run npx tsc --noEmit after migration
--   - [ ] Run npm test after migration

-- 7. Employer settings: recruiter preference persistence
-- Stores per-employer notification and digest preferences.
CREATE TABLE IF NOT EXISTS employer_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  email_alerts text NOT NULL DEFAULT 'true' CHECK (email_alerts IN ('true','false')),
  instant_applicant_alert text NOT NULL DEFAULT 'true' CHECK (instant_applicant_alert IN ('true','false')),
  weekly_digest text NOT NULL DEFAULT 'true' CHECK (weekly_digest IN ('true','false')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE employer_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Employer own settings" ON employer_settings FOR ALL USING (employer_id = auth.uid());
CREATE POLICY "Admin full access on employer_settings" ON employer_settings FOR ALL USING (true);

-- 8. Workspace members persistence (code references workspace_members table)
-- Stores workspace members with roles (Owner, Admin, Recruiter, Hiring Manager).
-- Linked to employer for ownership scoping.
CREATE TABLE IF NOT EXISTS workspace_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'recruiter' CHECK (role IN ('owner','admin','recruiter','hiring_manager')),
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(employer_id, email)
);
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Employer own workspace members" ON workspace_members FOR ALL USING (employer_id = auth.uid());
CREATE POLICY "Admin full access on workspace_members" ON workspace_members FOR ALL USING (true);

-- End of migration