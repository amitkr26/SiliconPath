-- Add unique constraint on news source_url to prevent duplicates
ALTER TABLE news_articles ADD CONSTRAINT IF NOT EXISTS unique_news_source_url 
  UNIQUE (source_url);

-- Clean duplicate news (keep latest)
DELETE FROM news_articles a USING news_articles b
WHERE a.created_at < b.created_at AND a.source_url = b.source_url;

-- Add slug for opportunities if not already set  
UPDATE opportunities 
SET slug = lower(regexp_replace(
  category || '-' || organization || '-' || left(title, 40),
  '[^a-z0-9]+', '-', 'g'
))
WHERE slug IS NULL OR slug = '';

-- Verify counts
SELECT 'opportunities' as table_name, COUNT(*) FROM opportunities
UNION ALL  
SELECT 'news_articles', COUNT(*) FROM news_articles
UNION ALL
SELECT 'subscribers', COUNT(*) FROM subscribers;
