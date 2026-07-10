-- =====================================================================
-- Neon analytics schema (single consolidated analytics DB — down from 2).
-- Privacy: never store raw IP; store a salted hash instead.
-- =====================================================================

DROP TABLE IF EXISTS page_views CASCADE;
DROP TABLE IF EXISTS search_queries CASCADE;
DROP TABLE IF EXISTS click_events CASCADE;

CREATE TABLE page_views (
  id          BIGSERIAL PRIMARY KEY,
  path        TEXT NOT NULL,
  referrer    TEXT,
  country     TEXT,
  ip_hash     TEXT,
  session_id  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE search_queries (
  id             BIGSERIAL PRIMARY KEY,
  query          TEXT NOT NULL,
  results_count  INTEGER DEFAULT 0,
  filters        JSONB DEFAULT '{}',
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE click_events (
  id             BIGSERIAL PRIMARY KEY,
  opportunity_id TEXT NOT NULL,
  event_type     TEXT NOT NULL CHECK (event_type IN ('view','apply_click','share','save')),
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_pv_path    ON page_views(path, created_at DESC);
CREATE INDEX idx_clk_opp    ON click_events(opportunity_id, created_at DESC);
CREATE INDEX idx_sq_created ON search_queries(created_at DESC);
