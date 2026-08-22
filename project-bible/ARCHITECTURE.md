# SiliconPath (BerojgarDegreeWala) — Technical Architecture

**Version:** 2026-08-22 (Reconciled & Production Certified) · **Pattern:** Modular Monolith on Next.js & Supabase + Dedicated Employer Suite & Independent Backend Replication

---

## 1. Architectural Overview

SiliconPath operates as a **modular monolith** on Next.js 14 (App Router) deployed to Vercel, backed by a unified Supabase PostgreSQL database (`aqauempuwmbizqoaolop`) and Neon analytics database.

The application serves four discrete, authoritative user experiences from a single codebase and authentication system:
1. **Public Portal**: Deep-tech intelligence, news, opportunities, academy, and search.
2. **Candidate Portal**: Career management, applications, saved jobs, networking, messaging, and profile/resume builder.
3. **Employer / Recruiter Suite**: Full recruitment cockpit, job posting studio, multi-stage ATS pipeline, talent sourcing, recruiter messaging, company branding, team seats, settings, and analytics.
4. **Admin Console**: Opportunity verification, scraping fleet health, announcements, and platform performance.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                   Next.js 14 Modular Monolith (Vercel)                   │
├───────────────────┬────────────────────┬────────────────┬────────────────┤
│   PUBLIC PORTAL   │  CANDIDATE PORTAL  │ EMPLOYER SUITE │  ADMIN CONSOLE │
│  (Navbar + Hero)  │ (Candidate Shell)  │(Employer Shell)│ (Admin Shell)  │
├───────────────────┴────────────────────┴────────────────┴────────────────┤
│       Universal Auth Guard (Cookie Session + Authorization Bearer JWT)   │
├──────────────────────────────────────────────────────────────────────────┤
│                  API Route Handlers (frontend/src/app/api/*)             │
│            • Public Reads  • Candidate Actions  • Employer Endpoints     │
└─────────────────────────────────────┬────────────────────────────────────┘
                                      │
        ┌─────────────────────────────┼────────────────────────────┐
        ▼                             ▼                            ▼
  Supabase DB1 (Core & Social)   Neon DB 1 (Analytics)       AI Gateway (9 Providers)
  • opportunities (+created_by)  • click_events              • Groq (qwen/qwen3.6-27b)
  • user_profiles (+username)    • page_views                • Gemini 1.5 Pro/Flash
  • applications (+status)       • search_queries            • OpenRouter, Bedrock
  • company_claims               • opportunities_mirror      • DB-grounded RAG
  • recruiter_saved_candidates
  • employer_settings
  • workspace_members
```

---

## 2. Four Discrete Platform Surfaces

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

## 3. Database Architecture & Additive Schema

The live Supabase PostgreSQL database incorporates the following schema structure:

### Core Tables & Foreign Key Constraints
- **`opportunities`**:
  - `id` (UUID PK), `title` (TEXT), `slug` (TEXT UNIQUE), `organization_id` (UUID FK → `organizations.id`), `created_by` (UUID FK → `user_profiles.id`), `employer_id` (UUID FK → `user_profiles.id`), `job_status` (TEXT DEFAULT 'active' CHECK in ('active', 'paused', 'closed', 'draft')), `screening_questions` (JSONB DEFAULT '[]'), `category` (TEXT CHECK in ('jrf', 'srf', 'phd', 'fellowship', 'government', 'internship')), `location`, `salary_range`, `eligibility`, `description`, `apply_url`, `tags` (TEXT[]), `is_active` (BOOL), `posted_date`, `created_at`, `updated_at`.
- **`applications`**:
  - `id` (UUID PK), `opportunity_id` (UUID FK → `opportunities.id`), `user_id` (UUID FK → `user_profiles.id`), `status` (TEXT CHECK in ('applied', 'screening', 'shortlisted', 'interview', 'accepted', 'rejected')), `notes` (TEXT), `applied_at`, `updated_at`.
- **`company_claims`**:
  - `id` (UUID PK), `organization_id` (UUID FK → `organizations.id`), `claimed_by` (UUID FK → `user_profiles.id`), `status` (TEXT DEFAULT 'pending' CHECK in ('pending', 'approved', 'rejected')), `reviewed_by` (UUID FK → `user_profiles.id`), `reviewed_at` (TIMESTAMPTZ), `message` (TEXT), `created_at`, `updated_at`.
- **`recruiter_saved_candidates`**:
  - `id` (UUID PK), `employer_id` (UUID FK → `user_profiles.id`), `candidate_id` (UUID FK → `user_profiles.id`), `note` (TEXT), `created_at`.
  - Constraint: `UNIQUE(employer_id, candidate_id)`.
- **`employer_settings`**:
  - `employer_id` (UUID PK FK → `user_profiles.id`), `email_alerts` (BOOL), `instant_applicant_alert` (BOOL), `weekly_digest` (BOOL), `dm_notifications` (BOOL), `default_stage_notes` (TEXT), `created_at`, `updated_at`.
- **`workspace_members`**:
  - `id` (UUID PK), `employer_id` (UUID FK → `user_profiles.id`), `email` (TEXT), `role` (TEXT CHECK in ('owner', 'admin', 'recruiter', 'hiring_manager')), `status` (TEXT DEFAULT 'active'), `created_at`, `updated_at`.
  - Constraint: `UNIQUE(employer_id, email)`.
- **`user_profiles`**:
  - Enforces global unique case-insensitive handle via `UNIQUE INDEX user_profiles_username_lower_key ON user_profiles (lower(username))`.

---

## 4. Security, Dual Auth & IDOR Protection

1. **Dual Authentication Helper (`frontend/src/lib/employer-auth.ts`)**:
   - Accepts both browser session cookies (`sb-...-auth-token`) and programmatic Bearer tokens (`Authorization: Bearer <jwt>`).
   - Validates role metadata (`employer`, `provider`, or `admin`).
2. **Server-Side Middleware Boundary (`frontend/src/middleware.ts`)**:
   - Strictly intercepts all `/employer/*` and `/api/employer/*` routes, returning 403 Forbidden for non-employer roles and 401 for anonymous traffic.
3. **Multi-Employer IDOR Shield**:
   - Every mutation and review endpoint verifies that the authenticated user owns the referenced opportunity (`created_by === user.id || employer_id === user.id` or `role === 'admin'`).
   - Cross-employer access attempts return HTTP 403 Forbidden.
4. **Security Response Headers**:
   - `X-Frame-Options: DENY`
   - `X-Content-Type-Options: nosniff`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Content-Security-Policy: default-src 'self' ...; report-uri /api/csp-report`
   - `Strict-Transport-Security: max-age=31536000; includeSubDomains`

---

## 5. Verification Baseline

- **TypeScript Type Safety**: `npx tsc --noEmit` (0 errors)
- **Unit & Integration Tests**: `npx jest` (14 suites, 117/117 passing)
- **Production Build**: `npm run build` (241/241 routes compiled)
- **Forensic Stateful E2E Suite**: `node scripts/forensic-full-suite.mjs` (15/15 gates PASS)
