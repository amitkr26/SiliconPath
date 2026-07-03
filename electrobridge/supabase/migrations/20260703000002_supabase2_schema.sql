-- ═══════════════════════════════════
-- SUPABASE SECONDARY — News Archive
-- Run this on Supabase Secondary (Netlify account)
-- ═══════════════════════════════════

CREATE TABLE IF NOT EXISTS news_archive (
  id uuid PRIMARY KEY,
  title text NOT NULL,
  summary text,
  source text,
  source_url text UNIQUE,
  image_url text,
  tags text[],
  slug text UNIQUE,
  published_at timestamptz,
  created_at timestamptz,
  archived_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_archive_pub ON news_archive (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_archive_source ON news_archive (source);

CREATE TABLE IF NOT EXISTS subscribers_overflow (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  keywords text[],
  categories text[],
  created_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);
