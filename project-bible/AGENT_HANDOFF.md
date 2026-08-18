# AGENT HANDOFF — 2026-08-18

For the next session (human or agent). Read `AGENT_STATE.md` first.

## How to deploy (important)
The Vercel project `electrobridge/berojgardegreewala` is connected to GitHub
(amitkr26/BerojgarDegreeWala, branch main). **Pushing to main deploys automatically.**
Do NOT run `npx vercel deploy --prod` — it races the git deployment: the git deploy is
BLOCKED and the CLI deploy is deleted ("Deployment not found"). Verify with
`npx vercel ls --prod` and wait for the newest entry to go Ready (~15-20 min build).

**Git-author protection (2026-08-18):** the project blocks deployments whose commit
author GitHub cannot associate with a GitHub user. Local `git config user.email` was
`amit@berojgardegreewala.vercel.app` (a Vercel-generated identity) → every git deploy
BLOCKED with "GitHub could not associate the committer with a GitHub user". Fixed by
setting `git config user.email amitkr26@users.noreply.github.com`. Keep it that way;
re-check with `git config user.email` if deploys start blocking again.

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
- `PUBLIC_PROFILE_FIELDS` (`frontend/src/lib/utils.ts`) MUST include any profile field
  the PublicProfile page should display — it is a server-side allowlist that strips
  everything else (counts silently never rendered before the fix).
- `connections` is trigger-maintained: `handle_connection_count()` SECURITY DEFINER,
  `on_connection_change` AFTER INSERT/UPDATE/DELETE (accepted rows only) keeps
  `user_profiles.connection_count` in sync (migration `20260818000003`). Feed counts
  are trigger-maintained the same way (`20260818000002`). Routes must NOT
  read-modify-write these counts manually.
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
- `frontend/tests/e2e/*`: 5 legacy specs + `social-workflow.spec.ts`.
  Default BASE_URL = production. Local: `$env:BASE_URL="http://localhost:3000"`
- **Full-suite contract: ALWAYS run the inter-account Cleanup SQL (see
  `E2E_TEST_STATUS.md`) before a full run.** Leftover state between A and B fails
  tests by design (observed 2026-08-18: a leftover accepted connection made the
  connect test see "Message" instead of "Connect").
- **Pooler read-after-write lag (real, reproduced):** after a fresh conversation
  creation, `GET /api/messages` can return `200 []` for ~5-10s while
  `GET /api/messages/[id]` already sees the row. `useConversations()` polls every 5s
  to heal this; the messages query polls at 10s. Do not "fix" by removing the polling
  or by weakening the messaging spec's 25s assertions.
  (dev server must be running; admin-backed routes 500 locally until the key is fixed).
- **2026-08-18 final: full suite 9/9 GREEN against production** (deploy `cdc80a7`).
  Suite contract: run on a CLEAN DB (leftover A↔B state makes connect/feed tests fail
  by design). Cleanup SQL + run history: `project-bible/E2E_TEST_STATUS.md`.
- Feed like/comment counts are trigger-maintained (SECURITY DEFINER, live):
  `on_post_like`/`on_post_comment` → `update_post_likes_count`/`update_post_comments_count`
  write `like_count`/`comment_count`. Routes must NOT manually increment. Migration:
  `frontend/supabase/migrations/20260818000002_fix_post_count_triggers.sql`.
- 104 jest tests pass; build passes.

## Environment quirks
- PowerShell 5.1: no `&&`/`||`/`head`; use `cmd1; if ($?) { cmd2 }`.
- Node 26: inline `node -e` with top-level await must wrap in `(async()=>{})()`.
- `.vercel` dirs are gitignored and disposable.
- Commit messages can skip the deploy with `[vercel skip]` (used for spec-only fixes).