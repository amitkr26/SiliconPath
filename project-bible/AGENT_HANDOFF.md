# Multi-Agent Handoff Document (Antigravity ⇋ OpenCode)

```text
HANDOFF_VERSION: 1.4.0
TIMESTAMP: 2026-08-20
CURRENT_AGENT: OpenCode
NEXT_AGENT: OpenCode / Antigravity (shared continuation contract)
TASK_STATUS: Phase 6.5 PARTIAL — backend DEPLOYED to Render (web service live at https://berojgardegreewala-backend.onrender.com, auto-deploy on push; `free` plan — `starter` rejected 402, workspace lacks a billing card). Production verification: /health + /health/ready 200; smoke suite (opportunities/news/organizations/search/404-envelope/CORS/admin-guard/JWT-auth) green after fixing db1 schema drift (commit 37ce7cc: organizations.website, news_articles source_name/url, news/[slug] → news_articles); cron news-sync production run: 12 feeds attempted, 8 OK, 58 rows inserted, re-runs insert 0 (news_articles stable at 280); Vercel cron unchanged (production owner); production E2E 9/9 (residue cleaned). BLOCKED: Render cron job (billing, KNOWN_ISSUES #14 — owner adds card then creates cron from render.yaml) and AI smoke (502 AI_UNAVAILABLE — Groq retired llama-3.1-8b-instant; KNOWN_ISSUES #15, one-line shared-gateway fix awaiting owner approval). Remote 500955d (parallel phase 6a) integrated 2026-08-19: OpenAPI re-scoped to backend /api/v1, redundant worker-local files removed.
```

---

## 1. Completed
- **Direct Messaging Root Cause Resolved**:
  - In `frontend/src/app/api/messages/route.ts`: Extracted `const content = body.content || body.body || body.message;` from validated body, eliminating the unhandled `ReferenceError: content is not defined` that caused 500 errors on message send.
  - In `frontend/src/lib/validation.ts`: Updated `messageSchema` to accept `participantId`, `recipientId`, `recipient_id`, or `participant_id`.
  - In `frontend/src/lib/supabase/server.ts`: Configured `createClient` to bind Bearer tokens to `client.auth.getUser()`, allowing API token calls (like test runners and mobile clients) to authenticate cleanly.
- **Connections & Network Suggestions**:
  - In `frontend/src/app/api/network/connections/route.ts`: Response now includes full profile cards (`id`, `display_name`, `headline`, `current_company`, `avatar_url`) AND relation metadata (`user_id`, `requester_id`, `addressee_id`, `status`).
- **Profile Navigation (LinkedIn-Style)**:
  - In `frontend/src/app/profile/[username]/page.tsx`: Route now seamlessly resolves both usernames (e.g. `/profile/amittest1`) and UUIDs (e.g. `/profile/56b47f8e-...`), enabling profile clicks from suggestions, messages, and feed.
- **End-to-End Social Test Execution**:
  - Ran `frontend/scripts/test-social-e2e.mjs`: **RESULTS: 17 passed, 0 failed**.
    - Step 1: User 1 Login (Passed)
    - Step 2: User 2 Login (Passed)
    - Step 3: Network Suggestions (Passed - real candidate found)
    - Step 4: Connection Request (Passed - 201 Created)
    - Step 5: View Incoming Requests (Passed - 200 OK)
    - Step 6: Accept Connection (Passed - 200 OK)
    - Step 7: View Connections (Passed - 200 OK)
    - Step 8: Send Message (Passed - 201 Created)
    - Step 9: Send Reply Message (Passed - 201 Created)
    - Step 10: List Conversations (Passed - 200 OK)
    - Step 11: Conversation Message History (Passed - 200 OK, count >= 2)
    - Step 12: Profile Page & Suggestions (Passed - 200 OK)
- **Static & Build Verification**:
  - `npm test`: 14 passed, 14 total (104 tests passed).
  - `npm run build`: Exit code 0 (237 routes generated, 0 TypeScript errors).

---

## 2. Next Action for OpenCode / Antigravity
- Stage, commit, and push all modified files to GitHub `origin/main` to trigger the production Vercel deployment.
- Verify live site on `https://berojgardegreewala.vercel.app`.

