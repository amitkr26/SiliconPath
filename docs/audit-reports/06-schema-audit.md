# Schema Audit Report — Phase 2 Database Consolidation

**Date**: 2026-07-13
**Branch**: phase-02-database-consolidation

## Database Map

| DB | Provider | Role |
|----|----------|------|
| DB1 | Supabase Primary | Core platform + social data |
| DB2 | Supabase Secondary | Archive + overflow |
| NEON1 | Neon Primary | Analytics + operational logs |
| NEON2 | Neon Secondary | Mirror replicas + cache |

---

## 1. DB1 — Supabase Primary (Core + Social)

### 1.1 Tables

| Table | Status | Issue |
|-------|--------|-------|
| `opportunities` | ✅ Canonical | Naming drift: `apply_link` (migration) vs `apply_url` (live), `stipend` vs `salary_range` |
| `companies` | ✅ Canonical | Named `organizations` in some code paths |
| `news_articles` | ✅ Canonical | Column drift: `source` vs `source_name`, `source_url` vs `url` |
| `scraper_sources` | ✅ Canonical | Named `scrape_sources` in DB_TABLES — rename needed |
| `subscribers` | ✅ Canonical | — |
| `suggestions` | ✅ Canonical | Missing from DB_TABLES |
| `link_check_results` | ✅ Canonical | Missing from DB_TABLES |
| `opportunity_reports` | ✅ Canonical | Missing from DB_TABLES |
| `learning_tracks` | ✅ Canonical | Named `academy_tracks` in DB_TABLES |
| `learning_days` | ✅ Canonical | Named `academy_days` in DB_TABLES |
| `learning_resources` | ✅ Canonical | Missing from DB_TABLES |
| `learning_questions` | ✅ Canonical | Missing from DB_TABLES |
| `track_assessments` | ✅ Canonical | Named `track_checkpoints` / `academy_assessment_results` in DB_TABLES |
| `user_learning_progress` | ✅ Canonical | — |
| `user_track_assessment_results` | ✅ Canonical | Named `academy_assessment_results` in DB_TABLES |
| `user_profiles` | ⚠️ Actually on DB1 | DB spec says DB2, live code routes to DB1 |
| `feed_posts` | ⚠️ Actually on DB1 | Same as above |
| `connections` | ⚠️ Actually on DB1 | Created by linkedin_features migration on DB1 |
| `connection_requests` | ⚠️ Actually on DB1 | Same |
| `user_follows` | ⚠️ Actually on DB1 | Same |
| `feed_post_likes` | ⚠️ Actually on DB1 | Named `post_reactions` in app code |
| `feed_post_comments` | ⚠️ Actually on DB1 | — |
| `feed_post_reposts` | ⚠️ Actually on DB1 | — |
| `conversations` | ⚠️ Actually on DB1 | Column drift: `participant_1/2` vs `participant_a/b` (app code) |
| `messages` | ⚠️ Actually on DB1 | Column drift: `content` vs `body` (app code) |
| `notifications` | ⚠️ Actually on DB1 | — |
| `skill_endorsements` | ⚠️ Actually on DB1 | — |
| `recommendations` | ⚠️ Actually on DB1 | — |
| `company_pages` | ⚠️ Actually on DB1 | — |
| `company_followers` | ⚠️ Actually on DB1 | — |
| `saved_opportunities` | ⚠️ Actually on DB1 | — |
| `applications` | ⚠️ Actually on DB1 | — |
| `user_resumes` | ⚠️ Actually on DB1 | Named `resumes` in app code |
| `user_alerts` | ⚠️ Actually on DB1 | Missing from DB_TABLES |

### 1.2 Missing Indexes

