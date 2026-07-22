-- target: supabase_db1
-- ═══════════════════════════════════════════════════════════════
-- BerojgarDegreeWala Session 14: scrape_sources table + verification update
-- Run on Supabase Primary (db1)
-- ═══════════════════════════════════════════════════════════════

-- ── Part 1: scrape_sources config table ─────────────────────────
CREATE TABLE IF NOT EXISTS scrape_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  source_type text NOT NULL CHECK (source_type IN ('rss', 'ats', 'html', 'api')),
  url text NOT NULL,
  adapter text NOT NULL,
  category text,
  is_active boolean DEFAULT true,
  priority int DEFAULT 100,
  last_scraped_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE scrape_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active scrape_sources"
  ON scrape_sources FOR SELECT
  USING (is_active = true OR is_active = false);

CREATE POLICY "Admin full access on scrape_sources"
  ON scrape_sources FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_scrape_sources_active ON scrape_sources (is_active);
CREATE INDEX IF NOT EXISTS idx_scrape_sources_type ON scrape_sources (source_type);

-- ── Part 2: Add 'pending' to verification_status ───────────────
ALTER TABLE opportunities
  DROP CONSTRAINT IF EXISTS opportunities_verification_status_check;

ALTER TABLE opportunities
  ADD CONSTRAINT opportunities_verification_status_check
  CHECK (verification_status IN ('pending', 'verified', 'unverified', 'link_unavailable', 'expired'));

-- Set existing unverified items to pending
UPDATE opportunities
  SET verification_status = 'pending'
  WHERE verification_status = 'unverified';
