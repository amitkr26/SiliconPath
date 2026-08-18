# AGENT HANDOFF — 2026-08-18

For the next session (human or agent). Read `AGENT_STATE.md` first.

## How to deploy (important)
The Vercel project `electrobridge/berojgardegreewala` is connected to GitHub
(amitkr26/BerojgarDegreeWala, branch main). **Pushing to main deploys automatically.**
Do NOT run `npx vercel deploy --prod` — it races the git deployment: the git deploy is
BLOCKED and the CLI deploy is deleted ("Deployment not found"). Verify with
`npx vercel ls --prod` and wait for the newest entry to go Ready (~15-20 min build).

## Keys / credentials state
- `siliconpath-credentials.txt` is the single source of truth (gitignored).
- Project 1 (`aqauempuwmbizqoaolop`) is the PRODUCTION DB (core + social + logs).
  Project 2 (`jbqjipwanfsxyqkfrrpx`) is the legacy mirror — `.env.local` pointed there
  before 2026-08-18, which made local dev + the supabase MCP useless for social work.
- **Project 1 service-role key in the credentials file is STALE (401 "Unregistered API
  key").** Publishable/anon key is current. Owner (edutubeeducation@gmail.com) must
  rotate/grab a fresh secret key in the Supabase dashboard and update the file +
  `frontend/.env.local` (`SUPABASE_SERVICE_ROLE_KEY=`). Until then: admin-backed routes
  (feed GET/POST, follow POST/DELETE, connect POST, profile SSR page) fail ONLY locally;
  production is unaffected.
- Management API access token (Project 1) works for `/database/query` (see
  `C:\Users\STUDENT\AppData\Local\Temp\opencode\db1-sql.mjs`) but NOT for
  `/api-keys` endpoints (scope). Vercel env values are unrecoverable (encrypted
  `[SENSITIVE]` on `env pull`).

## Live schema facts (verified 2026-08-18)
- `user_follows`: FKs → auth.users, UNIQUE(follower_id, following_id), CHECK(follower <> following).
- `connections`: FKs → user_profiles, UNIQUE(requester_id, addressee_id),
  status CHECK `pending|accepted|rejected|blocked` (NOT `declined` — legacy
  `connection_requests` uses `declined|withdrawn`).
- `feed_posts`: `author_id` (no `user_id`, no `visibility` column); counts in
  `like_count`/`comment_count`.
- `user_profiles`: has `username`, `account_type`, `is_profile_public`, and now
  `follower_count`/`following_count`/`connection_count` (added today).
- RLS v2 is LIVE and correct on all social tables — do NOT apply
  `20260817000001_fix_social_rls_v2.sql` (would duplicate policies; references a
  non-existent `feed_posts.visibility`).
- `follow_error_count` exists nowhere (repo, history, live schema). The user's error
  was a misread of `column "follower_count" does not exist`.

## Test accounts (Project 1)
- A: `xasefe9251@bejum.com` / `12345678` (Ajeet) → 14738cfb-9629-4d9b-a116-719b5a825afe
- B: `weqolyji@forexzig.com` / `87654321` (Vikram) → 63eaf830-f7ba-42c0-8099-d3d3fd67b586
- C: `amitkumar` → ea6a55be-0633-44b0-8f3c-0db5a62f56a4
E2E helpers log in as A/B. Clean inter-account state before reruns:
DELETE user_follows / connections / notifications where user_id IN (A,B) etc.
(see session report for exact SQL).

## E2E
- `frontend/tests/e2e/*`: 5 legacy specs + new `social-workflow.spec.ts`.
  Default BASE_URL = production. Local: `$env:BASE_URL="http://localhost:3000"`
  (dev server must be running; admin-backed routes 500 locally until the key is fixed).
- 104 jest tests pass; build passes.

## Environment quirks
- PowerShell 5.1: no `&&`/`||`/`head`; use `cmd1; if ($?) { cmd2 }`.
- Node 26: inline `node -e` with top-level await must wrap in `(async()=>{})()`.
- `.vercel` dirs are gitignored and disposable.