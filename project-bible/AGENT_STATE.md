# AGENT STATE — 2026-08-18 (production social bug fix session)

Status: **code complete, committed, pushed (05a5494), awaiting production deploy + live E2E.**

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

## Commits (pushed to origin/main, 05a5494)
- 070937c fix(network): follow/connect routes + migration
- (5-file commit) fix: GoTrueClient bundle leaks + academy fallback + /people crash
- (2-file commit) test(e2e): social workflow spec + hydration-safe login helper
- docs commit (this session): CHANGELOG + state files + session report

## In flight
- Production deploy (Vercel git integration, push-triggered) — poll `vercel ls --prod`.
- Run full E2E suite against production (BASE_URL default is prod URL).
- Production verification + test-data cleanup + E2E_TEST_STATUS.md update.

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