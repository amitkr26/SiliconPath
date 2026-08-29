# CURRENT PLATFORM REALITY: ARCHITECTURE & RUNTIME INVENTORY

**Date:** 2026-08-23  
**Project:** SiliconPath / BerojgarDegreeWala  
**Authority:** Certified Runtime & Live PostgreSQL Database Evidence  
**Database Project Ref:** `aqauempuwmbizqoaolop` (`https://aqauempuwmbizqoaolop.supabase.co`)  
**Active Baseline Git Commit:** `db4bfcb`

---

## 1. PLATFORM SURFACES

| Surface | Layout Shell | Key Routes | Auth & RBAC Invariant |
| :--- | :--- | :--- | :--- |
| **1. Public Portal** | Navbar + Footer | `/`, `/opportunities`, `/opportunities/[slug]`, `/news`, `/news/[slug]`, `/academy`, `/organizations`, `/resources`, `/search`, `/ask-ai`, `/match` | Public reads on active items; SSR + edge cached. No login required. |
| **2. Candidate Portal** | Candidate Layout | `/dashboard`, `/applications`, `/saved`, `/network`, `/messages`, `/profile`, `/resume` | Authenticated session (`auth.uid()`). Strict candidate data isolation. |
| **3. Employer Suite** | EmployerSuiteShell + EmployerNav | `/employer/dashboard`, `/employer/jobs`, `/employer/jobs/[id]`, `/employer/jobs/[id]/applicants`, `/employer/jobs/[id]/edit`, `/employer/post-job`, `/employer/applicants`, `/employer/applicants/[id]`, `/employer/talent`, `/employer/talent/[username]`, `/employer/messages`, `/employer/company`, `/employer/team`, `/employer/settings`, `/employer/analytics`, `/employer/company-claim` | Authenticated role (`employer`, `provider`, or `admin`). Intercepted by middleware and verified via strict IDOR owner check. |
| **4. Admin Console** | Admin Shell | `/admin`, `/admin/applications`, `/admin/companies`, `/admin/scrape-health`, `/admin/performance`, `/admin/analytics` | Dedicated HMAC token / `x-admin-password` guard enforced at every `/api/admin/*` route. |

---

## 2. DATABASES & TOPOLOGY

- **Supabase DB1 (`aqauempuwmbizqoaolop`)**: Authoritative primary database for User Accounts, Profiles, Candidate Sub-Resources, Social Network Graph, Conversations, Messages, Notifications, Opportunities, Applications, and Employer Cockpit Suite.
- **Supabase DB2 (`jbqjipwanfsxyqkfrrpx`)**: Secondary mirror and historical news archive storage.
- **Neon DB1**: High-throughput serverless analytics for `click_events`, `page_views`, and `search_queries`.
- **Neon DB2**: Dedicated cache mirror for analytics queries.
- **Backend Replica (Render)**: Independent Express service (`https://berojgardegreewala-backend.onrender.com`) running API parity routes, multi-provider AI Gateway, and background cron worker tasks. Production traffic remains solely on Vercel.

---

## 3. LIVE DATABASE TABLES (SUPABASE DB1)

