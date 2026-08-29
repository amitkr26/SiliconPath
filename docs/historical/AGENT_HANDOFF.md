# Multi-Agent Handoff Document (Antigravity ⇋ OpenCode)

```text
HANDOFF_VERSION: 1.15.0
TIMESTAMP: 2026-08-23
CURRENT_AGENT: Antigravity / OpenCode
NEXT_AGENT: Antigravity / OpenCode (shared continuation contract)
TASK_STATUS: Phase 15 Post-Phase-14 Reconciliation & Production Readiness Complete. Live schema verified, Security Advisor findings resolved, candidate sub-resources operational, 278/278 automated test cases green.
VERIFIED SURFACES:
1. Public Portal (News, Opportunities, Academy, Organizations, Resources, Search)
2. Candidate Portal (Dashboard, Applications, Saved, Resume, Network, Messaging, Profile)
3. Employer & Recruiter Suite (Dashboard, Jobs CRUD, Post Position Studio, Multi-Stage ATS, Talent Search, Candidate Invitations, Recruiter Messaging, Saved Candidates, Company Branding, Team Seats, Settings, Scoped Analytics)
4. Admin Console (Scrape Health, Opportunities Verification, Performance, Announcements)
LIVE DATABASE ALIGNMENT:
- opportunities: created_by & employer_id confirmed identical across all 1,000 live rows (993 system nulls, 7 employer-created matches, 0 mismatches)
- applications: live statuses verified across applied (5), accepted (5), shortlisted (1) (0 invalid statuses)
- company_claims: table + RLS (0 orphans)
- recruiter_saved_candidates: table + RLS (0 orphans)
- employer_settings: table + RLS (live schema verified)
- workspace_members: table + RLS (0 orphans)
- user_profiles_username_lower_key: case-insensitive unique index
- candidate sub-resources: candidate_experiences, candidate_educations, candidate_projects, candidate_certifications, candidate_achievements (all live in DB1, 0 orphans)
- security hardening: 20260823120000_security_hardening_followup.sql (RLS policies + search_path + execute revocations)
VERIFICATION SUITE:
- node scripts/candidate-network-e2e.mjs: 12/12 gates PASS
- node scripts/forensic-full-suite.mjs: 15/15 gates PASS
- npx tsc --noEmit: 0 errors
- npx jest: 15 suites, 120/120 passing
- backend test suite: 158/158 passing (46 server + 15 ai-gateway + 97 api)
- total automated tests: 278/278 passing (100%)
- npm run build: 241/241 routes compiled successfully
VERDICT: PHASE 15 RECONCILED & CERTIFIED (278/278 TESTS PASS).
```

---

## 1. Verified Architecture & Endpoints

### 1.1 Dual Authentication Helper (`frontend/src/lib/employer-auth.ts`)
- Extracts JWT credentials seamlessly from cookies (`sb-...-auth-token`) and `Authorization: Bearer <token>` headers.
- Enforces role validation (`employer`, `provider`, or `admin`).

### 1.2 IDOR Protection Matrix
- Strict ownership checks on every job mutation, applicant review, invite reachout, and recruiter collection:
  `created_by === user.id || employer_id === user.id || role === 'admin'`.
- All cross-employer access attempts return HTTP 403 Forbidden.

### 1.3 Case-Insensitive Global Usernames
- Supported on all candidate and employer registration and check flows (`/api/username/check`).
- Collision resistance verified across lower, mixed, and uppercase variations (`audit_user_2026`, `Audit_User_2026`, `AUDIT_USER_2026`).

---

## 2. Verification Commands

```bash
# Run TypeScript compilation check
npx tsc --noEmit

# Run unit test suite
npx jest

# Run Next.js production build
npm run build

# Run comprehensive live forensic stateful audit (15 gates against live Supabase PostgreSQL)
node frontend/scripts/forensic-full-suite.mjs
```

---

## 3. Production Deployment Contract

- Production runs on Vercel (`https://berojgardegreewala.vercel.app`) connected to git branch `origin/main`.
- All documentation is maintained in `project-bible/`, and audit reports in `docs/audit-reports/`.
- Commit history remains clean with credentials scanned and `.gitignore` strictly respected.