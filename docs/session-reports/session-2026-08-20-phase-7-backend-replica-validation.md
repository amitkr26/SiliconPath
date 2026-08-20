# Session Report — Phase 7: Backend Replica Validation (2026-08-20)

## Objective

Prove the backend (`backend/server` + `backend/api` + `backend/ai-gateway` +
`backend/worker`) exists **independently** of the Next.js production app — without
changing production, without creating any Vercel→Render dependency, without paid
Render infrastructure, and without migrating the scraper fleet. Vercel remains
production; Render is an independently deployed free-tier replica.

## Architecture (final, Phase 7)

- **PRODUCTION (unchanged):** GitHub → Vercel → Next.js (frontend + all `/api/*`
  routes) + Vercel cron (scrape-opportunities 00:00, check-links 08:00, news/sync
  06:00 UTC) → Supabase (db1/db2) + Neon + Resend + AI providers. No code path in
  the frontend calls Render.
- **REPLICA (independent):** GitHub → Render free web service
  (`https://berojgardegreewala-backend.onrender.com`) → `backend/server` Express +
  `backend/api` shared lib + `backend/ai-gateway` → same Supabase database.
  `backend/worker` stays in the image, independently runnable, **never scheduled**
  (Phase 7 removed the Render cron concept from `render.yaml` — `plan: free`, no
  `crons:` section; KNOWN_ISSUES #14 CLOSED as NOT REQUIRED / OUT OF SCOPE).

## Route parity

New authoritative `backend/docs/BACKEND-PARITY-MATRIX.md` (supersedes the stale
`FRONTEND-BACKEND-MAP.md`, which now carries a SUPERSEDED header). Full inventory:
**136 production Next.js API route files** →
REPLICATED **48** · PARTIALLY REPLICATED **5** (news list live-RSS merge;
applications PATCH employer-status whitelist; profiles/me PATCH; profiles/:username
UUID/PATCH/view-increment; admin stats-only) · CRON/WORKER (stays on Vercel) **28** ·
FRONTEND-INTERNAL / NOT REPLICATED / N/A **~55**.

## Authentication parity

- Production: Supabase Auth (GoTrue) + `requireAuth`/`requireAdmin`/`requireCron`
  shared from `backend/api`.
- Replica: same shared `requireAuth` (Bearer → `auth.getUser`), admin = timing-safe
  `X-Admin-Password` + HMAC, cron = timing-safe `CRON_SECRET`. Live-verified:
  10 protected endpoints → **401** `UNAUTHORIZED` on the deployed replica; cron →
  **403** for missing and wrong secrets; admin guarded (tested).
- Not weaker: no replica route bypasses auth; rate limits (in-memory buckets, same
  shared implementation) applied to auth/search/AI/admin.

## Social parity

feed (GET/POST, PATCH/DELETE posts/:id owner, like, comment, repost), network
(connect POST/GET + PATCH accept/decline/withdraw, connections, suggestions,
follow/:userId GET/POST, followers, following), notifications (GET, count,
PATCH all, PATCH :id) — all REPLICATED (`routes/social.ts` + `routes/messages.ts`).
Unit: 401 enforcement (parity suite) + production E2E 9/9 covers the production
contract the replica mirrors. No new social features added.

## Messaging parity

`GET /api/v1/messages` (conversations), `GET /with/:userId`, `GET/POST
/:conversationId` (thread + read state + participant authorization) — REPLICATED.

## Opportunity parity

`GET /api/v1/opportunities` (same filters, pagination, `{success,data,pagination}`
envelope) + `GET /:idOrSlug` (UUID or slug, `is_expired`) — REPLICATED; embed now
returns organization `{name, slug, website}` (Phase 6.6 fix, live-verified).
featured/stats/opportunities-feed/similar stay on Vercel (NOT REPLICATED, scoped
out).

## News parity

List + `:slug` REPLICATED (live 200s; `:slug` resolved a real Electronics Weekly
row with `source_name` + `url`). Sync: single shared ingestion implementation
`backend/api/src/content/news-sync.ts` used by the replica cron route, the worker,
and production's `/api/news/sync` contract. Production execution owner = Vercel
cron (unchanged); replica endpoint = manual/parity trigger (403-guarded).

## AI parity

chat/match/search/summarize/insights REPLICATED with grounding guards + no-match
fallback + URL allowlist + telemetry (`ai_usage_log`, verified row without
credentials). Groq model `qwen/qwen3.6-27b` (Phase 6.6 fix, live-verified 200).
classify/enhance/expire/opportunity-summary stay on Vercel. Rate limits on AI
routes: 20/min.

## Scraper status

`project-bible/09-scrapers/REPLICA-MIGRATION-MATRIX.md` created: 21 modules + 14
API surfaces inventoried by type. **Only news RSS is REPLICATED.** Government (6),
institutional (4), custom HTTP (2), ATS (1 family), search (1), fabricated (1):
**NOT MIGRATED — do not copy yet** (owner mandate §16; porting deferred to a later
phase, next candidate = govt/institutional opportunity scrapers into the worker).

## Render deployment

- Live free web service (auto-deploy), `render.yaml` = free web service only.
- Live smokes (2026-08-20): `/health` 200 (**cold 22.1 s** — free-tier idle boot),
  `/health/ready` 200 (warm 1.7 s), CORS allow/block, 10 protected endpoints 401,
  cron 403 (missing + wrong secret), public reads 200.
- No payment method on the workspace; none needed. No Render cron; no keep-alives.

## Tests

| Suite | Result |
|---|---|
| Server (node:test) | **46/46** |
| API (jest) | **97/97** |
| AI gateway (jest) | **15/15** |
| Worker (node:test) | **17/17** |
| TypeScript | clean (server/api/worker/ai-gateway + frontend) |
| Backend builds | server + worker clean |
| Frontend build | exit 0, compiled |
| Production E2E (Playwright) | **9/9** |

E2E note: the first run was 7/9 — two connection specs failed. Root cause (not a
product bug): a stale **accepted** connection between amittest1/amittest2 left by
the social-workflow spec's terminal state (its cleanup contract only withdraws
pending requests; the accepted connection persists and hides the "Connect" buttons
on the next run). Deleted via the Supabase Management API, re-ran → 9/9, cleaned
post-run. `reset-test-social.mjs` fixed (hardcoded `D:\Tinkerscape` path → cwd-
relative resolution) but remains unusable until KNOWN_ISSUES #1 (stale local
service-role key in `frontend/.env.local`) is rotated — documented in #6.

## Known differences (verified, not aspirational)

1. Replica news list does not merge live RSS (production does, 30-min cache).
2. Replica applications PATCH lacks the employer status whitelist.
3. Replica `profiles/:username` resolves username only (no UUID/PATCH/view-increment).
4. Replica admin = `GET /stats` only.
5. Rate limiting: same in-memory implementation; no Redis (explicitly out of scope).
6. Render free-tier cold start ~22 s after idle (no keep-alives by design).

## Known limitations (see KNOWN_ISSUES.md)

#1 stale local service-role key (OPEN — owner action, 2 min) · #5 feed ignores
connection graph (product decision) · #7 no feed comment UI · #9 CI green-run
confirmation pending (no gh CLI on private repo).

## Next phase

Phase 8 candidate (owner decision): port the first government/institutional
opportunity scraper (ISRO/DRDO/CSIR tier) into `backend/worker` per
REPLICA-MIGRATION-MATRIX priorities — inventory is ready, copying is deferred by
mandate.