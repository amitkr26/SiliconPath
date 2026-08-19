# Backend Architecture

## Overview

Three backend components, managed as npm workspaces from the root `package.json` (`backend/api`, `backend/ai-gateway`, `backend/server`). Only `backend/server` is runnable; the other two are TypeScript libraries.

## Components

### backend/api — framework-less TypeScript library

Consumed as raw TypeScript by both the frontend and `backend/server`. No server, no port.

- `response/` — success, created, noContent, list, cursor, error envelope helpers
- `error/` — `AppError` hierarchy + `handleError`
- `auth/` — `getUser`, `requireAuth`, `requireAdmin`, `requireCron`, `requireCronOrAdmin`
- `validation/` — zod `validate`, `paginationSchema`, `opportunityListQuerySchema`, `applyPagination`/`applyCursor`/`applySort`/`applyFilters`
- `rate-limit/` — in-memory Map sliding window; presets: api 120/min, auth 10/min, search 30/min, scrape 5/min, ai 20/min, admin 20/min
- `cache/` — ETag helpers
- `openapi/` — `generateOpenAPISpec` + `zodToSchema`; static copy at `backend/api/openapi.json`
- `content/` — taxonomy, dates, status, sources, dedup, seo, linking, quality, provenance; used by frontend scrapers/ingest
- Jest tests in `backend/api/__tests__` (97)

### backend/ai-gateway — AI provider library

9 AI providers with fallback chain and 10-minute cooldown per provider; zero runtime dependencies (global `fetch`). 15 jest tests (`__tests__/gateway.test.ts`) — fallback/cooldown/telemetry incl. the `safeLog` best-effort telemetry contract (a throwing usage-logger never breaks a provider response). Provider details live in `project-bible/08-ai`.

### backend/server — Express 4 REST API (the only runnable component)

- Port 8080 (env `PORT`), binds `0.0.0.0`; entry `src/server.ts` → `createApp({ env, db clients })`
- Health: `GET /health` (liveness, no DB) + `GET /health/ready` (readiness: probes `opportunities` via admin client; 503 `DB_UNAVAILABLE` when unconfigured)
- Routes:
  - `GET /api/v1/opportunities` (zod-validated filters + pagination) + `/:idOrSlug`
  - `GET /api/v1/profiles/me` (Bearer) + `/:username` (public, lowercase)
  - `GET /api/v1/organizations` + `/:slug`
  - `GET /api/v1/news` + `/:slug`
  - `GET/POST /api/v1/applications` + `PATCH/DELETE /:id` (Bearer, caller-scoped, dedupe)
  - `GET/POST /api/v1/saved-opportunities` + `DELETE /:id`
  - `POST /api/v1/ai/chat` (grounded, URL-host allowlist), `/match` (top-10), `/search` (LLM filters), `/summarize`, `/insights` — Bearer + ai rate limit; usage-logged to `ai_usage_log`; gateway exhaustion → 502 `AI_UNAVAILABLE`
  - `GET /api/v1/admin/stats` (`x-admin-password`, sha256 + timingSafeEqual, admin rate limit 20/min)
  - `POST /api/v1/auth/signup` + `GET /auth/check-username`
  - `GET /api/v1/search` + `/people`
  - `GET /api/v1/feed` + posts CRUD/like/comment/repost (Bearer, trigger-maintained counts)
  - `GET /api/v1/network/*` — connections, status/:userId, connect, suggestions, follow/:userId, followers, following (role-enforced)
  - `GET /api/v1/notifications` + mark-all/mark-one
  - `GET /api/v1/messages` + `/:conversationId` + `/with/:userId`
  - `GET /api/v1/cron/news-sync` (Bearer `CRON_SECRET`, timing-safe, idempotent RSS upsert)
- Envelope: `{ success, data, pagination }` / `{ success: false, error: { code, message, details? } }`
- Rate limiting: Express middleware over the shared api-lib presets via a Web-Request header shim (XFF-aware buckets; per-IP isolation)
- CORS allow-list via `ALLOWED_ORIGINS` env (credentials)
- 46 `node:test` tests in `backend/server/tests` (30 parity + 16 hardening: AI stubbed-provider routes, CORS, XFF shim, admin 429, readiness, invalid-JSON 400)
- `dist/` generated, gitignored
- Dockerfile: `node:20-alpine`, non-root `USER node`, HEALTHCHECK (wget `http://127.0.0.1:8080/health`), EXPOSE 8080
- `.env.example` categorized REQUIRED / OPTIONAL / DEPLOYMENT: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_2_URL, SUPABASE_2_SERVICE_ROLE_KEY, PORT, NODE_ENV, ALLOWED_ORIGINS, ADMIN_PASSWORD, ADMIN_HMAC_SECRET, CRON_SECRET + AI provider keys (incl. AGENTROUTER_*, OMNIROUTER_*)

## Backend replication status (as of 2026-08-19)

Parity docs exist: `backend/docs/FRONTEND-BACKEND-MAP.md`, `backend/docs/API-PARITY.md`.

- Complete: opportunities (list/detail/slug), applications, saved-opportunities, profiles (GET), organizations, admin stats, social layer (feed/network/messages/notifications), AI breadth (chat/match/search/summarize + usage logging), search + /people, auth signup/check-username, news `:slug`, news RSS sync cron
- Production readiness (Phase 5): tests 46 server / 15 gateway / 97 api, `tsc` clean, Docker hardened, `/health/ready`, 502 mapping, admin + cron timing-safe guards
- Not deployed: production-ready but deployment decision pending (KNOWN_ISSUES #0; recommended Docker → Render per `14-devops/deploy-stack.txt`)
- Missing/deferred: scraper fleet port (Phase 6 candidate), PATCH `/profiles/me`, `supabase2Admin` DB2 client unused, admin breadth beyond `/stats`, academy, misc

## Related Documents

- [FRONTEND-BACKEND-MAP.md](../../backend/docs/FRONTEND-BACKEND-MAP.md) — frontend route ↔ backend route mapping
- [API-PARITY.md](../../backend/docs/API-PARITY.md) — replication parity analysis