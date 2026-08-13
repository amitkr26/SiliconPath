-- QA audit: /api/cron/check-links selected and updated opportunities columns
-- that did not exist in the live schema (apply_link, last_link_checked,
-- link_check_status, verified_at) — the query errored every run and link
-- verification silently never happened. Add the three missing columns;
-- apply_link was a plain rename of apply_url (code fixed to use apply_url).

ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS last_link_checked timestamptz;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS link_check_status integer;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS verified_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_opp_last_link_checked ON opportunities (last_link_checked) WHERE last_link_checked IS NOT NULL;