# SiliconPath

### Consumer Brand: BerojgarDegreeWala
### Career Intelligence & Recruitment Infrastructure for India's Deep-Tech & Electronics Ecosystem

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Primary%20DB-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Neon](https://img.shields.io/badge/Neon-Analytics%20DB-00E599?style=for-the-badge&logo=postgresql)](https://neon.tech/)
[![Deployment](https://img.shields.io/badge/Vercel-Live-000000?style=for-the-badge&logo=vercel)](https://berojgardegreewala.vercel.app)
[![Tests](https://img.shields.io/badge/Jest-117%2F117%20PASS-brightgreen?style=for-the-badge)](https://github.com/amitkr26/BerojgarDegreeWala)
[![Forensic Audit](https://img.shields.io/badge/Forensic%20Audit-15%2F15%20READY-brightgreen?style=for-the-badge)](project-bible/FINAL_PLATFORM_AUDIT.md)

[**Live Platform**](https://berojgardegreewala.vercel.app) • [**Opportunities**](https://berojgardegreewala.vercel.app/opportunities) • [**Employer Suite**](https://berojgardegreewala.vercel.app/employer) • [**Academy**](https://berojgardegreewala.vercel.app/academy) • [**Admin**](https://berojgardegreewala.vercel.app/admin)

---

## Vision

**SiliconPath** is career intelligence and recruitment infrastructure for India's electronics ecosystem — semiconductor, VLSI, embedded systems, and materials science. It exists to answer two critical questions:
1. For candidates & researchers: *"What can I apply to next, is it real, and am I eligible?"*
2. For employers & research labs: *"How do we find, screen, invite, and hire specialized engineering talent with zero recruiter friction?"*

The moat is **technical depth + verified aggregation + dedicated hiring infrastructure**: understanding what a 28nm tapeout, a JJAP publication, or a DRDO security clearance means — then pairing candidates and employers inside separate, authoritative product experiences.

---

## Four Authoritative Platform Surfaces

The platform operates as **one application, one authentication system, and one database**, serving four strictly separated product experiences:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                   BerojgarDegreeWala / SiliconPath                       │
├───────────────────┬────────────────────┬────────────────┬────────────────┤
│   PUBLIC PORTAL   │  CANDIDATE PORTAL  │ EMPLOYER SUITE │  ADMIN CONSOLE │
│  (Browse & Intel) │ (Career & Network) │ (ATS & Hiring) │  (Ops & Fleet) │
└───────────────────┴────────────────────┴────────────────┴────────────────┘
```

| Surface | Target Persona | Shell & Layout | Core Routes | Database Scoping & Auth |
| :--- | :--- | :--- | :--- | :--- |
| **Public Surface** | Anonymous Visitors & Scholars | `Navbar` + `Footer` | `/`, `/opportunities`, `/news`, `/academy`, `/organizations`, `/resources`, `/search` | Public read on verified active rows |
| **Candidate Surface** | Job Seekers, Scholars & Engineers | Candidate Shell | `/dashboard`, `/applications`, `/saved`, `/network`, `/messages`, `/profile`, `/resume` | Scoped to authenticated user ID |
| **Employer Suite** | Recruiters, PIs, Lab Directors | `EmployerNav` + `EmployerSuiteShell` | `/employer/dashboard`, `/employer/jobs`, `/employer/post-job`, `/employer/applicants`, `/employer/talent`, `/employer/messages`, `/employer/analytics`, `/employer/company`, `/employer/team`, `/employer/settings` | Strictly scoped to `created_by` / `employer_id = auth.uid()` |
| **Admin Surface** | Platform Operations & Verification | Admin Dashboard Shell | `/admin`, `/admin/applications`, `/admin/companies`, `/admin/scrape-health`, `/admin/performance`, `/admin/analytics` | Full platform administrative access |

---

## Employer Suite Feature Matrix (100% DB-Backed)

The Employer Suite provides a professional recruiter cockpit comparable to LinkedIn Recruiter or Indeed Employer:

- **Recruiter Cockpit** (`/employer/dashboard`): Real-time metrics (Active Jobs, Total Applicants, Screening Pipeline, Direct Messages) and live applicant activity stream.
- **Job Postings Manager** (`/employer/jobs`, `/employer/jobs/[id]`, `/employer/jobs/[id]/edit`): Full lifecycle management (Active, Paused, Closed), 1-click status toggle, applicant counters, and shareable URLs.
- **Post Position Studio** (`/employer/post-job`, `/employer/jobs/new`): Multi-step form with quick-fill presets for DST JRF, SRF, VLSI verification, and embedded roles.
- **ATS Applicant Pipeline** (`/employer/applicants`, `/employer/applicants/[id]`, `/employer/jobs/[id]/applicants`): Kanban/list pipeline with 6 state machine stages (`applied`, `screening`, `shortlisted`, `interview`, `accepted`, `rejected`), resume previews, and private recruiter notes.
- **Candidate Talent Sourcing** (`/employer/talent`, `/employer/talent/[username]`): Search directory of verified `user_profiles` with skill/experience filters and 1-click **Direct Reachout / Invitation modal**.
- **Recruiter Messaging** (`/employer/messages`): Real-time 1-on-1 candidate messaging backed by canonical `conversations` and `messages` tables.
- **Recruiter Saved Candidates** (`/api/employer/saved-candidates`): Dedicated collection of starred candidate profiles with private notes and complete cross-employer isolation.
- **Company & Lab Profiles** (`/employer/company`, `/employer/company-claim`): Verified organizational workspace with official domain claim review workflows.
- **Team Workspace Seats** (`/employer/team`): Multi-seat recruiter management (`owner`, `admin`, `recruiter`, `hiring_manager`).
- **Employer Preferences & Settings** (`/employer/settings`): Alert frequencies, applicant digest controls, and recruitment defaults.
- **Recruitment Analytics Engine** (`/employer/analytics`): Live SQL-computed conversion velocities, pipeline conversion funnels, and per-job performance metrics.

---

## Security, RBAC & Multi-Employer IDOR Protection

1. **Dual-Authentication Architecture** ([`frontend/src/lib/employer-auth.ts`](file:///D:/Tinkerscape/SiliconPath/frontend/src/lib/employer-auth.ts)): Seamlessly authenticates via both Supabase SSR cookies (`sb-...-auth-token`) and `Authorization: Bearer <token>` headers.
2. **Strict Server-Side Boundary**: Middleware ([`frontend/src/middleware.ts`](file:///D:/Tinkerscape/SiliconPath/frontend/src/middleware.ts)) gates `/employer/*` and `/api/employer/*` exclusively to `role in ('employer', 'provider', 'admin')`.
3. **Forensically Verified IDOR Shield**: Every job mutation, applicant review, invite dispatch, saved candidate, and team route verifies resource ownership against `created_by = user.id` OR `employer_id = user.id`. Cross-employer unauthorized requests return HTTP 403 Forbidden with zero data leakage.
4. **Case-Insensitive Global Username Uniqueness**: All human accounts (candidates and recruiters) receive a unique `@username` handle enforced at the PostgreSQL level via `user_profiles_username_lower_key` on `lower(username)`.
5. **Production Security Headers**:
   - `X-Frame-Options: DENY`
   - `X-Content-Type-Options: nosniff`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Content-Security-Policy: default-src 'self'; ...; report-uri /api/csp-report`
   - `Strict-Transport-Security: max-age=31536000; includeSubDomains`

---

## Tech Stack

| Layer | Choice | Notes |
| :--- | :--- | :--- |
| **Frontend & API** | Next.js 14.2 (App Router), React 18, TypeScript 5.4 | 241 static and dynamic compiled routes |
| **Styling** | Tailwind CSS + Neobrutalist Design System | Clean, responsive, high-contrast UI |
| **Databases** | Supabase DB1 (Core/Social) + Neon (Analytics/Mirrors) | PostgreSQL with RLS and trigger-maintained counters |
| **AI Gateway** | `@berojgardegreewala/ai-gateway` | DB-grounded RAG with Groq (`qwen/qwen3.6-27b`), Gemini, OpenRouter |
| **Authentication** | Supabase Auth (Email + Google OAuth) | Global `@username` and dual-token validation |
| **Deployment** | Vercel (Production Web + Cron) | Sub-second edge response times |

---

## Verification & Forensic Audit Status

| Test Suite | Command | Result | Status |
| :--- | :--- | :--- | :--- |
| **TypeScript Compilation** | `npx tsc --noEmit` | **0 Errors** | ✅ PASS |
| **Unit Test Suite** | `npx jest` | **117 / 117 Tests PASS** | ✅ PASS |
| **Next.js Production Build** | `npm run build` | **241 / 241 Routes Compiled** | ✅ PASS |
| **Multi-Actor Forensic E2E Gate** | `node scripts/forensic-full-suite.mjs` | **15 / 15 Gates PASS** | ✅ PASS |

Complete forensic evidence and raw HTTP status codes are documented in [project-bible/FINAL_PLATFORM_AUDIT.md](project-bible/FINAL_PLATFORM_AUDIT.md).

---

## Development

```bash
# Clone the repository
git clone https://github.com/amitkr26/BerojgarDegreeWala.git
cd SiliconPath

# Install dependencies
npm install

# Start Next.js development server
npm run dev

# Run automated test suites
npm test

# Run forensic verification gate against live PostgreSQL
node frontend/scripts/forensic-full-suite.mjs
```

---

*Last Updated: August 22, 2026 — Phase 8.1 Production Certified.*
