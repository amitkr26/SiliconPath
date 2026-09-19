-- ==============================================================================
-- MIGRATION: 20260907000001_remove_user_metadata_admin_bypass.sql
-- Target: Supabase DB1
-- Remediates SEC-01: Removes client-controllable user_metadata admin checks from
-- app_config, scrape_sources, scrape_runs, and ai_usage_log RLS policies.
-- Administrative access MUST be governed strictly by server-controlled app_metadata.
-- ==============================================================================

-- 1. APP_CONFIG
DROP POLICY IF EXISTS "Admins can view app config" ON app_config;
CREATE POLICY "Admins can view app config" ON app_config
  FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin')
  );

-- 2. SCRAPE_SOURCES & SCRAPE_RUNS
DROP POLICY IF EXISTS "Admins can view scrape sources" ON scrape_sources;
CREATE POLICY "Admins can view scrape sources" ON scrape_sources
  FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin')
  );

DROP POLICY IF EXISTS "Admins can view scrape runs" ON scrape_runs;
CREATE POLICY "Admins can view scrape runs" ON scrape_runs
  FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin')
  );

-- 3. AI_USAGE_LOG
DROP POLICY IF EXISTS "Admins can view ai usage log" ON ai_usage_log;
CREATE POLICY "Admins can view ai usage log" ON ai_usage_log
  FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin')
  );
