# Phase 30C: Database Migration & Schema Audit Report

**Platform**: BerojgarDegreeWala  
**Audit Date**: August 28, 2026  
**Primary Database**: Supabase PostgreSQL (`aqauempuwmbizqoaolop`)  
**Secondary Telemetry**: Neon PostgreSQL (`ep-mute-wave-a5m04ucl`)  
**Status**: **VERIFIED & CONSOLIDATED**

---

## 1. Schema Extensions Applied

1. **`user_roles`**: Maps user IDs to global platform roles (`owner`, `platform_admin`, `manager`, `moderator`, `support`, `user`).
2. **`user_permissions`**: Maps user IDs to explicit capability strings.
3. **`audit_logs`**: Stores administrative events with JSONB metadata.
4. **`opportunities` Extension**:
   - `quality_score (INTEGER DEFAULT 50)`: Deterministic score (0–100).
   - `last_verified_at (TIMESTAMPTZ)`: Timestamp of most recent verification check.
   - `verification_source (TEXT)`: Source verifying authority.
   - `audit_notes (TEXT)`: Structured audit findings.
5. **RLS Hardening**: Removed `FOR ALL USING (true)` policies; privileged mutations use `supabaseAdmin` service role.

---

## 2. Table Ownership & Responsibility Matrix

| Database Cluster | Entity Tables | Primary Responsibility |
| :--- | :--- | :--- |
| **Supabase PostgreSQL** | `user_profiles`, `user_resumes`, `user_roles`, `user_permissions`, `audit_logs`, `opportunities`, `applications`, `saved_opportunities`, `feed_posts`, `feed_post_comments`, `feed_post_likes`, `conversations`, `messages`, `notifications`, `connections`, `skill_endorsements`, `recommendations`, `organizations`, `news_articles`, `scrape_sources`, `scrape_runs` | Single source of truth for all transactional business entities and user authentication. |
| **Neon PostgreSQL** | `search_telemetry`, `pageview_events`, `scraper_execution_logs`, `ai_query_cache` | Telemetry analytics, rate limit cache, and background scrape worker scratch data. |
