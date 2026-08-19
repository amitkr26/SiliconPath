# FRONTEND ↔ BACKEND FUNCTIONALITY MAP

> Generated 2026-08-19 from a full audit of `frontend/` (150 `route.ts` files + `lib/`) and `backend/` (`api`, `server`, `ai-gateway`).
> Status legend: **COMPLETE** = backend performs the same operation · **PARTIAL** = exists but missing parts · **MISSING** = no backend counterpart · **N/A** = intentionally frontend/Supabase-side (auth flows delegated to Supabase Auth per Phase 8).

Every row maps a frontend backend capability to its backend equivalent. Paths are real, discovered paths.

---

## Auth & Session

| Frontend implementation | Existing backend equivalent | Status |
|---|---|---|
| `frontend/src/app/api/auth/signup/route.ts` (POST; Supabase Admin createUser + `user_profiles` upsert, role from whitelisted accountType, reserved-username guard) | `backend/server/src/routes/` — none (server only *verifies* tokens via `middleware/auth.ts`) | **MISSING** → add `POST /api/v1/auth/signup` mirroring the frontend (Supabase Auth stays the identity store, Phase 8) |
| `frontend/src/app/api/auth/signout/route.ts` (POST; Supabase client signOut) | none (stateless Bearer — nothing to invalidate server-side) | **N/A** (client-side token discard) |
| `frontend/src/app/api/auth/check-username/route.ts` (GET; username lookup + suggestions) | none | **MISSING** → `GET /api/v1/auth/check-username` |
| `frontend/src/middleware.ts` (Bearer/`getUser` verification, session cookie) | `backend/server/src/middleware/auth.ts` `requireAuth` (Supabase `auth.getUser`) | **COMPLETE** (same verification model) |
| `frontend/src/app/api/admin/auth/route.ts` + `admin/auth/session` (HMAC admin token) | `backend/api/src/auth` `requireAdmin` (x-admin-password / HMAC / static) — used by Next routes, **not** by the server (server has its own `x-admin-password` sha256 check in `routes/admin.ts`) | **PARTIAL** — server admin covers password path only |

## Opportunities

| Frontend implementation | Existing backend equivalent | Status |
|---|---|---|
| `frontend/src/app/api/opportunities/route.ts` (GET; `searchOpportunities()` — is_active, verification, category/eligibility/location/deadline/search filters, pagination, canonical vocabulary) | `backend/server/src/routes/opportunities.ts` `GET /api/v1/opportunities` (same filters, zod `opportunityListQuerySchema`, `{success,data,pagination}`) | **COMPLETE** |
| `frontend/src/app/api/opportunities/[id]/route.ts` (GET) | `GET /api/v1/opportunities/:idOrSlug` (UUID or slug, `is_expired` computed) | **COMPLETE** |
| `.../opportunities/[id]` PATCH/DELETE (requireAdmin, evidence-gated org resolution) | none (admin ops are frontend-only) | **MISSING** → admin routes in server are read-only stats today |
| `frontend/src/app/api/opportunities/by-slug/[slug]/route.ts` (GET) | covered by `:idOrSlug` | **COMPLETE** |
| `frontend/src/app/api/opportunities/featured/route.ts` (GET, active+verified limit 10) | none | **MISSING** → `GET /api/v1/opportunities/featured` |
| `frontend/src/app/api/opportunities/stats/route.ts` (GET counts + byCategory) | none | **MISSING** → `GET /api/v1/opportunities/stats` |
| `frontend/src/app/api/opportunities-feed/route.ts` (public JSON feed) | none | **MISSING** |
| `frontend/src/app/api/opportunities/similar/[id]/route.ts` (GET, tags overlap) | none | **MISSING** |
| `frontend/src/app/api/search/route.ts` + `search/opportunities` (search wrapper + org join) | `GET /api/v1/opportunities` `search` param (text ilike) | **PARTIAL** — no people search, no org-name join |
| `frontend/src/app/api/calendar-export/[id]/route.ts` (ICS + VALARM) | none | **MISSING** |
| `frontend/src/app/api/sitemap/route.ts`, `og/opportunity/[slug]` (edge) | none (Next-specific) | **N/A** (stay in frontend) |

## News

| Frontend implementation | Existing backend equivalent | Status |
|---|---|---|
| `frontend/src/app/api/news/route.ts` (GET; DB rows merged with live RSS, 30-min cache) | `backend/server/src/routes/content.ts` `GET /api/v1/news` (list only) | **PARTIAL** — no live-RSS merge in server |
| `frontend/src/app/api/news/[slug]/route.ts` (GET) | none | **MISSING** → `GET /api/v1/news/:slug` |
| `frontend/src/app/api/news/sync/route.ts` (requireCron; RSS → upsert) | none | **MISSING** → `GET /api/v1/cron/news-sync` |
| `frontend/src/app/api/news/archive-news/route.ts` (db1 → db2 mirror) | none | **MISSING** |
| `frontend/src/app/api/news/cleanup-news/route.ts` (dedupe normalized url/title) | none | **MISSING** |

