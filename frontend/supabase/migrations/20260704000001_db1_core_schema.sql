-- target: supabase_db1
-- ════════════════════════════════════════
-- BEROJGARDEGREEWALA — SUPABASE PRIMARY (DB1)
-- PURPOSE: Core public platform data
-- Tables: opportunities, news, companies, config
-- ════════════════════════════════════════

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- For text search
CREATE EXTENSION IF NOT EXISTS "unaccent";  -- For accent-insensitive search

-- ── COMPANIES (must come before opportunities) ──
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  short_name text,
  tagline text,
  description text,
  logo_url text,
  banner_url text,
  website text,
  careers_page_url text,      -- Direct URL to their careers page (for scraping)
  linkedin_url text,
  company_type text CHECK(company_type IN (
    'Government PSU', 'Research Lab', 'Central University',
    'IIT/NIT', 'IISER/IIST', 'Private MNC', 'Private Indian',
    'Startup', 'International University', 'International Research Lab',
    'International Company'
  )),
  country text DEFAULT 'India',
  headquarters text,
  state text,
  city text,
  founded_year integer,
  employee_count_range text,
  specialties text[],
  industry text,
  is_active boolean DEFAULT true,
  is_verified boolean DEFAULT false,
  is_auto_scraped boolean DEFAULT true,  -- Whether we scrape their careers page
  scrape_frequency text DEFAULT 'daily' CHECK(scrape_frequency IN ('hourly', 'daily', 'weekly')),
  last_scraped_at timestamptz,
  follower_count integer DEFAULT 0,
  opportunity_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ── OPPORTUNITIES ──
CREATE TABLE IF NOT EXISTS opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Core fields
  title text NOT NULL,
  organization text NOT NULL,
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  category text NOT NULL CHECK(category IN (
    'JRF', 'SRF', 'PhD', 'Postdoc', 'Research Associate',
    'Internship', 'Trainee', 'Govt Job', 'Private Job',
    'Fellowship', 'Scholarship', 'Faculty'
  )),
  -- Location
  location text,
  city text,
  state text,
  country text DEFAULT 'India',
  is_remote boolean DEFAULT false,
  -- Compensation
  stipend text,
  stipend_min integer,          -- For range filtering (monthly INR or USD)
  stipend_max integer,
  stipend_currency text DEFAULT 'INR',
  -- Timeline
  deadline date,
  posted_date date,
  duration text,                -- "6 months", "2 years", "Permanent"
  -- Requirements
  eligibility text,
  min_qualification text CHECK(min_qualification IN (
    'BTech/BE', 'MTech/ME', 'MSc', 'PhD', 'Any Graduate', 'Any Postgraduate'
  )),
  experience_required text,
  skills_required text[],
  -- Content
  description text,
  short_description text,       -- AI-generated 2-line summary
  responsibilities text[],      -- AI-extracted bullet points
  requirements text[],          -- AI-extracted requirements
  -- Links
  apply_link text,
  official_page_url text,
  source_url text UNIQUE,
  apply_link_type text DEFAULT 'homepage' CHECK(apply_link_type IN (
    'direct', 'homepage', 'pdf', 'email', 'portal'
  )),
  -- Status
  is_active boolean DEFAULT true,
  verification_status text DEFAULT 'unverified' CHECK(verification_status IN (
    'verified', 'unverified', 'link_unavailable', 'expired'
  )),
  verified_at timestamptz,
  -- Metadata
  tags text[],
  slug text UNIQUE,
  org_slug text,
  -- Tracking
  apply_clicks integer DEFAULT 0,
  views integer DEFAULT 0,
  saves_count integer DEFAULT 0,
  posted_at timestamptz DEFAULT now(),
  last_link_checked timestamptz,
  link_check_status integer,
  admin_notes text,
  -- Source tracking
  scrape_source text,           -- 'isro_html', 'drdo_rss', 'iit_careers', etc.
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Slug auto-generation
CREATE OR REPLACE FUNCTION generate_opp_slug(title text, organization text, category text)
RETURNS text AS $$
DECLARE
  base text;
  final_slug text;
  n integer := 0;
