-- target: supabase_db1
-- Add slug column to news_articles
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS slug text;
UPDATE news_articles SET slug = lower(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g'));
UPDATE news_articles SET slug = trim(both '-' from slug);
UPDATE news_articles SET slug = left(slug, 80);

-- Handle duplicates by appending a suffix
UPDATE news_articles n1
SET slug = n1.slug || '-' || n1.id::text
WHERE EXISTS (
  SELECT 1 FROM news_articles n2
  WHERE n2.slug = n1.slug AND n2.id != n1.id
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_news_slug'
  ) THEN
    ALTER TABLE news_articles ADD CONSTRAINT unique_news_slug UNIQUE (slug);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_news_articles_slug ON news_articles(slug);

-- Suggestions table for contact page
CREATE TABLE IF NOT EXISTS suggestions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  type text,
  url text,
  notes text,
  contact_email text,
  submitted_at timestamp with time zone DEFAULT now(),
  is_reviewed boolean DEFAULT false
);

ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert suggestions"
  ON suggestions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin can read suggestions"
  ON suggestions
  FOR SELECT
  USING (true);