## AI (canonical gateway = `backend/ai-gateway`, used by BOTH sides)

| Frontend implementation | Existing backend equivalent | Status |
|---|---|---|
| `frontend/src/lib/ai/providers.ts` → ai-gateway `gateway.generate`, logged to `ai_usage_log` via `setLogger(logAIUsage)` | `backend/server/src/routes/ai.ts` `POST /api/v1/ai/insights` (wraps gateway; **no** `setLogger` → no usage log) | **PARTIAL** — logging missing on server |
| `frontend/src/app/api/ai/chat/route.ts` (grounding, no-match fallback, URL sanitizer) | none (only generic `/ai/insights`) | **MISSING** → `POST /api/v1/ai/chat` |
| `frontend/src/app/api/ai/match/route.ts` (top-10 JSON) | none | **MISSING** → `POST /api/v1/ai/match` |
| `frontend/src/app/api/ai/search/route.ts` (parseSearchQuery → filters) | none | **MISSING** → `POST /api/v1/ai/search` |
| `frontend/src/app/api/ai/summarize/route.ts`, `classify`, `enhance`, `expire`, `opportunity-summary/[slug]` | none | **MISSING** |
| `frontend/src/lib/ai/grounding.ts` (opportunity grounding helpers) | none | **MISSING** → port into `backend/server/src/services/ai` |

## Community / LinkedIn-style (all MISSING in server; `supabase2Admin` DB2 client already wired but unused)

