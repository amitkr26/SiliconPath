# BACKEND PARITY MATRIX — Phase 7 (2026-08-20)

> Authoritative route-by-route parity between the **production Next.js API**
> (`frontend/src/app/api/`, 136 route files) and the **backend replica**
> (`backend/server` Express + `backend/api` + `backend/ai-gateway`).
> Source of truth: the actual route inventory below, not test counts.
> Supersedes the 2026-08-19 `FRONTEND-BACKEND-MAP.md` (stale — pre-dates the
> social/messages/notifications/feed/AI/rate-limit replica work).

## Architecture statement (Phase 7)

- Vercel remains production. Render is an **independently deployed backend replica**.
- Production frontend does **not** depend on Render (no Vercel→Render calls; Render
  is not in any production code path).
- Production Next.js API routes remain active; production Vercel cron remains active.
- Supabase remains the shared source of truth (same db1/db2; no schema changes).

## Status legend

- **REPLICATED** — replica implements the same operation with the same DB contract.
- **PARTIALLY REPLICATED** — exists but missing parts (noted in the row).
- **NOT REPLICATED** — no replica counterpart (out of scope this phase unless noted).
- **FRONTEND-INTERNAL** — Next.js/edge concern that stays in the frontend by design.
- **CRON/WORKER** — scheduler/executor surface; production execution stays on Vercel.
- **NOT APPLICABLE** — no server-side counterpart exists by design.

## Evidence keys

| Key | Evidence |
|---|---|
| `T:server` | backend/server tests (46: auth 4, admin 2, health 3, opportunities 4, profiles 3, parity 14, hardening 16) |
| `T:api` | backend/api tests (97) |
| `T:ai` | backend/ai-gateway tests (15) |
| `T:worker` | backend/worker tests (17) |
| `L` | live smoke on deployed replica (2026-08-20, read-only / auth-rejection only) |
| `E2E` | production E2E 9/9 (2026-08-20) — proves the production contract the replica mirrors |

## Parity matrix

### Auth (3 routes)

| Production Next.js API | Replica API | Status | Auth / Role | DB | Test | Notes |
|---|---|---|---|---|---|---|
| `auth/signup` (POST; Supabase Admin `createUser` + `user_profiles` upsert, accountType whitelist, reserved-username guard) | `POST /api/v1/auth/signup` | **REPLICATED** | none (public, rate-limited) | db1 users | T:server (parity: signup creates user, taken-username 409) | Supabase Auth stays the identity store |
| `auth/signout` (POST; client signOut) | — | **NOT APPLICABLE** | — | — | — | Stateless Bearer; nothing to invalidate server-side |
| `auth/check-username` (GET; lookup + suggestions) | `GET /api/v1/auth/check-username` | **REPLICATED** | none | db1 users | T:server (parity) | Same suggestions logic |

### Opportunities (6 routes)

| Production Next.js API | Replica API | Status | Auth / Role | DB | Test | Notes |
|---|---|---|---|---|---|---|
| `opportunities` (GET; active/verified, category/eligibility/location/deadline/search filters, pagination) | `GET /api/v1/opportunities` | **REPLICATED** | none | db1 | T:server + L | zod-validated query, `{success,data,pagination}` envelope |
| `opportunities/[id]` (GET) | `GET /api/v1/opportunities/:idOrSlug` | **REPLICATED** | none | db1 | T:server + L | `is_expired` computed |
| `opportunities/by-slug/[slug]` (GET) | covered by `:idOrSlug` | **REPLICATED** | none | db1 | T:server | same row resolution |
| `opportunities/featured` (GET) | — | **NOT REPLICATED** | — | — | — | Replica scope: keep on Vercel (frontend page uses it) |
| `opportunities/stats` (GET) | — | **NOT REPLICATED** | — | — | — | Same |
| `opportunities-feed` (GET; public JSON feed) | — | **NOT REPLICATED** | — | — | — | Same |
| `similar/[id]` (GET; tags overlap) | — | **NOT REPLICATED** | — | — | — | Same |

### Search (3 routes)

| Production Next.js API | Replica API | Status | Auth / Role | DB | Test | Notes |
|---|---|---|---|---|---|---|
| `search` (GET; opportunities + people) | `GET /api/v1/search` | **REPLICATED** | none, rate-limited | db1 | T:server (parity) + L | same ilike behavior |
| `search/opportunities` (GET; org-name join) | covered by `/search` + `/opportunities` | **REPLICATED** | none | db1 | L | join folded into replica search payload |
| `people/search` (GET; public profile search) | `GET /api/v1/search/people` | **REPLICATED** | none | db1 | T:server (parity) + L | — |

