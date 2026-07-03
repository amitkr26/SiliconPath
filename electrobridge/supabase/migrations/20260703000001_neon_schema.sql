-- ═══════════════════════════════════
-- NEON DATABASE 1 — Analytics & Logs
-- Run this on Neon Primary
-- ═══════════════════════════════════

CREATE TABLE IF NOT EXISTS ai_usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature text NOT NULL,
  provider text NOT NULL,
  model text,
  prompt_length integer,
  response_length integer,
  success boolean DEFAULT true,
  error_message text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_created ON ai_usage_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_provider ON ai_usage_log (provider);
CREATE INDEX IF NOT EXISTS idx_ai_usage_feature ON ai_usage_log (feature);

CREATE TABLE IF NOT EXISTS link_check_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL,
  checked_at timestamptz DEFAULT now(),
  http_status integer,
  is_reachable boolean,
  error_message text
);

CREATE TABLE IF NOT EXISTS opportunity_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL,
  report_type text,
  description text,
  reported_at timestamptz DEFAULT now(),
  is_resolved boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS platform_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  opportunity_id uuid,
  news_id uuid,
  page_path text,
  user_agent text,
  country text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_event ON platform_analytics (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_opp ON platform_analytics (opportunity_id);

-- ═══════════════════════════════════
-- NEON DATABASE 2 — Read Replica
-- Run this on Neon Secondary
-- ═══════════════════════════════════

CREATE TABLE IF NOT EXISTS opportunities_mirror (
  id uuid PRIMARY KEY,
  title text NOT NULL,
  organization text NOT NULL,
  category text NOT NULL,
  location text,
  stipend text,
  deadline date,
  eligibility text,
  description text,
  apply_link text,
  tags text[],
  slug text UNIQUE,
  verification_status text,
  is_active boolean,
  apply_clicks integer DEFAULT 0,
  posted_at timestamptz,
  created_at timestamptz,
  synced_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mirror_active ON opportunities_mirror (is_active, deadline);
CREATE INDEX IF NOT EXISTS idx_mirror_category ON opportunities_mirror (category);
CREATE INDEX IF NOT EXISTS idx_mirror_slug ON opportunities_mirror (slug);

CREATE TABLE IF NOT EXISTS news_mirror (
  id uuid PRIMARY KEY,
  title text NOT NULL,
  summary text,
  source text,
  source_url text UNIQUE,
  tags text[],
  slug text UNIQUE,
  published_at timestamptz,
  created_at timestamptz,
  synced_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_news_mirror_pub ON news_mirror (published_at DESC);
