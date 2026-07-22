-- ============================================================================
-- BerojgarDegreeWala v2 :: Neon (ANALYTICS) :: single consolidated database
-- Down from 2 Neon databases to 1. Run via psql or the Neon SQL Editor.
-- ============================================================================

DROP TABLE IF EXISTS page_views CASCADE;
DROP TABLE IF EXISTS search_queries CASCADE;
DROP TABLE IF EXISTS click_events CASCADE;

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

CREATE INDEX idx_pv_path    ON page_views(path, created_at DESC);
CREATE INDEX idx_click_opp  ON click_events(opportunity_id, created_at DESC);
CREATE INDEX idx_search_ts  ON search_queries(created_at DESC);
