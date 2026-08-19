# Testing Strategy

## Overview

Playwright E2E against production plus Jest unit tests (frontend) and `node:test` (backend server). No Cypress.

## Test Suites

### E2E — Playwright (`frontend/tests/e2e/`)

- 6 spec files: auth (header-nav), messaging, network-connect, social-workflow, accept-connection, probe-network
- Runs against `https://berojgardegreewala.vercel.app` (override with `BASE_URL`)
- Production suite passes 9/9 as of 2026-08-19 (Phase 5 regression; residue cleaned before AND after)
- Sequential workers (1) to avoid state collisions; config: `frontend/playwright.config.ts`

### Unit — Jest (frontend)

- 104 tests across 14 files in `frontend/src/__tests__/` (api routes, lib utils, scrapers, validation, components)
- Config: `frontend/jest.config.js`

### Server — node:test (`backend/server`)

- 46 tests in `backend/server/tests/` — `parity.test.ts` (30: health/CORS/404 envelope, opportunities pagination/slug/validation, profiles public-field stripping + `/me`, Bearer auth 401s/invalid tokens/caller scoping, admin guard 403/200, social/AI/auth/search/news-cron routes, rate-limit 429, cron secret gate) + `hardening.test.ts` (16: AI routes against a stubbed provider — grounding/allowlist/502 mapping/telemetry, CORS allowed+blocked+preflight, XFF shim rate-limit buckets, admin 429, `/health/ready` 200/503, malformed JSON → 400 `VALIDATION_ERROR`)
- No credentials needed: Supabase clients are fakes (`fake.ts`); AI tests stub `global.fetch` + `GROQ_API_KEY` with a 127.0.0.1 passthrough
- Real HTTP: boots the app on an ephemeral port, exercises with `fetch`
- Each file runs in its own process — in-memory rate-limit buckets / gateway cooldowns are per-file

### Library — Jest (`backend/api` + `backend/ai-gateway`)

- `backend/api`: 97 unit tests in `backend/api/__tests__/` (validation, error handling, content helpers, openapi)
- `backend/ai-gateway`: 15 tests in `backend/ai-gateway/__tests__/gateway.test.ts` (provider success, fallback chain incl. 500/429/timeout/malformed JSON/nvidia empty-content guard, missing-credential skip, all-fail controlled error, cooldown, preferred-model reorder, systemPrompt, generateAdvanced, telemetry success+failure no-secret-leak, logger-throw resilience)

## Canonical E2E Test Accounts (2026-08-19)

These supersede all legacy accounts (e.g. `xasefe9251@bejum.com`, `weqolyji@forexzig.com` — deleted).

| Account | Email | Password | UUID |
|---|---|---|---|
| Candidate | amittest1@berojgardegreewala.com | TestPassword123! | 56b47f8e-8501-45c5-b9a3-8d4fcef8252e |
| Candidate | amittest2@berojgardegreewala.com | TestPassword123! | 9e55b282-0d5b-4210-9fd4-54ec5c45da45 |

Cleanup contract before full runs: delete inter-account rows — connections, `user_follows`, `feed_posts` like `E2E test post%`, notifications, messages by `sender_id`, conversations by participant.

Test rules: run on a clean DB. `frontend/scripts/test-social-e2e.mjs` leaves residue (accepted connection).

## Related Documents

- [TESTING.md](./TESTING.md) — QA rules and test data lifecycle