BEGIN
  base := lower(category) || '-' ||
    regexp_replace(lower(coalesce(organization, '')), '[^a-z0-9]+', '-', 'g') || '-' ||
    regexp_replace(lower(coalesce(title, '')), '[^a-z0-9]+', '-', 'g');
  base := regexp_replace(base, '-+', '-', 'g');
  base := trim(both '-' from base);
  base := left(base, 80);
  IF base = '' THEN
    base := 'opportunity';
  END IF;
  final_slug := base;
  WHILE EXISTS (SELECT 1 FROM opportunities WHERE slug = final_slug) LOOP
    n := n + 1;
    final_slug := base || '-' || n;
  END LOOP;
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION auto_opp_slug() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_opp_slug(NEW.title, NEW.organization, NEW.category);
  END IF;
  IF NEW.org_slug IS NULL THEN
    NEW.org_slug := lower(regexp_replace(NEW.organization, '[^a-zA-Z0-9]+', '-', 'g'));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Full text search index
CREATE INDEX IF NOT EXISTS idx_opp_fts ON opportunities
  USING gin(to_tsvector('english', coalesce(title,'') || ' ' || coalesce(organization,'') || ' ' || coalesce(description,'')));
CREATE INDEX IF NOT EXISTS idx_opp_active ON opportunities(is_active, deadline, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_opp_category ON opportunities(category, is_active);
CREATE INDEX IF NOT EXISTS idx_opp_company ON opportunities(company_id, is_active);
CREATE INDEX IF NOT EXISTS idx_opp_slug ON opportunities(slug);
CREATE INDEX IF NOT EXISTS idx_opp_source ON opportunities(source_url);

-- ── NEWS ARTICLES ──
CREATE TABLE IF NOT EXISTS news_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE,
  summary text,
  content text,
  source text,
  source_url text UNIQUE,
  author text,
  image_url text,
  category text DEFAULT 'industry' CHECK(category IN (
    'industry', 'research', 'policy', 'funding', 'product',
    'acquisition', 'hiring', 'education', 'international', 'india'
  )),
  tags text[],
  companies_mentioned text[],   -- Company slugs mentioned in article
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  views integer DEFAULT 0,
  is_featured boolean DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_news_pub ON news_articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_source ON news_articles(source_url);
CREATE INDEX IF NOT EXISTS idx_news_tags ON news_articles USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_news_fts ON news_articles
  USING gin(to_tsvector('english', coalesce(title,'') || ' ' || coalesce(summary,'')));

-- ── SCRAPER CONFIGURATION (admin-controlled) ──
CREATE TABLE IF NOT EXISTS scraper_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,
  type text CHECK(type IN ('rss_news', 'rss_opportunities', 'html_careers', 'api')),
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  country text DEFAULT 'India',
  is_active boolean DEFAULT true,
  scrape_frequency text DEFAULT 'daily',
  last_scraped_at timestamptz,
  last_success_at timestamptz,
  last_error text,
  items_found_last_run integer DEFAULT 0,
  items_inserted_last_run integer DEFAULT 0,
  total_items_scraped integer DEFAULT 0,
  config jsonb DEFAULT '{}',    -- Source-specific config (CSS selectors, etc.)
  created_at timestamptz DEFAULT now()
);

-- ── SUBSCRIBERS ──
CREATE TABLE IF NOT EXISTS subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  keywords text[],
  categories text[],
  locations text[],
  created_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  last_email_sent_at timestamptz,
  email_count integer DEFAULT 0
);

-- ── SUGGESTIONS / CONTACT ──
CREATE TABLE IF NOT EXISTS suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text,
  name text,
  email text,
  url text,
  notes text,
  submitted_at timestamptz DEFAULT now(),
  is_reviewed boolean DEFAULT false
);

-- ── LINK CHECK RESULTS ──
CREATE TABLE IF NOT EXISTS link_check_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid REFERENCES opportunities(id) ON DELETE CASCADE,
  checked_at timestamptz DEFAULT now(),
  http_status integer,
  is_reachable boolean,
  response_time_ms integer,
  error_message text
);

-- ── ISSUE REPORTS ──
CREATE TABLE IF NOT EXISTS opportunity_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid REFERENCES opportunities(id) ON DELETE CASCADE,
  report_type text CHECK(report_type IN ('broken_link', 'wrong_info', 'expired', 'duplicate', 'other')),
  description text,
  reporter_email text,
  reported_at timestamptz DEFAULT now(),
  is_resolved boolean DEFAULT false
);

-- ── ROW LEVEL SECURITY ──
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraper_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_check_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_reports ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public reads companies" ON companies FOR SELECT USING (is_active = true);
CREATE POLICY "Public reads opportunities" ON opportunities FOR SELECT USING (is_active = true);
CREATE POLICY "Public reads news" ON news_articles FOR SELECT USING (true);

-- Anyone can submit
CREATE POLICY "Anyone subscribes" ON subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone suggests" ON suggestions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone reports" ON opportunity_reports FOR INSERT WITH CHECK (true);
