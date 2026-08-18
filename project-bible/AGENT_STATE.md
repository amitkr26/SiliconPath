# AGENT STATE — 2026-08-18 (production social bug fix session)

Status: **DONE — production E2E 9/9 GREEN (deploy 6d9684d); test data cleaned; docs updated.**

## Mission
Fix the four production Social Networking failures on https://berojgardegreewala.vercel.app
and make the full workflow work end-to-end: follow state GET, follow POST/DELETE,
connect/accept/cancel, messaging, feed likes/comments — RLS verified, local + production
E2E, full documentation. Never fake success; never disable RLS.

## Fixed (root causes, committed)
1. Follow POST 500 — `handle_follow()` trigger wrote missing `user_profiles` count columns.
   Migration `frontend/supabase/migrations/20260818000001_user_profiles_social_counts.sql`
   added + backfilled them. **Applied live to Project 1** (verified insert + counts).
2. Follow GET 405 — added GET handler → `{ following }`.
3. Connect 409/404/PATCH semantics — see commits; UI reflects real state.
4. GoTrueClient warning — messages + academy bundle leaks closed.
5. `/people/[username]` React `use()` crash — one-line fix.
6. Local dev env — `.env.local` now Project 1 + missing anon key added (dev was 500ing
   on every request via middleware).
7. PostgREST `or(and())` 400s — connections/connect routes use two flat pair queries.
8. Messages username lookup — UUID-aware (id when UUID, username otherwise).
9. **Feed like/comment counts** (deploy cdc80a7) — `on_post_like` trigger wrote
   nonexistent `likes_count` → every like INSERT failed while the route returned
   `{ liked: true }` unchecked (likes never persisted); trigger now writes `like_count`
   and both count triggers are SECURITY DEFINER (counts match rows for every insert
   path); routes no longer manually increment (was double-counting). Migration
   `20260818000002_fix_post_count_triggers.sql` applied live; verified 8/8 via probes.
10. **Social counts on public profiles** (deploy b07ebd1) — `PUBLIC_PROFILE_FIELDS`
    (`frontend/src/lib/utils.ts`) lacked `follower_count`/`following_count`/
    `connection_count`, so PublicProfile never rendered count spans; added all three.
    `connections` had no trigger → `connection_count` stayed 0; migration
    `20260818000003_connection_count_trigger.sql` (applied live): SECURITY DEFINER
    `handle_connection_count()` + `on_connection_change` trigger (accepted-only) +
    backfill. Verified: pending no-op, accept +1 both sides, reject −1.
11. **Messaging conversation list read-after-write lag** (deploy 6d9684d) — the last
    E2E flake: on a clean DB the list GET returned `200 []` for ~5-10s after a fresh
    conversation creation while the per-conversation GET saw the row (pooler lag).
    `useConversations()` now polls every 5s (same pattern as the messages query).

## Commits (pushed to origin/main)
- 070937c fix(network): follow/connect routes + migration
- (5-file commit) fix: GoTrueClient bundle leaks + academy fallback + /people crash
- (2-file commit) test(e2e): social workflow spec + hydration-safe login helper
- 184224a, af3aa42 docs (incl. git-author protection note)
- c6c91b0 fix: pair-connection queries, messages username lookup, comment count sync
- cdc80a7 fix(feed): trigger-maintained counts + broken like trigger + migration
- 86acb2f test(e2e): messaging list locator + connection-state wait [vercel skip]
- b07ebd1 fix(profile): expose social counts on public profiles; maintain connection_count
- 6d9684d fix(messages): poll conversation list to heal pooler read-after-write lag


## Final verification (production, deploy 6d9684d)
- Full Playwright suite vs https://berojgardegreewala.vercel.app: **9/9 PASSED (1.7m)**
  on a clean DB — including the fresh-conversation messaging path (previously flaky).
  Details + history in `E2E_TEST_STATUS.md`.
- E2E test data cleaned from live DB (follows/connections/conversations/feed posts/
  notifications/messages between A & B).

## Gotchas learned (write into AGENT_HANDOFF)
- **Never run `vercel deploy --prod` via CLI here**: project is git-integrated
  (amitkr26/BerojgarDegreeWala); CLI deploy races the automatic git deployment —
  git deploy ends up BLOCKED and the CLI deploy vanishes ("Deployment not found").
  Deploy = push to main.
- Vercel env values are encrypted: `vercel env pull` returns `[SENSITIVE]` — cannot
  recover keys that way.
- Credentials file: Project 1 `SUPABASE_SECRET_KEY` is STALE (401). Publishable key is
  current. Owner must update the file with a fresh secret key (dashboard rotate).
- The stale root `.vercel/` (Build Output API experiment from 08-14) was deleted this
  session; `frontend/.vercel/project.json` still holds an old projectId that 404s —
  harmless for CLI deploy, confusing for `vercel ls --prod` project filtering.
- Playwright against localhost: React hydration race — login helper now retries.