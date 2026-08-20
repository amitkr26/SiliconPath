# KNOWN ISSUES — 2026-08-20 (reconciled)

## 0. Backend deployment — DONE (2026-08-20, P1 → CLOSED)
Render web service **deployed and verified** on 2026-08-20 (Phase 6.5):
`https://berojgardegreewala-backend.onrender.com` (auto-deploy on push to main).
Evidence: `/health` 200, `/health/ready` 200, CORS Vercel/foreign, admin guard
403/200, user JWT 200/401, `/api/v1/cron/news-sync` inserted 58 rows then 0 on
re-run, production E2E 9/9. Caveat: created on `plan: free` — `render.yaml` says
`free` since Phase 7; the earlier `starter` attempt was rejected 402 (no billing
card) and is moot (#14 CLOSED — no paid Render infrastructure is required).

## 1. Stale Project 1 service-role key in credentials (P1, local-dev only)
`siliconpath-credentials.txt` → `SUPABASE_SECRET_KEY` (Project 1 section) 401s
("Unregistered API key" — rotated after the file's last update; verified by direct
PostgREST call). **Production is unaffected** (Vercel holds valid keys). Impact:
local `npm run dev` admin-backed routes fail: `/api/feed` GET/POST, `/api/network/follow`
POST/DELETE, `/api/network/connect` POST, `/profile/[username]` SSR (renders
"Profile Not Found" — use `/people/[username]` or the API locally).

Fix (owner action, 2 min): Supabase dashboard → Project 1 (`aqauempuwmbizqoaolop`) →
Settings → API → copy `secret key` (sb_secret_...) → update
`siliconpath-credentials.txt` (Project 1 section) + `frontend/.env.local`
(`SUPABASE_SERVICE_ROLE_KEY=`). Alternatively rotate in dashboard and paste the new one.
Note 2026-08-20: for the Render deployment the current **legacy `service_role`
JWT** (fetched via the Supabase Management API `GET /v1/projects/{ref}/api-keys`
list) was used — verified valid against PostgREST; the file's `sb_secret_...`
value is still the stale one.

## 2. Vercel env values unrecoverable from CLI (info)
`vercel env pull` returns `[SENSITIVE]` placeholders (values stored encrypted).
The pre-existing `.vercel/.env.production.local` at root is likewise redacted. Don't
attempt key recovery via Vercel CLI.

## 3. `vercel deploy --prod` CLI races git integration (info, 2026-08-18)
Project is git-connected; a CLI prod deploy while a git deploy is pending leaves the
git deploy BLOCKED and the CLI deploy deleted ("Deployment not found"). Deploy by
pushing to main only. (A stale root `.vercel/output` from a failed 08-14
`vercel build` experiment was deleted this session.)

## 4. `frontend/.vercel/project.json` projectId is stale (info)
`prj_OEMMidzfk7e90H6EqIQUHII5C6RG` 404s on the API. Harmless (CLI resolves the project
by name); re-run `vercel link` when convenient.

## 5. `/api/feed` fetches `connections` but never filters by it (code smell)
Comment says "posts from connections + own posts" but the query returns ALL posts;
the `conns` result is unused. Intended behavior per comment is network-filtered feed;
as-shipped it's a global feed. Leave as-is until product decides (changing it is a
product decision, not a bug fix).

## 6. Test data residue from E2E runs (housekeeping)
Follows/connections/messages/feed posts between the canonical test accounts
`amittest1@berojgardegreewala.com` (`56b47f8e-...`) and
`amittest2@berojgardegreewala.com` (`9e55b282-...`) accumulate with each E2E run.
**2026-08-20 (Phase 7) root-cause confirmed:** the social-workflow spec leaves an
**accepted** connection behind (A connects → B accepts → both connected is the
test's terminal state) and no spec/suite hook removes it; a leftover accepted
connection then makes the next run's `/network` suggestion cards and B's profile
show no "Connect" button (two E2E specs fail with `element not found`). Fixed per
run by deleting the rows via the Supabase Management API (db1-sql helper) before
and after the suite. `frontend/scripts/reset-test-social.mjs` exists for this but
is **currently unusable**: it builds its admin client from
`frontend/.env.local`, whose `SUPABASE_SERVICE_ROLE_KEY` is the stale key from
KNOWN_ISSUES #1 → the lookup silently returns zero users. Fix #1 (rotate the
local key) un-breaks the script. Cleanup SQL: delete from `connections`
(requester/addressee IN the two ids), `messages` (sender_id), `conversations`
(participant_a/b), `feed_posts` (author_id).

## 7. Feed page has no comment UI (product gap, not a regression)
Likes/comments counts render; comments are only POSTable via API. E2E covers the API
path. Not in scope for this fix.

## 8. Employer "ATS" claim in docs over-stated (documentation, FIXED 2026-08-19)
`E2E_TEST_STATUS.md` row #10 and the 2026-08-18 full-platform-audit report claimed an
"applicant pipeline visible" / "100% production ready" employer portal. Reality: job
posting, dashboard, claim (notification-only), recommendations are implemented; there
is **no ATS applicant review UI, no recruiter messaging, no real company-claims table**.
Reconciled in E2E_TEST_STATUS.md / 11-employers / IMPLEMENTATION_STATUS on 2026-08-19.
Audit report kept as historical evidence. Remaining work: build the ATS review surface
(backlog epic-05).

