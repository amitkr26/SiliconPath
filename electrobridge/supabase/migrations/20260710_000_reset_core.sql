-- ============================================================================
-- SiliconPath v2 :: Supabase Project 1 (CORE DATA) :: FULL RESET
-- WARNING: This DROPS all core tables and their data. There is no undo.
-- Run in the Supabase SQL Editor for your PRIMARY project.
-- ============================================================================

DROP TABLE IF EXISTS opportunities CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS scrape_sources CASCADE;
DROP TABLE IF EXISTS scrape_runs CASCADE;
DROP TABLE IF EXISTS news_articles CASCADE;
DROP TABLE IF EXISTS resources CASCADE;
DROP TABLE IF EXISTS academy_tracks CASCADE;
DROP TABLE IF EXISTS academy_days CASCADE;
DROP TABLE IF EXISTS academy_assessments CASCADE;
DROP TABLE IF EXISTS subscribers CASCADE;

-- ---------------------------------------------------------------------------
-- Organizations (worldwide)
-- ---------------------------------------------------------------------------
CREATE TABLE organizations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL UNIQUE,
  slug          TEXT NOT NULL UNIQUE,
  type          TEXT NOT NULL CHECK (type IN ('academic','government','private','international','psu','research_lab')),
  country       TEXT,
  location      TEXT,
  website       TEXT,
  careers_url   TEXT,
  logo_url      TEXT,
  description   TEXT,
  is_verified   BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Opportunities
