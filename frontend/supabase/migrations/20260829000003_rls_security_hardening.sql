-- ==============================================================================
-- RLS SECURITY HARDENING MIGRATION
-- Target: Supabase DB1 (aqauempuwmbizqoaolop)
-- Remediates insecure 'FOR ALL USING (true)' policies across 15+ sensitive tables.
-- ==============================================================================

-- 1. APP_CONFIG (Secrets & Platform Configuration)
ALTER TABLE IF EXISTS app_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view app config" ON app_config;
DROP POLICY IF EXISTS "Allow all access to app_config" ON app_config;
DROP POLICY IF EXISTS "app_config_full_access" ON app_config;

CREATE POLICY "Admins can view app config" ON app_config
  FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin')
    OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin')
  );

-- 2. SCRAPER PIPELINE (scrape_sources, scrape_runs)
ALTER TABLE IF EXISTS scrape_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS scrape_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on scrape_sources" ON scrape_sources;
DROP POLICY IF EXISTS "Allow all on scrape_runs" ON scrape_runs;

CREATE POLICY "Admins can view scrape sources" ON scrape_sources
  FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin')
    OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin')
  );

CREATE POLICY "Admins can view scrape runs" ON scrape_runs
  FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin')
    OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin')
  );

-- 3. RBAC & PERMISSIONS (user_roles, user_permissions)
ALTER TABLE IF EXISTS user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on user_roles" ON user_roles;
DROP POLICY IF EXISTS "Allow all on user_permissions" ON user_permissions;

CREATE POLICY "Users can view own roles" ON user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view own permissions" ON user_permissions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 4. EMPLOYER SUITE & WORKSPACES
ALTER TABLE IF EXISTS company_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS recruiter_saved_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS employer_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS workspace_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on company_claims" ON company_claims;
DROP POLICY IF EXISTS "Allow all on recruiter_saved_candidates" ON recruiter_saved_candidates;
DROP POLICY IF EXISTS "Allow all on employer_settings" ON employer_settings;
DROP POLICY IF EXISTS "Allow all on workspace_members" ON workspace_members;

CREATE POLICY "Users can manage own company claims" ON company_claims
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Recruiters can manage saved candidates" ON recruiter_saved_candidates
  FOR ALL TO authenticated
  USING (recruiter_id = auth.uid())
  WITH CHECK (recruiter_id = auth.uid());

CREATE POLICY "Employers can manage own settings" ON employer_settings
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Workspace members can view own membership" ON workspace_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 5. CANDIDATE PROFILE SUITE
ALTER TABLE IF EXISTS candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS candidate_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS candidate_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS candidate_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS candidate_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on candidate_profiles" ON candidate_profiles;
DROP POLICY IF EXISTS "Allow all on candidate_skills" ON candidate_skills;
DROP POLICY IF EXISTS "Allow all on candidate_experiences" ON candidate_experiences;
DROP POLICY IF EXISTS "Allow all on candidate_education" ON candidate_education;
DROP POLICY IF EXISTS "Allow all on candidate_projects" ON candidate_projects;

-- Public read for candidate portfolios, owner-only modifications
CREATE POLICY "Public can view candidate profiles" ON candidate_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own candidate profile" ON candidate_profiles
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Public can view candidate skills" ON candidate_skills
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own candidate skills" ON candidate_skills
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Public can view candidate experiences" ON candidate_experiences
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own candidate experiences" ON candidate_experiences
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Public can view candidate education" ON candidate_education
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own candidate education" ON candidate_education
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Public can view candidate projects" ON candidate_projects
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own candidate projects" ON candidate_projects
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 6. AI USAGE LOG (Privacy Protection)
ALTER TABLE IF EXISTS ai_usage_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow select on ai_usage_log" ON ai_usage_log;
DROP POLICY IF EXISTS "Allow all on ai_usage_log" ON ai_usage_log;

CREATE POLICY "Users can view own AI usage log" ON ai_usage_log
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 7. COMPANY_JOBS (Replace deprecated auth.role() = 'service_role')
ALTER TABLE IF EXISTS company_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on company_jobs" ON company_jobs;
DROP POLICY IF EXISTS "company_jobs_service_role" ON company_jobs;

CREATE POLICY "Public can view active company jobs" ON company_jobs
  FOR SELECT USING (is_active = true);

CREATE POLICY "Employers can manage own company jobs" ON company_jobs
  FOR ALL TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());
