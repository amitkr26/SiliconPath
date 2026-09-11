-- ==============================================================================
-- SECURITY RELEASE 1: Critical Live RLS Policy Hardening (CORRECTED & VERIFIED)
-- Target: Supabase DB1 (aqauempuwmbizqoaolop)
-- Minimum targeted hardening for 6 tables confirmed present in live DB.
-- ==============================================================================

-- 1. APP_CONFIG (Enforce Admin-only access, revoke public anon read/write)
-- Columns: id, config_key, config_value, config_type, description, created_at, updated_at
ALTER TABLE IF EXISTS app_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view app config" ON app_config;
DROP POLICY IF EXISTS "Allow all access to app_config" ON app_config;
DROP POLICY IF EXISTS "app_config_full_access" ON app_config;
DROP POLICY IF EXISTS "Admins can view app config" ON app_config;

CREATE POLICY "Admins can view app config" ON app_config
  FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin')
    OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin')
  );

-- 2. COMPANY_CLAIMS (Owner-scoped claims management)
-- Columns: id, organization_id, claimed_by, status, reviewed_by, reviewed_at, message, created_at, updated_at
ALTER TABLE IF EXISTS company_claims ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on company_claims" ON company_claims;
DROP POLICY IF EXISTS "Users can manage own company claims" ON company_claims;

CREATE POLICY "Users can manage own company claims" ON company_claims
  FOR ALL TO authenticated
  USING (claimed_by = auth.uid())
  WITH CHECK (claimed_by = auth.uid());

-- 3. RECRUITER_SAVED_CANDIDATES & EMPLOYER_SETTINGS & WORKSPACE_MEMBERS
-- Columns in recruiter_saved_candidates: id, employer_id, candidate_id, note, created_at
-- Columns in employer_settings: employer_id, email_alerts, instant_applicant_alert, weekly_digest, dm_notifications, default_stage_notes, created_at, updated_at
-- Columns in workspace_members: id, employer_id, email, role, status, created_at, updated_at

ALTER TABLE IF EXISTS recruiter_saved_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS employer_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS workspace_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on recruiter_saved_candidates" ON recruiter_saved_candidates;
DROP POLICY IF EXISTS "Allow all on employer_settings" ON employer_settings;
DROP POLICY IF EXISTS "Allow all on workspace_members" ON workspace_members;
DROP POLICY IF EXISTS "Recruiters can manage saved candidates" ON recruiter_saved_candidates;
DROP POLICY IF EXISTS "Employers can manage own settings" ON employer_settings;
DROP POLICY IF EXISTS "Workspace members can view own membership" ON workspace_members;
DROP POLICY IF EXISTS "Employers can manage own workspace members" ON workspace_members;

CREATE POLICY "Recruiters can manage saved candidates" ON recruiter_saved_candidates
  FOR ALL TO authenticated
  USING (employer_id = auth.uid())
  WITH CHECK (employer_id = auth.uid());

CREATE POLICY "Employers can manage own settings" ON employer_settings
  FOR ALL TO authenticated
  USING (employer_id = auth.uid())
  WITH CHECK (employer_id = auth.uid());

CREATE POLICY "Employers can manage own workspace members" ON workspace_members
  FOR ALL TO authenticated
  USING (employer_id = auth.uid())
  WITH CHECK (employer_id = auth.uid());

-- 4. AI_USAGE_LOG (Admin telemetry protection - no user_id column exists)
-- Columns: id, feature, provider, model, prompt_length, response_length, success, error_message, created_at, cost_estimate
ALTER TABLE IF EXISTS ai_usage_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow select on ai_usage_log" ON ai_usage_log;
DROP POLICY IF EXISTS "Allow all on ai_usage_log" ON ai_usage_log;
DROP POLICY IF EXISTS "Users can view own AI usage log" ON ai_usage_log;
DROP POLICY IF EXISTS "Admins can view ai usage log" ON ai_usage_log;

CREATE POLICY "Admins can view ai usage log" ON ai_usage_log
  FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin')
    OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin')
  );
