# DATABASE MAP — every Supabase table/function used by the frontend

> Generated 2026-08-19 from a full audit of `frontend/src` (`.from()` and `.rpc()` sweep). Column details verified against live schema where noted; tables marked with migration-sourced columns derive from `frontend/supabase/migrations/` (not live introspection).

## Topology

| DB | Project | Role | Client | Env vars |
|---|---|---|---|---|
| db1 | Supabase Project 1 `aqauempuwmbizqoaolop` | Core transactional + social + logs | `supabaseAdmin` (service role) / SSR `createClient` | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| db2 | Supabase Project 2 `jbqjipwanfsxyqkfrrpx` | Legacy social mirror | `supabase2Admin` (service role) | `SUPABASE_2_URL`, `SUPABASE_2_SERVICE_ROLE_KEY` |
| neon1 | Neon 1 | Analytics + mirrors | `neon1`/`neonPrimary` | `NEON_1_DATABASE_URL` |
| neon2 | Neon 2 | Cache mirror | `neon2`/`neonSecondary` | `NEON_2_DATABASE_URL` |

Purpose router: `frontend/src/lib/db/index.ts` — opportunities/news/auth → db1, social → db2 (legacy only), analytics → neon1, cache/search → neon2.

## Tables (db1 — 44)

| Table | Used by (routes/lib) | Read ops | Write ops | Auth req | Backend impl |
|---|---|---|---|---|---|
| `opportunities` | opportunities, search, feed, cron, admin, employer, ai/grounding | select w/ filters, is_active, verification_status | insert (scrapers/employer/admin), update (admin verify/reject/edit, expiry), delete (admin) | public read; admin/cron write | `backend/server` `GET /api/v1/opportunities` + `/:idOrSlug` (COMPLETE); writes MISSING |
| `organizations` | organizations, opportunities org resolve, admin, companies | select (list/slug), join | insert/update/delete (admin, evidence-gated resolve) | public read; admin write | `GET /api/v1/organizations` + `/:slug` (COMPLETE) |
| `news_articles` | news, news/sync, archive-news, sitemap | select w/ search/tag, slug | insert/update (sync, onConflict url), delete (cleanup) | public read; cron write | `GET /api/v1/news` (list only) — PARTIAL |
| `user_profiles` | profile, people, network, suggestions, feed backfill, resume, academy, recommendations, employer, auth/signup | select (public allowlist `PUBLIC_PROFILE_FIELDS`), search | upsert (signup), update (PATCH self), syncProfile (db2 mirror) | self write, public read (allowlist) | `GET /api/v1/profiles/me` + `/:username` (COMPLETE GET; PATCH MISSING) |
| `connections` | network/connect, connections, suggestions, feed | select (accepted/pending, direction, status check) | insert (pending), update (accept/reject), delete (withdraw) | auth | MISSING |
| `connection_requests` (legacy) | network/connect PATCH fallback | select | insert | auth | MISSING |
| `user_follows` | network/follow, followers, following | select | insert/delete (23505→409) | auth | MISSING |
| `feed_posts` | feed, feed/posts, community? | select (global feed), connection filter (unused — KNOWN_ISSUES #5) | insert, update/delete (owner) | auth | MISSING |
| `feed_post_likes` | feed/posts/[id]/like | select (toggle state) | insert/delete (toggle) | auth | MISSING |
| `feed_post_comments` | feed/posts/[id]/comment | select (count) | insert | auth | MISSING |
| `feed_post_reposts` | feed/posts/[id]/repost | select (toggle state) | insert/delete (toggle) | auth | MISSING |
| `conversations` | messages | select (participant_a/b, last_message_at) | insert, update (last_message_at) | auth (participant) | MISSING |
| `messages` | messages/[conversationId] | select (history, marks incoming read) | insert | auth (participant) | MISSING |
| `notifications` | notifications, feed/network/community/employer hooks | select (limit 100, unread filter), count | insert, update (mark read/all-read) | auth (owner) | MISSING |
| `saved_opportunities` | bookmarks | select (join opp+org) | insert (idempotent), delete (by id or opportunity_id) | auth | `backend/server` saved-opportunities CRUD (COMPLETE) |
| `applications` | applications | select (join opp+org+profile) | insert (idempotent per user+opp), update (owner/employer/admin status flow), delete | auth | `backend/server` applications CRUD (COMPLETE) |
| `resumes` | resume | select | insert, delete (all for user) | auth | MISSING |
| `skill_endorsements` | profile/[userId]/endorse | select (toggle) | insert/delete | auth | MISSING |
| `recommendations` | profile/[userId]/recommendations | select (is_visible filter) | insert | auth | MISSING |
| `community_posts` | community/posts | select (category filter, sort) | insert (category forced general), delete (owner) | public read; auth write | MISSING |
| `community_comments` | community/comments | select | insert (manual comment_count increment) | auth | MISSING |
| `company_pages` | companies | select (is_following join) | insert/update/delete (admin) | public read (gated FEATURE flag) | MISSING |
| `company_followers` | companies/[id]/follow | select | insert/delete | auth | MISSING |
| `subscribers` | subscribe, admin/subscribers, digest | select (for digest, unsubscribe token) | insert (23505→409), delete (token-verified) | none (public) | MISSING |
| `resources` | resources | select (category/limit/offset), slug | — | public | MISSING |
| `announcements` | admin/announcements | select | insert/delete | admin | MISSING |
| `opportunity_reports` | contact, report-issue | — | insert (report_type mapping) | none (rate-limited) | MISSING |
| `scrape_sources` | scrape-sources, admin/scrape, scraper health | select | CRUD (verifyAdmin) | admin | MISSING |
| `scrape_runs` | admin/scrape/status, admin/performance | select (health) | insert/update (pipeline) | admin | MISSING |
| `link_check_logs` | check-links, admin/recheck-link | select | insert | cron/admin | MISSING |
| `opportunity_verifications` | check-links, admin/recheck-link | select | insert (evidence ledger — **DDL may be pending**: insert guarded in `lib/db/index.ts`) | cron/admin | MISSING |
| `ai_usage_log` | ai via `logAIUsage` (gateway.setLogger) | admin/analytics | insert (fire-and-forget) | backend-only | MISSING (server does not log) |
| `app_config` | ATS adapters (greenhouse_board_token) | select | — | backend-only | MISSING |
| `academy_tracks` | academy/tracks | select (or FALLBACK_TRACKS) | — | public | MISSING |
| `academy_days` | academy/tracks/[id]/days | select (by track_id) | — | public | MISSING |
| `track_assessments` | academy/tracks/[id]/checkpoints | select | — | public | MISSING |
| `track_checkpoints` | (checkpoint queries) | select | — | public | MISSING |
| `user_learning_progress` | academy/progress | select (completed-days, passed-tracks) | upsert onConflict (user_id, track_id, day_id) | unauthenticated-but-userId-parameterized | MISSING |
| `learning_tracks` (legacy) | academy fallback | select | — | public | MISSING |
| `learning_days` (legacy) | academy fallback | select | — | public | MISSING |

## Tables (db2 — 2)

| Table | Used by | Ops | Notes |
|---|---|---|---|
| `news_archive` | archive-news | insert (db1 → db2) | legacy mirror |
| `user_profiles` | syncProfile | upsert | legacy mirror; live writes go to db1 |

## Tables (neon1 — 7)

| Table | Used by | Ops |
|---|---|---|
| `click_events` | track-click (apply_click), admin/analytics, admin/performance | insert, count |
| `page_views` | (analytics) | insert, count |
| `search_queries` | (analytics) | insert |
| `trending_cache` | (trending) | read/write |
| `keyword_stats` | (analytics) | read/write |
| `opportunities_mirror` | sync-replica | upsert (from db1) |
| `news_mirror` | sync-replica | upsert (from db1) |

## Tables (neon2 — 3)

| Table | Used by | Ops |
|---|---|---|
| `page_views` | sync-replica | upsert |
| `search_queries` | sync-replica | upsert |
| `click_events` | sync-replica | upsert |

## RPCs / functions (db1)

| Function | Caller | Behavior |
|---|---|---|
| `toggle_upvote` | community/vote POST | toggles community post upvote |
| `increment_profile_views` | profile/[userId] GET | increments profile view counter |
| triggers | — | `feed_posts.like_count/comment_count` (SECURITY DEFINER, migration `20260818000002`); `user_profiles.follower_count/following_count/connection_count` (migrations `20260818000001`, `20260818000003`) |

## Notes

- **Do not invent table names.** The legacy `learning_*` names are real (fallback path); `scraper_sources` (admin UI) vs `scrape_sources` (engine) split is a real drift item.
- Counts are trigger-maintained for feed_posts and user_profiles; `community_comments.comment_count` is route-managed. Routes must not manually increment trigger-managed counts.
- RLS: v2 policies verified live on DB1 social tables (2026-08-18); service-role clients bypass RLS (used for reads + admin ops).
