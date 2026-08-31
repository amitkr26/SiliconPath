# Phase 21 — Current Baseline & Verification Truth

**Date**: 2026-08-26  
**Auditor**: Lead QA, Security & Reliability Engineering  
**Git Commit**: `47593b0`  
**Production Site**: https://berojgardegreewala.vercel.app  
**Database**: Supabase PostgreSQL (`aqauempuwmbizqoaolop`)

---

## 1. Current Truth Summary

1. **Git & Codebase State**:
   - Clean working tree on branch `main`, tracking `origin/main`.
   - TypeScript compilation (`npx tsc --noEmit`): **0 errors**.
   - Jest test suite (`npm test`): **16/16 test suites, 153/153 tests passing (100%)**.
   - Production bundle (`npm run build`): **349 routes compiled cleanly**.
   - Multi-Portal Verification Suite: **24/24 passed locally**.

2. **Live Database Schema State**:
   - **`opportunities` Table**: Contains both `created_by` (UUID FK $\rightarrow$ `user_profiles.id`) and `employer_id`. Live ownership is established via `created_by` (with backward-compatible fallback to `employer_id`).
   - **`job_status`**: Enforces `CHECK (job_status IN ('draft', 'active', 'paused', 'closed'))`.
   - **`verification_status`**: Enforces live check constraint `CHECK (verification_status IN ('pending', 'verified', 'rejected', 'expired', 'link_unavailable'))`. Value `'unverified'` is **invalid** and rejected by the database.
   - **`employer_settings` Table**: Physical table with primary key `employer_id` (FK $\rightarrow$ `user_profiles.id`), columns `email_alerts`, `instant_applicant_alert`, `weekly_digest`.
   - **`workspace_members` Table**: Physical table with `id`, `employer_id` (FK), `email`, `role`, `status`, and unique constraint `UNIQUE(employer_id, email)`.
   - **`candidate_profile_entities`**: `candidate_work_experiences`, `candidate_educations`, `candidate_projects`, `candidate_certifications`, `candidate_skills_detail` all exist in live PostgreSQL.

3. **Data Census**:
   - Total Database Rows: **3,608 (Zero Deletions)**
   - Public Verified Active: **342**
   - Quarantined: **3,258**
   - User Applications: **11/11 (100% Preserved)**
   - User Bookmarks: **2/2 (100% Preserved)**

---

## 2. Discrepancies Discovered & Remediated

- **Scraper Ingestion Default (`api/cron/scrape-global`, `api/cron/scrape-india`)**:
  - Found comments suggesting `'unverified'`, but database CHECK constraint strictly requires `'pending'`.
  - Updated both scraper endpoints to explicitly pass `verification_status: "pending"`, ensuring seamless fail-closed ingestion without database constraint violations.
