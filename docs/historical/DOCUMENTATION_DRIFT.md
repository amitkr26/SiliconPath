# DOCUMENTATION DRIFT & RECONCILIATION AUDIT

**Date:** 2026-08-23  
**Project:** SiliconPath / BerojgarDegreeWala  
**Audit Purpose:** Comprehensive audit of historical documentation drift vs. live database and code reality.

---

## 1. Summary of Identified Drifts & Reconciliation

| # | Item / Entity | Historical / Stale Claim | Live Database & Code Reality | Status |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **`opportunities` Ownership** | Some older audit reports referenced `employer_id` exclusively, others `created_by`. | Both `created_by` and `employer_id` exist in PostgreSQL DB1 as foreign keys to `user_profiles(id)`. Code checks `created_by === user.id \|\| employer_id === user.id`. | **RECONCILED** |
| **2** | **Team Workspace Table Name** | Mentioned as `team_workspace_members` in old specs. | Actual table name in PostgreSQL is `workspace_members` with `UNIQUE(employer_id, email)`. | **RECONCILED** |
| **3** | **`employer_settings` Columns** | Older docs listed `applicant_email_alerts` / `email_notifications`. | Live columns are `employer_id`, `email_alerts`, `instant_applicant_alert`, `weekly_digest`, `dm_notifications`, `default_stage_notes`, `created_at`, `updated_at`. | **RECONCILED** |
| **4** | **Employer Suite Completion** | Some early audit reports labeled Employer Portal as "partial / mock-only". | Employer suite is 100% database-backed, verified across 15 forensic gates with zero mocks. | **RECONCILED** |
| **5** | **Phase 9 Candidate Sub-Resources** | Earlier reports marked tables as "migration ready / missing". | Migration executed in Supabase; all 5 tables (`candidate_experiences`, `candidate_educations`, `candidate_projects`, `candidate_certifications`, `candidate_achievements`) are physically present in PostgreSQL. | **RECONCILED** |
| **6** | **Automated Test Count** | Older docs cited 117 tests. | Current test baseline: 120 Frontend Jest + 158 Backend = 278 automated test cases (all passing). | **RECONCILED** |
| **7** | **Cron Architecture** | Older docs mentioned only 3 cron jobs. | Frontend API exposes 7 cron endpoints (`check-links`, `cleanup`, `digest`, `scrape-global`, `scrape-india`, `scrape-news`, `scrape-opportunities`), protected by `CRON_SECRET`. | **RECONCILED** |
| **8** | **Backend Replica Status** | Labeled as "missing" in older audits. | Express backend is running independently on Render (`https://berojgardegreewala-backend.onrender.com`) with 158 passing tests across `server`, `ai-gateway`, and `api`. | **RECONCILED** |

---

## 2. Invariant Rules for Future Agents

1. **Never Rewrite Historical Reports**: Audit reports in `docs/audit-reports/` and historical markdown files in `project-bible/audits/` serve as immutable evidence of past state. Never rewrite past timestamps or reports to match present reality.
2. **Current State Authority**: All current state claims must come strictly from `project-bible/ARCHITECTURE.md`, `project-bible/IMPLEMENTATION_STATUS.md`, `project-bible/PHASE10-ARCHITECTURE-FREEZE.md`, and `project-bible/PRODUCTION_SCHEMA_SNAPSHOT.md`.