## 9. `.github/workflows/ci.yml` referenced non-existent paths (P2, FIXED 2026-08-19)
CI job paths `packages/ai-gateway` and working-directory `berojgardegreewala\` did
not exist (workspaces live at `backend/ai-gateway` and root). **FIXED 2026-08-19:**
rewritten — ai-gateway job points at `@berojgardegreewala/ai-gateway`, a new
`backend` job runs typecheck/test/build for api+server+worker, frontend job drops
the bogus working-directory and uses `--workspace frontend`. Runs triggered by the
2026-08-20 pushes (45ed89f, 37ce7cc); **close status pending** — CI results cannot
be read from this environment (private repo, no gh CLI).

## 10. `backend/api` `openapi` npm script was broken (P2, FIXED 2026-08-19)
`package.json` referenced `scripts/generate-openapi.ts` which did not exist.
**FIXED 2026-08-19:** `backend/api/scripts/generate-openapi.ts` created (runs
`generateOpenAPISpec()` from `src/openapi`, writes `openapi.json`); the spec was
re-scoped to the backend `/api/v1` surface (servers: Render backend, Vercel
frontend, local) and `openapi.json` regenerated to match; `openapi.test.ts`
(base-spec assertions) stays green.

## 11. AI gateway has zero tests (P2, FIXED 2026-08-19)
`backend/ai-gateway` jest config exists but no test files (`--passWithNoTests`).
Provider dispatch/fallback/cooldown is the riskiest untested logic in the repo.
**FIXED 2026-08-19:** 15 jest tests in `backend/ai-gateway/__tests__/gateway.test.ts`
(success path, fallback chain incl. 500/429/timeout/malformed JSON/nvidia
empty-content guard, missing-credential skip, all-fail controlled error, cooldown
skip, preferred-model reorder, systemPrompt, generateAdvanced, telemetry success
+failure with no secret leak, logger-throw resilience). Also fixed a real bug the
suite caught: a throwing usage-logger was treated as a provider failure — telemetry
now runs through `safeLog` (best-effort, never breaks the response).

## 12. No verified recent scraper production run (P3, evidence gap) — CLOSED 2026-08-20
Scheduled Vercel crons exist (3: scrape-opportunities 00:00, check-links 08:00,
news/sync 06:00) but the 2026-08-19 audit found no evidence of a recent successful
run (no log/health confirmation in docs). Verify from Vercel cron logs or
`/api/admin/scrape-health` and record the result.
Partial evidence 2026-08-20: the backend production sync (`GET /api/v1/cron/news-sync`
on the deployed Render service — same shared module as the worker) ingested 58 new
`news_articles` rows and re-runs insert 0 (idempotent). **CLOSED 2026-08-20 (Phase
6.6):** the worker entrypoint itself (`backend/worker/dist/index.js news` — the exact
command render.yaml configures for the cron) executed twice in production mode against
the live DB: Run A inserted 5 rows (news_articles 280 → 285, `created_at` 05:55 UTC,
`is_active=true`), Run B exited **0** with fetched=92 / inserted=0 / duplicates=0
(stable count at 285 across 3+ re-runs — URL-uniqueness idempotency proven). Run health
persisted to `scrape_runs` + `scrape_sources` in db1. Caveat: executed locally in
production mode, not via the Render cron — the cron itself is still blocked on billing
(#14), so the run evidence is "worker executed + valid production data", not "Render
cron executed".

## 13. Backend news-sync wrote to the wrong table (P1, FIXED 2026-08-19)
`backend/server` cron route upserted into `news_archive` onConflict `slug` — that
is db2's archive table and `slug` has no unique constraint there, so the backend
route was broken against the live schema. **FIXED 2026-08-19:** news ingestion
moved to the shared module `backend/api/src/content/news-sync.ts` with the exact
production write contract of the frontend `/api/news/sync`: `news_articles`,
onConflict `url` (unique in db1, verified), `ignoreDuplicates`, `is_active: true`,
null-url rows never written. Covered by the worker suite
(`backend/worker/tests/news-sync.test.ts`, 17 tests).

## 14. Render cron job — NOT REQUIRED / OUT OF SCOPE (P2 → CLOSED 2026-08-20, Phase 7)
Phase 7 decision: the project **does not require Render Cron**. Render is the
standalone backend **replica**; Vercel remains production (Next.js APIs + Vercel
cron own all production traffic). `render.yaml` no longer defines a `crons` section
and its web service is `plan: free` — no billing card is needed on the workspace
(`tea-d91n0jeq1p3s73c8k1vg`; the 402 from Phase 6.5/6.6 is moot — nothing on Render
is paid). The replica's guarded `GET /api/v1/cron/news-sync` stays as a manual/parity
trigger; the worker entrypoint (`backend/worker/dist/index.js news`) stays in the
image, independently runnable for testing/future use (production-mode evidence: #12).
**Status: CLOSED as NOT REQUIRED / OUT OF SCOPE — not a production blocker.**

## 15. AI 502 on Render backend — Groq retired `llama-3.1-8b-instant` (P2, config drift) — FIXED 2026-08-20
Production AI smoke test on the deployed backend returns 502 `AI_UNAVAILABLE`
(clean envelope, no leak). Root cause isolated: the GROQ key provisioned is
**valid** (GET /models 200), but `backend/ai-gateway/src/gateway/index.ts`
`PROVIDER_CONFIG.groq.model = "llama-3.1-8b-instant"` no longer exists on Groq
(current: `qwen/qwen3.6-27b`, `openai/gpt-oss-120b`, `groq/compound`, ...) → the
call 404s and the fallback chain exhausts. The frontend imports the same shared
gateway (`frontend/src/lib/ai/providers.ts`), so frontend AI is affected too once
it re-deploys. **FIXED 2026-08-20 (Phase 6.6, commit b32f3d7):** groq model id
updated to `qwen/qwen3.6-27b` (verified present in the live Groq /v1/models list;
same OpenAI-style chat-completions contract — model id only, no gateway/fallback
changes; gateway tests updated). Verified live: backend `POST /api/v1/ai/summarize`
→ **200** `{provider: "groq", model: "qwen/qwen3.6-27b"}`; telemetry row in db1
`ai_usage_log` (`api-ai-summarize`, success=true, prompt_len 304 / resp_len 2698,
no credentials in the row); frontend production `/api/ai/summarize` → **200** with a
real summary (Vercel build includes the fixed gateway). Fallback chain unchanged
(unit-covered: first-provider failure falls through; all-fail → controlled
`AI_UNAVAILABLE`).

## 16. Production opportunity scraper silently inserts ZERO rows — `verification_status: "unverified"` violates the live CHECK constraint (P1, production, discovered Phase 8)
The live `opportunities` table has `opportunities_verification_status_check`
(`pending/verified/rejected/expired/link_unavailable`) — **`unverified` is NOT in
the list**. The production pipeline `frontend/src/lib/scrapers/run-opportunity-scrape.ts`
inserts `verification_status: "unverified"` for every scraped row, so **every insert
fails the CHECK** and is silently counted as skipped. Evidence (db1, 2026-08-20):
`max(created_at)` across the whole `opportunities` table = **2026-08-02** (18 days
of zero inserts); verification_status distribution = 3240 verified / 29
link_unavailable / 3 expired / **0 pending / 0 unverified**; a transaction-probe
insert with `unverified` returns `23514 opportunities_verification_status_check`
violation (rolled back, zero residue); the same probe with `pending` is **accepted**
by the live CHECK. The Vercel cron `/api/cron/scrape-opportunities` (00:00) and the
admin `/api/scrape` trigger are both affected. **Owner action required:** change
`run-opportunity-scrape.ts` to write `pending` (the CONTENT_UPGRADE rename; the
verification/link-check pipeline should then move `pending → verified`). **The Phase 8
replica already writes `pending`** (the only CHECK-valid status) and is currently the
only working opportunity-ingestion path.

## 17. ISRO careers page redesign appends " Read More" to every title anchor — production ISRO scraper outputs 0 rows (P1, production, discovered Phase 8)
Live probe of `https://www.isro.gov.in/Careers.html` (2026-08-20): every listing
anchor's text ends with " Read More" (e.g. "…and Stenographers Read More"). The
production scraper `frontend/src/lib/scrapers/isro-scraper.ts` sets `title =
linkText` verbatim and then applies `GARBAGE_TITLE_PATTERNS` (which contains
`read more`) — so **every row is filtered** and the ISRO source contributes 0
opportunities. Consistent with #16's evidence (no new rows since Aug 2). **Owner
action required:** strip the trailing " Read More" (or pick the title node, not the
anchor text) in the frontend scraper. The Phase 8 replica mirrors this behavior
exactly (parity — the title/normalization contract must not diverge unilaterally),
so it also yields 0 insertable rows on the live page until the frontend fix lands;
its insert/dedup/verification lifecycle is proven by deterministic tests and the
live smoke (run 1 and run 2 both exit 0, 18 fetched / 0 inserted / 18 skipped, 0
duplicates).

## 18. GARBAGE_TITLE_PATTERNS `search` token matches inside "Research" — every Research listing is dropped (P2, production, discovered Phase 8)
`GARBAGE_TITLE_PATTERNS` (shared `frontend/src/lib/scrapers/utils.ts`) contains
the unanchored token `search`; the substring `search` appears inside **"Research"**,
so any title containing "Research" (e.g. "Temporary Research Personnel",
"Research Scientist/Research Assistant", "Project Associate - I" no, but Research
roles yes) is garbage-filtered and skipped by the production pipeline. The Phase 8
replica mirrors this exactly (parity, covered by test); fixing the regex (e.g.
`\bsearch\b` or removing the token) is an owner/product decision on the frontend —
the replica follows whatever the frontend ships.