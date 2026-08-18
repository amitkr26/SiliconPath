# End-to-End Test Status & Workflow Matrix

```text
LAST_UPDATED: 2026-08-18T21:14:00+05:30
TEST_ENVIRONMENT: Local Server (http://127.0.0.1:3000) + Production (https://berojgardegreewala.vercel.app)
OVERALL_STATUS: 100% PASS (17/17 Social E2E steps passed, 14/14 unit test suites passed, Next.js build exit 0)
```

## Test Accounts

| # | Role | Email | Password | DB1 User ID |
|---|---|---|---|---|
| 1 | Candidate | `amittest1@berojgardegreewala.com` | `TestPassword123!` | `56b47f8e-8501-45c5-b9a3-8d4fcef8252e` |
| 2 | Candidate | `amittest2@berojgardegreewala.com` | `TestPassword123!` | `9e55b282-0d5b-4210-9fd4-54ec5c45da45` |
| 3 | Candidate | `xasefe9251@bejum.com` | `12345678` | Verified |
| 4 | Employer | `weqolyji@forexzig.com` | `87654321` | Verified |

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
| 10 | **Employer Job Posting & ATS** | User creates job on `/employer/post-job`, checks `/employer/dashboard` | Job created with pending verification status, applicant pipeline visible | ✅ PASS |