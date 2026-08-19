# Multi-Agent Handoff Document (Antigravity ⇋ OpenCode)

```text
HANDOFF_VERSION: 1.2.0
TIMESTAMP: 2026-08-19
CURRENT_AGENT: OpenCode
NEXT_AGENT: OpenCode / Antigravity (shared continuation contract)
TASK_STATUS: Social core verified 9/9; network 4-tab feature shipped (683404c, a79773a); backend replication docs done — implementation in progress; project-bible reconciled 2026-08-19
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
  agentrouter→omnirouter→cloudflare→bedrock→huggingface, 10-min cooldown). Both have
  jest configs; ai-gateway has NO tests (KNOWN_ISSUES #11).
- `backend/server` = Express 4 on :8080. Routes today: /health, /api/v1/opportunities
  (+/:idOrSlug), /profiles/me, /profiles/:username, /organizations(+/:slug), /news
  (list only), /applications CRUD, /saved-opportunities CRUD, /ai/insights (no usage
  log), /admin/stats. Envelope `{success,data,pagination}` /
  `{success:false,error:{code,message}}`. 16 node:test tests; `dist/` generated+
  gitignored; Dockerfile node:20-alpine EXPOSE 8080.
- **Open parity gaps** (per `backend/docs/API-PARITY.md`): social layer (feed/network/
  messages/notifications — `supabase2Admin` DB2 client wired but unused), AI endpoint
  breadth + `setLogger` usage logging, cron/scrapers port (news RSS sync first),
  news `:slug` + search + `auth/signup`, admin breadth, academy/misc, server rate
  limiting (api package limiter exists).
- Server tests use node:test + a Proxy fake (`backend/server/tests/fake.ts`) — keep
  that pattern for new route tests.

### Documentation source of truth (post-reconciliation)
- `project-bible/ARCHITECTURE.md` (CURRENT/TRANSITION/TARGET), `MASTER_INDEX.md`,
  `IMPLEMENTATION_STATUS.md` (full feature matrix), `KNOWN_ISSUES.md` (12 issues),
  `backend/docs/FRONTEND-BACKEND-MAP.md` + `API-PARITY.md` — all reconciled 2026-08-19.
- Section READMEs (04–23) were rewritten 2026-08-19 by subagents with verified counts:
  138 API route files, 3 scheduled crons, 9 AI providers, 18 scraper modules, 4 DBs
  (2 Supabase + 2 Neon), 7 academy tracks, 104 jest / 97 api-jest / 16 server tests.
- Historical docs (master-specification, CONTENT_UPGRADE_PLAN, deploy-stack.txt,
  19-prompts files, ADR-001) carry DEPRECATED/HISTORICAL status headers — do not edit
  their bodies to "modernize" them.

### New known issues (2026-08-19)
- #9 ci.yml references nonexistent paths (`packages/ai-gateway`, `berojgardegreewala\`) — broken, unused.
- #10 `backend/api` `npm run openapi` broken (missing `scripts/generate-openapi.ts`).
- #11 ai-gateway zero tests.
- #12 no verified recent production scraper run — verify via `/api/admin/scrape-health` or Vercel cron logs before claiming scrapers work.