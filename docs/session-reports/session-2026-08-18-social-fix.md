# Session Report — 2026-08-18: Production Social Networking Bug Fix

## Summary
Four production failures on https://berojgardegreewala.vercel.app (follow state GET,
follow POST 500, connect 409, GoTrueClient console warning) diagnosed to root cause,
fixed, committed, and pushed (deploys 05a5494 → c6c91b0 → cdc80a7, all via Vercel git
integration). Full production E2E verification: **9/9 green**. One additional
real production bug found and fixed along the way: feed likes never persisted (broken
`on_post_like` trigger writing a dead `likes_count` column; route masked the failure).

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

## Follow-up fixes (deploys c6c91b0 → cdc80a7)
7. **Pair-connection queries** — PostgREST rejects nested `and()` inside `or()`
   (400 PGRST100); connections/connect routes now use two flat queries.
8. **Messages username lookup** — `id.eq.<username>` 400s (UUID cast); lookup is
   now UUID-aware (id when UUID, username otherwise).
9. **Feed like/comment counts — root cause** (see CHANGELOG):
   - `on_post_like` trigger wrote nonexistent `likes_count` → every like INSERT
     failed at the DB level; the route returned `{ liked: true }` without checking
     (likes never persisted). Fixed: trigger writes `like_count`.
   - Both count triggers were SECURITY INVOKER → RLS-filtered to 0 rows for
     plain-user inserts; now SECURITY DEFINER (counts always match rows).
   - Routes no longer manually increment (was double-counting with the trigger:
     observed `comment_count=2` with 1 row).
   - Verified via direct PostgREST probes (8/8 behaviors, plain-user path) + the
     production E2E feed test.
10. **E2E spec fixes** — whitespace-tolerant count assertion, "Message" link (no
    "Connected" text exists), wait for connection-state fetch before Connect click,
    deterministic messaging seed + correct list locator (`overflow-y-auto`;
    container uses `divide-y-2` not `divide-y`).

## Final production verification (deploy cdc80a7)
Full Playwright suite against https://berojgardegreewala.vercel.app:
**9/9 PASSED (1.5m)** — accept-connection, header-nav ×2, messaging (seed → list →
thread send), network-connect (no FK-error toast), follow/unfollow persistence,
connect → accept → connected (Message link), A→B messaging both directions, feed
post/like/comment counts persist after reload. Test data cleaned from live DB
afterwards. Details: `project-bible/E2E_TEST_STATUS.md`.

## Deployment
- Project is git-integrated (amitkr26/BerojgarDegreeWala → main). Pushing deploys
  (~15-16 min build). Git-author protection: commits must be authored as
  `amitkr26@users.noreply.github.com` (Vercel's generated identity gets BLOCKED).
- CLI `vercel deploy --prod` races the git deployment (git deploy BLOCKED, CLI deploy
  deleted) — do not use it. Deleted stale root `.vercel/` (08-14 failed build output).

## Open items
- Owner: refresh Project 1 secret key in credentials file (KNOWN_ISSUES #1) so
  admin-backed local E2E runs become possible.
- Product decision: network-filtered feed (comment says so; code returns all posts).
- Legacy `accept-connection.spec.ts`/`network-connect.spec.ts` keep a clean-state
  contract (documented in E2E_TEST_STATUS).

## Files changed
Migration (social counts + post count triggers), follow/connect/feed routes,
PublicProfile, network page, academy (fallback + page + queries), messages page,
people page, e2e helpers + social-workflow/messaging/accept-connection specs, docs
(CHANGELOG, AGENT_STATE, AGENT_HANDOFF, IMPLEMENTATION_STATUS, KNOWN_ISSUES,
E2E_TEST_STATUS, this report).