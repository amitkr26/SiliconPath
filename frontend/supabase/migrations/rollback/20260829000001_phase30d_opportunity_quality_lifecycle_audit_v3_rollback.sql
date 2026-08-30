-- ==============================================================================
-- ROLLBACK SCRIPT: Phase 30D Opportunity Quality, Lifecycle Normalization & Audit (v3)
-- Target: Supabase DB1 (aqauempuwmbizqoaolop)
-- Safe schema undo script for Migration A v3.
-- NOTE: To restore pre-migration is_active values for the 27 deactivated broken link rows,
-- run the companion script: 20260829000001_phase30d_restore_is_active_data.sql
-- ==============================================================================

-- 1. DROP INDEXES
DROP INDEX IF EXISTS idx_opportunities_quality_score;
DROP INDEX IF EXISTS idx_opportunities_lifecycle_status;
DROP INDEX IF EXISTS idx_opportunities_active_lifecycle;
DROP INDEX IF EXISTS idx_opportunities_deadline_active;
DROP INDEX IF EXISTS idx_audit_logs_resource;
DROP INDEX IF EXISTS idx_audit_logs_action;
DROP INDEX IF EXISTS idx_audit_logs_created_at;

-- 2. DROP AUDIT_LOGS TABLE
DROP TABLE IF EXISTS audit_logs CASCADE;

-- 3. REMOVE ADDED COLUMNS FROM OPPORTUNITIES
ALTER TABLE opportunities DROP COLUMN IF EXISTS quality_score;
ALTER TABLE opportunities DROP COLUMN IF EXISTS quality_reason;
ALTER TABLE opportunities DROP COLUMN IF EXISTS lifecycle_status;
ALTER TABLE opportunities DROP COLUMN IF EXISTS last_verified_at;
ALTER TABLE opportunities DROP COLUMN IF EXISTS verification_source;
ALTER TABLE opportunities DROP COLUMN IF EXISTS audit_notes;
