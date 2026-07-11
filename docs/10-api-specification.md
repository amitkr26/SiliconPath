# 10 — API Specification

All routes under `electrobridge/src/app/api/`. JSON in/out. Auth via Supabase SSR cookies
unless noted. Admin routes require `verifyAdmin()` (header `x-admin-password` or
`Authorization: Bearer <ADMIN_PASSWORD|CRON_SECRET>`).

## Public / read
- `GET /api/opportunities?category&location&specialization&search&page&limit` → `{opportunities, count, page, total_pages}`. Joins organizations; maps to client shape; only verified.
- `GET /api/opportunities/[id]` → single (joined).
- `GET /api/organizations` → `{organizations}` with active/verified opportunity counts via organization_id.
- `GET /api/news` → `{articles}`.
- `POST /api/subscribe` {email, keywords, categories} → rate-limited (durable), 201/409.
- `POST /api/track-click` {opportunity_id, event_type} → Neon analytics.

## Admin / write
- `POST /api/opportunities` (admin) → insert, allowlisted fields, slug generated, verified.
- `GET|POST|PUT|DELETE /api/scrape-sources` (admin) → CRUD; POST/PUT validate URL (SSRF block).
- `POST /api/admin/auth` → verify admin password server-side.
- `POST /api/admin/recheck-link` (admin) → revalidate a source URL.

## Auth-gated (user)
- `GET|PATCH /api/profile/[userId]` → GET own/public; PATCH own only, **13-field allowlist**.
- `GET /api/profile/me`.
- `GET|POST /api/feed`, `POST /api/feed/posts/[id]/like|comment|repost`, `DELETE /api/feed/posts/[id]`.
- `GET /api/network/connections|followers|following|suggestions`, `POST /api/network/connect`,
  `PATCH|DELETE /api/network/connect/[id]`, `POST|DELETE /api/network/follow/[userId]`.
- `GET|POST /api/messages`, `GET|POST /api/messages/[conversationId]`.
- `GET|PATCH /api/notifications`, `GET /api/notifications/count`.
- `GET|POST /api/resume`, `POST /api/profile/parse-resume`.
- `GET|POST /api/applications`.

## AI
- `POST /api/ai/chat|search|match|summarize|enhance` → multi-provider fallback; output parsed
  with tolerant JSON parser (never raw JSON.parse).

## Cron (CRON_SECRET)
- `/api/cron/scrape-india|scrape-global|scrape-news|check-links|digest`.

## Conventions
- Errors: `{error: string}` + status. Generic message in prod, detailed in dev (structured log).
- Every write: validate with Zod (`lib/validation.ts`) before touching the DB.
