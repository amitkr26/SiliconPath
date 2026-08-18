# Session Report — 2026-08-18: Production Social Networking Bug Fix

## Summary
Four production failures on https://berojgardegreewala.vercel.app (follow state GET,
follow POST 500, connect 409, GoTrueClient console warning) diagnosed to root cause,
fixed, committed (05a5494), and pushed. Deploy runs via Vercel git integration.
Live verification of the full social workflow (follow/connect/message/feed) is the
remaining step, pending deploy completion.

## Root causes & fixes
1. **Follow POST 500** — `handle_follow()` trigger (AFTER INSERT/DELETE on
   `user_follows`) ran `UPDATE user_profiles SET follower_count = follower_count + 1`
   but live `user_profiles` had no count columns → every follow insert died with
   `ERROR 42703: column "follower_count" does not exist`. The user-facing report
   "follow_error_count" was a misread; that identifier exists nowhere (repo, git
   history, live columns/functions/policies/views/triggers on both projects).
   **Fix:** `frontend/supabase/migrations/20260818000001_user_profiles_social_counts.sql`
   adds `follower_count`/`following_count`/`connection_count` INT NOT NULL DEFAULT 0
   + backfill — **applied live via Management API** (`/database/query`); follow insert
   and unfollow verified; counts increment/decrement.
2. **Follow GET 405** — route had only POST/DELETE. Added GET → `{ following }`.
   PublicProfile now reads it; loadRelationship failures isolated per-API-call.
3. **Connect 409** — genuine duplicate semantics (UNIQUE(requester_id, addressee_id)).
   POST returns 409 with existing row; receiver existence pre-check (404); PATCH
   role-enforced (addressee accept/reject; requester withdraw → delete; status
   `declined`→`rejected` for connections, legacy `connection_requests` kept with its
   own vocab); GET pending-only + `direction`. UI reflects pending/connected states.
4. **GoTrueClient warning** — anon client (`lib/supabase.ts`) statically imported by
   `/messages` and dynamically by `/academy` (via `lib/academy/queries`). Fixed:
   `createClient()` from `lib/supabase/client` in messages; supabase-free
   `lib/academy/fallback.ts` (queries re-exports; page statically imports).
5. **/people/[username] crash** — `use(params)` on a plain object (Next 14 client page)
   threw "unsupported type passed to use()"; page never rendered. Fixed: plain
   destructure. (Found while running local E2E.)
6. **Local dev broken** — `.env.local` pointed at Project 2 (archive) and lacked
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` (middleware threw on every request → 500s).
   Repointed to Project 1 + added anon key. Local logins now work.

## Verification done
- Migration applied live; follow insert/unfollow + counts verified via SQL.
- `npm run build` passes; 104 jest tests pass.
- Local E2E (localhost): login hydration race found + fixed in helper; `/people`
  crash found + fixed; social flows locally blocked by stale service-role key
  (see KNOWN_ISSUES #1) → full local run deferred; production run is the gate.

## Deployment
- Project is git-integrated (amitkr26/BerojgarDegreeWala → main). Pushing deploys.
- CLI `vercel deploy --prod` races the git deployment (git deploy BLOCKED, CLI deploy
  deleted) — do not use it. Deleted stale root `.vercel/` (08-14 failed build output).

## Open items
- Production deploy Ready + full E2E + live DB spot-check + test-data cleanup.
- Owner: refresh Project 1 secret key in credentials file (KNOWN_ISSUES #1).
- Product decision: network-filtered feed (comment says so; code returns all posts).

## Files changed
Migration, follow/connect routes, PublicProfile, network page, academy (fallback +
page + queries), messages page, people page, e2e helpers + social-workflow spec,
docs (CHANGELOG, AGENT_STATE, AGENT_HANDOFF, IMPLEMENTATION_STATUS, KNOWN_ISSUES,
E2E_TEST_STATUS, this report).