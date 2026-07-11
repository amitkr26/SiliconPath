# 10 - API Specification

All routes under `electrobridge/src/app/api/`. JSON in/out. Auth: **public** (no auth), **user** (Supabase session cookie), **admin** (`verifyAdmin` via `x-admin-password` or Bearer `ADMIN_PASSWORD`/`CRON_SECRET`).

## Opportunities
- `GET /api/opportunities` (public) — query: category, location, specialization, search, page, limit. Returns verified, active, non-expired opportunities joined with organizations, mapped via `mapDbOpportunityToClient`. Sanitize `search` (strip `{}(),."\[]`, cap 100).
- `POST /api/opportunities` (admin) — create; whitelist fields; generate slug in code; default verification_status.
- `GET/PATCH/DELETE /api/opportunities/[id]` (admin for writes).
- `GET /api/opportunities-feed` (public) — lightweight feed.
- `GET /api/organizations` (public) — orgs + active verified counts via organization_id.

## Scraping / sources
- `POST/PUT/DELETE /api/scrape-sources` (admin) — manage sources; validate URL is public (reject localhost/link-local/private ranges = SSRF guard).
- `GET /api/scrape-sources` (admin).
- `/api/cron/scrape-india|scrape-global|scrape-news|check-links|digest` (cron secret) — proxy to backend.
- Backend: `POST /scrape/run`, `POST /scrape/batch/:id`, `GET /scrape/test/:id` (all require SCRAPER_SECRET), `GET /scrape/status`, `GET /scrape/explore`, `GET /health`, `GET /metrics`.

## Auth / profile
- `/api/auth/signout` (user).
- `GET/PATCH /api/profile/[userId]` — GET user; PATCH self only, strict field allowlist (13 fields, incl job_title not current_role).
- `GET /api/profile/me`, `POST /api/profile/parse-resume` (user; needs AI provider configured).
- `GET/POST /api/profile/[userId]/endorse`, `.../recommendations`.

## Social
- `GET/POST /api/feed`, `/api/feed/posts/[id]`, `.../comment`, `.../like`, `.../repost` (user).
- `GET/POST /api/messages`, `GET/POST /api/messages/[conversationId]` (user).
- `/api/network/connect`, `/connect/[id]`, `/connections`, `/follow/[userId]`, `/followers`, `/following`, `/suggestions` (user).
- `GET/PATCH /api/notifications`, `/[id]`, `/count` (user).
- `/api/companies`, `/[id]`, `/[id]/follow` (user/provider).
- `/api/applications` (user), `/api/people/search` (user).

## Academy
- Academy reads go through `src/lib/academy/queries.ts` (server/client). `getTracks()` returns DB tracks or `FALLBACK_TRACKS`. Progress: `saveUserProgress`, `getCompletedDays`, `getPassedTracks`.
- `/api/resume` (user) — GET profile, POST resume + ATS score.

## Content / misc
- `GET /api/news`, `POST /api/archive-news` (admin/cron; DB2), `/api/cleanup-news`.
- `POST /api/subscribe`, `DELETE /api/subscribe` (public, rate-limited).
- `/api/ai/chat|search|match|summarize|enhance|opportunity-summary/[slug]` (public/user; AI chain).
- `/api/analytics/platform|ai-usage`, `/api/track-click` (Neon).
- `/api/og`, `/api/og/opportunity/[slug]`, `/api/calendar-export/[id]`, `/api/similar/[id]`, `/api/search/opportunities`, `/api/report-issue`, `/api/health`.

## Error contract
Use centralized `apiError()`: generic message in prod, detailed in dev; structured JSON log. 401 unauthorized, 400 validation, 404 not found, 429 rate limit, 500 server, 503 DB not configured.
