-- =====================================================================
-- 0001_core_schema.sql  (run on Supabase Project 1 — Core Data)
-- Global aggregator: organizations, opportunities, scraping, news, academy.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------
-- ORGANIZATIONS (worldwide)
-- ---------------------------------------------------------------
CREATE TABLE organizations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL UNIQUE,
  slug          TEXT NOT NULL UNIQUE,
  type          TEXT NOT NULL CHECK (type IN (
                  'academic','government','national_lab','private',
                  'fabless','idm','eda','equipment','osat','startup')),
  website       TEXT,
  careers_url   TEXT,
  logo_url      TEXT,
  description   TEXT,
  country       TEXT,               -- ISO country name
  region        TEXT CHECK (region IN (
                  'india','north_america','europe','asia_pacific',
                  'middle_east','latin_america','africa','global')),
  is_verified   BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------
-- OPPORTUNITIES
-- ---------------------------------------------------------------
CREATE TABLE opportunities (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title               TEXT NOT NULL,
  slug                TEXT NOT NULL UNIQUE,
  organization_id     UUID REFERENCES organizations(id) ON DELETE SET NULL,

  category            TEXT NOT NULL CHECK (category IN (
                        'jrf','srf','phd','postdoc','fellowship',
                        'industry','government','internship')),
  specialization      TEXT[] DEFAULT '{}',   -- vlsi, physical-design, verification, dft, rf, embedded...

  description         TEXT,
  eligibility         TEXT,
  location            TEXT,
  country             TEXT,
  is_international     BOOLEAN DEFAULT false,
  salary_range        TEXT,
  apply_url           TEXT NOT NULL,

  deadline            DATE,
  posted_date         DATE DEFAULT CURRENT_DATE,

  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN (
                        'pending','verified','rejected','expired')),
  source_type         TEXT DEFAULT 'scraped' CHECK (source_type IN (
                        'scraped','manual','employer_posted')),
  source_url          TEXT,
  scrape_source_id    UUID,

  tags                TEXT[] DEFAULT '{}',
  is_active           BOOLEAN DEFAULT true,
  view_count          INTEGER DEFAULT 0,

  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------
-- SCRAPE SOURCES  (+ health tracking so we can see the 6% yield problem)
-- ---------------------------------------------------------------
CREATE TABLE scrape_sources (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL,
  url                   TEXT NOT NULL,
  adapter               TEXT NOT NULL CHECK (adapter IN (
                          'greenhouse','lever','smartrecruiters','workday',
                          'html','rss','schema')),
  category              TEXT NOT NULL,
  organization_id       UUID REFERENCES organizations(id) ON DELETE SET NULL,

  is_active             BOOLEAN DEFAULT true,
  priority              INTEGER DEFAULT 100,
  batch                 INTEGER DEFAULT 1,

  last_scrape_at        TIMESTAMPTZ,
  last_success_at       TIMESTAMPTZ,
  last_error            TEXT,
  consecutive_failures  INTEGER DEFAULT 0,
  total_runs            INTEGER DEFAULT 0,
  total_results         INTEGER DEFAULT 0,

  created_at            TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE scrape_runs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id      UUID REFERENCES scrape_sources(id) ON DELETE CASCADE,
  status         TEXT NOT NULL CHECK (status IN ('running','success','failed')),
  results_count  INTEGER DEFAULT 0,
  error          TEXT,
  duration_ms    INTEGER,
  started_at     TIMESTAMPTZ DEFAULT now(),
  completed_at   TIMESTAMPTZ
);

-- ---------------------------------------------------------------
-- NEWS
-- ---------------------------------------------------------------
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

-- ---------------------------------------------------------------
-- ACADEMY
-- ---------------------------------------------------------------
CREATE TABLE academy_tracks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT NOT NULL UNIQUE,
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  icon            TEXT DEFAULT 'Cpu',
  color           TEXT DEFAULT '#6366f1',
  order_index     INTEGER NOT NULL,
  estimated_days  INTEGER NOT NULL,
  estimated_hours INTEGER NOT NULL,
  prerequisites   TEXT[] DEFAULT '{}',
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
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

-- ---------------------------------------------------------------
-- SUBSCRIBERS (email alerts)
-- ---------------------------------------------------------------
CREATE TABLE subscribers (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email              TEXT NOT NULL UNIQUE,
  categories         TEXT[] DEFAULT '{}',
  keywords           TEXT[] DEFAULT '{}',
  regions            TEXT[] DEFAULT '{}',
  is_verified        BOOLEAN DEFAULT false,
  verification_token TEXT,
  unsubscribe_token  TEXT DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at         TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------
-- INDEXES
-- ---------------------------------------------------------------
CREATE INDEX idx_opp_category   ON opportunities(category);
CREATE INDEX idx_opp_active      ON opportunities(is_active, verification_status);
CREATE INDEX idx_opp_deadline    ON opportunities(deadline) WHERE deadline IS NOT NULL;
CREATE INDEX idx_opp_org         ON opportunities(organization_id);
CREATE INDEX idx_opp_created      ON opportunities(created_at DESC);
CREATE INDEX idx_opp_intl        ON opportunities(is_international);
CREATE INDEX idx_src_active       ON scrape_sources(is_active, batch);
CREATE INDEX idx_org_region       ON organizations(region);
CREATE INDEX idx_days_track       ON academy_days(track_id, day_number);

-- ---------------------------------------------------------------
-- ROW LEVEL SECURITY
-- Public can READ verified content. Only service_role can write.
-- ---------------------------------------------------------------
ALTER TABLE organizations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities   ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_tracks  ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_days    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read orgs"   ON organizations  FOR SELECT USING (true);
CREATE POLICY "public read opps"   ON opportunities  FOR SELECT USING (is_active = true AND verification_status = 'verified');
CREATE POLICY "public read news"   ON news_articles  FOR SELECT USING (is_active = true);
CREATE POLICY "public read tracks" ON academy_tracks FOR SELECT USING (is_active = true);
CREATE POLICY "public read days"   ON academy_days   FOR SELECT USING (true);

-- service_role bypasses RLS automatically; explicit policies documented in docs/SECURITY.md
