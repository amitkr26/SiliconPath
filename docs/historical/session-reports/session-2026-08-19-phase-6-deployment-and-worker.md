# Session Report — 2026-08-19: Phase 6 — Deployment Decision + Scraper Worker + Infrastructure Fixes

## Summary
Phase 6 of the backend replication: the backend became **deployable by decision and
config** (Render, `render.yaml`) and the **first scraper workload left the frontend
execution model** — the news RSS sync now runs as a standalone worker process that
shares a single ingestion module with the Express server. Along the way the phase
caught and fixed four pre-existing infrastructure bugs (Docker could never have
built/run the server; CI paths were wrong; the server cron route upserted the wrong
table; local typecheck was a false green). No frontend changes, no schema changes,
no production traffic switched, no deploy — all backend-only. A parallel remote
commit `500955d` (another agent's "phase 6a") was merged in: its OpenAPI re-scope to
the backend `/api/v1` surface was adopted; its redundant worker-local implementation
was removed in favor of the shared module.

## Phase 6 Status: PASS

| Gate | Result |
|---|---|
| Server tests (`backend/server`, node:test) | **46/46** |
| API parity tests (`backend/api`, jest) | **97/97** |
| AI gateway tests (`backend/ai-gateway`, jest) | **15/15** |
| Worker tests (`backend/worker`, node:test) | **17/17** (new suite) |
| TypeScript (`tsc`, api + ai-gateway + server + worker) | clean |
| Builds (server + worker dist) | clean |
| Frontend build regression | exit 0 (zero frontend changes) |
| Production E2E (Playwright vs https://berojgardegreewala.vercel.app) | **9/9 PASSED**; DB residue cleaned BEFORE and AFTER |
| Docker build | PASS (`bdw-backend:phase6`) |
| Docker runtime | `/health` → `{"status":"ok"}`; `/health/ready` → 500 with unreachable DB (correct error path); SIGTERM → drain → exit; worker fail-closed without env (exit 1); bad command (exit 2) |

**Readiness state:** local-ready ✅ · Docker-ready ✅ · CI-ready ✅ (first run on next
push) · deployment-ready ✅ · **deployed: NO** (owner action — create Render service,
set secrets, flip domain; KNOWN_ISSUES #0).

## Deployment decision (6A)
- **Target: Render.** Web service = Express API from `backend/server/Dockerfile`
  (dockerContext `.`, health check `/health`); cron job = the SAME image running
  `node --import tsx backend/worker/dist/index.js news` on `0 6 * * *` (06:00 UTC,
  matching the frontend `vercel.json` news schedule).
- `render.yaml` committed with `sync: false` secrets — owner sets them in the Render
  dashboard. `ALLOWED_ORIGINS` carries a concrete value (localhost + Vercel prod +
  electrobridge). No queue/microservices/Redis — per the standing architecture rule.
- Vercel remains the production cron owner for the frontend paths; the backend cron
  route stays as the guarded (`CRON_SECRET`) trigger.

## Scraper worker architecture (6B)
- New workspace `backend/worker` (`@berojgardegreewala/worker`). Entry:
  `node --import tsx dist/index.js news`. Exit codes: **0** (≥1 feed succeeded),
  **1** (all feeds failed / DB write failed / missing env — fail-closed), **2** (bad
  command). Structured JSON summary on stdout.
- All ingestion logic lives in ONE shared module,
  `backend/api/src/content/news-sync.ts`, consumed by both the server cron route and
  the worker (no duplication; the worker never imports frontend code).
- Run health persisted exactly like the frontend pipeline: `scrape_runs` row per feed
  (status success/error, results_count, error, duration_ms, started_at/completed_at)
  + `scrape_sources` health (name-keyed read-then-write — no unique constraint on
  name, so no onConflict; no schema changes).
- **No fabricated-data path at all** — all-feeds-fail yields zero rows (tested).

## RSS migration (6C) — shared `news-sync.ts`
- 12 news feeds, electronics relevance filter, bounded fetch concurrency 4, retry
  1+2 with exponential backoff on network error / 5xx / 429 (404 non-retryable),
  run-level URL dedup (lowercased, trimmed), per-source execution contract.
- Write contract = the frontend `/api/news/sync` contract exactly: `news_articles`
  upsert onConflict `url` ignoreDuplicates, `is_active: true`, null-url rows never
  written. `url` unique constraint verified in db1.
- **P1 parity bug fixed (KNOWN_ISSUES #13):** the server cron route previously
  upserted `news_archive` onConflict `slug` (db2 archive table, slug not unique) —
  broken against the live schema. `routes/cron.ts` now uses the shared module
  (response shape unchanged, adds per-source `sources`); old
  `backend/server/src/services/news-sync.ts` deleted.

## Infrastructure fixes (6D/6E) — each verified in-container
1. **`.dockerignore` added** — host `node_modules` (Windows junctions + win32
   binaries) was being COPYed into the linux image; Phase 5's Dockerfile could never
   have worked.
2. **`node:20-alpine` → `node:22-alpine`** — supabase-js ≥2.110 requires native
   WebSocket; node:20 crashed at boot (local Node is v26.7.0).
3. **`npm ci` must name the worker workspace** (`--workspace
   @berojgardegreewala/server --workspace @berojgardegreewala/worker
   --include-workspace-root`) or the worker symlink is never created.
4. **Extensionless package subpaths** (`@berojgardegreewala/api/src/content/news-sync`)
   — tsx's CJS hook doesn't map `.js`→`.ts` for package subpaths (ESM import worked,
   CJS require didn't).
5. **ai-gateway `res.json()` typing fix** — local typecheck passed only because
   frontend `@types` (aria-query → `lib.dom`) leaked into the server program; the
   container (canonical env) correctly errored TS18046. Fixed with a small `json()`
   helper (9 call sites) + `types: ["node"]` in server + worker tsconfigs.
6. **Graceful shutdown** in `server.ts` (SIGTERM/SIGINT → `server.close()` drain,
   10s force-exit) — verified in-container.
7. **CI rewritten** (`ci.yml`): ai-gateway job on `@berojgardegreewala/ai-gateway`,
   new `backend` job (api+server+worker typecheck/test/build), frontend job drops
   the bogus working-directory; node-version 22 everywhere. KNOWN_ISSUES #9 fixed —
   close after first green run.
8. **OpenAPI**: `backend/api/scripts/generate-openapi.ts` created (KNOWN_ISSUES #10
   closed); spec re-scoped to the backend `/api/v1` surface with Render/Vercel/local
   servers (adopted from remote `500955d`); `openapi.json` regenerated to match.

## Merge of remote `500955d` ("phase 6a")
Fast-forwarded to `500955d`, restored the local Phase 6 work, resolved conflicts:
- **Adopted:** OpenAPI re-scope (`openapi/index.ts` + regenerated `openapi.json`),
  `ALLOWED_ORIGINS` concrete value in render.yaml, worker workspace + graceful
  shutdown (already equivalent locally).
- **Superseded/removed:** the parallel worker-local implementation
  (`backend/worker/src/{config.ts,db.ts,workers/news-sync.ts}`, interval-loop
  design, 7 tests) — replaced by the shared-module CLI worker (17 tests, cron
  model, exit codes); its render.yaml (node-runtime web service, no cron) was
  replaced by the docker web + cron job blueprint per the recorded decision.
- Post-merge verification rerun: api 97/97, ai-gateway 15/15, server 46/46, worker
  17/17, tsc + builds clean, openapi regenerated, `.gitignore` now covers
  `backend/worker/dist/`.

## Files changed
- Added: `.dockerignore`, `render.yaml`, `backend/api/src/content/news-sync.ts`,
  `backend/api/scripts/generate-openapi.ts`, `backend/worker/` (package.json,
  tsconfig.json, src/index.ts, src/run-news-sync.ts, tests/news-sync.test.ts).
- Modified: root `package.json`/`package-lock.json` (workspace + start scripts),
  `backend/api/package.json` (rss-parser), `backend/api/src/content/index.ts`,
  `backend/api/src/openapi/index.ts`, `backend/api/openapi.json`,
  `backend/ai-gateway/src/gateway/index.ts` (json helper),
  `backend/server/Dockerfile`, `backend/server/src/{server.ts,routes/cron.ts}`,
  `backend/server/tests/parity.test.ts`, `backend/server/tsconfig.json`,
  `.github/workflows/ci.yml`, `.gitignore`, project-bible (09-scrapers, 14-devops,
  ARCHITECTURE, IMPLEMENTATION_STATUS, KNOWN_ISSUES, AGENT_STATE, AGENT_HANDOFF,
  CHANGELOG, 07-api, 20-machine-specs).
- Deleted: `backend/server/src/services/news-sync.ts` (superseded by shared
  module), `backend/worker/src/{config.ts,db.ts,workers/news-sync.ts}` (redundant
  parallel implementation).

## Security notes
- No secrets committed: render.yaml uses `sync: false`; ALLOWED_ORIGINS is a
  non-secret allowlist. `CRON_SECRET` guard on the cron route is timing-safe;
  worker reads env directly, fails closed when missing.
- Credential scan before push per SECURITY.md; stale local key remains KNOWN_ISSUES
  #1 (owner action, production unaffected).

## Remaining blockers
- KNOWN_ISSUES #0 (deploy = owner action on Render) · #1 (stale local key, owner)
  · #9 (close after first green CI run on the next push) · #12 (scraper-run
  evidence gap).

## Next action (exactly ONE)
Owner: deploy the backend on Render via the committed `render.yaml` (web service +
cron job), set the `sync: false` secrets, and confirm `/health` + the first cron
run — then close KNOWN_ISSUES #0/#9/#12.