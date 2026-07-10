-- =====================================================================
-- 0000_reset_DESTRUCTIVE.sql
-- WARNING: This DROPS ALL DATA in both Supabase projects. No undo.
-- Run this ONLY when doing the clean v2 rebuild the maintainer requested.
-- Run 0001 (core) on Supabase Project 1, 0002 (social) on Supabase Project 2.
-- =====================================================================

-- ---- Project 1 (Core) tables ----
DROP TABLE IF EXISTS scrape_runs CASCADE;
DROP TABLE IF EXISTS scrape_sources CASCADE;
DROP TABLE IF EXISTS opportunities CASCADE;
DROP TABLE IF EXISTS news_articles CASCADE;
DROP TABLE IF EXISTS resources CASCADE;
DROP TABLE IF EXISTS academy_assessments CASCADE;
DROP TABLE IF EXISTS academy_days CASCADE;
DROP TABLE IF EXISTS academy_tracks CASCADE;
DROP TABLE IF EXISTS subscribers CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- ---- Project 2 (Social) tables ----
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS connections CASCADE;
DROP TABLE IF EXISTS feed_posts CASCADE;
DROP TABLE IF EXISTS employer_profiles CASCADE;
DROP TABLE IF EXISTS academy_assessment_results CASCADE;
DROP TABLE IF EXISTS academy_user_progress CASCADE;
DROP TABLE IF EXISTS saved_opportunities CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