| Frontend implementation | Existing backend equivalent | Status |
|---|---|---|
| `frontend/src/app/api/feed/route.ts` (GET auth: connections' posts; POST auth) | none | **MISSING** → `GET/POST /api/v1/feed` |
| `frontend/src/app/api/feed/posts/[id]/route.ts` PATCH/DELETE (owner) | none | **MISSING** |
| `frontend/src/app/api/feed/posts/[id]/like` POST, `/comment` POST, `/repost` POST | none | **MISSING** |
| `frontend/src/app/api/network/connect/route.ts` (POST pending + notification + email; GET with direction) | none | **MISSING** → `/api/v1/network/connect` |
| `frontend/src/app/api/network/connect/[id]/route.ts` PATCH (accept/decline/withdraw) | none | **MISSING** |
| `frontend/src/app/api/network/connections/route.ts` (GET accepted list or `?myId=&theirId=` status) | none | **MISSING** |
| `frontend/src/app/api/network/suggestions/route.ts` (GET scoring) | none | **MISSING** |
| `frontend/src/app/api/network/follow/[userId]` GET/POST, `followers`, `following` | none | **MISSING** |
| `frontend/src/app/api/messages/route.ts` (GET conversations) + `messages/[conversationId]` GET/POST | none | **MISSING** |
| `frontend/src/app/api/notifications/route.ts` (GET, PATCH mark-all-read), `count`, `[id]` | none | **MISSING** |
| `frontend/src/app/api/community/posts` GET/POST, `posts/[id]` GET/DELETE, `comments` POST, `vote` POST (rpc `toggle_upvote`) | none | **MISSING** |
| `frontend/src/app/api/people/search/route.ts` (public profile search) | none | **MISSING** → `GET /api/v1/search/people` |
| `frontend/src/app/api/profile/[userId]/endorse`, `recommendations` | none | **MISSING** |
| `frontend/src/app/api/companies/...` (list, detail, follow/unfollow) | none | **MISSING** |

## Profiles

| Frontend implementation | Existing backend equivalent | Status |
|---|---|---|
| `frontend/src/app/api/profile/me/route.ts` (GET/PATCH) | `backend/server/src/routes/profiles.ts` `GET /api/v1/profiles/me` (GET only) | **PARTIAL** — PATCH missing |
| `frontend/src/app/api/profile/[userId]/route.ts` (GET public w/ `PUBLIC_PROFILE_FIELDS` allowlist + `increment_profile_views` rpc; PATCH self, username uniqueness) | `GET /api/v1/profiles/:username` (public, same allowlist spirit) | **PARTIAL** — no UUID lookup, no PATCH, no view increment |
| `frontend/src/app/api/profile/parse-resume/route.ts` (GCP Document AI + AI fallback) | none | **MISSING** |
| `frontend/src/app/api/resume/route.ts` (GET/POST w/ `calculateAtsScore`, DELETE) + `resume/ai-suggest` | none | **MISSING** |
| `frontend/src/app/api/recommendations/route.ts` (keyword-scored opportunities) | none | **MISSING** |

## Applications & Bookmarks

| Frontend implementation | Existing backend equivalent | Status |
|---|---|---|
| `frontend/src/app/api/applications/route.ts` GET/POST (idempotent per user+opp) + `applications/[id]` PATCH/DELETE (owner; employer/admin status flow) | `backend/server/src/routes/userdata.ts` `GET/POST /api/v1/applications`, `PATCH/DELETE /:id` (caller-scoped, dedupe, 201/200) | **COMPLETE** (server PATCH is generic; employer status whitelist not enforced — acceptable, documented in API-PARITY) |
| `frontend/src/app/api/bookmarks/route.ts` GET/POST + `bookmarks/[id]` DELETE (saved_opportunities) | `backend/server/src/routes/userdata.ts` `GET/POST /api/v1/saved-opportunities`, `DELETE /:id` | **COMPLETE** |

## Admin / Employer (server has only `GET /api/v1/admin/stats`)

| Frontend implementation | Existing backend equivalent | Status |
|---|---|---|
| `frontend/src/app/api/admin/analytics`, `applications` (+PATCH), `companies` CRUD, `opportunities` CRUD + verify/reject, `organizations` CRUD, `announcements`, `performance`, `recheck-link`, `scrape` (+status, health), `subscribers`, `ai/test` | `backend/server/src/routes/admin.ts` `GET /api/v1/admin/stats` (4 row counts) | **MISSING** (partial: stats only) |
| `frontend/src/app/api/employer/jobs` GET/POST, `employer/recommendations`, `employer/claim` | none | **MISSING** |

## Cron / Scrapers / Jobs (Phase 10: belongs in `backend/server`)

| Frontend implementation | Existing backend equivalent | Status |
|---|---|---|
| `frontend/src/lib/scrapers/opportunity-scraper-impl.ts` + `isro-scraper.ts`, `drdo-scraper.ts`, `csir-scraper.ts`, india-psu, india-academic, global-semiconductor, international-academic, fellowship + ATS adapters | none — **all scraping is frontend-side today** | **MISSING** → port pipeline to `backend/server/src/services/scrapers` |
| `frontend/src/lib/scrapers/rss-parser.ts` (13 news feeds + Scholarship Roar opps) | none | **MISSING** → `services/news-sync.ts` |
| `frontend/src/lib/scrapers/national-scrapers.ts`, `global-master-scraper.ts` (fabricated, gated by `SCRAPER_ALLOW_FABRICATED`) | none | **MISSING** (keep gated, low priority — disabled in prod) |
| `frontend/src/app/api/cron/*` (scrape-opportunities, scrape-news, scrape-india, scrape-global, digest, check-links, cleanup, send-digest, sync-replica) | none (server has no cron; `scripts/auto-daily-scraper.js` fires at the **frontend**) | **MISSING** → `GET /api/v1/cron/*` protected by `CRON_SECRET` (server env lacks `CRON_SECRET` today) |
| `frontend/src/lib/email-digest.ts` (Resend weekly digest), `email-notifications.ts`, `telegram-bot.ts`, `storage/gcp-storage.ts`, `resume/document-ai-parser.ts` | none | **MISSING** |

## Academy / Misc

| Frontend implementation | Existing backend equivalent | Status |
|---|---|---|
| `frontend/src/app/api/academy/*` (tracks, days, checkpoints, progress) | none | **MISSING** |
| `frontend/src/app/api/resources` + `resources/[slug]`, `contact`, `report-issue`, `subscribe` (GET/POST/DELETE + token unsubscribe), `track-click` (Neon), `sync-replica` (db1→Neon mirror) | none | **MISSING** |
| `frontend/src/app/api/scrape-sources` CRUD (verifyAdmin, SSRF-safe URL guard), `scrapers/[slug]`, `scrapers/run-all` | none | **MISSING** |

## Cross-cutting infrastructure

| Frontend implementation | Existing backend equivalent | Status |
|---|---|---|
| `frontend/src/middleware.ts` rate limiting via `backend/api/src/rate-limit` (in-memory buckets) | Express server has **no rate limiting** | **MISSING** → wire `createRateLimiter` into server middleware (auth/AI/search/scrape paths) |
| `backend/api/src/content/*` (taxonomy, dates, status, sources, dedup, seo, linking, quality) — used by frontend scrapers/ingest | unused by the server | **PARTIAL** — server should consume it in scrapers/ingest |
| CORS allow-list (`ALLOWED_ORIGINS` env) | `backend/server/src/app.ts` CORS middleware (env-driven, dev localhost passthrough) | **COMPLETE** |
| Error envelope `{success,error:{code,message,details}}` (server) vs `{error,code,details}` (api lib) | server uses its own `error.ts` middleware; api lib's `handleError` used by Next routes | **PARTIAL** — two envelopes exist; server envelope documented in API-PARITY |
| OpenAPI (`backend/api/openapi.json` + `src/openapi`) | `openapi:generate-openapi.ts` script missing (`backend/api/scripts/` does not exist) | **PARTIAL** — restore script; spec documents frontend surface |

## Summary

| Status | Count |
|---|---|
| COMPLETE | 7 |
| PARTIAL | 8 |
| MISSING | ~50 (dominated by social layer, cron/scrapers, admin, academy, misc) |
| N/A | 2 (Next-edge artifacts) |

**Biggest gaps, in priority order for `backend/server`:** (1) social layer (feed/network/messages/notifications — DB2 client already wired), (2) AI endpoint breadth + usage logging, (3) cron/scraper port (news sync first), (4) search + news slug, (5) auth signup/check-username, (6) admin breadth, (7) academy/resources/misc.