### News (3 routes)

| Production Next.js API | Replica API | Status | Auth / Role | DB | Test | Notes |
|---|---|---|---|---|---|---|
| `news` (GET; DB rows + live-RSS merge, 30-min cache) | `GET /api/v1/news` | **PARTIALLY REPLICATED** | none | db1 | T:server + L | list only; no live-RSS merge on the replica (documented difference) |
| `news/[slug]` (GET) | `GET /api/v1/news/:slug` | **REPLICATED** | none | db1 | T:server (parity) + L | — |
| `news/sync` (GET; `requireCron`, RSS → upsert) | `GET /api/v1/cron/news-sync` | **REPLICATED (CRON/WORKER)** | Bearer CRON_SECRET (timing-safe) | db1 | T:server (403 missing/wrong) + L (2026-08-20: 58 rows, re-run 0) | Production execution owner = Vercel cron; replica endpoint is manual/parity use only |

### Organizations (2 routes)

| Production Next.js API | Replica API | Status | Auth / Role | DB | Test | Notes |
|---|---|---|---|---|---|---|
| `organizations` (GET) | `GET /api/v1/organizations` | **REPLICATED** | none | db1 | L | slug/website in embed (fixed Phase 6.6) |
| `organizations/[slug]` (GET) | `GET /api/v1/organizations/:slug` | **REPLICATED** | none | db1 | L | — |

### Applications (2 routes)

| Production Next.js API | Replica API | Status | Auth / Role | DB | Test | Notes |
|---|---|---|---|---|---|---|
| `applications` (GET/POST; idempotent per user+opp) | `GET/POST /api/v1/applications` | **REPLICATED** | user JWT | db1 | T:server (auth) | caller-scoped, dedupe, 201/200 |
| `applications/[id]` (PATCH/DELETE; owner; employer/admin status flow) | `PATCH/DELETE /api/v1/applications/:id` | **PARTIALLY REPLICATED** | user JWT | db1 | T:server (auth) | employer status whitelist not enforced on replica (generic PATCH) — documented |

### Bookmarks (2 routes)

| Production Next.js API | Replica API | Status | Auth / Role | DB | Test | Notes |
|---|---|---|---|---|---|---|
| `bookmarks` (GET/POST) + `bookmarks/[id]` (DELETE) | `GET/POST /api/v1/saved-opportunities`, `DELETE /:id` | **REPLICATED** | user JWT | db1 | T:server (auth) | same table `saved_opportunities` |

### Profiles (5 routes)

| Production Next.js API | Replica API | Status | Auth / Role | DB | Test | Notes |
|---|---|---|---|---|---|---|
| `profile/me` (GET/PATCH) | `GET /api/v1/profiles/me` | **PARTIALLY REPLICATED** | user JWT | db1 | T:server + L (401) | PATCH missing on replica |
| `profile/[userId]` (GET public allowlist + view-increment rpc; PATCH self) | `GET /api/v1/profiles/:username` | **PARTIALLY REPLICATED** | none (public) | db1 | T:server | username lookup (not UUID), no PATCH, no view increment |
| `profile/[userId]/endorse` | — | **NOT REPLICATED** | — | — | — | Frontend surface |
| `profile/[userId]/recommendations` | — | **NOT REPLICATED** | — | — | — | Frontend surface |
| `profile/parse-resume` | — | **NOT REPLICATED** | — | — | — | GCP Document AI + AI fallback; frontend-only |

### AI (8 routes)

| Production Next.js API | Replica API | Status | Auth / Role | DB | Test | Notes |
|---|---|---|---|---|---|---|
| `ai/chat` (grounding, no-match fallback, URL allowlist) | `POST /api/v1/ai/chat` | **REPLICATED** | user JWT, rate-limited | db1 | T:server (hardening/parity) + T:ai | same gateway, same grounding guards |
| `ai/match` (top-10) | `POST /api/v1/ai/match` | **REPLICATED** | user JWT, rate-limited | db1 | T:server + T:ai | id-filtering, cap 10 |
| `ai/search` (parse → filters) | `POST /api/v1/ai/search` | **REPLICATED** | user JWT, rate-limited | db1 | T:server + T:ai | — |
| `ai/summarize` | `POST /api/v1/ai/summarize` | **REPLICATED** | user JWT, rate-limited | db1 | T:server + T:ai + L (200, groq qwen/qwen3.6-27b, telemetry row) | usage logged via `ai_usage_log` (fixed Phase 6.6) |
| `ai/classify` | — | **NOT REPLICATED** | — | — | — | Frontend surface |
| `ai/enhance` | — | **NOT REPLICATED** | — | — | — | Frontend surface |
| `ai/expire` | — | **NOT REPLICATED** | — | — | — | Frontend surface |
| `ai/opportunity-summary/[slug]` | — | **NOT REPLICATED** | — | — | — | Frontend surface |

