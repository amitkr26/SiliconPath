-- ════════════════════════════════════════════════════════════
-- SILICONPATH — NEON1 Schema Consolidation (Phase 2)
-- Database: Neon Primary (Analytics + Operational Logs)
-- Migration: 003 (additive, non-destructive)
-- ════════════════════════════════════════════════════════════

-- ============================================================
-- PART 1: MISSING COLUMNS
-- ============================================================

-- platform_events: add missing columns for richer analytics
ALTER TABLE platform_events ADD COLUMN IF NOT EXISTS session_id text;
ALTER TABLE platform_events ADD COLUMN IF NOT EXISTS user_id uuid;

-- ai_usage_log: add latency and version tracking
ALTER TABLE ai_usage_log ADD COLUMN IF NOT EXISTS duration_ms integer;
ALTER TABLE ai_usage_log ADD COLUMN IF NOT EXISTS model_version text;
ALTER TABLE ai_usage_log ADD COLUMN IF NOT EXISTS feature_version integer;

-- link_check_logs: add response_time_ms (exists in DB1 version)
ALTER TABLE link_check_logs ADD COLUMN IF NOT EXISTS response_time_ms integer;

-- ============================================================
-- PART 2: MISSING INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_events_created ON platform_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_news ON platform_events(news_id);
CREATE INDEX IF NOT EXISTS idx_events_session ON platform_events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_user ON platform_events(user_id);
CREATE INDEX IF NOT EXISTS idx_scrape_logs_source ON scrape_logs(source_id);
CREATE INDEX IF NOT EXISTS idx_scrape_logs_started ON scrape_logs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_scrape_logs_success ON scrape_logs(success);
CREATE INDEX IF NOT EXISTS idx_ai_usage_duration ON ai_usage_log(duration_ms);
CREATE INDEX IF NOT EXISTS idx_link_check_opp ON link_check_logs(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_link_check_time ON link_check_logs(checked_at DESC);
