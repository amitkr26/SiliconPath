# End-to-End Test Status & Workflow Matrix

```text
LAST_UPDATED: 2026-08-19
TEST_ENVIRONMENT: Local Server (http://127.0.0.1:3000) + Production (https://berojgardegreewala.vercel.app)
OVERALL_STATUS: 9/9 production Playwright runs passed (last vs deploy `683404c`, 2026-08-19); jest 104/104; Next build exit 0
```

## Test Accounts

| # | Role | Email | Password | DB1 User ID |
|---|---|---|---|---|
| 1 | Candidate | `amittest1@berojgardegreewala.com` | `TestPassword123!` | `56b47f8e-8501-45c5-b9a3-8d4fcef8252e` |
| 2 | Candidate | `amittest2@berojgardegreewala.com` | `TestPassword123!` | `9e55b282-0d5b-4210-9fd4-54ec5c45da45` |

> NOTE 2026-08-18 (night): the legacy A/B accounts (`xasefe9251@bejum.com`,
> `weqolyji@forexzig.com`) were **deleted** by `frontend/scripts/reset-users.mjs`
> (deletes ALL auth users, creates amittest1/amittest2 above). `amittest2` is a plain
> seeker — no flow requires the employer role (helpers.ts `loginAsEmployer` is a
> legacy name). Recreate canonical users with `reset-users.mjs` if wiped again.

## Playwright production suite (6 spec files, 10 tests)

`frontend/tests/e2e/*` — runs against https://berojgardegreewala.vercel.app
(BASE_URL default). Spec files: auth, accept-connection, header-nav, messaging,
network-connect, social-workflow (+ temporary probe specs removed after use).
**Contract: clean inter-account rows before every full run** —
the owner's `test-social-e2e.mjs` and the connect specs leave residue that fails
subsequent runs by design (observed twice 2026-08-18). Cleanup SQL (Management API,
`db1-sql.mjs`):

```sql
DELETE FROM connections WHERE (requester_id IN ('56b47f8e-...','9e55b282-...')
  AND addressee_id IN ('56b47f8e-...','9e55b282-...'));
DELETE FROM user_follows WHERE follower_id IN (...) AND following_id IN (...);
DELETE FROM feed_posts WHERE content LIKE 'E2E test post%';
DELETE FROM notifications WHERE actor_id IN (...) AND user_id IN (...);
DELETE FROM messages WHERE sender_id IN (...);
DELETE FROM conversations WHERE participant_a IN (...) AND participant_b IN (...);
```

`network-connect.spec.ts` self-withdraws the request it sends (PATCH
`/api/network/connect/[id]` `{status:"withdrawn"}`) so it can't poison
`social-workflow` — the only suggestion with just amittest1/amittest2 in the DB is
the other test user.

**Latest production runs (2026-08-19): 9/9 PASSED against deploy `a79773a`
(network username-link fix). Earlier: 9/9 vs `683404c` (network 4-tab feature),
9/9 vs `6d9684d`, 9/9 vs `c4c60f6` (owner's round, accounts migrated).**
The `a79773a` run also included a temporary probe spec (deleted after use) that
verified the connection card name-link href is `/profile/amittest2` (not `#`) and
that both name-link and card-body clicks navigate to the profile.

---

## Workflow Test Matrix

| # | Workflow | Steps / Scenario | Expected Result | Status |
|---|---|---|---|---|
| 1 | **Public Opportunities Search** | Unauthenticated user visits `/opportunities` & searches "Qualcomm", "Lead RISC-V", "DRDO" | Matches displayed, zero login modal popups, filters work | ✅ PASS |
| 2 | **Public Organizations Directory** | Unauthenticated user visits `/organizations`, searches by name & clicks category tabs | Real-time filtering with authentic org cards | ✅ PASS |
| 3 | **Public VLSI Academy** | Unauthenticated user visits `/academy` | 7 sequential curriculum tracks visible with structured topics | ✅ PASS |
| 4 | **Candidate Network Discovery** | User 1 visits `/network` & checks suggestions | Real candidate cards displayed (no `sug-*` dummy errors), "Connect" sends request | ✅ PASS (200) |
| 5 | **Connection Request Lifecycle** | User 1 sends request to User 2 ➔ User 2 accepts | Request sent (201), incoming seen (200), accept (200), connections list updated (200) | ✅ PASS (100%) |
| 6 | **1-to-1 Direct Messaging** | User 1 opens `/messages?user=<User 2>` & sends message; User 2 replies | Message sent (201), reply sent (201), conversation list (200), message history (200) | ✅ PASS (100%) |
| 7 | **LinkedIn-Style Profile Routing** | User clicks on profile via `/profile/[username]` or `/profile/[id]` | Profile metadata and public fields load dynamically without 404 | ✅ PASS (200) |
| 8 | **ATS Resume Builder Persistence** | User 1 edits resume on `/resume`, clicks Save & reloads page | Data persists completely from `user_profiles.resume_data`, ATS score shown | ✅ PASS |
| 9 | **Saved Opportunities** | User 1 saves an opportunity on `/opportunities`, navigates to `/saved` | Bookmarked opportunity listed with company name, removable | ✅ PASS |
| 10 | **Employer Job Posting** | User creates job on `/employer/post-job`, checks `/employer/dashboard` | Job created with unverified status, visible on dashboard | ✅ PASS (posting; **no ATS applicant pipeline exists** — see KNOWN_ISSUES #8; dashboard shows job + raw application data only) |