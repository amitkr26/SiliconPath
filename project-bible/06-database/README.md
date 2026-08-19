# Database Architecture

Verified live 2026-08-19. Sources: `frontend/src/lib/db/index.ts`, `frontend/src/lib/supabase.ts`, `frontend/supabase/migrations/*`.

## 1. Topology

| DB | Provider | Role | Live tables |
|----|----------|------|-------------|
| DB1 | Supabase Project 1 | Production core (platform + social + logs) | opportunities, organizations, news_articles, user_profiles, connections, connection_requests (legacy), user_follows, feed_posts, feed_post_likes, feed_post_comments, feed_post_reposts, conversations, messages, notifications, saved_opportunities, applications, resumes, skill_endorsements, recommendations, community_posts, community_comments, company_pages, company_followers, subscribers, resources, announcements, opportunity_reports, scrape_sources, scrape_runs, link_check_logs, opportunity_verifications, ai_usage_log, app_config (greenhouse_board_token), academy_tracks, academy_days, track_assessments, track_checkpoints, user_learning_progress, learning_tracks, learning_days (legacy names) |
| DB2 | Supabase Project 2 | Legacy mirror only | news_archive, user_profiles (written via `syncProfile`) |
| Neon 1 | Neon (analytics + mirrors) | Analytics + mirrored data | click_events, page_views, search_queries, trending_cache, keyword_stats, opportunities_mirror, news_mirror |
| Neon 2 | Neon (cache mirror) | Cache mirror (subset of Neon 1) | page_views, search_queries, click_events |

Purpose router (`getDB` in `frontend/src/lib/db/index.ts`): opportunities/news/auth → DB1; social → DB2 (legacy); analytics → Neon 1; cache/search → Neon 2. Access is via `@supabase/supabase-js` (DB1/DB2) and `@neondatabase/serverless` (Neon 1/2).

## 2. Core Tables (live columns)

### `opportunities` (DB1)
Key live columns: `id` (uuid PK), `title`, `organization_id` (uuid FK → organizations.id), `category`, `location`, `city`, `state`, `country`, `is_remote`, `salary_range`, `deadline`, `posted_date`, `duration`, `eligibility`, `min_qualification`, `experience_required`, `skills_required` (text[]), `description`, `short_description`, `responsibilities` (text[]), `requirements` (text[]), `apply_url`, `official_page_url`, `source_url` (UNIQUE), `apply_link_type`, `is_active`, `verification_status`, `verified_at`, `tags` (text[]), `slug` (UNIQUE), `org_slug`, `apply_clicks`, `views`, `saves_count`, `posted_at`, `last_link_checked`, `link_check_status`, `admin_notes`, `scrape_source`, `source_type` (scraped | employer_posted | rss | ...), `created_at`, `updated_at`.

`verification_status` CHECK constraint = `verified | unverified | link_unavailable | expired` (20260704000001 + re-applied 20260715_002). No `pending`, no `rejected` in the enum.

### `organizations` (DB1)
`id`, `name`, `slug` (UNIQUE), `type` (government | research_lab | academic | private | international | psu), `country`, `location`, `website`, `logo_url`, `description`, `is_verified`, `is_active`, `created_at`, `updated_at`.

### `news_articles` (DB1)
`id`, `title`, `slug` (UNIQUE), `summary`, `content`, `source_name`, `url` (canonical names per code — `frontend/src/lib/scrapers/rss-parser.ts`; historical `source`/`source_url` columns exist in migrations), `author`, `image_url`, `category`, `tags` (text[]), `companies_mentioned` (text[]), `published_at`, `created_at`, `views`, `is_featured`.

### `user_profiles` (DB1)
`id`, `username`, `display_name`, `headline`, `bio`, `location`, `country`, `city`, `job_title`, `current_company`, `experience_years`, `skills`, `interests`, `linkedin_url`, `github_url`, `website_url`, `avatar_url`, `is_profile_public`, `follower_count`, `following_count`, `connection_count`.

### `connections` (DB1)
`id`, `requester_id`, `addressee_id`, `status` (pending | accepted | rejected), `created_at`. No accept-trigger; triggers only maintain `user_profiles` counts.

### `conversations` (DB1)
`id`, `participant_a`, `participant_b`, `last_message_at`, `last_message_preview`, `unread_count_a`, `unread_count_b`, `created_at` (code names `participant_a`/`participant_b` — not `participant_1/2`).

### `messages` (DB1)
`id`, `conversation_id`, `sender_id`, `body`, `is_read`, `created_at` (column is `body`, not `content`).

### `feed_posts` (DB1) + engagement tables
`feed_posts`: `id`, `user_id`, `company_id`, `content`, `post_type`, `media_urls` (text[]), `opportunity_id`, `article_title`, `article_cover_url`, `tags` (text[]), `like_count`, `comment_count` (NOT `likes_count`/`comments_count` — wrong names were a production bug fixed 2026-08-18), `reposts_count`, `views_count`, `visibility`, `is_pinned`, `created_at`, `updated_at`.
`feed_post_likes`: `id`, `post_id`, `user_id`, `reaction`, `created_at`, UNIQUE(post_id, user_id).
`feed_post_comments`: `id`, `post_id`, `user_id`, `parent_comment_id` (self-ref), `content`, `likes_count`, `created_at`.
`feed_post_reposts`: `id`, `post_id`, `user_id`, `comment`, `created_at`, UNIQUE(post_id, user_id).