| Table | Missing Index |
|-------|---------------|
| `user_profiles` | `idx_user_profiles_username` on `username` (for lookups) |
| `user_profiles` | `idx_user_profiles_city` on `city` (for location-based search) |
| `user_profiles` | `idx_user_profiles_is_open_to_work` on `is_open_to_work` |
| `saved_opportunities` | `idx_saved_opp_user` on `user_id` |
| `applications` | `idx_applications_user` on `user_id` |
| `applications` | `idx_applications_opportunity` on `opportunity_id` |
| `feed_posts` | `idx_feed_posts_user` on `user_id` |
| `feed_posts` | `idx_feed_posts_created` on `created_at DESC` |
| `feed_posts` | `idx_feed_posts_type` on `post_type` |
| `feed_post_likes` | `idx_feed_likes_post` on `post_id` |
| `feed_post_comments` | `idx_feed_comments_post` on `post_id` |
| `feed_post_reposts` | `idx_feed_reposts_post` on `post_id` |
| `conversations` | `idx_conversations_participant_1` on `participant_1` |
| `conversations` | `idx_conversations_participant_2` on `participant_2` |
| `messages` | `idx_messages_conversation` on `conversation_id` |
| `notifications` | `idx_notifications_user_created` on `(user_id, created_at DESC)` |
| `skill_endorsements` | `idx_endorsements_owner` on `profile_owner_id` |
| `recommendations` | `idx_recommendations_recipient` on `recipient_id` |
| `user_follows` | `idx_follows_follower` on `follower_id` |
| `user_follows` | `idx_follows_following` on `following_id` |
| `connection_requests` | `idx_conn_req_sender` on `sender_id` |
| `connection_requests` | `idx_conn_req_receiver` on `receiver_id` |
| `company_pages` | `idx_company_pages_industry` on `industry` |
| `company_followers` | `idx_company_followers_company` on `company_id` |
| `community_posts` | `idx_community_posts_created` on `created_at DESC` |
| `community_posts` | `idx_community_posts_category` on `category` |
| `community_comments` | `idx_community_comments_post` on `post_id` |
| `user_alerts` | `idx_user_alerts_user` on `user_id` |
| `learning_tracks` | `idx_learning_tracks_order` on `order_index` |
| `user_learning_progress` | `idx_learning_progress_status` on `status` |
| `user_track_assessment_results` | `idx_assessment_results_track` on `track_id` |
| `scraper_sources` | `idx_scraper_sources_active` on `(is_active, last_scraped_at)` |
| `scraper_sources` | `idx_scraper_sources_type` on `type` |

### 1.3 Missing Foreign Keys

| Table | Missing FK |
|-------|------------|
| `applications.opportunity_id` | No FK to `opportunities` (cross-db but code uses DB1 for both) |
| `feed_posts.user_id` | FK exists to `auth.users` but missing to `user_profiles` |
| `feed_posts.opportunity_id` | No FK to `opportunities` |
| `saved_opportunities.opportunity_id` | No FK (cross-db reference) |
| `company_followers.user_id` | FK exists to `auth.users` but missing to `user_profiles` |
| `community_posts.user_id` | FK exists to `auth.users` but missing to `user_profiles` |
| `conversations.participant_1` | FK to `auth.users` but missing to `user_profiles` |
| `user_resumes.user_id` | FK to `auth.users`/`user_profiles` |

### 1.4 Missing RLS Policies

| Table | Issue |
|-------|-------|
| `learning_tracks` | RLS enabled but no admin write policy |
| `learning_days` | RLS enabled but no admin write policy |
| `learning_resources` | RLS enabled but no admin write policy |
| `learning_questions` | RLS enabled but no admin write policy |
| `track_assessments` | RLS enabled but no admin write policy |
| `user_profiles` | Needs public read policy for profile viewing |
| `applications` | No admin read policy |
| `user_alerts` | No policies (RLS enabled but no policies on DB2 migration) |
| `feed_posts` | Missing visibility-based read policy for connections/followers |
| `conversations` | Missing delete policy |
| `messages` | Missing delete policy |
| `user_track_assessment_results` | RLS enabled but no admin write policy |

### 1.5 Missing Triggers

| Table | Missing Trigger |
|-------|----------------|
| `opportunities` | `updated_at` auto-update |
| `companies` | `updated_at` auto-update |
| `company_pages` | `updated_at` auto-update |
| `user_profiles` | `updated_at` auto-update |
| `feed_posts` | `updated_at` auto-update |
| `learning_tracks` | `updated_at` auto-update |
| `recommendations` | No `updated_at` column at all |
| `connection_requests` | `updated_at` auto-update |
| `applications` | `updated_at` auto-update |
| `user_resumes` | `updated_at` auto-update |

---

## 2. DB2 — Supabase Secondary (Archive)

### 2.1 Tables

| Table | Status | Issue |
|-------|--------|-------|
| `news_archive` | ✅ Canonical | — |
| `subscribers_overflow` | ✅ Canonical | — |

### 2.2 Missing Indexes

| Table | Missing Index |
|-------|---------------|
| `subscribers_overflow` | `idx_overflow_email` on `email` |
| `news_archive` | `idx_archive_title_fts` for GIN index on full-text search |

### 2.3 Missing RLS

| Table | Issue |
|-------|-------|
| `news_archive` | RLS not enabled |
| `subscribers_overflow` | RLS not enabled |