| Table Name | Physical State | Keys & Constraints | RLS Enforcement |
| :--- | :--- | :--- | :--- |
| **`user_profiles`** | **LIVE** | `id uuid PK`, unique btree index on `lower(username)` | Public read on public profiles; owner manage. |
| **`candidate_experiences`** | **LIVE** | `id uuid PK`, `candidate_id FK -> user_profiles(id) CASCADE` | Public read (if profile public), owner CRUD. |
| **`candidate_educations`** | **LIVE** | `id uuid PK`, `candidate_id FK -> user_profiles(id) CASCADE` | Public read (if profile public), owner CRUD. |
| **`candidate_projects`** | **LIVE** | `id uuid PK`, `candidate_id FK -> user_profiles(id) CASCADE` | Public read (if profile public), owner CRUD. |
| **`candidate_certifications`** | **LIVE** | `id uuid PK`, `candidate_id FK -> user_profiles(id) CASCADE` | Public read (if profile public), owner CRUD. |
| **`candidate_achievements`** | **LIVE** | `id uuid PK`, `candidate_id FK -> user_profiles(id) CASCADE` | Public read (if profile public), owner CRUD. |
| **`connections`** | **LIVE** | `id uuid PK`, `requester_id FK`, `addressee_id FK` | Participant access; 1st-degree mutual network graph. |
| **`user_follows`** | **LIVE** | `id uuid PK`, `follower_id FK`, `following_id FK` | Unidirectional follow stream. |
| **`conversations` & `messages`** | **LIVE** | `id uuid PK`, `participant_a FK`, `participant_b FK` | Multi-tenant participant-only read/write. |
| **`notifications`** | **LIVE** | `id uuid PK`, `user_id FK` | Owner-only read/mutation. |
| **`opportunities`** | **LIVE** | `id uuid PK`, `created_by FK`, `employer_id FK`, `slug UNIQUE` | Public read on active rows; employer owner/admin manage. |
| **`applications`** | **LIVE** | `id uuid PK`, `opportunity_id FK`, `user_id FK` | Candidate view own; Employer view applicants for owned job. |
| **`company_claims`** | **LIVE** | `id uuid PK`, `organization_id FK`, `claimed_by FK` | Employer submit/view own; Admin review and approve/reject. |
| **`recruiter_saved_candidates`**| **LIVE** | `id uuid PK`, `UNIQUE(employer_id, candidate_id)` | Employer isolated to own saved candidate collections. |
| **`employer_settings`** | **LIVE** | `employer_id uuid PK FK -> user_profiles(id)` | Employer isolated to own notification settings. |
| **`workspace_members`** | **LIVE** | `id uuid PK`, `UNIQUE(employer_id, email)` | Employer isolated to own workspace recruiter seats. |
| **`organizations`** | **LIVE** | `id uuid PK`, `slug UNIQUE` | Public read; Admin/owner manage. |
| **`news_articles`** | **LIVE** | `id uuid PK`, `slug UNIQUE` | Public read; Cron/Admin sync. |
| **`feed_posts`** | **LIVE** | `id uuid PK`, `user_id FK` | Authenticated social feed stream. |

---

## 4. AUTHENTICATION & RBAC

- **Authentication Providers**: Supabase Auth (Email/Password + Google OAuth). Client token stored in secure cookie `sb-...-auth-token` and passed via `Authorization: Bearer <jwt>`.
- **User Roles**: Stored in `user_profiles.account_type` and `auth.users.user_metadata.role` (`candidate`, `employer`, `provider`, `admin`).
- **Server Middleware Guard (`frontend/src/middleware.ts`)**:
  - Gated candidate paths require valid session.
  - Employer paths (`/employer/*`, `/api/employer/*`) strictly require `role === 'employer' || role === 'admin' || account_type === 'provider'` (returning HTTP 403 Forbidden for candidates and HTTP 401 for anonymous traffic).
  - Admin APIs require HMAC token / `x-admin-password` validation.

---

## 5. CANONICAL EMPLOYER OPPORTUNITY OWNERSHIP

- **Live Columns**: Both `created_by` and `employer_id` exist in DB1 referencing `user_profiles(id)`.
- **Live Data Consistency**:
  - Scraped/System opportunities (993 rows): `created_by = NULL`, `employer_id = NULL`.
  - Employer-created opportunities (7 rows): `created_by = auth.uid()`, `employer_id = auth.uid()`.
  - Zero ownership conflicts across all 1,000 live rows (`created_by === employer_id` for all employer records).
- **Application Invariant**: Employer routes verify ownership via `created_by === user.id || employer_id === user.id || role === 'admin'`.

---

## 6. APPLICATION STATUS STATE MACHINE & UI MAPPING

- **Canonical Persisted DB Values**:
  - `applied`: Candidate submitted application.
  - `screening`: Recruiter initiated preliminary screening / review.
  - `shortlisted`: Candidate shortlisted for position.
  - `interview`: Candidate invited or scheduled for interview.
  - `accepted`: Candidate application accepted / offer extended.
  - `rejected`: Application declined.
