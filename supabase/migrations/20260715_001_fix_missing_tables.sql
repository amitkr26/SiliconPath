-- target: supabase_db1
-- ═══════════════════════════════════════════════════════════════
-- BerojgarDegreeWala — Fix Missing Tables & Schema Drift
-- 
-- Adds tables referenced in code but missing from migrations:
--   scrape_runs, app_config, organizations
-- Fixes scrape_sources missing columns used by scrape-health route
-- Fixes opportunity_reports schema drift (missing reporter_email)
-- ═══════════════════════════════════════════════════════════════

-- ── 1. scrape_runs (referenced in opportunity-scraper-impl.ts:156, scrape-health/route.ts:14) ──
CREATE TABLE IF NOT EXISTS scrape_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid REFERENCES scrape_sources(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'running' CHECK(status IN ('running', 'success', 'failed')),
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  duration_ms integer,
  results_count integer DEFAULT 0,
  error text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scrape_runs_source ON scrape_runs(source_id);
CREATE INDEX IF NOT EXISTS idx_scrape_runs_started ON scrape_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_scrape_runs_status ON scrape_runs(status);

ALTER TABLE scrape_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on scrape_runs"
  ON scrape_runs FOR ALL
  USING (true)
  WITH CHECK (true);

-- ── 2. app_config (referenced in opportunity-scraper-impl.ts:54) ──
CREATE TABLE IF NOT EXISTS app_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key text UNIQUE NOT NULL,
  config_value text,
  config_type text DEFAULT 'string' CHECK(config_type IN ('string', 'number', 'boolean', 'json')),
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on app_config"
  ON app_config FOR ALL
  USING (true)
  WITH CHECK (true);

-- Seed greenhouse_board_token config
INSERT INTO app_config (config_key, config_value, config_type, description)
VALUES ('greenhouse_board_token', '', 'string', 'Greenhouse board API token for ATS scraping')
ON CONFLICT (config_key) DO NOTHING;

-- ── 3. organizations (referenced in seed files + scrape-health route) ──
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  type text CHECK(type IN ('government', 'research_lab', 'academic', 'private', 'international', 'psu')),
  country text DEFAULT 'India',
  location text,
  website text,
  logo_url text,
  description text,
  is_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_type ON organizations(type);
CREATE INDEX IF NOT EXISTS idx_organizations_country ON organizations(country);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads organizations" ON organizations FOR SELECT USING (is_active = true);

-- ── 4. Add missing columns to scrape_sources (used by scrape-health/route.ts) ──
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scrape_sources' AND column_name = 'consecutive_failures') THEN
    ALTER TABLE scrape_sources ADD COLUMN consecutive_failures integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scrape_sources' AND column_name = 'total_results') THEN
    ALTER TABLE scrape_sources ADD COLUMN total_results integer DEFAULT 0;
  END IF;
END $$;

-- ── 5. Add reporter_email to opportunity_reports (schema drift fix) ──
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'opportunity_reports' AND column_name = 'reporter_email') THEN
    ALTER TABLE opportunity_reports ADD COLUMN reporter_email text;
  END IF;
END $$;

-- ── 6. Add cost_estimate to ai_usage_log ──
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_usage_log' AND column_name = 'cost_estimate') THEN
    ALTER TABLE ai_usage_log ADD COLUMN cost_estimate numeric(10,6) DEFAULT 0;
  END IF;
END $$;

-- ── 7. Add organization_id FK to opportunities if not present ──
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'opportunities' AND column_name = 'organization_id') THEN
    ALTER TABLE opportunities ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL;
  END IF;
END $$;