---

## 3. NEON1 — Analytics

### 3.1 Tables

| Table | Status | Issue |
|-------|--------|-------|
| `ai_usage_log` | ✅ Canonical | Duplicated in DB1 migration |
| `link_check_logs` | ✅ Canonical | Duplicated in DB1 migration |
| `platform_events` | ✅ Canonical | Named `platform_analytics` in app code |
| `scrape_logs` | ✅ Canonical | Missing from DB_TABLES |

### 3.2 DB_TABLES Mismatch

| DB_TABLES Name | Actual Migration Name |
|----------------|----------------------|
| `page_views` | Uses `platform_events.event_type='page_view'` |
| `search_queries` | Uses `platform_events.event_type='search'` |
| `click_events` | Uses `platform_events.event_type='apply_click'` |

DB_TABLES lists `page_views`, `search_queries`, `click_events` as separate tables. The actual schema uses `platform_events` with an `event_type` discriminator. This is a **major discrepancy**.

### 3.3 Missing Indexes

| Table | Missing Index |
|-------|---------------|
| `platform_events` | `idx_events_created` on `created_at DESC` |
| `platform_events` | `idx_events_news` on `news_id` |
| `scrape_logs` | `idx_scrape_logs_source` on `source_id` |
| `scrape_logs` | `idx_scrape_logs_started` on `started_at DESC` |
| `scrape_logs` | `idx_scrape_logs_success` on `success` |

### 3.4 Missing Columns

| Table | Missing Column |
|-------|---------------|
| `link_check_logs` | `response_time_ms` integer (exists in DB1 version) |
| `platform_events` | `session_id` text (for session analytics) |
| `platform_events` | `user_id` uuid (for authenticated event tracking) |
| `ai_usage_log` | `duration_ms` integer (for latency tracking) |
| `ai_usage_log` | `model_version` text (for A/B testing) |
| `ai_usage_log` | `feature_version` integer (for feature iteration tracking) |

---

## 4. NEON2 — Cache / Mirror

### 4.1 Tables

| Table | Status | Issue |
|-------|--------|-------|
| `opportunities_mirror` | ✅ Canonical | Missing from DB_TABLES (listed as empty) |
| `news_mirror` | ✅ Canonical | Missing from DB_TABLES (listed as empty) |

### 4.2 Missing Indexes

| Table | Missing Index |
|-------|---------------|
| `news_mirror` | `idx_news_mirror_source` on `source` |

### 4.3 Missing Columns

`opportunities_mirror` is missing these columns that `opportunities` has:
- `city`, `state`, `country`, `is_remote`
- `responsibilities`, `requirements`
- `official_page_url`, `apply_link_type`
- `org_slug`, `company_page_id`

---

## 5. Naming Inconsistencies (Consolidation Plan)

| Migration Name | DB_TABLES Name | App Code Name | Canonical Choice |
|----------------|----------------|---------------|------------------|
| `scraper_sources` | `scrape_sources` | `scrape_sources` | `scraper_sources` (migration) |
| `learning_tracks` | `academy_tracks` | `learning_tracks`/`academy_tracks` | `learning_tracks` (migration) |
| `learning_days` | `academy_days` | `learning_days`/`academy_days` | `learning_days` (migration) |
| `track_assessments` | `track_checkpoints` | — | `track_assessments` (migration) |
| `user_track_assessment_results` | `academy_assessment_results` | — | `user_track_assessment_results` (migration) |
| `user_resumes` | `resumes` | `resumes` | `resumes` (app code + latest migration) |
| `connection_requests` | `connections` | `connections` | `connection_requests` (migration) with `connections` as accepted-connections view |
| `feed_post_likes` | Not in DB_TABLES | `post_reactions` | `feed_post_likes` (migration) |
| `notifications` (linkedin) | Not in DB_TABLES | `notifications` | `notifications` with unified schema |
| `platform_events` | `page_views`/`search_queries`/`click_events` | `platform_analytics` | `platform_events` (migration) with event_type |
| `suggestions` | Not in DB_TABLES | — | Add to DB_TABLES |
| `link_check_results` | Not in DB_TABLES | — | Add to DB_TABLES |
| `companies` | Not in DB_TABLES | — | Add as `companies` |
| `user_alerts` | Not in DB_TABLES | — | Add to DB_TABLES |
| `learning_resources` | Not in DB_TABLES | — | Add to DB_TABLES |
| `learning_questions` | Not in DB_TABLES | — | Add to DB_TABLES |
| `opportunities_mirror` | Not in DB_TABLES (NEON2 empty) | — | Add to DB_TABLES.NEON2 |
| `news_mirror` | Not in DB_TABLES (NEON2 empty) | — | Add to DB_TABLES.NEON2 |
| `scrape_logs` | Not in DB_TABLES | — | Add to DB_TABLES |
| `opportunities.apply_link` | — | `apply_url` | Keep `apply_link` as canonical, add generated col `apply_url` |
| `opportunities.stipend` | — | `salary_range` | Keep `stipend` as canonical, add generated col `salary_range` |
| `conversations.participant_1/2` | — | `participant_a/b` | Keep `participant_1/2` as canonical |
| `messages.content` | — | `body` | Keep `content` as canonical |
| `feed_posts.user_id` | — | `author_id` | Keep `user_id` as canonical |
| `feed_posts.likes_count` | — | `like_count`/`likes` | Keep `likes_count` as canonical |
| `feed_posts.comments_count` | — | `comment_count` | Keep `comments_count` as canonical |
| `notifications.message` | — | `body`/`title`+`body` | Keep `message` as canonical |

