-- ════════════════════════════════════════════════════════════
-- SILICONPATH — NEON2 Schema Consolidation (Phase 2)
-- Database: Neon Secondary (Mirror Replicas + Cache)
-- Migration: 004 (additive, non-destructive)
-- ════════════════════════════════════════════════════════════

-- ============================================================
-- PART 1: MISSING COLUMNS ON opportunities_mirror
-- ============================================================

ALTER TABLE opportunities_mirror ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE opportunities_mirror ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE opportunities_mirror ADD COLUMN IF NOT EXISTS country text DEFAULT 'India';
ALTER TABLE opportunities_mirror ADD COLUMN IF NOT EXISTS is_remote boolean DEFAULT false;
ALTER TABLE opportunities_mirror ADD COLUMN IF NOT EXISTS responsibilities text[];
ALTER TABLE opportunities_mirror ADD COLUMN IF NOT EXISTS requirements text[];
ALTER TABLE opportunities_mirror ADD COLUMN IF NOT EXISTS official_page_url text;
ALTER TABLE opportunities_mirror ADD COLUMN IF NOT EXISTS apply_link_type text DEFAULT 'homepage';
ALTER TABLE opportunities_mirror ADD COLUMN IF NOT EXISTS org_slug text;
ALTER TABLE opportunities_mirror ADD COLUMN IF NOT EXISTS company_page_id uuid;

-- ============================================================
-- PART 2: MISSING INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_news_mirror_source ON news_mirror(source);
CREATE INDEX IF NOT EXISTS idx_mirror_org ON opportunities_mirror(organization);
CREATE INDEX IF NOT EXISTS idx_mirror_posted ON opportunities_mirror(posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_mirror_verification ON opportunities_mirror(verification_status);
