# KNOWN ISSUES — 2026-08-20 (reconciled)

## 0. Backend deployment — DONE (2026-08-20, P1 → CLOSED)
Render web service **deployed and verified** on 2026-08-20 (Phase 6.5):
`https://berojgardegreewala-backend.onrender.com` (auto-deploy on push to main).
Evidence: `/health` 200, `/health/ready` 200, CORS Vercel/foreign, admin guard
403/200, user JWT 200/401, `/api/v1/cron/news-sync` inserted 58 rows then 0 on
re-run, production E2E 9/9. Two caveats tracked separately: created on `plan: free`
(committed render.yaml says `starter` — rejected 402, no billing card; see #14) and
the Render cron job does not exist yet (#14).

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
(The legacy A/B accounts were deleted 2026-08-18 by `frontend/scripts/reset-users.mjs`
— that script also deletes ALL auth users, so run it only when you intend to wipe
everything.) Cleanup SQL in `E2E_TEST_STATUS.md`; `frontend/scripts/reset-test-social.mjs`
does the same via the service-role key; re-run before any fresh verification.

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

## 14. Render cron job blocked — no billing card on the workspace (P2, owner action) — OPEN
Creating the `news-sync` cron job fails with **402 Payment Required**: cron jobs
require a paid plan and the Render workspace (`tea-d91n0jeq1p3s73c8k1vg`) has no
payment method. Same 402 blocked the web service's `starter` plan — deployed on
`free` instead (documented deviation from render.yaml). **Re-verified 2026-08-20
(Phase 6.6):** still blocked — `POST /v1/services` (type `cron_job`, runtime docker,
schedule `0 6 * * *`, plan `starter`, command `node --import tsx backend/worker/dist/index.js news`,
dockerfile `./backend/server/Dockerfile`, env SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)
returned 402; `GET /v1/owners/tea-d91n0jeq1p3s73c8k1vg` shows `billingCheckState`/
`paymentType`/`availablePlans` all empty; the API key sees only this one workspace.
The card has not landed on this workspace yet. **Owner action (unchanged):** add a
card at https://dashboard.render.com/billing **to the Amitkr26 workspace**, then
create the cron from `render.yaml` (or re-run the blueprint). Until then, daily news
ingestion keeps running on the Vercel cron (`/api/news/sync`, 06:00 UTC — unchanged
production owner); the backend `/api/v1/cron/news-sync` endpoint works as a manual
fallback (verified 2026-08-20) and the worker entrypoint was additionally verified
in production mode (see #12).

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