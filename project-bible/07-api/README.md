**Last Verified:** 2026-08-30 · **Status:** Current · **Scope:** API architecture and route inventory**

# API Architecture

> Last reconciled: 2026-08-19

## Overview

The entire product API surface is the Next.js App Router under `frontend/src/app/api`. Measured 2026-08-19: **138 route handlers** (136 `route.ts` + 2 `route.tsx`). There is no separate backend API service; shared helpers (rate limiting, admin/cron auth guards, Zod validation, error/response helpers) live in the workspace package `@berojgardegreewala/api` (`backend/api/src`).

The OpenAPI spec at `backend/api/openapi.json` documents the backend `/api/v1` surface (mirror of the frontend routes): **51 paths, 60 operations, 19 tags**, security schemes `BearerAuth` / `AdminAuth` / `CronAuth`; servers point at the Render backend, the Vercel frontend, and local. The runtime frontend surface (138 handlers) is larger than the spec covers. Regenerate with `npm run openapi --workspace @berojgardegreewala/api`.

## Route Inventory (measured 2026-08-19)

| Category | Count | Handlers |
|---|---|---|
| auth | 3 | signup, signout, check-username |
| system | 3 | health, cron-health, csp-report |
| opportunities | 5 | list, [id], by-slug/[slug], featured, stats |
| opportunities support | 5 | similar/[id], opportunities-feed, calendar-export/[id], sitemap, og/opportunity/[slug] |
| og | 1 | og (base image) |
| news | 3 | list, [slug], sync |
| ai | 8 | chat, classify, enhance, expire, match, opportunity-summary/[slug], search, summarize |
| bookmarks | 2 | list, [id] |
| notifications | 3 | list, count, [id] |
| applications | 2 | list, [id] |
| resume | 2 | list, ai-suggest |
| profile | 5 | me, [userId], [userId]/endorse, [userId]/recommendations, parse-resume |
| recommendations | 1 | top-level recommendations |
| feed | 5 | list, posts/[id], posts/[id]/like, /comment, /repost |
| network | 7 | connect, connect/[id], connections, suggestions, follow/[userId], followers, following |
| people | 1 | search |
| messages | 2 | list, [conversationId] |
| community | 4 | posts, posts/[id], comments, vote |
| companies | 3 | list, [id], [id]/follow |
| organizations | 2 | list, [slug] |
| employer | 3 | claim, jobs, recommendations |
| academy | 9 | tracks, tracks/[id], tracks/[id]/days, tracks/[id]/days/[day], tracks/[id]/checkpoints, days/[trackId]/[dayNumber], progress, progress/completed-days, progress/passed-tracks |
| admin | 22 | auth, auth/session, analytics, announcements, applications + [id], companies + [id], opportunities + [id] + verify + reject, organizations + [id], performance, recheck-link, scrape, scrape/status, scrape-health, subscribers + [id], ai/test |
| cron | 7 | scrape-opportunities, scrape-news, scrape-india, scrape-global, digest, check-links, cleanup |
| cron-style top-level | 4 | archive-news, cleanup-news, send-digest, sync-replica |
| scrapers | 14 | [slug], run-all, csir, drdo, isro, iit-iisc, iits-iisc, electronics-semiconductor, global-master, psu-electronics, railways, scientific-research, semiconductor, space-defence |
| scrape + scrape-sources | 2 | manual scrape, source registry |
| search | 2 | search, search/opportunities |
| analytics | 2 | platform, ai-usage |
| misc | 6 | contact, subscribe, track-click, report-issue, resources, resources/[slug] |
| **Total** | **138** | |

## Auth Guards

- **BearerAuth** — Supabase session via `@supabase/ssr` (cookies / Authorization header), checked in middleware and per-route.
- **AdminAuth** — `requireAdmin` / `verifyAdmin` from `@berojgardegreewala/api` (x-admin-password + HMAC, fail-closed) on every `/api/admin/*` route, `/api/scrape`, `/api/scrape-sources`, `/api/analytics/*`. The admin console does not use a Supabase session.
- **CronAuth** — `requireCron` / `requireCronOrAdmin` (CRON_SECRET bearer) on `/api/cron/*`, `/api/news/sync`, `/api/scrapers/*`, `/api/scrape`.

## Middleware (`frontend/src/middleware.ts`)

- **CSRF guard** on POST/PUT/PATCH/DELETE: origin/referer must be in allowlist (`localhost:3000`, `*.berojgardegreewala.vercel.app`, `ponytail.dev`, `omniroute.online`, +www variants); exempts `/api/auth*`, `/api/subscribe`, `/api/report-issue`. Missing origin is allowed (non-browser clients).
- **Rate limits** (per-path buckets from `@berojgardegreewala/api`): api 120/min, auth 10/min, search 30/min, scrape 5/min, ai 20/min. `/api/scrapers` and `/api/cron` exempt.
- **Auth-gated paths**: `/api/feed`, `/api/network`, `/api/companies`, `/api/messages`, `/api/notifications`, `/api/people`, `/api/resume`, `/api/applications` → 401 for APIs; pages `/applications`, `/resume`, `/saved` → redirect `/login?redirectTo=`.
- **Employer-only paths**: `/post-job`, `/employers`, `/employer`, `/api/employer`; role check `user_metadata.role` in (employer, admin) OR `account_type` = provider, else 403 / redirect `/`.
- **Security headers** on all responses: CSP (`report-uri /api/csp-report`), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, Referrer-Policy, Permissions-Policy, HSTS in production.
- `code` query param on `/` or `/login` → redirect to `/auth/callback`.

## Scheduled Crons (vercel.json, measured 2026-08-19)

| Path | Schedule (UTC) |
|---|---|
| `/api/cron/scrape-opportunities` | daily 00:00 |
| `/api/cron/check-links` | daily 08:00 |
| `/api/news/sync` | daily 06:00 |

Exactly 3 crons are scheduled. The remaining cron-capable routes (`cron/scrape-news`, `cron/scrape-india`, `cron/scrape-global`, `cron/digest`, `cron/cleanup`, `send-digest`, `sync-replica`, `archive-news`, `cleanup-news`) exist but are **not** scheduled — the previous docs' claim of 6 scheduled crons including a newsletter was wrong.

## Response Patterns

- Success: `{ data: T }`; paginated lists: `{ data: T[], count, page, pageSize }`.
- Error: `{ error: string, code?, details? }` (helpers in `@berojgardegreewala/api`).
- Status codes: 200/201/204 success, 400 Zod validation, 401 missing/invalid auth, 403 forbidden/CSRF, 404 not found, 409 duplicate, 429 rate-limited, 500/503 server errors.

## Related

- Spec: `backend/api/openapi.json` (51 paths, 60 operations, 19 tags)
- Shared helpers: `backend/api/src` (package `@berojgardegreewala/api`)
- Middleware: `frontend/src/middleware.ts`
- AI endpoints: `project-bible/08-ai/README.md`
- Scraping endpoints: `project-bible/09-scrapers/README.md`
