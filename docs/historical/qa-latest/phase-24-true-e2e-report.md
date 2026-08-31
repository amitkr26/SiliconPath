# Phase 24 — True End-to-End Acceptance Report

**Date**: 2026-08-26  
**Auditor**: Lead QA, Security & Reliability Engineering  
**Base Target**: `http://localhost:3001` & `https://berojgardegreewala.vercel.app`

---

## 1. Candidate Lifecycle & Sub-Entities
- **Authentication**: Signin via `@amittest1` succeeded. Session bearer token issued.
- **Profile Completeness**: Computed dynamically at 90% across identity, bio, location, skills, experience, education, and career preferences.
- **Sub-Entity Mutations**: Verified creation, retrieval, and deletion of `candidate_work_experiences`, `candidate_educations`, `candidate_projects`, `candidate_certifications`, and `candidate_achievements`.
- **Applications & Saved Opportunities**: Application submission, status retrieval, and bookmarking verified in live database with zero orphan rows.

---

## 2. Employer Lifecycle & Multi-Tenant ATS Isolation
- **Authentication**: Role-gated session access for `@excompany`.
- **Job Lifecycle**: Creation, modification, status transition (`active` -> `paused`), and deletion verified.
- **Cross-Tenant IDOR Attack Defense**: 7 active IDOR attack vectors (view other employer's job, edit job, delete job, view applicants, patch applicant stage, invite candidate, anonymous access) strictly blocked with HTTP 401/403.
- **ATS Stage Transitions**: Candidate application progressed across `screening` -> `shortlisted` -> `interview` -> `accepted` and separately `rejected`.
- **Recruiter Settings & Team**: Notification settings and workspace seats verified in PostgreSQL.

---

## 3. Social Graph & Direct Messaging
- **Connections Graph**: Invariant checks verified: self-connections blocked (400), duplicate connection requests blocked (409 Conflict), mutual connection calculation verified.
- **Follow System**: Self-follow blocked (400), follow/unfollow triggers executed without counter corruption.
- **Messaging**: Bidirectional candidate-to-candidate and employer-to-candidate messaging verified with conversation reuse and unread badge counters.

---

## 4. UI Section Width Realignment
- **Identified Issue**: Homepage sections for Dual Portals (`max-w-4xl`), FAQs (`max-w-4xl`), and Subscribe CTA (`max-w-5xl`) had narrower container widths than other `max-w-7xl` sections.
- **Resolution**: Realigned all container wrappers to `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` and removed child grid max-width constraints, producing consistent edge-to-edge alignment across the entire homepage.

---

## 5. Public Production Smoke Test
Tested 12 read-only endpoints against `https://berojgardegreewala.vercel.app`:
- `/` (HTTP 200)
- `/opportunities` (HTTP 200)
- `/news` (HTTP 200)
- `/academy` (HTTP 200)
- `/organizations` (HTTP 200)
- `/resources/jrf-guide` (HTTP 200)
- `/search?q=VLSI` (HTTP 200)
- `/sitemap.xml` (HTTP 200)
- `/robots.txt` (HTTP 200)
- `/api/health` (HTTP 200)
- `/api/opportunities?limit=5` (HTTP 200)
- `/api/news` (HTTP 200)
- **Result**: 12/12 PASSED (100%).