-- ---------------------------------------------------------------------------
CREATE TABLE opportunities (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                TEXT NOT NULL,
  slug                 TEXT NOT NULL UNIQUE,
  organization_id      UUID REFERENCES organizations(id) ON DELETE SET NULL,

  category             TEXT NOT NULL CHECK (category IN ('jrf','srf','phd','postdoc','industry','government','fellowship','internship')),
  specialization       TEXT[] DEFAULT '{}',

  description          TEXT,
  eligibility          TEXT,
  location             TEXT,
  country              TEXT,
  is_international      BOOLEAN DEFAULT false,
  is_remote            BOOLEAN DEFAULT false,
  salary_range         TEXT,
  apply_url            TEXT NOT NULL,

  deadline             DATE,
  posted_date          DATE DEFAULT CURRENT_DATE,

  verification_status  TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending','verified','rejected','expired')),
  source_type          TEXT DEFAULT 'scraped' CHECK (source_type IN ('scraped','manual','employer_posted')),
  source_url           TEXT,
  scrape_source_id     UUID,

  tags                 TEXT[] DEFAULT '{}',
  is_active            BOOLEAN DEFAULT true,
  view_count           INTEGER DEFAULT 0,

  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Scrape sources + run history (health tracking)
-- ---------------------------------------------------------------------------
CREATE TABLE scrape_sources (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 TEXT NOT NULL,
  url                  TEXT NOT NULL,
  adapter              TEXT NOT NULL CHECK (adapter IN ('greenhouse','lever','smartrecruiters','workday','html','rss','schema')),
  category             TEXT NOT NULL,
  organization_id      UUID REFERENCES organizations(id) ON DELETE SET NULL,

  is_active            BOOLEAN DEFAULT true,
  priority             INTEGER DEFAULT 100,
  batch                INTEGER DEFAULT 1,

  last_scrape_at       TIMESTAMPTZ,
  last_success_at      TIMESTAMPTZ,
  last_error           TEXT,
  consecutive_failures INTEGER DEFAULT 0,
  total_runs           INTEGER DEFAULT 0,
  total_results        INTEGER DEFAULT 0,

  created_at           TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE scrape_runs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id     UUID REFERENCES scrape_sources(id) ON DELETE CASCADE,
  status        TEXT NOT NULL CHECK (status IN ('running','success','failed')),
  results_count INTEGER DEFAULT 0,
  error         TEXT,
  duration_ms   INTEGER,
  started_at    TIMESTAMPTZ DEFAULT now(),
  completed_at  TIMESTAMPTZ
);

-- ---------------------------------------------------------------------------
-- News + resources
-- ---------------------------------------------------------------------------
CREATE TABLE news_articles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  url           TEXT NOT NULL UNIQUE,
  source_name   TEXT NOT NULL,
  summary       TEXT,
  image_url     TEXT,
  published_at  TIMESTAMPTZ,
  tags          TEXT[] DEFAULT '{}',
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE resources (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  url           TEXT NOT NULL,
  kind          TEXT NOT NULL CHECK (kind IN ('course','channel','tool','book','paper')),
  difficulty    TEXT CHECK (difficulty IN ('beginner','intermediate','advanced')),
  topic_tags    TEXT[] DEFAULT '{}',
  track_slug    TEXT,
  notes         TEXT,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Academy content (public, static curriculum)
-- ---------------------------------------------------------------------------
CREATE TABLE academy_tracks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             TEXT NOT NULL UNIQUE,
  title            TEXT NOT NULL,
  description      TEXT NOT NULL,
  icon             TEXT DEFAULT 'Cpu',
  color            TEXT DEFAULT '#6366f1',
  order_index      INTEGER NOT NULL,
  estimated_days   INTEGER NOT NULL,
  estimated_hours  INTEGER NOT NULL,
  prerequisites    TEXT[] DEFAULT '{}',
  is_active        BOOLEAN DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE academy_days (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id           UUID REFERENCES academy_tracks(id) ON DELETE CASCADE,
  day_number         INTEGER NOT NULL,
  title              TEXT NOT NULL,
  objectives         TEXT[] DEFAULT '{}',
  resources          JSONB DEFAULT '[]',
  practice_questions JSONB DEFAULT '[]',
  estimated_minutes  INTEGER DEFAULT 120,
  created_at         TIMESTAMPTZ DEFAULT now(),
  UNIQUE(track_id, day_number)
);

CREATE TABLE academy_assessments (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id           UUID REFERENCES academy_tracks(id) ON DELETE CASCADE,
  questions          JSONB NOT NULL,
  passing_score      INTEGER DEFAULT 70,
  time_limit_minutes INTEGER DEFAULT 45,
  created_at         TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE subscribers (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email              TEXT NOT NULL UNIQUE,
  categories         TEXT[] DEFAULT '{}',
  keywords           TEXT[] DEFAULT '{}',
  countries          TEXT[] DEFAULT '{}',
  is_verified        BOOLEAN DEFAULT false,
  verification_token TEXT,
  unsubscribe_token  TEXT DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at         TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX idx_opp_category   ON opportunities(category);
CREATE INDEX idx_opp_active      ON opportunities(is_active, verification_status);
CREATE INDEX idx_opp_deadline    ON opportunities(deadline) WHERE deadline IS NOT NULL;
CREATE INDEX idx_opp_org         ON opportunities(organization_id);
CREATE INDEX idx_opp_created      ON opportunities(created_at DESC);
CREATE INDEX idx_opp_intl         ON opportunities(is_international);
CREATE INDEX idx_src_active        ON scrape_sources(is_active, batch);
CREATE INDEX idx_days_track        ON academy_days(track_id, day_number);
CREATE INDEX idx_news_published    ON news_articles(published_at DESC) WHERE is_active = true;

-- ---------------------------------------------------------------------------
-- Row-Level Security
-- Aggregator content is public-read; writes only via service_role (admin/cron).
-- ---------------------------------------------------------------------------
ALTER TABLE opportunities       ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources           ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_tracks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_days        ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read verified opportunities" ON opportunities
  FOR SELECT USING (is_active = true AND verification_status = 'verified');
CREATE POLICY "public read organizations" ON organizations
  FOR SELECT USING (true);
CREATE POLICY "public read news" ON news_articles
  FOR SELECT USING (is_active = true);
CREATE POLICY "public read resources" ON resources
  FOR SELECT USING (is_active = true);
CREATE POLICY "public read tracks" ON academy_tracks
  FOR SELECT USING (is_active = true);
CREATE POLICY "public read days" ON academy_days
  FOR SELECT USING (true);
CREATE POLICY "public read assessments" ON academy_assessments
  FOR SELECT USING (true);

-- service_role bypasses RLS automatically; no write policies needed for anon.