---

## 6. Duplicate Structures

| Table | Duplicated In |
|-------|---------------|
| `ai_usage_log` | DB1 core + NEON1 + separate migration (3 definitions) |
| `link_check_logs` | DB1 core + NEON1 (2 definitions) |
| `opportunity_reports` | DB1 core + NEON1 (2 definitions) |
| `opportunities` table | DB1 definition + `opportunities_mirror` on NEON2 |
| `notifications` | DB2 user_social + DB1 linkedin (2 definitions) |
| `feed_posts` | DB2 user_social + DB1 linkedin (2 definitions) |
| `company_profiles` | DB1 core + DB1 linkedin migration (same table, two DEFINE + ALTER) |
| `company_followers` | DB1 linkedin migration (two CREATE TABLE IF NOT EXISTS) |
| `user_follows` | DB2 user_social + DB1 linkedin (2 definitions) |
| `skill_endorsements` | DB2 user_social + DB1 linkedin (2 definitions) |
| `conversations` | DB2 user_social + DB1 linkedin (2 definitions) |
| `messages` | DB2 user_social + DB1 linkedin (2 definitions, different schema!) |
| `user_profiles` | DB2 user_social + DB1 linkedin (ALTER TABLE ADD COLUMN pattern) |
| `saved_opportunities` | DB2 user_social + early separate migration |
| `applications` | DB2 user_social + early separate migration |

---

## 7. Missing Triggers

| Function | Status |
|----------|--------|
| `generate_opp_slug()` | Defined but body was previously empty — now implemented |
| `auto_opp_slug()` | ✅ Defined (INSERT trigger on opportunities) |
| `auto_slug()` | ❌ Duplicate of `auto_opp_slug()` — consolidation needed |
| `set_username` | ✅ Defined |
| `handle_new_user()` | ✅ Defined (auto-create profile on signup) |
| `on_connection_accepted` | ✅ Defined |
| `on_follow_change` | ✅ Defined |
| `on_post_like` | ✅ Defined |
| `on_post_comment` | ✅ Defined |
| `on_company_follow` | ✅ Defined |
| `on_new_conversation` | ✅ Defined |
| `on_new_message` | ✅ Defined |
| `updated_at` trigger | ❌ Missing on ALL tables that have `updated_at` column |

---

## 8. Summary

### Critical Issues
1. **DB_TABLES.NEON1** lists 3 separate tables (`page_views`, `search_queries`, `click_events`) but schema uses `platform_events` with `event_type` discriminator
2. **DB_TABLES.NEON2** listed empty but should have `opportunities_mirror`, `news_mirror`
3. **Duplicate table definitions** across multiple migration files targeting different DBs
4. **Column name drift** between migration files and app code for 5+ columns
5. **Social tables** defined in DB2 migrations but actually live on DB1 in production

### High Priority
6. **Missing updated_at triggers** on 10+ tables that have `updated_at` column
7. **Missing indexes** on 35+ frequently-queried columns
8. **Missing RLS policies** on 10+ tables  
9. **Missing foreign keys** on cross-table references
10. **DB_TABLES inventory** out of sync (missing 12+ tables, wrong names for 8+)

### Medium Priority
11. **Naming standardization** of 10+ table/column names across codebase
12. **Missing columns** on mirror tables for feature parity
13. **Duplicate function definitions** (`generate_opp_slug` vs `generate_slug`, `auto_opp_slug` vs `auto_slug`)
