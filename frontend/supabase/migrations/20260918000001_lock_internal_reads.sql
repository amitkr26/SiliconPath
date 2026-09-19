-- target: supabase_db1
-- ═══════════════════════════════════════════════════════════════════════
-- BerojgarDegreeWala — Lock internal/operational tables from anonymous reads
-- (2026-09-18)
--
-- Verified 2026-09-18 via anonymous PostgREST probes (anon key, no auth):
-- these tables return rows to unauthenticated clients:
--   employer_settings   (employer configuration — internal)
--   scrape_runs         (scraper operational telemetry — internal)
--
-- Also anonymously readable (fixed by 20260917000001 — apply that first):
--   app_config    (holds the Greenhouse board token)  ← CRITICAL
--   ai_usage_log, suggestions
--
-- user_follows / skill_endorsements / candidate_* also return rows to anon —
-- candidate_* public read is by design; user_follows and skill_endorsements
-- are candidate-social surfaces: verify intended public-read BEFORE locking.
--
-- This migration drops ANY policy that grants the anon OR authenticated role
-- access on the two internal tables below. NOTE: the live permissive policies
-- are declared `TO PUBLIC` (PostgreSQL pseudo-role = every role, incl. anon),
-- so a roles LITERAL check ('anon'/'authenticated') would miss them — the
-- named explicit drops below are authoritative, and the DO block remains as a
-- belt-and-suspenders guard for future role-tagged policies.
-- Service-role API routes are unaffected (RLS is bypassed for the service
-- key), so the backend keeps working. Reversible: re-create if ever needed.
-- ═══════════════════════════════════════════════════════════════════════

-- Authoritative named drops (verified 2026-09-18 against live pg_policies:
-- both are FOR ALL USING (true) TO PUBLIC, i.e. role "public").
DROP POLICY IF EXISTS "Admin full access on employer_settings" ON employer_settings;
DROP POLICY IF EXISTS "Admin full access on scrape_runs" ON scrape_runs;

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE tablename IN ('employer_settings', 'scrape_runs')
      AND (roles::text LIKE '%anon%' OR roles::text LIKE '%authenticated%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    RAISE NOTICE 'dropped policy % on %.%', r.policyname, r.schemaname, r.tablename;
  END LOOP;
END $$;

-- Optional verification (run after applying):
--   SELECT tablename, policyname, roles, cmd
--   FROM pg_policies
--   WHERE tablename IN ('employer_settings','scrape_runs')
--   ORDER BY tablename, policyname;