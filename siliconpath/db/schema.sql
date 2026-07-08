-- SiliconPath core schema — db1 (Supabase Primary).
-- Data foundation, applied BEFORE any scraper writes (Phase 1 gate).
-- Organization-shape validation is enforced at BOTH the app layer
-- (src/lib/validation/organization.ts) and here at the DB layer, so a bad
-- byline/author value cannot silently land even if a future code path forgets
-- to validate. This is structural, not a blocklist of specific bad names.

create extension if not exists pgcrypto;

-- ── companies / organizations ────────────────────────────────────────────────
create table if not exists companies (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  slug        text unique,
  type        text,            -- Government | University | PSU | Private | National Lab | ...
  domain      text,            -- used later for the "claim this page" email-domain match
  logo_url    text,
  description text,            -- only if genuinely sourced; never fabricated
  created_at  timestamptz not null default now()
);

-- ── scraper sources ──────────────────────────────────────────────────────────
create table if not exists scraper_sources (
  id         text primary key,
  name       text not null,
  type       text not null check (type in ('workday','greenhouse','lever','smartrecruiters','schema','html','rss')),
  url        text not null,
  category   text not null,
  batch      int  not null default 1,
  active     boolean not null default false,
  robots_ok  boolean,          -- last robots.txt check result
  last_run_at timestamptz,
  notes      text
);

-- ── opportunities ────────────────────────────────────────────────────────────
create table if not exists opportunities (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  organization text not null,
  organization_id uuid references companies(id),
  category     text not null,
  location     text,
  stipend      text,
  deadline     text,
  eligibility  text,
  description  text,
  apply_link   text,
  source_url   text not null,
  source_type  text not null default 'scraped' check (source_type in ('scraped','employer_posted')),
  tags         text[] not null default '{}',
  is_active    boolean not null default true,
  -- Stable dedupe key: prefer apply_link, else hash(source_url + title).
  dedupe_key   text generated always as (coalesce(apply_link, encode(digest(source_url || '|' || title, 'sha256'), 'hex'))) stored,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  -- Structural org guard at the DB layer: reject a bare "Firstname Lastname"
  -- with no institutional keyword (the classic scraped-byline bug). Values with
  -- institutional keywords, 3+ words, digits, or non-name punctuation pass.
  constraint organization_not_person_name check (
    organization !~ '^[A-Z][a-z]+( [A-Z]\.?)? [A-Z][a-z]+$'
    or organization ~* '(institute|university|college|dept|department|ltd|limited|inc|corp|corporation|llc|gmbh|pvt|laborator|labs|council|centre|center|organi[sz]ation|technolog|systems|semiconductor|electronics|foundation|academy|agency|ministry|board|authority|company|group|holdings|research|foundry|solutions|instruments|devices|materials|national|international)'
  )
);

create unique index if not exists opportunities_dedupe_key_uq on opportunities (dedupe_key);
create index if not exists opportunities_category_idx on opportunities (category) where is_active;
create index if not exists opportunities_deadline_idx on opportunities (deadline) where is_active;

-- ── news ─────────────────────────────────────────────────────────────────────
create table if not exists news_articles (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  url          text not null unique,
  source       text,
  summary      text,
  published_at timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists news_published_idx on news_articles (published_at desc);
