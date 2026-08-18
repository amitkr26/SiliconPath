# IMPLEMENTATION STATUS — 2026-08-18

## Social Networking (production bug fix — current session)

| # | Item | Status | Evidence |
|---|------|--------|----------|
| 1 | Follow POST 500 (missing count columns) | DONE — fixed + applied live | Migration `20260818000001_user_profiles_social_counts.sql` applied to DB1; insert verified, counts update |
| 2 | Follow state GET 405 | DONE | `api/network/follow/[userId]` GET handler returns `{ following }` |
| 3 | Connect 409 / 404 / PATCH semantics | DONE | 409 returns existing row; receiver 404 pre-check; role-enforced PATCH; GET direction+pending |
| 4 | PublicProfile UI reflects real state | DONE | 409 handled (Pending/Connected); loadRelationship isolated |
| 5 | Network page request states | DONE | incoming/outgoing tabs, Accept/Decline/Cancel, withdraw |
| 6 | GoTrueClient warning (/messages + /academy) | DONE | bundle leaks closed; build verifies no static supabase import in client pages |
| 7 | /people/[username] use() crash | DONE | plain param destructure |
| 8 | Local env → Project 1 + anon key | DONE (partial) | .env.local repointed + anon key added; **service-role key stale** (see KNOWN_ISSUES) |
| 9 | Build + jest | DONE | build passes; 104 tests pass |
| 10 | E2E spec for social workflow | DONE | `social-workflow.spec.ts` — **passing on production** |
| 11 | Production deploy | DONE | `cdc80a7` READY (git integration, ~16 min build) |
| 12 | Production E2E + live verify | DONE | **9/9 PASSED** (1.5m) — see E2E_TEST_STATUS.md |
| 13 | Test-data cleanup | DONE | A↔B rows removed from live DB after final run |
| 14 | Docs | DONE | CHANGELOG + state files + session report |
| 15 | Pair-connection query 400 (or(and())) | DONE | two flat queries in connections/connect routes |
| 16 | Messages username lookup 400 | DONE | UUID-aware lookup in messages page |
| 17 | **Feed like/comment counts** | DONE — fixed live | `on_post_like` wrote dead `likes_count` → likes never persisted (route masked it); trigger now writes `like_count`; both count triggers SECURITY DEFINER; routes no longer manually increment. Migration `20260818000002_fix_post_count_triggers.sql` applied live; 8/8 probes + E2E green |
| 18 | Social counts on public profiles | DONE — fixed live | `PUBLIC_PROFILE_FIELDS` (utils.ts) + migration `20260818000003_connection_count_trigger.sql` (SECURITY DEFINER, accepted-only) applied live; probes + E2E green. Deploy `b07ebd1` |
| 19 | Messaging conversation-list read-after-write lag | DONE | `useConversations` polls 5s (pooler lag; reproduced deterministically). Deploy `6d9684d` |
| 20 | Final production E2E | DONE | **9/9 PASSED** (1.7m, clean DB, deploy `6d9684d`) — see E2E_TEST_STATUS.md |

## RLS
Verified live on DB1 — all social tables have correct v2 policies. No migration needed;
do NOT re-apply `20260817000001_fix_social_rls_v2.sql`.

## Known local-only limitation
Admin-backed routes 401 locally (stale service-role key). Production unaffected.
See `KNOWN_ISSUES.md` #1.