- **Candidate Visibility**: Candidates view real-time progression across all 6 stages.
- **Employer ATS Progression**: Recruiter advances candidates across stages with audit notes via `PATCH /api/employer/applicants/[id]`.

---

## 7. CANDIDATE PROFILE ENTITIES (PHASE 9 VERIFIED)

- **PostgreSQL Storage**: All 5 candidate sub-resource tables (`candidate_experiences`, `candidate_educations`, `candidate_projects`, `candidate_certifications`, `candidate_achievements`) are physically present and act as primary storage in PostgreSQL DB1.
- **Completeness Engine**: Deterministic 0–100% calculation based on real persisted data across 9 dimensions (Identity, Avatar, Bio, Location, Skills, Experience, Education, Projects, Career Preferences).
- **Public Profile Visibility**: Public profile views display structured sub-resources if `is_profile_public = true`.

---

## 8. BACKEND REPLICA PARITY STATUS

| Capability Area | Frontend Route | Backend Express Route | Parity Status |
| :--- | :--- | :--- | :--- |
| **Health Checks** | `/api/health` | `/health`, `/health/ready` | **COMPLETE** |
| **Opportunities Read** | `/api/opportunities`, `/api/opportunities/[id]` | `/api/v1/opportunities`, `/api/v1/opportunities/:idOrSlug` | **COMPLETE** |
| **Saved Opportunities**| `/api/bookmarks` | `/api/v1/saved-opportunities` | **COMPLETE** |
| **Applications CRUD** | `/api/applications` | `/api/v1/applications` | **COMPLETE** |
| **Profile Read** | `/api/profile/[userId]` | `/api/v1/profiles/:username`, `/api/v1/profiles/me` | **PARTIAL** |
| **Auth Signup** | `/api/auth/signup` | `/api/v1/auth/signup`, `/api/v1/auth/check-username` | **COMPLETE** |
| **AI Gateway** | `/api/ai/*` | `/api/v1/ai/*` | **COMPLETE** |
| **News Feed & Sync** | `/api/news`, `/api/news/[slug]` | `/api/v1/news`, `/api/v1/news/:slug`, `/api/v1/cron/news-sync` | **COMPLETE** |
| **Search Engine** | `/api/search` | `/api/v1/search` | **COMPLETE** |
| **Social / Network** | `/api/feed`, `/api/network/*`, `/api/messages` | Express replication queue | **IN PROGRESS** |
| **Employer Suite** | `/api/employer/*` | Express replication queue | **IN PROGRESS** |

---

## 9. MASTER TEST BASELINE

```
================================================================================
  CANONICAL PLATFORM TEST BASELINE (100% PASSING)
================================================================================
Frontend TypeScript Compilation (npx tsc --noEmit)              : 0 ERRORS
Frontend Jest Unit Tests (npx jest)                             : 120 / 120 PASS (15 suites)
Next.js Production Build (npm run build)                        : 241 / 241 ROUTES COMPILED
Candidate Network Forensic E2E (scripts/candidate-network-e2e)  : 12 / 12 GATES PASS
Employer Forensic Full Suite (scripts/forensic-full-suite.mjs)  : 15 / 15 GATES PASS
Backend Server Test Suite (backend/server)                      : 46 / 46 PASS
Backend AI-Gateway Test Suite (backend/ai-gateway)              : 15 / 15 PASS
Backend API Test Suite (backend/api)                            : 97 / 97 PASS
Total Automated Test Cases Passing                              : 278 / 278 PASS (100%)
================================================================================
```

---

## 10. RECONCILED OPEN ISSUES REGISTER

1. **`siliconpath-credentials.txt` Stale Dev Key (P1, Local Dev Only)**:
   - Status: **DOCUMENTED (Owner Action)**. Project 1 legacy secret key rotated; production Vercel/Render deployments hold active rotated credentials.
2. **`/api/feed` Unfiltered Network Feed (Product Consideration)**:
   - Status: **DOCUMENTED**. Feed returns global community posts; network-filtered tab available under `/network`.
3. **Backend Parity Social Layer Replication (Phase 11 In Progress)**:
   - Status: **IN PROGRESS**. Independent Express backend replicating social feed, connection mutuals, and messaging routes.
