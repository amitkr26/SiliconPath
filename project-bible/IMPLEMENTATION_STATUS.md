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
| 10 | E2E spec for social workflow | DONE (written) | `social-workflow.spec.ts` — pending production run |
| 11 | Production deploy | IN PROGRESS | push-triggered git deploy; awaiting Ready |
| 12 | Production E2E + live verify | PENDING | after deploy |
| 13 | Test-data cleanup | PENDING | after E2E |
| 14 | Docs | DONE (this session) | CHANGELOG + state files + session report |

## RLS
Verified live on DB1 — all social tables have correct v2 policies. No migration needed;
do NOT re-apply `20260817000001_fix_social_rls_v2.sql`.

## Known local-only limitation
Admin-backed routes 401 locally (stale service-role key). Production unaffected.
See `KNOWN_ISSUES.md` #1.