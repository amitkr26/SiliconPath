# Testing Strategy

## Overview

Playwright E2E against production plus Jest unit tests (frontend) and `node:test` (backend server). No Cypress.

## Test Suites

### E2E — Playwright (`frontend/tests/e2e/`)

- 6 spec files: auth (header-nav), messaging, network-connect, social-workflow, accept-connection, probe-network
- Runs against `https://berojgardegreewala.vercel.app` (override with `BASE_URL`)
- Production suite passes 9/9 as of 2026-08-18
- Sequential workers (1) to avoid state collisions; config: `frontend/playwright.config.ts`

### Unit — Jest (frontend)

- 104 tests across 14 files in `frontend/src/__tests__/` (api routes, lib utils, scrapers, validation, components)
- Config: `frontend/jest.config.js`

### Server — node:test (`backend/server`)

- 16 tests in `backend/server/tests/` (health/CORS/404 envelope, opportunities pagination/slug/validation, profiles public-field stripping + `/me`, Bearer auth 401s/invalid tokens/caller scoping, admin guard 403/200)
- No credentials needed: Supabase clients are fakes (`fake.ts`)
- Real HTTP: boots the app on an ephemeral port, exercises with `fetch`

### Library — Jest (`backend/api`)

- Unit tests in `backend/api/__tests__/` (validation, error handling, content helpers, openapi)

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