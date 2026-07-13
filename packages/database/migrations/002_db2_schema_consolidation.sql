-- ════════════════════════════════════════════════════════════
-- SILICONPATH — DB2 Schema Consolidation (Phase 2)
-- Database: Supabase Secondary (Archive + Overflow)
-- Migration: 002 (additive, non-destructive)
-- ════════════════════════════════════════════════════════════

-- ============================================================
-- PART 1: MISSING INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_archive_title_fts ON news_archive
  USING gin(to_tsvector('english', coalesce(title, '')));
CREATE INDEX IF NOT EXISTS idx_overflow_email ON subscribers_overflow(email);

-- ============================================================
-- PART 2: MISSING RLS POLICIES
-- ============================================================

ALTER TABLE news_archive ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read archive" ON news_archive;
CREATE POLICY "Public can read archive" ON news_archive
  FOR SELECT USING (true);

ALTER TABLE subscribers_overflow ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can subscribe overflow" ON subscribers_overflow;
CREATE POLICY "Anyone can subscribe overflow" ON subscribers_overflow
  FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can read own overflow" ON subscribers_overflow;
CREATE POLICY "Users can read own overflow" ON subscribers_overflow
  FOR SELECT USING (email = current_setting('request.jwt.claims', true)::json->>'email');
