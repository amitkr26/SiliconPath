# Phase 26 — Final Schema & API Contract Audit Report

**Date**: 2026-08-26  
**Auditor**: Senior System Engineering & Forensic QA  
**Scope**: Full live PostgreSQL schema extraction, static database reference scanner across 100% of repository files, physical column verification, table name drift detection, status/enum consistency audit.  
**Live Target**: Supabase Project `aqauempuwmbizqoaolop` (58 physical tables, 3,608 opportunities preserved)  
**Status**: ✅ **AUDIT COMPLETE — ALL CONFIRMED DEFECTS REMEDIATED**

---

## 1. Schema Inventory & Source-of-Truth

The live Supabase OpenAPI / PostgREST specification was extracted and mapped. Across 58 physical tables, every column type, nullability constraint, foreign key relation, and default was mapped to a machine-readable schema map (`scripts/live-schema-map.json`).

### Primary Tables Overview

| Table Name | Primary Key | Critical Physical Columns | Special Considerations / Foreign Keys |
| :--- | :--- | :--- | :--- |
| `opportunities` | `id` (uuid) | `title`, `slug`, `organization_id`, `category`, `description`, `eligibility`, `location`, `salary_range`, `deadline`, `posted_date`, `verification_status`, `is_active`, `created_by`, `employer_id`, `job_status` | Filter on `eligibility` and `title` for experience levels. `experience_required` does NOT exist in DB. |
| `user_profiles` | `id` (uuid) | `display_name`, `email`, `avatar_url`, `headline`, `bio`, `location`, `country`, `account_type`, `job_title`, `current_company`, `experience_years`, `skills`, `interests`, `is_profile_public`, `is_open_to_work`, `username`, `follower_count`, `following_count`, `connection_count` | Primary key is `id` (`auth.users.id`). `resume_data` and `open_to_work_types` do NOT exist on this table. |
| `user_resumes` | `id` (uuid) | `user_id`, `full_name`, `email`, `phone`, `linkedin`, `github`, `education`, `skills`, `experience`, `projects`, `publications`, `ats_score`, `ats_feedback`, `created_at`, `updated_at` | Physical single source of truth for resume data. Table name is `user_resumes` (NOT `resumes`). |
| `recruiter_saved_candidates` | `id` (uuid) | `employer_id`, `candidate_id`, `note`, `created_at` | Stores `employer_id` and `candidate_id`. Separate profile enrichment used to prevent PostgREST ambiguous relation errors. |
| `applications` | `id` (uuid) | `user_id`, `opportunity_id`, `status`, `applied_at`, `notes`, `updated_at` | Contains `applied_at` (NOT `created_at`). Opportunities are owned by employer (`opportunities.created_by`). |
| `saved_opportunities` | `id` (uuid) | `user_id`, `opportunity_id`, `saved_at` | Contains `saved_at` (NOT `created_at`). |
| `organizations` | `id` (uuid) | `name`, `slug`, `type`, `country`, `location`, `website`, `careers_url`, `logo_url`, `description`, `is_verified`, `is_active` | Contains `type` (NOT `category`) and `is_verified` (NOT `verification_status`). |
| `subscribers` | `id` (uuid) | `email`, `categories`, `keywords`, `countries`, `is_verified`, `verification_token`, `unsubscribe_token`, `created_at` | Contains `is_verified` (NOT `is_active`). |
| `scrape_sources` | `id` (uuid) | `name`, `url`, `adapter`, `category`, `organization_id`, `is_active`, `priority`, `batch`, `last_scrape_at`, `last_success_at`, `total_runs`, `total_results` | Contains `adapter` (NOT `source_type`). |
| `news_articles` | `id` (uuid) | `title`, `url`, `source_name`, `summary`, `image_url`, `published_at`, `tags`, `is_active`, `created_at`, `slug` | Contains `published_at` and `created_at` (NOT `updated_at`). |
| `user_learning_progress` | `id` (uuid) | `user_id`, `track_id`, `day_id`, `completed_at` | Tracks completed days via `day_id` and `track_id`. |
| `user_track_assessment_results` | `id` (uuid) | `user_id`, `track_id`, `score_percent`, `passed`, `answers_json`, `attempted_at` | Tracks academy checkpoint and track assessments. |

