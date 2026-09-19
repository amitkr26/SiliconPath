-- ============================================================================
-- BerojgarDegreeWala v2 :: Neon1 (ANALYTICS + CACHE) :: canonical schema
-- Live reality: two Neon databases exist (Neon1 = analytics/cache + mirrors,
-- Neon2 = read-only cache mirror). This file describes Neon1. Matches live
-- tables: page_views, search_queries, click_events, trending_cache,
-- keyword_stats (verified 2026-08-16). Note: ai_usage_log lives on Supabase
-- db1, NOT Neon. Run via psql or the Neon SQL Editor.
-- ============================================================================

DROP TABLE IF EXISTS page_views CASCADE;
DROP TABLE IF EXISTS search_queries CASCADE;
DROP TABLE IF EXISTS click_events CASCADE;
DROP TABLE IF EXISTS trending_cache CASCADE;
DROP TABLE IF EXISTS keyword_stats CASCADE;

CREATE TABLE page_views (
  id         BIGSERIAL PRIMARY KEY,
  path       TEXT NOT NULL,
  referrer   TEXT,
  user_agent TEXT,
  ip_hash    TEXT,
  session_id TEXT,
  country    TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE search_queries (
  id            BIGSERIAL PRIMARY KEY,
  query         TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  filters       JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE click_events (
  id             BIGSERIAL PRIMARY KEY,
  opportunity_id TEXT NOT NULL,
  event_type     TEXT NOT NULL CHECK (event_type IN ('view','apply_click','share','save')),
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- Trending / keyword cache tables (live on Neon1; consumed by api/trending, admin/analytics)
CREATE TABLE trending_cache (
  id         SERIAL PRIMARY KEY,
  category   VARCHAR(50) UNIQUE NOT NULL,
  data       JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE keyword_stats (
  keyword      VARCHAR(255) PRIMARY KEY,
  search_count INTEGER NOT NULL DEFAULT 1,
  last_searched TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_pv_path    ON page_views(path, created_at DESC);
CREATE INDEX idx_click_opp  ON click_events(opportunity_id, created_at DESC);
CREATE INDEX idx_search_ts  ON search_queries(created_at DESC);
