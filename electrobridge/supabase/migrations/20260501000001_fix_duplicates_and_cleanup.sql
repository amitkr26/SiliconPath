-- FIX 1: Deduplicate opportunities - remove dupes, then add unique constraint
DELETE FROM opportunities a USING opportunities b
WHERE a.created_at > b.created_at AND a.source_url = b.source_url
AND a.source_url IS NOT NULL AND a.source_url != '';

ALTER TABLE opportunities DROP CONSTRAINT IF EXISTS unique_source_url;
ALTER TABLE opportunities ADD CONSTRAINT unique_source_url UNIQUE (source_url);

-- FIX 2: Remove irrelevant news articles (not matching our keywords)
DELETE FROM news_articles WHERE NOT (
  LOWER(COALESCE(title, '')) ~ '(semiconductor|electronics|vlsi|chip|transistor|photonics|spintronics|embedded|mems|radar|microwave|antenna|pcb|circuit|iot|fpga|microprocessor|sensor|nanotechnology|quantum|laser|optoelectronics|power.electronics|rf|signal|jrf|phd|fellowship|research|drdo|isro|csir|iit|nit)'
  OR
  LOWER(COALESCE(summary, '')) ~ '(semiconductor|electronics|vlsi|chip|transistor|photonics|spintronics|embedded|mems|radar|microwave|antenna|pcb|circuit|iot|fpga|microprocessor|sensor|nanotechnology|quantum|laser|optoelectronics|power.electronics|rf|signal|jrf|phd|fellowship|research|drdo|isro|csir|iit|nit)'
);
