# KNOWN ISSUES — 2026-08-19 (reconciled)

## 0. Backend deployment decision required (P1, owner action)
`backend/server` is production-ready but NOT deployed (Phase 5 mandate: no deploy).
Pick a target (recommended: Docker → Render, per `project-bible/14-devops/deploy-stack.txt`),
set the env vars, and ship it. Backend is not a second system of record — it reads
the same Supabase DBs the frontend uses.

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

## 9. `.github/workflows/ci.yml` references non-existent paths (P2, dev infra)
CI job paths `packages/ai-gateway` and working-directory `berojgardegreewala\` do not
exist (workspaces live at `backend/ai-gateway` and root). The workflow is broken and
effectively unused; `security-scan.yml` (gitleaks) works. Fix: rewrite ci.yml job
paths to the real workspace layout.

## 10. `backend/api` `openapi` npm script is broken (P2)
`package.json` references `scripts/generate-openapi.ts` — `backend/api/scripts/`
does not exist, so `npm run openapi` fails. `backend/api/openapi.json` is a static
copy. Fix: restore the script or repoint the script to the real generator
(`src/openapi/index.ts` + a small runner).

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

## 12. No verified recent scraper production run (P3, evidence gap)
Scheduled Vercel crons exist (3: scrape-opportunities 00:00, check-links 08:00,
news/sync 06:00) but the 2026-08-19 audit found no evidence of a recent successful
run (no log/health confirmation in docs). Verify from Vercel cron logs or
`/api/admin/scrape-health` and record the result.