---

## 3. OpenCode continuation notes (2026-08-18 night — keep alongside §1/§2)

### Deploy mechanics
- Deploy = push to `main` (Vercel git integration, ~15-16 min build). **Never run
  `npx vercel deploy --prod`** — it races the git deploy (git deploy BLOCKED, CLI
  deploy deleted). Git author must stay `amitkr26@users.noreply.github.com`
  (Vercel's generated identity gets BLOCKED).
- **`[vercel skip]` in commit messages does NOT skip builds** (verified: 86acb2f,
  183dd58, dce254a all deployed READY despite the token — no Ignored Build Step
  configured). Docs-only commits trigger wasteful no-op rebuilds; harmless, but to
  actually skip, owner must configure an ignored build step in project settings.

### Production DB facts (Project 1 `aqauempuwmbizqoaolop`, verified live)
- `connections`: `requester_id`/`addressee_id`/`status` (pending|accepted|rejected|blocked).
- `conversations`: `participant_a`/`participant_b`. `feed_posts`: `author_id`, counts
  in `like_count`/`comment_count` (no `likes_count`).
- **Counts are trigger-maintained** (migrations `20260818000002` feed counts,
  `20260818000003` connection_count; both SECURITY DEFINER). Routes must NOT
  read-modify-write them. `PUBLIC_PROFILE_FIELDS` (`frontend/src/lib/utils.ts`) is a
  server-side allowlist — any profile field the page should show must be in it.
- `siliconpath-credentials.txt` Project 1 `SUPABASE_SECRET_KEY` is STALE (401; owner
  action to rotate — production unaffected). SQL helper:
  `C:\Users\STUDENT\AppData\Local\Temp\opencode\db1-sql.mjs` (Management API;
  one statement per call).

### E2E pitfalls (production suite, `frontend/tests/e2e/`)
- **Clean inter-account rows before EVERY full run** (see `E2E_TEST_STATUS.md` for
  SQL; test accounts amittest1/amittest2). `test-social-e2e.mjs` and the connect
  specs leave residue that fails later specs by design.
- **Pooler read-after-write lag is real**: after a fresh conversation creation the
  list GET can return `200 []` for ~5-10s while the per-conversation GET sees the
  row. `useConversations()` polls every 5s to heal it — do not remove the polling or
  weaken the messaging spec's 25s assertions.
- Comment-count span textContent is `" 1"` (JSX whitespace) — assert with
  `/^\s*1\s*$/`. Connected state on a profile = "Message" link (no "Connected" text).

---

## 4. OpenCode continuation notes (2026-08-19 — backend replication + docs reconciliation)

### Backend replication (active workstream)
- **Rule: replicate, never move.** The frontend is the baseline; `backend/` work is
  COPY/REIMPLEMENT. No production traffic switch without explicit instruction.
- `backend/api` = framework-less shared lib (response/error/auth/validation/
  rate-limit/cache/openapi/content), consumed as raw TS by frontend AND server.
  `backend/ai-gateway` = 9-provider fallback lib (order groq→gemini→openrouter→nvidia→
  agentrouter→omnirouter→cloudflare→bedrock→huggingface, 10-min cooldown). Both jest;
  ai-gateway now has 15 tests (KNOWN_ISSUES #11 CLOSED). Note: omnirouter is
  env-guard-EXEMPT (localhost:20128 default) — always attempted; documented, keep.
- `backend/server` = Express 4 on :8080, production-ready, NOT deployed. Full surface:
  /health + /health/ready, opportunities(+/:idOrSlug), profiles(me/:username),
  organizations(+/:slug), news(+/:slug), applications CRUD, saved-opportunities CRUD,
  ai/{chat,match,search,summarize,insights} (usage-logged, 502 AI_UNAVAILABLE on
  exhaustion), admin/stats (rate-limited 20/min, timing-safe password), auth signup +
  check-username, search + /people, feed + posts/like/comment/repost, network
  (connections/status/connect/suggestions/follow/followers/following), notifications,
  messages (+thread/with/:userId), cron/news-sync (timing-safe CRON_SECRET). Envelope
  `{success,data,pagination}` / `{success:false,error:{code,message}}`. 46 node:test
  (30 parity + 16 hardening); `dist/` generated+gitignored; Dockerfile node:22-alpine
  (supabase-js ≥2.110 needs native WebSocket — node:20 crashed at boot) non-root USER
  node + HEALTHCHECK, EXPOSE 8080, `.dockerignore` excludes host node_modules; graceful
  SIGTERM/SIGINT drain + 10s force-exit. `.env.example` categorized
  REQUIRED/OPTIONAL/DEPLOYMENT.
- `backend/worker` = Phase 6 scheduled process workspace (`@berojgardegreewala/worker`):
  `node --import tsx dist/index.js news` — CLI subcommand, exit 0 (≥1 feed ok) / 1 (all
  failed or DB write failed / missing env, fail-closed) / 2 (usage). Shares ALL
  ingestion via `backend/api/src/content/news-sync.ts` (12 feeds, concurrency 4, retry
  1+2 network/5xx/429 backoff, run-level URL dedup, `news_articles` upsert onConflict
  `url` ignoreDuplicates, is_active true, null-url never written — the exact frontend
  `/api/news/sync` contract). Persists `scrape_runs` + `scrape_sources` health
  (name-keyed read-then-write; no schema changes). 17 node:test. No fabricated-data
  path. Deployed as a Render cron job running the same Docker image (`render.yaml`).
- **Remaining parity gaps**: scraper fleet port beyond news RSS (Phase 7 candidate:
  opportunity scrapers via the worker + scrape_sources registry, DEFERRED — port news
  only, then STOP), PATCH `/profiles/me`, `supabase2Admin` DB2 client unused, admin
  breadth beyond /stats, academy/misc.
- Server tests use node:test + a Proxy fake (`backend/server/tests/fake.ts`) — keep
  that pattern for new route tests. AI route tests stub global.fetch + GROQ_API_KEY
  with a 127.0.0.1 passthrough (never stub the test server's own requests). Worker
  tests use a Chain fake (`backend/worker/tests/news-sync.test.ts`) and MUST pass
  `sources: [SRC]` (default NEWS_SOURCES) for persistence assertions.

### Documentation source of truth (post-reconciliation)
- `project-bible/ARCHITECTURE.md` (CURRENT/TRANSITION/TARGET), `MASTER_INDEX.md`,
  `IMPLEMENTATION_STATUS.md` (full feature matrix), `KNOWN_ISSUES.md` (13 issues),
  `backend/docs/FRONTEND-BACKEND-MAP.md` + `API-PARITY.md` — reconciled 2026-08-19.
- Section READMEs (04–23) were rewritten 2026-08-19 by subagents with verified counts:
  138 API route files, 3 scheduled crons, 9 AI providers, 18 scraper modules, 4 DBs
  (2 Supabase + 2 Neon), 7 academy tracks, 104 frontend jest / 97 api jest / 15
  ai-gateway jest / 46 server node:test.
- Historical docs (master-specification, CONTENT_UPGRADE_PLAN, deploy-stack.txt,
  19-prompts files, ADR-001) carry DEPRECATED/HISTORICAL status headers — do not edit
  their bodies to "modernize" them.

### Known issues (2026-08-19)
- #0 backend deployment DECISION MADE (Render Docker web + cron job, render.yaml, 2026-08-19) — deployment itself is an owner action (create service, set secrets, flip domain). NOT deployed.
- #1 stale local Project 1 service-role key (owner action, 2 min fix; production unaffected).
- #9 ci.yml rewritten (workspace names, backend job, node 22) — FIXED in code; close after first green CI run on the next push.
- #10 `backend/api` `npm run openapi` — FIXED 2026-08-19 (generate-openapi.ts; spec re-scoped to backend `/api/v1` surface in 500955d).
- #11 ai-gateway zero tests — CLOSED 2026-08-19 (15 tests; also fixed logFn-throw bug via safeLog).
- #12 no verified recent production scraper run — verify via `/api/admin/scrape-health` or Vercel cron logs before claiming scrapers work (owner can also watch the Render cron's first run once deployed).
- #13 backend news-sync wrote to `news_archive` onConflict `slug` — FIXED 2026-08-19 (shared `content/news-sync.ts` → `news_articles` onConflict `url`).