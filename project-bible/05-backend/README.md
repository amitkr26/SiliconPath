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
- `rate-limit/` — in-memory Map sliding window; presets: api 120/min, auth 10/min, search 30/min, scrape 5/min, ai 20/min
- `cache/` — ETag helpers
- `openapi/` — `generateOpenAPISpec` + `zodToSchema`; static copy at `backend/api/openapi.json`
- `content/` — taxonomy, dates, status, sources, dedup, seo, linking, quality, provenance; used by frontend scrapers/ingest
- Jest tests in `backend/api/__tests__`

### backend/ai-gateway — AI provider library

9 AI providers with fallback chain and 10-minute cooldown per provider; zero runtime dependencies (global `fetch`). No tests. Provider details live in `project-bible/08-ai`.

### backend/server — Express 4 REST API (the only runnable component)

- Port 8080 (env `PORT`), binds `0.0.0.0`; entry `src/server.ts` → `createApp({ env, db clients })`
- Routes:
  - `GET /health` (no DB)
  - `GET /api/v1/opportunities` (zod-validated filters + pagination)
  - `GET /api/v1/opportunities/:idOrSlug`
  - `GET /api/v1/profiles/me` (Bearer)
  - `GET /api/v1/profiles/:username` (public, lowercase)
  - `GET /api/v1/organizations` + `GET /api/v1/organizations/:slug`
  - `GET /api/v1/news` (list only)
  - `GET/POST /api/v1/applications` + `PATCH/DELETE /:id` (Bearer, caller-scoped, dedupe)
  - `GET/POST /api/v1/saved-opportunities` + `DELETE /:id`
  - `POST /api/v1/ai/insights` (Bearer, wraps ai-gateway, no usage logging)
  - `GET /api/v1/admin/stats` (`x-admin-password`, sha256 + timingSafeEqual)
- Envelope: `{ success, data, pagination }` / `{ success: false, error: { code, message, details? } }`
- CORS allow-list via `ALLOWED_ORIGINS` env
- 16 `node:test` tests in `backend/server/tests`
- `dist/` generated, gitignored
- Dockerfile: `node:20-alpine`, EXPOSE 8080
- `.env.example` (`backend/server/.env.example`): SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_2_URL, SUPABASE_2_SERVICE_ROLE_KEY, PORT, NODE_ENV, ALLOWED_ORIGINS, ADMIN_PASSWORD, ADMIN_HMAC_SECRET + AI provider keys

## Backend replication status (as of 2026-08-19)

Parity docs exist: `backend/docs/FRONTEND-BACKEND-MAP.md`, `backend/docs/API-PARITY.md`.

- Complete: opportunities (list/detail/slug), applications, saved-opportunities, profiles (GET), organizations, admin stats
- Partial: news (list only), AI (insights only)
- Missing: social layer (feed/network/messages/notifications), AI breadth (chat/match/search/summarize), cron/scrapers, search, auth/signup, admin breadth, academy, misc

## Related Documents

- [FRONTEND-BACKEND-MAP.md](../../backend/docs/FRONTEND-BACKEND-MAP.md) — frontend route ↔ backend route mapping
- [API-PARITY.md](../../backend/docs/API-PARITY.md) — replication parity analysis