---

## 2. Identified Schema & API Mismatches (Remediated)

During the systematic static and runtime discovery scan, the following schema mismatches were discovered and permanently corrected:

### Defect 1: Employer Dashboard Applications Query (`frontend/src/app/page.tsx`)
- **Root Cause**: Query attempted `.from("applications").select("id, status").eq("employer_id", user.id)`. The `applications` table has no `employer_id` column; applications reference `opportunity_id`.
- **Fix**: Updated `page.tsx` to retrieve employer opportunities first (`opportunities.created_by = user.id`), extract job IDs, and query `applications.opportunity_id IN (jobIds)`.

### Defect 2: Recruiter Saved Candidates Query PostgREST Ambiguity (`frontend/src/app/api/employer/saved-candidates/route.ts`)
- **Root Cause**: The route attempted a direct relation embed `candidate:user_profiles(...)` which failed with PostgREST error `Could not embed because more than one relationship was found for 'recruiter_saved_candidates' and 'user_profiles'`.
- **Fix**: Replaced with reliable two-stage candidate profile enrichment (`user_profiles.id IN (candidateIds)`), guaranteeing complete candidate data without foreign-key alias failures.

### Defect 3: Non-existent `open_to_work_types` in Talent Search (`frontend/src/app/api/employer/talent/route.ts`)
- **Root Cause**: Route selected `open_to_work_types` from `user_profiles`, causing 42703 error and returning empty candidate array.
- **Fix**: Removed `open_to_work_types` from select list and migrated auth to `getAuthenticatedEmployerUser`.

### Defect 4: Resume Single Source-of-Truth (`frontend/src/app/api/resume/route.ts`)
- **Root Cause**: Route attempted to read/write `user_profiles.resume_data` and query non-existent `resumes` table. Physical database table is `user_resumes`.
- **Fix**: Completely rewrote `/api/resume` to read/write `user_resumes` physical table with exact columns (`full_name`, `email`, `phone`, `education`, `skills`, `experience`, `projects`, `publications`, `ats_score`, `ats_feedback`).

### Defect 5: Non-existent `is_active` in Subscribers (`frontend/src/lib/email-digest.ts`)
- **Root Cause**: Query attempted `.from("subscribers").select("*").eq("is_active", true)`. Column in DB is `is_verified`.
- **Fix**: Replaced `.eq("is_active", true)` with `.eq("is_verified", true)`.

### Defect 6: Non-existent `updated_at` on `news_articles` (`frontend/src/app/api/sitemap/route.ts`)
- **Root Cause**: Query attempted `.from("news_articles").select("slug, updated_at").order("updated_at")`. Physical column is `created_at` / `published_at`.
- **Fix**: Replaced `updated_at` with `created_at`.

### Defect 7: Non-existent `source_type` on `scrape_sources` (`frontend/src/lib/scrapers/opportunity-scraper-impl.ts`)
- **Root Cause**: Query filtered `.in("source_type", ["ats", "html", "api"])`. Physical column is `adapter`.
- **Fix**: Replaced `source_type` with `adapter`.

### Defect 8: Academy Learning Progress & Assessments (`frontend/src/lib/academy/queries.ts`)
- **Root Cause**: Queries referenced `day_number` and `status` on `user_learning_progress` (which physically contains `day_id`, `track_id`, `completed_at`) and queried `user_learning_progress` for track assessments instead of `user_track_assessment_results`.
- **Fix**: Updated `getCompletedDays`, `getPassedTracks`, `markDayComplete`, and `saveAssessmentResult` to query physical schema tables `learning_days`, `user_learning_progress`, and `user_track_assessment_results`.

---

## 3. Verification & Acceptance

- **Static Reference Scan**: 100% of source files verified against 58 tables.
- **Runtime Discovery**: 25/25 endpoints returned valid HTTP responses.
- **TypeScript**: 0 type errors.
- **Jest Unit Tests**: 153/153 passed (100%).
- **Production Build**: 350+ routes compiled with 0 errors.
