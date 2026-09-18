-- target: supabase_db1
-- ═══════════════════════════════════════════════════════════════
-- BerojgarDegreeWala — RLS Permissive Policy Cleanup (2026-09-17)
--
-- Removes remaining permissive policies that expose or grant write
-- access on sensitive/internal tables to the anon and authenticated
-- roles:
--
--   * candidate_* (cv entities)      — "Admin full access" FOR ALL USING(true)
--                                      = ANY logged-in user could read/write/
--                                      delete ANY candidate's data. Keeps the
--                                      existing "Candidate manage own" AND
--                                      "Public read candidate ..." policies.
--   * scrape_sources / scrape_runs   — "Admin full access" FOR ALL USING(true)
--   * app_config                     — "Admin full access" FOR ALL USING(true)
--                                      (holds the Greenhouse board token)
--   * ai_usage_log / suggestions     — "Admin can read ..." FOR SELECT USING(true)
--                                      (internal operational data)
--
-- Safe to drop: the service-role client (supabaseAdmin) bypasses RLS
-- entirely, so all backend/admin access still works. These tables are
-- only ever touched through the service role.
--
-- NOTE: Generating this migration does NOT apply it. Apply via the
-- Supabase SQL editor against DB1, or `supabase db push`.
-- ═══════════════════════════════════════════════════════════════

-- ── 1. candidate cv entities (self-manage + public-read policies retained) ──
DROP POLICY IF EXISTS "Admin full access on candidate_experiences" ON candidate_experiences;
DROP POLICY IF EXISTS "Admin full access on candidate_educations" ON candidate_educations;
DROP POLICY IF EXISTS "Admin full access on candidate_projects" ON candidate_projects;
DROP POLICY IF EXISTS "Admin full access on candidate_certifications" ON candidate_certifications;
DROP POLICY IF EXISTS "Admin full access on candidate_achievements" ON candidate_achievements;

-- ── 2. scraper health pipeline ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin full access on scrape_sources" ON scrape_sources;
DROP POLICY IF EXISTS "Admin full access on scrape_runs" ON scrape_runs;

-- ── 3. app_config (contains secrets) ───────────────────────────────────────
DROP POLICY IF EXISTS "Admin full access on app_config" ON app_config;

-- ── 4. internal operational data (service role only) ───────────────────────
DROP POLICY IF EXISTS "Admin can read ai_usage_log" ON ai_usage_log;
DROP POLICY IF EXISTS "Admin can read suggestions" ON suggestions;

-- Optional verification queries (run after applying):
--   SELECT tablename, policyname FROM pg_policies
--   WHERE tablename IN ('candidate_experiences','candidate_educations',
--     'candidate_projects','candidate_certifications','candidate_achievements',
--     'scrape_sources','scrape_runs','app_config','ai_usage_log','suggestions')
--   ORDER BY tablename, policyname;