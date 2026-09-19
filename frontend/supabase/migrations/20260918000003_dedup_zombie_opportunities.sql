-- target: supabase_db1
-- ═══════════════════════════════════════════════════════════════════════
-- BerojgarDegreeWala — De-duplicate zombie opportunities (2026-09-18)
--
-- The ISRO scraper ingested the same advertisement multiple times with
-- different verdicts (verified examples: NRSC/RMT/1/2026 ×3, BE002 ×2 —
-- all duplicate rows were inactive/expired/rejected, invisible to users,
-- but they inflate the table and distort admin stats).
--
-- Strategy (conservative):
--   1. Rank rows per source_url, keeping the "best" row (verified > pending
--      > unverified > link_unavailable > expired > rejected; active first;
--      newest posted_date/created_at as tiebreak).
--   2. A row is deleted only if it is a non-best duplicate AND
--        - is_active = false, AND
--        - verification_status IN ('rejected','expired'), AND
--        - NOT referenced by applications, saved_opportunities, or
--          link_check_logs (FK safety).
--
-- Anything referenced or still active is left untouched. Reversible only by
-- restore — review the affected-row count before committing.
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

CREATE TEMP TABLE dup_targets ON COMMIT DROP AS
WITH ranked AS (
  SELECT
    id,
    source_url,
    verification_status,
    is_active,
    posted_date,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY source_url
      ORDER BY
        CASE verification_status
          WHEN 'verified'          THEN 1
          WHEN 'pending'           THEN 2
          WHEN 'unverified'        THEN 3
          WHEN 'link_unavailable'  THEN 4
          WHEN 'expired'           THEN 5
          WHEN 'rejected'          THEN 6
          ELSE 7
        END,
        is_active DESC,
        posted_date DESC NULLS LAST,
        created_at DESC NULLS LAST
    ) AS rn
  FROM opportunities
  WHERE source_url IS NOT NULL AND source_url <> ''
)
SELECT id, source_url, verification_status, is_active FROM ranked WHERE rn > 1;

-- Preview first (should be 0 rows / small counts):
--   SELECT count(*) FROM dup_targets;
--   SELECT source_url, count(*) FROM dup_targets GROUP BY source_url ORDER BY 2 DESC;

DELETE FROM opportunities o
USING dup_targets t
WHERE o.id = t.id
  AND o.is_active = false
  AND o.verification_status IN ('rejected', 'expired')
  AND NOT EXISTS (SELECT 1 FROM applications a         WHERE a.opportunity_id = o.id)
  AND NOT EXISTS (SELECT 1 FROM saved_opportunities s  WHERE s.opportunity_id = o.id)
  AND NOT EXISTS (SELECT 1 FROM link_check_logs l      WHERE l.opportunity_id = o.id);

COMMIT;

-- Optional verification:
--   SELECT source_url, count(*), array_agg(verification_status ORDER BY verification_status)
--   FROM opportunities
--   WHERE source_url IS NOT NULL AND source_url <> ''
--   GROUP BY source_url HAVING count(*) > 1
--   ORDER BY count(*) DESC
--   LIMIT 20;