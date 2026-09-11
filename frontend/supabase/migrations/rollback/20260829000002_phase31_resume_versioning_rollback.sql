-- ==============================================================================
-- ROLLBACK SCRIPT: Phase 31 Resume Versioning & Extended Domain Fields
-- Target: Supabase DB1 (aqauempuwmbizqoaolop)
-- Safe undo script if Phase 31 migration needs to be reverted.
-- ==============================================================================

-- 1. DROP RESUME_VERSIONS TABLE
DROP TABLE IF EXISTS resume_versions CASCADE;

-- 2. REMOVE ADDED EXTENSION COLUMNS FROM USER_RESUMES
ALTER TABLE user_resumes DROP COLUMN IF EXISTS headline;
ALTER TABLE user_resumes DROP COLUMN IF EXISTS summary;
ALTER TABLE user_resumes DROP COLUMN IF EXISTS location;
ALTER TABLE user_resumes DROP COLUMN IF EXISTS awards;
ALTER TABLE user_resumes DROP COLUMN IF EXISTS certifications;
