-- ==============================================================================
-- ROLLBACK SCRIPT FOR SECURITY RELEASE 1 (CORRECTED)
-- Target: Supabase DB1 (aqauempuwmbizqoaolop)
-- Restores previous state if needed.
-- ==============================================================================

-- 1. APP_CONFIG
DROP POLICY IF EXISTS "Admins can view app config" ON app_config;
CREATE POLICY "Public can view app config" ON app_config
  FOR ALL USING (true);

-- 2. COMPANY_CLAIMS
DROP POLICY IF EXISTS "Users can manage own company claims" ON company_claims;
CREATE POLICY "Allow all on company_claims" ON company_claims
  FOR ALL USING (true);

-- 3. RECRUITER_SAVED_CANDIDATES & EMPLOYER_SETTINGS & WORKSPACE_MEMBERS
DROP POLICY IF EXISTS "Recruiters can manage saved candidates" ON recruiter_saved_candidates;
CREATE POLICY "Allow all on recruiter_saved_candidates" ON recruiter_saved_candidates
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Employers can manage own settings" ON employer_settings;
CREATE POLICY "Allow all on employer_settings" ON employer_settings
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Employers can manage own workspace members" ON workspace_members;
DROP POLICY IF EXISTS "Workspace members can view own membership" ON workspace_members;
CREATE POLICY "Allow all on workspace_members" ON workspace_members
  FOR ALL USING (true);

-- 4. AI_USAGE_LOG
DROP POLICY IF EXISTS "Admins can view ai usage log" ON ai_usage_log;
DROP POLICY IF EXISTS "Users can view own AI usage log" ON ai_usage_log;
CREATE POLICY "Allow select on ai_usage_log" ON ai_usage_log
  FOR SELECT USING (true);