### `notifications` (DB1)
`id`, `user_id`, `type`, `actor_id`, `entity_type`, `entity_id`, `message`, `is_read`, `created_at`.

### `applications` (DB1)
`id`, `user_id`, `opportunity_id`, `opportunity_title`, `opportunity_org`, `opportunity_deadline`, `status`, `notes`, `applied_at`, `updated_at`, `created_at`.

### `saved_opportunities` (DB1)
`id`, `user_id`, `opportunity_id`, `created_at`, UNIQUE(user_id, opportunity_id).

### `resumes` (DB1)
`id`, `user_id` (UNIQUE), `full_name`, `headline`, `summary`, `location`, `email`, `phone`, `education` (jsonb), `experience` (jsonb), `projects` (jsonb), `skills` (text[]), `ats_score`, `updated_at`, `created_at`. (Migration 20260710_002 targets DB2 historically — live table is on DB1 per topology.)

## 3. Trigger / RPC Inventory

RPCs (only 2, call sites in code):
- `toggle_upvote` — community/vote (`frontend/src/app/api/community/vote/route.ts`)
- `increment_profile_views` — profile/[userId] (`frontend/src/app/api/profile/[userId]/route.ts`)

Triggers (live, SECURITY DEFINER where noted):
- `feed_posts.like_count` / `comment_count` — `update_post_likes_count()` / `update_post_comments_count()`, SECURITY DEFINER (20260818000002, replaced the 20260703000003 versions)
- `user_profiles.follower_count` / `following_count` — `handle_follow()` on user_follows (20260703000003)
- `user_profiles.connection_count` — `handle_connection_count()`, SECURITY DEFINER, only `accepted` rows count (20260818000003)

Defined in migrations, live status not reverified:
- `generate_opp_slug()` / `auto_opp_slug()` — opportunity slug auto-generation (20260704000001)
- `generate_slug()` / `auto_slug()` — slug generation (20260501000002, 20260715_002)
- `handle_new_user()` — auto-create user_profiles on auth signup (20260630000001)
- `auto_username()` — default username (20260703000003)
- `check_connection_unique()`, `handle_connection_accepted()`, `check_conversation_unique()`, `update_conversation_on_message()`, `update_company_followers()` (20260703000003)

## 4. Migrations Index

`frontend/supabase/migrations/` (28 files, listed in filename order):

- 20260501000001_fix_duplicates_and_cleanup.sql
- 20260501000002_verification_and_slugs.sql
- 20260501000004_ai_usage_log.sql
- 20260501000005_news_slug_suggestions.sql
- 20260630000001_user_profiles.sql
- 20260703000002_supabase2_schema.sql
- 20260703000003_linkedin_features.sql
- 20260703000004_scrape_sources_and_verification.sql
- 20260704000001_db1_core_schema.sql
- 20260704000001_linkedin_tables.sql
- 20260704000002_db2_user_social.sql
- 20260704000003_neon1_analytics.sql
- 20260705000001_academy_learning_path.sql
- 20260705000002_academy_content_seed.sql
- 20260706000001_batch1_sources.sql
- 20260710_002_resumes.sql
- 20260714_001_announcements.sql
- 20260715_001_fix_missing_tables.sql
- 20260715_002_fix_remaining_schema.sql
- 20260802000001_add_user_roles.sql
- 20260812000001_news_slug_column.sql
- 20260812000002_link_check_columns.sql
- 20260814000001_applications_unique_fk.sql
- 20260816000001_opportunity_verifications.sql
- 20260817000001_fix_social_rls_v2.sql
- 20260818000001_user_profiles_social_counts.sql (adds follower_count/following_count/connection_count to user_profiles, backfills)
- 20260818000002_fix_post_count_triggers.sql (SECURITY DEFINER like/comment count triggers; fixed wrong `likes_count`/`comments_count` names)
- 20260818000003_connection_count_trigger.sql (handle_connection_count + backfill)

## 5. RLS Note

RLS policies exist via migrations (e.g. public reads on opportunities/news/organizations, owner/manage-own policies for user_profiles/resumes, `20260817000001_fix_social_rls_v2.sql`). Verified live 2026-08-18. Do not re-apply blindly — the 20260817/20260818 fixes are already applied to Project 1; re-running CREATE POLICY may conflict.

## 6. Known Drift

- Neon mirrors are written by `/api/sync-replica` (frontend), not cron from migrations.
- `opportunity_verifications` table insert is guarded in code; DDL may still be pending — see the `opportunity_verifications (DDL pending)` comment in `frontend/src/lib/db/index.ts` (migration 20260816000001 exists).
- `resumes` migration targets DB2 (20260710_002 header) but the live topology has it on DB1.
- RPC definitions are not in migration files (created via SQL editor); only call sites confirmed.
