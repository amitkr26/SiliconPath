-- QA audit P2: news_articles had no slug column — the detail API, detail page,
-- news sync, and sitemap all read `slug` and silently failed (the live table
-- only had id/title/url/source_name/...). Add the column, backfill it from
-- the title (deterministic, non-fabricated), and index it.

ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS slug text;

-- Backfill: slugify(title) with collision suffix — never empty, never null.
UPDATE news_articles SET slug = NULL WHERE slug = '';

DO $$
DECLARE
  r RECORD;
  base text;
  candidate text;
  suffix int;
  taken boolean;
BEGIN
  FOR r IN SELECT id, title FROM news_articles WHERE slug IS NULL LOOP
    base := lower(trim(regexp_replace(r.title, '[^a-zA-Z0-9]+', '-', 'g')));
    base := trim(both '-' from base);
    IF base = '' THEN base := 'article-' || substr(r.id::text, 1, 8); END IF;
    base := left(COALESCE(base, 'article'), 80);

    candidate := base;
    suffix := 2;
    taken := true;
    WHILE taken LOOP
      SELECT EXISTS (
        SELECT 1 FROM news_articles WHERE slug = candidate AND id <> r.id
      ) INTO taken;
      IF taken THEN
        candidate := left(base, 80 - length(suffix::text) - 1) || '-' || suffix;
        suffix := suffix + 1;
      END IF;
    END LOOP;

    UPDATE news_articles SET slug = candidate WHERE id = r.id;
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS news_articles_slug_key ON news_articles (slug);