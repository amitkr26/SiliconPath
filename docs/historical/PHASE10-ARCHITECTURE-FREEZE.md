# PHASE 10: CANONICAL ARCHITECTURE & PROJECT BIBLE FREEZE

**Date:** 2026-08-23  
**Project:** SiliconPath / BerojgarDegreeWala  
**Status:** **FROZEN & CERTIFIED PRODUCTION READY**  
**Production Supabase DB1 Project:** `aqauempuwmbizqoaolop` (`https://aqauempuwmbizqoaolop.supabase.co`)  
**Active Baseline Git Commit:** `db4bfcb`  
**Total Automated Test Baseline:** **278 / 278 PASS (100%)**

---

## 1. Source-of-Truth Hierarchy

All engineering activities, audits, and documentation in this repository strictly adhere to this binding source-of-truth priority:

1. **Live Production Code** (`frontend/src/*`, `backend/*`)
2. **Live Database State** (Supabase DB1 `aqauempuwmbizqoaolop`, Neon DB1)
3. **Current Authoritative Architecture** (`project-bible/ARCHITECTURE.md`)
4. **Current Verified E2E Forensic Evidence** (`scripts/candidate-network-e2e.mjs`, `scripts/forensic-full-suite.mjs`)
5. **Product Specifications / PRD** (`project-bible/01-product/*`)
6. **Historical Audit & Planning Artifacts** (Preserved as dated immutable records)

---

## 2. Live Database Topology & Schema Definition

### 2.1 Database Topology
- **Supabase DB1 (`aqauempuwmbizqoaolop`)**: Authoritative primary database for Authentication, User Profiles, Candidate Sub-Resources, Professional Social Graph, Direct Messaging, Notifications, Opportunities, Applications, and Employer Recruitment Cockpit.
- **Supabase DB2 (`jbqjipwanfsxyqkfrrpx`)**: Secondary mirror and historical news archive storage.
- **Neon DB1**: High-throughput serverless analytics for `click_events`, `page_views`, and `search_queries`.
- **Neon DB2**: Dedicated cache mirror for analytics queries.

### 2.2 Reconciled Schema Inventory (Supabase DB1)
- **`user_profiles`**: 27 verified columns with case-insensitive unique index `user_profiles_username_lower_key ON user_profiles (lower(username))`.
- **`candidate_experiences`**: `id uuid PK`, `candidate_id uuid FK -> user_profiles(id) CASCADE`, `company_name`, `role_title`, `employment_type`, `location`, `start_date`, `end_date`, `is_current`, `description`, `skills_used` (TEXT[]), timestamps. Index: `idx_candidate_exp_candidate_id`. RLS enabled.
- **`candidate_educations`**: `id uuid PK`, `candidate_id uuid FK -> user_profiles(id) CASCADE`, `institution`, `degree`, `field_of_study`, `start_year`, `end_year`, `grade`, `description`, timestamps. Index: `idx_candidate_edu_candidate_id`. RLS enabled.
- **`candidate_projects`**: `id uuid PK`, `candidate_id uuid FK -> user_profiles(id) CASCADE`, `title`, `description`, `technologies` (TEXT[]), `project_url`, `github_url`, `start_date`, `end_date`, timestamps. Index: `idx_candidate_proj_candidate_id`. RLS enabled.
- **`candidate_certifications`**: `id uuid PK`, `candidate_id uuid FK -> user_profiles(id) CASCADE`, `name`, `issuing_org`, `issue_date`, `expiration_date`, `credential_id`, `credential_url`, timestamps. Index: `idx_candidate_cert_candidate_id`. RLS enabled.
- **`candidate_achievements`**: `id uuid PK`, `candidate_id uuid FK -> user_profiles(id) CASCADE`, `title`, `issuer`, `date_awarded`, `description`, timestamps. Index: `idx_candidate_achieve_candidate_id`. RLS enabled.
- **`opportunities`**: `id uuid PK`, `created_by uuid FK -> user_profiles(id)`, `employer_id uuid FK -> user_profiles(id)`, `organization_id`, `title`, `slug UNIQUE`, `job_status` ('active', 'paused', 'closed', 'draft'), `screening_questions` (JSONB), `category`, `location`, `salary_range`, `eligibility`, `description`, `apply_url`, `tags`, `is_active`, timestamps.
- **`applications`**: `id uuid PK`, `opportunity_id uuid FK -> opportunities(id)`, `user_id uuid FK -> user_profiles(id)`, `status` ('applied', 'screening', 'shortlisted', 'interview', 'accepted', 'rejected'), `notes`, timestamps.
- **`company_claims`**: `id uuid PK`, `organization_id`, `claimed_by uuid FK`, `status` ('pending', 'approved', 'rejected'), `reviewed_by uuid FK`, `reviewed_at`, `message`, timestamps. RLS enabled.
- **`recruiter_saved_candidates`**: `id uuid PK`, `employer_id uuid FK`, `candidate_id uuid FK`, `note`, timestamps. Constraint: `UNIQUE(employer_id, candidate_id)`. RLS enabled.
- **`employer_settings`**: `employer_id uuid PK FK -> user_profiles(id)`, `email_alerts`, `instant_applicant_alert`, `weekly_digest`, `dm_notifications`, `default_stage_notes`, timestamps. RLS enabled.
- **`workspace_members`**: `id uuid PK`, `employer_id uuid FK -> user_profiles(id)`, `email`, `role` ('owner', 'admin', 'recruiter', 'hiring_manager'), `status`, timestamps. Constraint: `UNIQUE(employer_id, email)`. RLS enabled.
- **`connections` & `user_follows`**: Bidirectional 1st-degree connection graph and unidirectional follow stream. RLS enabled.
- **`conversations` & `messages`**: Multi-tenant real-time chat supporting candidate-to-candidate and recruiter candidate reachout. RLS enabled.

---

## 3. Four Distinct Platform Surfaces

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Surface             Layout Shell            Key Pages                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│ 1. Public Portal    Navbar + Footer         /, /opportunities, /news, /academy, │
│                                             /organizations, /resources, /search │
│ 2. Candidate Portal Candidate Layout        /dashboard, /applications, /saved,  │
│                                             /network, /messages, /profile       │
│ 3. Employer Suite   EmployerSuiteShell      /employer/dashboard, /employer/jobs,│
│                     + EmployerNav           /employer/post-job, /employer/talent│
│                                             /employer/applicants, /employer/team│
│                                             /employer/settings, /employer/stats │
│ 4. Admin Console    Admin Dashboard Shell   /admin, /admin/scrape-health,       │
│                                             /admin/companies, /admin/performance│
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Deployed Infrastructure Responsibilities

- **Vercel (Production Frontend Monolith)**:
  - Serves Next.js 14 App Router, dynamic server rendering, static site generation (SSG), Edge middleware, and all 138 client API handlers.
  - Implements universal auth guard, employer RBAC, and IDOR protection matrix.
- **Render (Independent Backend Replica)**:
  - Runs Express.js REST API (`https://berojgardegreewala-backend.onrender.com`), independent health endpoints (`/health`, `/health/ready`), multi-provider AI Gateway, and background cron services.
  - Acts as a clean independent service layer according to [`backend/docs/API-PARITY.md`](file:///D:/Tinkerscape/SiliconPath/backend/docs/API-PARITY.md).

---

## 5. Master Verification Baseline

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

## 6. Architecture Freeze Certification

The core platform architecture, database schemas, authentication boundaries, and regression baselines are officially **FROZEN**. All future engineering work resumes directly with independent backend parity replication.
