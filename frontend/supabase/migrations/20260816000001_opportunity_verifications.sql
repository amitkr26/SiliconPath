-- target: supabase_db1
-- P0.2 (2026-08-16): evidence ledger for the verification pipeline.
-- Every link/source/deep check writes one row here. `opportunities.verification_status`
-- may only change to `verified` with supporting evidence in this table (admin queue) —
-- never fabricated at insert time.
CREATE TABLE IF NOT EXISTS opportunity_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  check_type text NOT NULL,             -- 'link' | 'source' | 'deep' | 'deadline' | 'eligibility'
  status text NOT NULL,                 -- 'pass' | 'fail'
  checked_at timestamptz NOT NULL DEFAULT now(),
  source_url text,
  http_status integer,
  deadline_found boolean,
  content_hash text,
  error text,
  metadata jsonb
);

CREATE INDEX IF NOT EXISTS idx_opp_verifications_opp ON opportunity_verifications (opportunity_id, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_opp_verifications_type ON opportunity_verifications (check_type, status);

ALTER TABLE opportunity_verifications ENABLE ROW LEVEL SECURITY;
-- No anon/authenticated policies: only service-role API routes read/write the ledger.
