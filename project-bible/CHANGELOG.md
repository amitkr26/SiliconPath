# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased] - clean/main branch

### Changed
- **2026-08-19 — Backend deployability + scraper worker (Phase 6 of backend replication).** All backend-only code + CI/ops, zero frontend changes, zero schema changes, no deploy, no production traffic switched.
  - *(a) Deployment decision*: Render — Docker web service for `backend/server` + Render cron job running the same image for the worker. `render.yaml` committed (secrets `sync: false` — set in the Render dashboard). NOT deployed (owner action; KNOWN_ISSUES #0 updated).
  - *(b) Scraper worker architecture*: new `backend/worker` workspace (`@berojgardegreewala/worker`) — a scheduled process (`node --import tsx dist/index.js news`) that shares ALL ingestion logic with the server via `backend/api/src/content/news-sync.ts` (single implementation, no duplication; worker never imports frontend code). Structured JSON summary on stdout; exit 0 when ≥1 feed succeeded, 1 when all failed or the DB write failed, 2 for bad commands; run health persisted to `scrape_runs` + `scrape_sources` (name-keyed read-then-write, same contract as the frontend pipeline; no schema changes).
  - *(c) Shared news module*: `news-sync.ts` — 12 news feeds, electronics relevance filter, bounded fetch concurrency 4, retry 1+2 with exponential backoff on network/5xx/429 (404 non-retryable), run-level URL dedup, per-source execution contract, and the production write contract: `news_articles` upsert onConflict `url` ignoreDuplicates with `is_active: true`, null-url rows never written. **This fixes a P1 parity bug (KNOWN_ISSUES #13):** the server cron route previously upserted `news_archive` onConflict `slug` (db2 archive table, slug not unique — broken against the live schema). Server `routes/cron.ts` now uses the shared module (response shape unchanged; adds per-source `sources` array); old `backend/server/src/services/news-sync.ts` deleted.
  - *(d) Docker fixes (pre-existing gaps, verified in-container)*: `.dockerignore` added — the build was copying the host's node_modules (Windows junctions + win32 binaries broke the linux image); base image `node:20-alpine` → `node:22-alpine` (supabase-js ≥2.110 requires native WebSocket; node:20 crashed at boot); `npm ci` must list `--workspace @berojgardegreewala/worker` explicitly (only dependee workspaces get linked); worker dist + package.json copied into the runtime stage; runtime imports switched to extensionless package subpaths (`@berojgardegreewala/api/src/content/news-sync`) because tsx's CJS hook doesn't map `.js`→`.ts` for package subpaths.
  - *(e) Type correctness fix (container caught a false green)*: ai-gateway `res.json()` results typed via a small `json()` helper — the local build was passing only because frontend `@types` (aria-query → `lib.dom`) leaked into the server program; `types: ["node"]` added to server + worker tsconfigs so local == canonical. 15 ai-gateway tests unchanged/green.
  - *(f) Server hardening*: graceful shutdown (SIGTERM/SIGINT → `server.close()` drain, 10s force-exit) in `server.ts`; verified in-container (`SIGTERM received — draining connections` → `connections drained — exiting`).
  - *(g) Infra fixes*: `.github/workflows/ci.yml` rewritten — ai-gateway job points at `@berojgardegreewala/ai-gateway`, new `backend` job (api+server+worker typecheck/test/build), frontend job drops the bogus `working-directory` (KNOWN_ISSUES #9 fixed, close after first green run); `backend/api/scripts/generate-openapi.ts` created — `npm run openapi` regenerates `openapi.json` (KNOWN_ISSUES #10 closed).
  - *(h) OpenAPI re-scoped to the backend surface (adopted from remote `500955d`)*: `backend/api/src/openapi/index.ts` path keys moved from the frontend `/api/...` to the Express `/api/v1/...` surface and the servers list now points at the Render backend + Vercel frontend + local backend; `openapi.json` regenerated to match. openapi.test.ts (base-spec assertions) unaffected.
  - *(i) Verification*: api 97/97, ai-gateway 15/15, server 46/46, worker 17/17 (retry/timeout/5xx/404/dedup/invalid-url/filter/slug-collision/DB-failure/partial-failure/idempotency/fabricated-guard/concurrency-bounds), tsc clean (all workspaces), server+worker builds clean, frontend build exit 0, production E2E 9/9 (residue cleaned before+after), Docker build + runtime verified (image builds; `/health` ok; `/health/ready` 500 with unreachable DB — correct error path; graceful shutdown; worker fail-closed without env: exit 1; bad command: exit 2).
- **2026-08-19 — Backend production-readiness hardening (Phase 5 of backend replication).** All backend-only code, zero frontend changes, zero schema changes, no deploy.
  - *(a) AI gateway tests + fix*: new `backend/ai-gateway/__tests__/gateway.test.ts` (15 jest tests). Suite caught a real bug: a throwing usage-logger (`logFn`) was caught by the provider try/catch and turned a successful provider into a failure — telemetry now runs via `safeLog` (best-effort, never breaks the response; KNOWN_ISSUES #11 closed). Documented pre-existing behavior: omnirouter is env-guard-exempt (localhost:20128 default) and always attempted — unchanged, shared with the frontend.
  - *(b) Server hardening suite*: new `backend/server/tests/hardening.test.ts` (16 node:test tests) — AI routes against a stubbed provider (grounded chat: rows + URL-host allowlist reach the system prompt; no-match fallback; all-providers-fail → 502 `AI_UNAVAILABLE`; match: invalid-id filtering, top-10 cap, malformed provider output → controlled 500 with no stack leak; search: LLM filters extracted + applied with unknown keys dropped; summarize; telemetry row recorded with safe fields, no secrets), CORS (allowed origin, disallowed origin blocked, preflight + credentials), X-Forwarded-For shim (per-IP rate-limit buckets: 1.2.3.4 exhausts at 429 while 5.6.7.8 stays 200), admin endpoint rate limit (21st wrong password → 429 `RATE_LIMITED`), `/health/ready` (200 ready / 503 `DB_UNAVAILABLE`), malformed JSON → 400 `VALIDATION_ERROR` without parser internals.
  - *(c) Route hardening*: `routes/ai.ts` chat/match/search now map gateway exhaustion to 502 `AI_UNAVAILABLE` via `aiFailure` (consistent with insights/summarize); `routes/cron.ts` news-sync gate now timing-safe (`safeEqual` sha256+`timingSafeEqual`) and rejects empty `CRON_SECRET`; `routes/admin.ts` mounted behind the new `admin` rate-limit preset (60s/20, api-lib `rateLimiters`); `middleware/error.ts` maps body-parser `entity.parse.failed` → 400 `VALIDATION_ERROR` "Invalid JSON body"; `server.ts` warns at boot when `CRON_SECRET` is missing.
  - *(d) Ops*: `routes/health.ts` rewritten as `healthRouter(deps)` with liveness `/` + readiness `/ready` (head-count probe against `opportunities`; 503 when no admin client); `Dockerfile` gains `USER node` + `HEALTHCHECK` (wget `http://127.0.0.1:8080/health`); `.env.example` reorganized into REQUIRED/OPTIONAL/DEPLOYMENT and now documents AGENTROUTER_* + OMNIROUTER_* keys.
  - *(e) Verification*: api 97/97 jest, ai-gateway 15/15 jest, server 46/46 node:test (30 parity + 16 hardening), `tsc` build clean, frontend build + full production E2E **9/9** against live deploy (residue cleaned before AND after per the cleanup contract). Backend still NOT deployed — deployment decision recorded as KNOWN_ISSUES #0 (owner action).
- **2026-08-19 — Project-bible reconciliation (full docs sync with code).** Rewrote root control files: `ARCHITECTURE.md` (CURRENT/TRANSITION/TARGET + corrected drift register: 4 databases, 9-provider AI chain, `user_metadata.role`, scrape cron reality, employer RBAC fixed), `MASTER_INDEX.md` (v2 — all 79+ files indexed, no dead links), `IMPLEMENTATION_STATUS.md` (full-platform feature matrix), `KNOWN_ISSUES.md` (added #8 employer-ATS doc overclaim, #9 ci.yml broken paths, #10 openapi script broken, #11 ai-gateway no tests, #12 scraper-run evidence gap), `AGENT_STATE.md` + `AGENT_HANDOFF.md` (v1.2.0 — backend replication + reconciliation state), `E2E_TEST_STATUS.md` (6 spec files / 10 tests, row #10 ATS claim corrected, latest run vs `683404c`). Section READMEs 04–23, machine-specs JSONs, ADR status headers, backlog annotations, and 23-reference status headers rewritten/reconciled by subagents with measured counts (138 API route files, 3 scheduled crons, 9 providers, 18 scraper modules, 4 DBs, 7 tracks). Historical docs marked with status headers, not rewritten. Session report: `docs/session-reports/session-2026-08-19-backend-replication-docs-reconciliation.md`.

### Added
- **2026-08-19 — Backend replication parity docs.** `backend/docs/FRONTEND-BACKEND-MAP.md` (frontend capability → backend equivalent → status; ~50 MISSING items identified, priority: social layer → AI breadth → cron/scrapers → search/signup) and `backend/docs/API-PARITY.md` (full endpoint inventory with COMPLETE/PARTIAL/MISSING/N/A statuses, cross-cutting contracts, status summary).
- **2026-08-19 - Backend server: full read/CRUD + social + AI + auth + news-cron milestone (Phase 4 of backend replication).** All backend-only code, no frontend changes, no schema changes.
  - *(a) Express rate limiting*: `backend/server/src/middleware/rate-limit.ts` adapts the shared api-lib `rateLimiters` presets (api 120/min, auth 10/min, search 30/min, ai 20/min) to Express via a Web-Request header shim; 429 envelope `{success:false, error:{code:"RATE_LIMITED", retryAfter}}`.
  - *(b) AI usage telemetry*: `services/ai-usage.ts` wires `gateway.setLogger` -> `ai_usage_log` inserts (fire-and-forget); `backend/ai-gateway/src/index.ts` now exports `AILogEntry`.
  - *(c) AI endpoints* (`routes/ai.ts` rewritten): `/chat` (grounding over live opportunities, URL-host allowlist, no-match fallback), `/match` (top-10 from pool, tolerant JSON extraction, id validation), `/search` (LLM -> filters), `/summarize` (validation moved outside the 502 catch). All behind `requireAuth` + ai rate limit.
  - *(d) Auth* (`routes/auth.ts`): POST `/signup` (email/password validation, reserved usernames, `auth.admin.createUser` email-confirm, `user_profiles` upsert, 409 on username/email conflict) + GET `/check-username`.
  - *(e) Search* (`routes/search.ts`): `/api/v1/search` + `/people` reusing the opportunities repository and public-profile filters.
  - *(f) Social* (`routes/social.ts`): feed CRUD + like/comment/repost (counts stay trigger-maintained), network connect/accept/withdraw (role-enforced) + connections list/status-check + suggestions + follow/unfollow + followers/following, notifications (list/count/mark-all/mark-one) with service-role cross-user inserts.
  - *(g) Messaging* (`routes/messages.ts`): conversation list (with other participant + last message + unread count), with/:userId discovery, thread GET (marks incoming read) + POST (bumps `last_message_at`, notifies other participant).
  - *(h) News*: `routes/content.ts` +GET `/:slug`; `services/news-sync.ts` ports the 12-feed RSS fetch (relevance filter, parallel) and slugify; `routes/cron.ts` GET `/api/v1/cron/news-sync` guarded by Bearer `CRON_SECRET`, idempotent upsert on slug.
  - *(i) Wiring*: `app.ts` mounts all routers + usage logger; `config/env.ts` +`cronSecret`; `.env.example` +`CRON_SECRET`; `backend/server/package.json` +`rss-parser@^3.13.0` (already hoisted at root); `tests/fake.ts` +`auth.admin.createUser` stub.
  - *(j) Tests*: new `tests/parity.test.ts` (14 tests: 401 coverage on all new protected routes, AI no-match/empty/validation paths, signup validation/conflict/success, username availability, search, news slug 404/200, cron secret gate, slugify, rate-limit 429). Result: server 30/30, api 97/97, `tsc` build clean. `backend/docs/BACKEND-EXTRACTION-REPORT.md` written (honest gaps: scraper fleet not ported, PATCH /me deferred, ai-gateway untested, DB2 client unused, per-process limiter).
- **2026-08-19 - Network verification wrap.** Deploy `a79773a` READY; production E2E **9/9 PASSED**; temporary `frontend/tests/e2e/probe-network.spec.ts` verified connection card href `/profile/amittest2` and both name-link/card-body click navigations, then deleted. DB residue left per the documented clean-before-next-run contract.
- **2026-08-19 — Network page: 4 tabs + clickable user cards; LinkedIn-style public profile (`683404c`, `a79773a`).**
  - *(a)* `frontend/src/app/network/page.tsx` now shows four sections — Suggested Connections, Received Requests, Sent Requests (outgoing with Cancel Request), My Connections. Received filters to `direction === "incoming"`; every user card (suggestion/received/sent/connection) is fully clickable and routes to `/profile/{username|id}`; action buttons use `stopPropagation`.
  - *(b)* `frontend/src/components/ConnectionCard.tsx` accepts `onOpen`; the root div handles click → `router.push` (cursor-pointer), buttons stop propagation.
  - *(c)* `frontend/src/components/profile/PublicProfile.tsx` renders previously-missing live columns: About reads `bio` (was `profile.about` — column doesn't exist), company line reads `job_title`/`current_company` (was `current_position`/`current_org`), location reads `location || country`, plus `experience_years`, Interests section, and Links section (`linkedin_url`/`github_url`/`website_url`). `frontend/src/types/index.ts` `UserProfile` extended with the optional live columns.
  - *(d)* `frontend/src/app/api/network/connections/route.ts` select now includes `username` so ConnectionCard links resolve to real `/profile/:username` URLs (previously fell back to `#`).
  - Verified: frontend build passes, 104/104 jest, production E2E 9/9 against deploy of `683404c`.

### Added
- **2026-08-18 — Full Platform Audit & E2E Verification (27/27 Passed, 104/104 Unit Tests, Build Exit 0).**
  - *(a) Full Platform Audit Report*: Authored `docs/audit-reports/2026-08-18-full-platform-audit-report.md` documenting 100% verification across all 3 portals (Public Aggregator, Candidate Social Hub, Employer Recruitment Pipeline).
  - *(b) Added GET /api/profile/me*: Implemented `GET` handler in `frontend/src/app/api/profile/me/route.ts` returning authenticated user profile and metadata.
  - *(c) Parameter Aliases in Connect Route*: Supported `receiverId`, `recipientId`, `targetUserId`, `addressee_id` in `frontend/src/app/api/network/connect/route.ts`.
  - *(d) Verified Bookmarks & Resume ATS*: Verified `/api/bookmarks` and `/api/resume` persistence and scoring (40-100).
- **2026-08-18 — Full Social Core E2E Verification (17/17 Passed) & Messaging/Profile Fixes.**
  - *(a) Direct Messaging 500 Fix*: Fixed `ReferenceError: content is not defined` in `frontend/src/app/api/messages/route.ts` by extracting `const content = body.content || body.body || body.message;` from the validated body.
  - *(b) Flexible Validation Schema*: Updated `messageSchema` in `frontend/src/lib/validation.ts` to accept `participantId`, `recipientId`, `recipient_id`, or `participant_id`.
  - *(c) Token Auth Support in server.ts*: Configured `createClient` in `frontend/src/lib/supabase/server.ts` to automatically bind Bearer authorization tokens to `client.auth.getUser()`, enabling clean API token testing and mobile client compatibility.
  - *(d) Enhanced Connections Response*: Enriched `frontend/src/app/api/network/connections/route.ts` to return both full user profiles (`display_name`, `headline`, `current_company`, `avatar_url`) AND relationship metadata (`user_id`, `requester_id`, `addressee_id`, `status`).
  - *(e) LinkedIn-Style Profile Lookup*: Updated `frontend/src/app/profile/[username]/page.tsx` to resolve users dynamically by either `username` (e.g. `amittest1`) or UUID (e.g. `56b47f8e-...`), enabling profile clicks from suggestions, direct messages, and feed cards.
  - *(f) 17/17 Multi-User E2E Test Suite*: Authored and executed `frontend/scripts/test-social-e2e.mjs` verifying the entire candidate-to-candidate social lifecycle (login, suggestions, connect, accept, connection list, send message, reply message, conversation list, message history, profile navigation) with 100% pass rate.
- **2026-08-18 — Production Social Networking Bug Fix (follow/connect/messages/feed).** All four reported production failures fixed at root cause and verified against live DB1 (`aqauempuwmbizqoaolop`):
  - *(a) Follow POST 500*: trigger `handle_follow()` wrote `follower_count`/`following_count` to `user_profiles` which lacked those columns → every follow insert failed with `column "follower_count" does not exist` (user reported it as `follow_error_count` — misread; that identifier exists nowhere in repo, history, or live schema). Fixed via new migration `frontend/supabase/migrations/20260818000001_user_profiles_social_counts.sql` (adds `follower_count`, `following_count`, `connection_count` INT NOT NULL DEFAULT 0 + backfill) — **applied live**. Insert/unfollow now succeeds and counts update.
  - *(b) Follow state GET 405*: `api/network/follow/[userId]` had no GET handler — added, returns `{ following }`.
  - *(c) Connect 409*: production 409 was genuine duplicate semantics (UNIQUE(requester_id, addressee_id)); route now returns 409 with the existing row and the UI reflects real state (Pending/Connected). Receiver pre-check added (clean 404). PATCH on `connect/[id]` is now role-enforced (addressee accept/decline→rejected; requester withdraw→row delete; 403 on wrong role). GET on `connect` filters pending + adds `direction`.
  - *(d) GoTrueClient warning*: anon client from `lib/supabase.ts` leaked into `/messages` (static import) and `/academy` (client-side `require`/dynamic import of `lib/academy/queries`). Fixed: messages uses `createClient()` from `lib/supabase/client`; academy fallback tracks moved to supabase-free `lib/academy/fallback.ts` (queries.ts re-exports), page imports it statically.
  - *(e) `/people/[username]` crash*: `use(params)` on a plain object threw React 18.3 "unsupported type passed to use()" — page never worked; destructures params directly now.
  - *(f) Local dev env fixes*: `frontend/.env.local` repointed from Project 2 (`jbqjipwanfsxyqkfrrpx`) to Project 1 (production DB) and gained the missing `NEXT_PUBLIC_SUPABASE_ANON_KEY` (middleware threw on every request without it — dev was broken). **Known limitation:** the Project 1 `SUPABASE_SERVICE_ROLE_KEY` in `siliconpath-credentials.txt` is stale (401s — rotated after the file was updated; owner has no access right now) — admin-backed routes fail locally only; production keys are valid.
  - *(g) New E2E* `tests/e2e/social-workflow.spec.ts` (follow/unfollow persistence, connect/accept, messaging, feed post/like/comment) + hydration-safe login helper (retries against the React hydration race that native-submitted the login form in local runs).
  - Verified: `npm run build` passes, 104 jest tests pass. Deploy via Vercel git integration (push-triggered; CLI `vercel deploy --prod` races the git deployment and must not be used). **Final verification: production E2E 9/9 green** — see `project-bible/E2E_TEST_STATUS.md`.

### Fixed (follow-up, deploy `cdc80a7`)
- **2026-08-18 — Feed like/comment counts trigger-maintained; broken like trigger fixed.** Root cause found via live schema inspection + direct PostgREST probes:
  - *(a)* `update_post_likes_count()` trigger wrote a nonexistent `feed_posts.likes_count` column → every like INSERT failed at the DB level (`42703`) while the like route returned `{ liked: true }` without checking the insert error — **likes never persisted** (count came from the route's manual `like_count` update, so the UI looked fine). Trigger now writes `like_count` (migration `frontend/supabase/migrations/20260818000002_fix_post_count_triggers.sql`, applied live via Management API).
  - *(b)* Both count triggers were SECURITY INVOKER, and `feed_posts` has no cross-user UPDATE policy → the trigger's `UPDATE feed_posts` was RLS-filtered to 0 rows for authenticated-role inserts (counts silently drifted). Both functions are now SECURITY DEFINER, so counts always match like/comment row counts for every insert path. Verified 8/8: comment/like inserts, unlikes, comment deletes, plain-user path.
  - *(c)* Like and comment routes no longer read-modify-write the counts manually (was double-incrementing on top of the trigger — observed `comment_count=2` with 1 row).
  - *(d)* E2E spec fixes (`86acb2f`): whitespace-tolerant count assertion (`/^\s*1\s*$/` — JSX whitespace), connected-state assertion is the "Message" link (no "Connected" text exists), connect flow waits for `GET /api/network/connections`, messaging spec seeds deterministically via `?user=` and targets the list container's real class (`overflow-y-auto`; `divide-y-2` ≠ `divide-y`). **Production full suite: 9/9 passed.**

### Fixed (follow-up, deploy `b07ebd1`)
- **2026-08-18 — Social counts on public profiles + connection_count maintained.** (a)
  `PUBLIC_PROFILE_FIELDS` in `frontend/src/lib/utils.ts` did not include
  `follower_count`/`following_count`/`connection_count`, so PublicProfile never rendered
  the count spans (the profile page fetched the counts, but the field allowlist stripped
  them server-side). All three columns added. (b) The `connections` table had no trigger,
  so `connection_count` stayed 0 forever. New migration
  `frontend/supabase/migrations/20260818000003_connection_count_trigger.sql` (applied
  live): `handle_connection_count()` SECURITY DEFINER + `on_connection_change` trigger
  (AFTER INSERT/UPDATE/DELETE, only `accepted` rows count) + backfill. Verified live:
  pending insert is a no-op, accept bumps +1 on both sides, reject/un-accept decrements.
  `handle_follow` was already SECURITY DEFINER. 104 jest pass; **production full suite:
  9/9 passed**.

### Fixed (follow-up, deploy `6d9684d`)
- **2026-08-18 — Messaging conversation list read-after-write lag (the last E2E flake).**
  Reproduced deterministically with a browser debug spec: on a clean DB, immediately
  after a fresh conversation is created the list GET `/api/messages` returns
  `200 {"conversations":[]}` for several seconds while the per-conversation GET
  `[id]` (same session, same route family) already sees the row — a read-after-write
  lag through the Supabase pooler (the list later self-heals within ~5-10s; every
  subsequent read is correct). The messages query already polled via
  `refetchInterval`; the conversations query had none. Fix: `useConversations()`
  now polls every 5s (one line, same pattern as the messages query), so a just-created
  conversation appears without a manual reload. Verified: fresh-conversation solo run
  green, then **production full suite 9/9 passed (1.7m)** on a clean DB (an earlier
  suite run had failed on leftover connection state — cleanup contract enforced).

### Added (2026-08-18 night — owner round + account migration)
- **Owner's round merged (`667fe62` → `c4c60f6`):** resilient messages POST field
  names (`participantId`/`recipientId`/`recipient_id`/`participant_id` +
  `content`/`body`/`message`), Bearer-token auth in `lib/supabase/server.ts`,
  UUID/username profile routing, richer connections/route response, network page
  profile links, reply-route parsing — all deployed READY by git integration.
- **Test-account migration:** `frontend/scripts/reset-users.mjs` deleted ALL auth
  users (incl. legacy A/B/C) and created canonical `amittest1`/`amittest2`
  (`TestPassword123!`). Playwright helpers/specs updated (`helpers.ts` credentials,
  `?user=amittest2`, `B_USERNAME='amittest2'`); `loginAsEmployer` kept as a legacy
  name (no flow needs the employer role — commented).
- **`network-connect.spec.ts` self-withdraws its request** (PATCH
  `/api/network/connect/[id]` `{status:"withdrawn"}`): with only two accounts in the
  DB the spec's target is the other test user, and leftover requests poisoned
  `social-workflow`'s connect test (observed twice). Spec-only change.
- Docs: `E2E_TEST_STATUS.md` (canonical accounts, cleanup SQL, 9/9 result),
  `AGENT_HANDOFF.md` (OpenCode continuation §3: deploy mechanics, `[vercel skip]`
  does not work, trigger-maintained counts, pooler lag, cleanup contract),
  `KNOWN_ISSUES.md` #6 (new accounts + reset-users warning).
- **Production full suite (deploy `c4c60f6`): 9/9 passed (1.6m).** Test data cleaned.

- **2026-08-17 — Core 3-Portal Ecosystem Hardening & Bug Fixes (Phases 1-3).**
  - *(a) Opportunities Search & Filter Blacklist*: Removed destructive keyword blocklist in `frontend/src/app/api/opportunities/route.ts` that erroneously filtered valid semiconductor positions ("Qualcomm", "Lead RISC-V", "Senior ASIC Verification Engineer", etc.).
  - *(b) Network & Connection Suggestions*: Replaced over-aggressive `isTestAccount()` in `frontend/src/app/api/network/suggestions/route.ts` with minimal bot filter `isSystemBot()`, allowing all genuine registered candidate profiles to be discoverable and connectable with zero `sug-*` mock ID failures.
  - *(c) 1-to-1 Realtime & Polling Direct Messaging*: Fixed target user resolution in `frontend/src/app/messages/page.tsx` by fetching profile data via `/api/profile/[userId]` and updated `useMessages` hook polling intervals to 3s for fast message delivery.
  - *(d) ATS Resume Builder Persistence*: Updated `frontend/src/app/api/resume/route.ts` to persist resume payload directly into `user_profiles.resume_data` (DB1 source of truth), calculate real-time ATS match score (40-100), and provide feedback.
  - *(e) Saved Opportunities Organization Mapping*: Enhanced `frontend/src/app/api/bookmarks/route.ts` to join `organizations(*)` and format authentic company names so bookmarks render accurately in `/saved`.
  - *(f) Interactive Organizations Directory*: Built `frontend/src/app/organizations/OrganizationsClient.tsx` with instant search and multi-category filtering (Defence/Space, Academic, Fabless/IDM, Research Labs).
  - *(g) VLSI Academy Sequential Numbering*: Cleaned up track number formatting in `frontend/src/app/academy/page.tsx` so all 7 tracks are numbered sequentially without skipped indices.
- **2026-08-17 — FK RESTRICT + E2E verification + Vercel build fix + security incident.** (a) `saved_opportunities.opportunity_id` FK changed from `ON DELETE CASCADE` to `ON DELETE RESTRICT` via Supabase Management API (verified live: deleting an opportunity with bookmarks now fails with constraint violation, bookmarks preserved). (b) Five Playwright E2E tests pass (network suggestions, connect, messages, header navigation, accept connection — no FK errors). (c) Health route `dynamic = "force-dynamic"` added (prevents stale static cache). (d) **🚨 SECURITY INCIDENT:** `change-fk.js` (root) and `.opencode/mcp-servers/change-fk.js` committed with live Supabase Management API token (`sbp_...`) and service role key (`sb_secret_...`) for project `jbqjipwanfsxyqkfrrpx` in plaintext. Both files deleted immediately. **Owner must rotate both tokens now** (Supabase Dashboard → DB2 project → Settings → API → regenerate service role + Management API tokens). `change-fk.js` and MCP variant added to `.gitignore` to prevent re-adding. (e) `vercel.json` build command reverted to `cd frontend && npm run build` (the `--workspaces` variant times out on Vercel due to `file:` protocol resolution for workspace packages — environment limitation, not code bug). Phase 1 status in implementation-map updated accordingly.- **2026-08-16 — Phase 1.7 security sweep (P0.6).** (a) Every `/api/scrapers/*` route now runs behind `requireCronOrAdmin` — the guard moved into the shared `runScraperRoute` (`scrapers/utils.ts`) so all 13 individual routes + `run-all` + `[slug]` are covered by one change; `run-all`'s now-redundant pre-guard removed. Previously any anonymous GET could trigger service-role scrapes (rate-limit-exempt too); verified live: unauthenticated `GET /api/scrapers/isro` → 403, nothing scraped. (b) Deleted dead no-op `/api/revalidate` route — its GET self-fetched POST with `REVALIDATE_SECRET` in the query string (secret leakage into server logs), the POST did nothing ("actual revalidation happens at edge"), and nothing in the app called it. `REVALIDATE_SECRET` removed from `.env.example`; `project-bible/07-api/README.md` + `route-manifest.json` updated. (c) Feed comment post-author lookup fixed `feed_posts.user_id` → `author_id` — `user_id` does not exist on live `feed_posts` (verified), so the comment-notification lookup silently returned null and post authors were never notified. (d) `report-issue` confirmed already covered: zod validation + middleware Upstash rate-limit (`api` bucket) + CSRF exemption (public form). Build passes; 104 jest tests pass.

- **2026-08-16 — Phase 1.6 RBAC server-side (P0.5): middleware role gate, escalation closed, IDOR closed, raw-body routes validated.** (a) `middleware.ts` now enforces a server-side employer gate on `EMPLOYER_ONLY_PATHS` (`/post-job`, `/employers`, `/employer*` + their APIs): previously login-only, any logged-in user could reach employer pages/APIs. Role read from `user_metadata.role` with `account_type:"provider"` fallback (same source the app's own checks use); non-employer → 403 (API) / redirect to `/` (page). Admin APIs deliberately NOT gated here — the admin console authenticates via `x-admin-password`/HMAC tokens (no Supabase session), enforced fail-closed by `requireAdmin` at every route. (b) `profile/me` PATCH no longer accepts `role:"admin"` (was a self-serve privilege escalation; `employer`/`candidate` remain self-service). (c) `applications/[id]` DELETE was an unscoped IDOR (any user, any application id) — now `.eq("user_id", user.id)` owner-scoped, non-owned ids return 404; PATCH body now whitelisted by new `applicationStatusUpdateSchema` (`status` enum = live lifecycle `applied|submitted|reviewed|shortlisted|accepted|rejected` + `notes` ≤ 2000, unknown keys stripped). (d) `auth/signup` whitelists `accountType` (`candidate`/`provider`); role was already server-derived so admin was unreachable — input now validated too. (e) Mass-assignment closed: `opportunities/[id]` PATCH now zod-validates via `adminOpportunityUpdateSchema` + `mapAdminOpportunityColumns` + `resolveOrganizationId` (mirrors the Phase 1.5 `/api/admin/opportunities` path — raw body was written straight to PostgREST); `admin/organizations` POST now validates via new strict `organizationCreateSchema` matched to LIVE `organizations` columns (the old `adminOrganizationSchema` carried dead columns `headquarters`/`founded_year`/`scrape_frequency` etc. that 400'd on PostgREST; it was unused dead code and was replaced). (f) New jest suite `validation-rbac.test.ts` (14 tests: strict org schema rejects dead/unknown columns, status lifecycle whitelist, legacy-field mapping, verification_status CHECK values). Build passes; 104 jest tests pass (was 90).

- **2026-08-16 — Phase 1.5 schema reconciliation (P0.4/P0.5), live-schema drift closed.** (a) `track-click` repointed from the dead `apply_clicks` counter to Neon `click_events` (`event_type='apply_click'` — the table analytics already read). (b) `cron/scrape-india` + `cron/scrape-global`: dropped legacy `organization` text insert + fabricated `verification_status:'verified'`; org now resolved evidence-gated via new shared `resolveOrganizationId()` helper (`run-opportunity-scrape.ts`, used by all three insert paths incl. `employer/jobs` POST + `admin/opportunities` POST/PATCH); new inserts default `unverified`. (c) `search/opportunities` + `ai/search`: removed legacy `organization.ilike` filter (PostgREST `or()` can't parse embedded columns); search now matches org names against the organizations table and filters `organization_id.in(...)`; ordering `posted_at`→`created_at`. (d) `applications` GET, `admin/applications`, `recommendations`, `admin/scrape-health`: embed `organizations(name)` and preserve the legacy `organization` string wire contract via post-fetch mapping. (e) `admin/scrape` + `admin/scrape/status`: `scraper_sources`→`scrape_sources` and `last_scraped_at`→`last_scrape_at` (live column; the impl's `updateSourceHealth` was writing a dead column — health updates now also set `last_success_at`). (f) Admin add/edit opportunity unbroken: `adminOpportunityUpdateSchema` enum trimmed to live CHECK values (`verified|unverified|link_unavailable|expired` — `pending`/`rejected` were 400s), new `mapAdminOpportunityColumns()` maps `stipend`→`salary_range`, `apply_link`→`apply_url` (create defaults `apply_url:""` NOT NULL; empty edit fields never clobber), `organization` text→`organization_id`; add form no longer sends `posted_at`/`pending`. (g) Docs truth: `db/index.ts` comments corrected to live topology (db1 = core+social+logs incl. `ai_usage_log`; db2 = legacy mirror; Neon1 = analytics+cache; Neon2 = cache subset), `neon/schema.sql` gained `trending_cache` + `keyword_stats` (live shapes verified) + corrected header. (h) `email-digest` "Most Popular" ordered by live `view_count` instead of deprecated `apply_clicks`; newsletter prompt reads `salary_range` (was `undefined`). Live-verified: embeds, `scrape_sources` order, FK org search; build passes; 90 jest tests pass. Phase 1 exit test: zero legacy-column queries in `frontend/src/app/api`.

- **2026-08-16 — Phase 1.4 org resolution (P0.3), evidence-gated.** (a) New pure resolver `frontend/src/lib/organizations/resolve.ts` — single source of truth for org inference: domain/website host match, ATS board-token match (greenhouse/lever/ashbyhq/recruitee/smartrecruiters), host-label vs slug/name match (e.g. `isro.gov.in` → ISRO), title substring match, exact-name table match, and a person-name guard that rejects `"Sadia Munir"`-style bylines; legacy URL map removed from `utils.ts` (`inferAuthenticOrganization` now delegates to the resolver). (b) Scrape insert path (`run-opportunity-scrape.ts`) now resolves via the resolver with the org table loaded once per run — org rows created only when the resolved name passes the person-name guard with domain/title backing (never blind creation). (c) Idempotent backfill `frontend/scripts/backfill-organization-ids.ts` (dry-run default, `--apply` to write; per-org batched updates). **Applied live: `organization_id IS NULL` 3,115 → 196 (95.2% → 6.0%)**, all assignments reference existing org rows; residual 196 = org-table gaps (IIT Hyderabad, BEL, Cirrus, …) + no-URL evidence, left unresolved by design. (d) Deleted orphan `frontend/src/lib/scrapers/ats-adapter.ts` (singular; buggy `extractOrgName` producing person-name orgs, zero importers — live adapters use `ats-adapters.ts`). (e) Jest suite `organizations-resolve.test.ts` (11 tests: person-name guard, board tokens, domain/title matching, no-blind-assignment). Build passes; 90 jest tests pass.

- **2026-08-16 — Phase 1 foundation (P0.1–P0.4 partial): real scrape cron, fail-closed guards, verification v1, analytics repoint.** (a) Cron → real engine: `frontend/src/lib/scrapers/run-opportunity-scrape.ts` extracted from `/api/scrape` (real `scrapeAllOpportunities()` + RSS path, writes `scrape_runs`), new `/api/cron/scrape-opportunities` (`requireCronOrAdmin`, fail-closed); `vercel.json` cron 00:00 repointed and 08:00 `/api/cron/check-links` added; `admin/page.tsx` "run all" button repointed. (b) Fail-closed guards: `api/ai/expire` + `api/send-digest` now `requireCron` (removed inverted secret checks). (c) Verification v1 (P0.2): new inserts default `verification_status='unverified'`; `opportunity_verifications` evidence-ledger migration authored (`20260816000001_opportunity_verifications.sql`) — **DDL pending owner application on Supabase db1** (no postgres URL available to agent); `cron/check-links` + `admin/recheck-link` write evidence rows and never auto-promote reachable→`verified`; legacy duplicate `api/check-links` deleted. (d) Analytics repointed to live tables (P0.6/16): `ai_usage_log` → Supabase db1 (`lib/ai/providers.ts` + `analytics/ai-usage` + `analytics/platform`), `platform_analytics` → Neon `click_events` (`analytics/platform`, `admin/analytics`, `admin/performance`), `scrape_logs` → `scrape_runs`. (e) Legacy-column readers fixed via shared `mapDbOpportunityToClient` (`opportunities-feed`, `calendar-export`, `sync-replica`) or column repoint (`admin/recheck-link`); dead duplicates `api/scrape-jobs` + `api/scrape-opportunities` deleted. Build passes; 79 jest tests pass.

- **2026-08-16 — Implementation map (master audit deliverable).** Full code-level audit executed: 4 parallel agent audits (frontend routes/components/auth, API routes/auth guards/legacy fields, database schema/migrations/RLS, 21-feature-system status matrix) + live MCP verification. Delivered as `docs/audit-reports/2026-08-16-implementation-map.md`: verdict (not a rebuild — ~60-70% reusable), P0 defect register (cron → fabricated path, fake verification, org resolution, schema drift, RBAC, fail-open guards, IDOR, mass-assignment), schema drift register (migration files vs live, incl. live-verified: `post_reactions` + `scrape_sources` exist live / `scraper_sources` + `platform_analytics` + Neon `ai_usage_log` do not), live topology discovery (social tables consolidated in Supabase db1; Neon1 holds cache tables), 12-phase file-level plan, route-group migration, decision points for owner, verification protocol. No code modified during audit (per mandate).

- **2026-08-16 — State of the Union audit + documentation overhaul.** Full audit (strategy, codebase reality check with **live database verification**, completion score, 7-day remediation plan) delivered as `docs/audit-reports/2026-08-16-state-of-the-union.md`. Root `README.md` rewritten to the SiliconPath vision ("Career Intelligence Infrastructure for India's Electronics Ecosystem", modular monolith, Discover → Match → Verify → Apply loop, honest current-state section). `ARCHITECTURE.md` rewritten with the 3-portal `(candidate)`/`(employer)`/`(admin)` target folder structure, data-flow diagram, and Known Drift register.
- **2026-08-16 — Documentation restructure.** All documentation centralized: `ARCHITECTURE.md`, `CHANGELOG.md`, `SECURITY.md` (→ `13-security/`), `TESTING.md` (→ `15-testing/`), `CONTENT_UPGRADE_PLAN.md` (→ `23-reference/`), `deploy-stack.txt` (→ `14-devops/`) moved into `project-bible/`. All audit reports moved `project-bible/reports/` → `docs/audit-reports/`. Root duplicates deleted (`trusted_sources_v2/v3.json`, `siliconpath-expanded-global-source-list-v4.md` — copies already tracked in `project-bible/23-reference/`). `PROJECT_BIBLE.md` and `PROJECT_KNOWLEDGE_PACK.md` removed (superseded by the `project-bible/` folder + `MASTER_INDEX.md`). `github-recovery-codes.txt` now gitignored.
- **2026-08-16 — MCP servers wired and verified.** Neon, Supabase, Vercel local MCP servers in `.opencode/mcp-servers/` + `gitmcp` remote server — all live-tested (handshake + real tool calls). Stale credentials in `siliconpath-credentials.txt`/`frontend/.env.local` corrected against live APIs (Neon connection strings rotated, Supabase project-1 key restored to its real legacy service-role JWT, Vercel token replaced).

- **2026-08-14 — Applications unique constraint + saved_opportunities FK (Part 2 fixes).** Added `UNIQUE(user_id, opportunity_id)` constraint to `applications` table (eliminates race condition in check-then-insert). Added foreign key `saved_opportunities.opportunity_id REFERENCES opportunities(id)` enabling PostgREST join — removes need for API fallback path. Migration: `20260814000001_applications_unique_fk.sql`.
- **2026-08-14 — Network suggestions test-account filter.** `isTestAccount()` in `/api/network/suggestions` now checks both `username` and `display_name` for username-like patterns (`test`, `qa`, `probe`, `api-test`, `hiring lead`, etc.) and boilerplate bios ("Microelectronics & semiconductor specialist."). Filters 4 known QA seed accounts from production suggestions. Verified live: only genuine profiles appear.
- **2026-08-14 — Documentation overhaul.** README rewritten with current 4-DB architecture, complete env var tables (frontend + standalone API), feature set (network, messages, bookmarks, applications, AI RAG, admin), setup steps. CHANGELOG updated with dated entries. SECURITY.md created with credential rotation history and secret management policy. `frontend/.env.example` created matching all 30+ env vars actually read by code.
- **2026-08-12 — News slug migration + regression test.** `news_articles` had no `slug` column, so `/api/news/[slug]` 404'd for every article, the detail page could not load real articles, news sync upserts silently failed, and news disappeared from `/sitemap.xml`. Migration `20260812000001_news_slug_column.sql` adds the column, backfills deterministic slugs from `title`, and indexes them (applied to the live project). Added `news-slug.test.ts` (3 tests) pinning the API contract. Verified live: API returns the stored record, detail page renders the stored title, sitemap now emits all 33 news URLs.
- **2026-08-12 — Live data QA cleanup.** Removed test subscriber `qa-audit-test@example.com` from `subscribers` (1 remaining genuine subscription). DB ground truth: 3,269 active opportunities, 33 news articles, 4 categories (jrf 942 / government 29 / fellowship 27 / internship 2).
- **2026-08-10 — Standalone Express REST API (`backend/server` workspace).** New `@berojgardegreewala/server` package mirroring the Next.js internal API: `GET /health`, `/api/v1/opportunities` (pagination + filters, slug/UUID lookup), `/api/v1/profiles/:username` (new indexed username lookup) + `/me`, `/api/v1/organizations`, `/api/v1/news`, `/api/v1/applications` + `/api/v1/saved-opportunities` (user-scoped via Bearer tokens), `POST /api/v1/ai/insights` (wraps `@berojgardegreewala/ai-gateway`), `GET /api/v1/admin/stats` (constant-time `X-Admin-Password`). Reuses `@berojgardegreewala/api` zod validation + error hierarchy. Added to root npm workspaces; `npm ci && npm run build --workspace @berojgardegreewala/server` builds it.
- **2026-08-10 — Server test suite (16 tests).** node:test + select-aware fake Supabase client in `backend/server/tests` — run with `npm test --workspace @berojgardegreewala/server`; no credentials required.
- **2026-08-10 — Deployment artifacts.** Root-context multi-stage Dockerfile (`backend/server/Dockerfile`) + `deploy-stack.txt` (Render/Docker steps, env var table, verification curls) + `backend/server/.env.example`.
- **2026-08-10 — README migration map.** Mirrored routes marked DONE with route→file mapping; remaining ~120 Next.js routes queued IN PROGRESS in priority order (social layer, academy, full AI surface, admin, employer/companies, resume/search, scrapers & cron, misc).

### Fixed
- **2026-08-14 — AI grounding context selection bug.** `lib/ai/grounding.ts` was selecting wrong context chunks (off-by-one in similarity threshold). Fixed threshold and added `grounding.test.ts` (7 tests) pinning retrieval behavior.
- **2026-08-14 — Profile fabricated-content fix.** Profile editor was allowing fabricated bios/headlines to persist. Added server-side validation in `api/profile/[userId]/route.ts` + client-side guards in `ProfileEditor.tsx`.
- **2026-08-14 — Security header additions.** `middleware.ts` now sets `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` on all responses. Verified via `security-scan.yml` workflow.
- **2026-08-14 — Neon/Supabase credential rotations.** All 4 database credentials rotated post-git-history-rewrite. Vercel env vars updated. MCP server configs (`.opencode/mcp-servers/*`) now read from `siliconpath-credentials.txt` + `frontend/.env.local` only.
- **2026-08-14 — Search/OG image/contact form fixes.** `/api/search` now returns consistent shape with `results` array. OG image generation (`/api/og/opportunity/[slug]`) handles missing images gracefully. Contact form (`/api/contact`) validates honeypot + rate limits via Upstash.
- **2026-08-14 — Table-name mismatches resolved.** Codebase standardized on `saved_opportunities` (not `saved_jobs`/`bookmarks`), `connection_requests` → `connections` (v2 schema with `requester_id/addressee_id/status`), `conversations`/`messages` (v2 schema with `participant_a/participant_b`). All API routes updated.

### Security
- **2026-08-07 — Git history force-rewritten to purge secrets.** Hardcoded Supabase service keys, a Vercel token, and Neon DB passwords that were committed in `frontend/scripts/*`, `frontend/src/lib/db/multi-db.ts`, and `test-db.js` were removed from the repository AND rewritten out of all git history (`git filter-branch` + force-push; remote `main` rewritten, old HEAD was `078c59a`). **Collaborators must `git fetch origin && git reset --hard origin/main` (or re-clone) — do NOT `git pull`** — the shared history has been rewritten. Keys were rotated on Supabase/Neon; Vercel env vars updated.
- Deleted all QA scripts with hardcoded credentials (19 files + `multi-db.ts` + `test_neon.js`). Secrets must only come from environment variables.

### Removed
- `docs/10-api-specification.md` (duplicate of `10-api-spec.md`)
- `docs/13-environment.md` (duplicate of `13-environment-variables.md`)
- `docs/ARCHITECTURE.md` (duplicate of `07-architecture.md`)
- `docs/DATABASE.md` (duplicate of `09-database.md` + `DATA_MODEL.md`)
- `docs/PRD.md` (duplicate of `03-prd.md`)
- `docs/ROADMAP.md` (duplicate of `22-roadmap.md`)
- `docs/SECURITY.md` (duplicate of `12-security.md` + `SECURITY_AND_COMPLIANCE.md`) — **recreated as new SECURITY.md**
- `docs/API_REFERENCE.md` (duplicate of `API_SPEC.md`)
- `docs/00-README.md` (redundant with `docs/README.md`)
- `berojgardegreewala/api_test_results.txt` (test artifact)
- `berojgardegreewala/audit_report.json` (test artifact)
- `berojgardegreewala/batch1_results.json` (test artifact)
- `berojgardegreewala/live_test_results.txt` (test artifact)
- `berojgardegreewala/LEGACY_READONLY.md` (obsolete legacy notice)

### Changed
- `docs/README.md` - Consolidated as single documentation index with complete navigation
- `README.md` - Rewritten with clear platform vision, 4-DB architecture, and setup guide
- `.gitignore` - Added patterns to prevent test artifacts from being committed

---

## [0.9.0] - 2026-07-10

### Added
- Academy learning paths with career progression
- Resume builder with AI analysis
- DB reset migrations for clean Supabase schema
- Batch 1 scrape sources configuration

---

## [0.8.0] - 2026-07-05

### Added
- LinkedIn-style social features (profiles, connections, messages)
- AI opportunity matching and analytics
- Community feed and posts
- Company pages
- Neon analytics database integration

---

## [0.7.0] - 2026-07-03

### Added
- Multi-database architecture (2x Supabase + 2x Neon)
- Scrape sources and verification system
- User profiles and onboarding
- Notification system

---

## [0.6.0] - 2026-06-30

### Added
- Supabase Auth integration (Google, GitHub, Email)
- User profiles table
- Protected routes and middleware

---

## [0.5.0] - 2026-05-01

### Added
- Core scraping infrastructure
- News feed with AI curation
- Opportunity verification badges
- SEO/AEO/GEO optimization
- Admin dashboard
- Email digest system

---

## [0.1.0] - 2026-03-15

### Added
- Initial project setup
- Next.js 14 frontend (berojgardegreewala)
- Express.js backend scraping service
- Basic opportunity listing
- Category filtering
### Changed
- **2026-08-20 -- Render deployment + deployed-schema fixes (Phase 6.5, part 1).** Backend deployed to Render as a web service (https://berojgardegreewala-backend.onrender.com, commit 45ed89f). Blueprint API does not support create (405); services created via POST /v1/services. starter plan rejected (402 -- workspace has no billing card): web service created on ree (documented deviation from render.yaml); Render cron job 
ews-sync (06:00 UTC) BLOCKED on billing -- owner action: add card at https://dashboard.render.com/billing, then create the cron from render.yaml (or re-run the blueprint). Vercel cron remains the production owner (unchanged). Production smoke tests exposed real schema mismatches between the committed queries and db1 (all 500s, root cause column-name drift): ackend/server/src/repositories/opportunities.ts embedded organizations(name, slug, website_url) -- db1 column is website; ackend/server/src/repositories/content.ts selected website_url (same fix) and source, source_url from 
ews_articles -- db1 has source_name, url (rows now mapped to the client shape source/source_url like the frontend); ackend/server/src/routes/content.ts GET /api/v1/news/:slug queried 
ews_archive (db2-only table) -- now 
ews_articles (parity with frontend /api/news/[slug]). Test updated: ackend/server/tests/parity.test.ts news-slug mock moved to 
ews_articles. Server 46/46 green; re-deployed (auto-deploy) and re-verified.
