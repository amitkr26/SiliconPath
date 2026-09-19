-- target: supabase_db1
-- ═══════════════════════════════════════════════════════════════════════
-- BerojgarDegreeWala — Backfill scrape_sources counters (2026-09-18)
--
-- The worker + cron code now increments total_runs / total_results, but
-- historical rows were left at 0 even though scrape_runs holds the real
-- history. This one-time backfill reconciles the counters from scrape_runs.
-- Idempotent in effect (re-running just re-derives the same values from the
-- current scrape_runs history).
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

WITH agg AS (
  SELECT
    source_id,
    COUNT(*)                               AS runs,
    COALESCE(SUM(results_count), 0)        AS results,
    MAX(completed_at)                      AS last_run_at
  FROM scrape_runs
  WHERE source_id IS NOT NULL
  GROUP BY source_id
)
UPDATE scrape_sources s
SET total_runs    = agg.runs,
    total_results = agg.results,
    last_success_at = COALESCE(s.last_success_at, agg.last_run_at)
FROM agg
WHERE s.id = agg.source_id;

COMMIT;

-- Optional verification:
--   SELECT s.name, s.total_runs, s.total_results, COUNT(r.id) AS real_runs
--   FROM scrape_sources s
--   LEFT JOIN scrape_runs r ON r.source_id = s.id
--   GROUP BY s.id
--   ORDER BY s.name;