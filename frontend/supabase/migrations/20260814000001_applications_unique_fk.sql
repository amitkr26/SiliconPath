-- target: supabase_db2
-- ���������������������������������������������������������������������������������
-- BEROJGARDEGREEWALA — Fix: Applications unique constraint + Saved Opportunities FK
-- Applied: 2026-08-14
-- ���������������������������������������������������������������������������������

-- 1. Add unique constraint on applications(user_id, opportunity_id)
-- Eliminates race condition in check-then-insert pattern
-- Verified: existing data has no duplicates (cleaned up prior to migration)
ALTER TABLE applications 
ADD CONSTRAINT applications_user_id_opportunity_id_key 
UNIQUE (user_id, opportunity_id);

-- 2. Add foreign key on saved_opportunities.opportunity_id REFERENCES opportunities(id)
-- Enables PostgREST join: saved_opportunities.select("*, opportunities(*)")
-- Note: opportunities table is in DB1 but in the same Supabase project in production
-- This FK replaces the API fallback path in /api/bookmarks/route.ts
ALTER TABLE saved_opportunities
ADD CONSTRAINT saved_opportunities_opportunity_id_fkey
FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE;

-- 3. Index to support the FK and common query patterns
CREATE INDEX IF NOT EXISTS idx_saved_opportunities_opportunity_id 
ON saved_opportunities(opportunity_id);

-- 4. Verify constraints
-- SELECT conname, contype FROM pg_constraint WHERE conrelid = 'applications'::regclass;
-- SELECT conname, contype FROM pg_constraint WHERE conrelid = 'saved_opportunities'::regclass;