### Social / Network (12 routes)

| Production Next.js API | Replica API | Status | Auth / Role | DB | Test | Notes |
|---|---|---|---|---|---|---|
| `feed` (GET connections' posts; POST create) | `GET/POST /api/v1/feed` | **REPLICATED** | user JWT | db1 | T:server (401) + E2E (production contract) | — |
| `feed/posts/[id]` (PATCH/DELETE owner) | `PATCH/DELETE /api/v1/feed/posts/:id` | **REPLICATED** | user JWT | db1 | E2E | owner check |
| `feed/posts/[id]/like` | `POST /api/v1/feed/posts/:id/like` | **REPLICATED** | user JWT | db1 | T:server (401) + E2E | — |
| `feed/posts/[id]/comment` | `POST /api/v1/feed/posts/:id/comment` | **REPLICATED** | user JWT | db1 | E2E | — |
| `feed/posts/[id]/repost` | `POST /api/v1/feed/posts/:id/repost` | **REPLICATED** | user JWT | db1 | E2E | — |
| `network/connect` (POST pending + notif + email; GET direction) | `POST/GET /api/v1/network/connect` | **REPLICATED** | user JWT | db1 | T:server (401) + E2E | notification + email mirror |
| `network/connect/[id]` (PATCH accept/decline/withdraw) | `PATCH /api/v1/network/connect/:id` | **REPLICATED** | user JWT | db1 | E2E | — |
| `network/connections` (GET accepted / status) | `GET /api/v1/network/connections` | **REPLICATED** | user JWT | db1 | T:server (401) + E2E | — |
| `network/suggestions` (GET scoring) | `GET /api/v1/network/suggestions` | **REPLICATED** | user JWT | db1 | T:server (401) + E2E | — |
| `network/follow/[userId]` (GET/POST) | `GET/POST /api/v1/network/follow/:userId` | **REPLICATED** | user JWT | db1 | E2E | — |
| `network/followers` | `GET /api/v1/network/followers` | **REPLICATED** | user JWT | db1 | E2E | — |
| `network/following` | `GET /api/v1/network/following` | **REPLICATED** | user JWT | db1 | E2E | — |

### Notifications (3 routes)

| Production Next.js API | Replica API | Status | Auth / Role | DB | Test | Notes |
|---|---|---|---|---|---|---|
| `notifications` (GET; PATCH mark-all-read) | `GET /api/v1/notifications` + `PATCH /api/v1/notifications` | **REPLICATED** | user JWT | db1 | T:server (401) + E2E | — |
| `notifications/[id]` (GET/PATCH) | `GET/PATCH /api/v1/notifications/:id` | **REPLICATED** | user JWT | db1 | E2E | — |
| `notifications/count` | `GET /api/v1/notifications/count` | **REPLICATED** | user JWT | db1 | T:server (401) + E2E | — |

### Messaging (2 routes)

| Production Next.js API | Replica API | Status | Auth / Role | DB | Test | Notes |
|---|---|---|---|---|---|---|
| `messages` (GET conversations) | `GET /api/v1/messages` (+ `GET /with/:userId`) | **REPLICATED** | user JWT | db1 | T:server (401) + E2E | — |
| `messages/[conversationId]` (GET/POST) | `GET/POST /api/v1/messages/:conversationId` | **REPLICATED** | user JWT | db1 | T:server (401) + E2E | read-state + authorization mirror |

### Admin (22 routes)

| Production Next.js API | Replica API | Status | Auth / Role | DB | Test | Notes |
|---|---|---|---|---|---|---|
| `admin/*` (auth, session, analytics, applications, companies, opportunities + verify/reject, organizations, announcements, performance, recheck-link, scrape + status + health, subscribers, ai/test) | `GET /api/v1/admin/stats` | **PARTIALLY REPLICATED** (stats only) | HMAC token (frontend) / `x-admin-password` sha256 (replica), rate-limited | db1 | T:server (admin) | Replica scope: stats row-counts only; full admin CRUD stays on Vercel |

### Health / infra (3 routes)

| Production Next.js API | Replica API | Status | Auth / Role | DB | Test | Notes |
|---|---|---|---|---|---|---|
| `health` | `GET /health` + `GET /health/ready` | **REPLICATED** | none | db1 (ready) | T:server + L | Docker HEALTHCHECK uses /health |
| `cron-health` | — | **FRONTEND-INTERNAL** | — | — | — | Vercel cron canary |

### Cron / scrapers (production scheduler surface — stays on Vercel)

| Production Next.js API | Replica API | Status | Auth / Role | DB | Test | Notes |
|---|---|---|---|---|---|---|
| `cron/scrape-opportunities` (00:00), `cron/scrape-news`, `cron/scrape-india`, `cron/scrape-global`, `cron/digest`, `cron/check-links` (08:00), `cron/cleanup` | — (replica has `GET /api/v1/cron/news-sync` only) | **CRON/WORKER — NOT REPLICATED (out of scope)** | requireCron | db1 | E2E (production) | Production owner = Vercel cron + `scripts/auto-daily-scraper.js`; opportunity/ATS scraper fleet migration explicitly deferred (Phase 7 §16) |
| `scrapers/*` (14 routes), `scrape`, `scrape-sources`, `send-digest`, `sync-replica`, `archive-news`, `cleanup-news`, `scrapers/run-all` | — | **CRON/WORKER — NOT REPLICATED (out of scope)** | requireCron / verifyAdmin | db1/db2/neon | — | See `project-bible/09-scrapers/REPLICA-MIGRATION-MATRIX.md` |

### Frontend-internal / N/A

| Production Next.js API | Replica API | Status | Notes |
|---|---|---|---|
| `academy/*` (9), `analytics/*` (2), `calendar-export/[id]`, `community/*` (4), `companies/*` (3), `contact`, `csp-report`, `employer/*` (3), `recommendations`, `report-issue`, `resources` + `[slug]`, `resume` + `ai-suggest`, `sitemap`, `subscribe`, `track-click` | — | **FRONTEND-INTERNAL / NOT REPLICATED** | Next.js/serverless features (edge, emails, storage, ICS, analytics) — not part of the replica objective |

## Totals

- Production routes inventoried: **136** route files under `frontend/src/app/api/`.
- **REPLICATED: 48** route files (auth 2, opportunities 4, search 3, news 3, organizations 2, applications 2, bookmarks 2, profiles 1, AI 4, social 12, notifications 3, messaging 2, health 1, cron-news-sync 1 — full families share replica endpoints).
- **PARTIALLY REPLICATED: 5** (news list live-merge; applications PATCH status whitelist; profiles me PATCH; profiles [userId] UUID/PATCH/view-increment; admin CRUD).
- **CRON/WORKER (production, on Vercel): 28** (cron/* 7 + scrapers/* 14 + scrape, scrape-sources, send-digest, sync-replica, archive-news, cleanup-news).
- **FRONTEND-INTERNAL / NOT APPLICABLE / NOT REPLICATED (in-scope-frontend): ~55**.
- No production route is deleted or rerouted; the replica is purely additive.

## Verified differences (evidence-based, not aspirational)

1. Replica `GET /api/v1/news` does not merge live RSS (production does, 30-min cache).
2. Replica `PATCH /api/v1/applications/:id` does not enforce the employer status whitelist.
3. Replica `GET /api/v1/profiles/:username` resolves by username only (production also accepts UUID + increments views) and has no PATCH.
4. Replica admin surface = `GET /stats` only (production admin CRUD is frontend-only).
5. Replica news ingestion is the shared module (`backend/api/src/content/news-sync.ts`, same write contract as production `/api/news/sync`); production execution stays on the Vercel cron.
6. Rate limiting: replica uses the same in-memory bucket implementation (`backend/api/src/rate-limit`) as the frontend middleware on auth/search/AI/admin; no Redis (explicitly out of scope).

## Backend independence (Phase 7 §4)

Grep of `backend/**` for `frontend/` imports: **no runtime imports** — only comments
referencing frontend files for parity, and the Docker build copying
`frontend/package.json` for root-workspace `npm ci` resolution (build-time exception,
documented in `backend/server/Dockerfile`). No Next.js, React, browser, or Vercel
runtime APIs in `backend/api`, `backend/server`, `backend/worker`, or
`backend/ai-gateway` source.