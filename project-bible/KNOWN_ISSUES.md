# KNOWN ISSUES — 2026-08-18

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