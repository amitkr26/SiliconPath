# Database Architecture

Verified live August 22, 2026. Sources: `frontend/src/lib/db/index.ts`, `frontend/src/lib/supabase.ts`, `frontend/supabase/migrations/*`.

---

## 1. Topology

| DB | Provider | Role | Live Tables |
|:---|:---|:---|:---|
| **DB1** | Supabase Project 1 (`aqauempuwmbizqoaolop`) | Production Core (Platform, Employer Suite, Social, Logs) | `opportunities`, `organizations`, `news_articles`, `user_profiles`, `connections`, `user_follows`, `feed_posts`, `feed_post_likes`, `feed_post_comments`, `feed_post_reposts`, `conversations`, `messages`, `notifications`, `saved_opportunities`, `applications`, `resumes`, `company_claims`, `recruiter_saved_candidates`, `employer_settings`, `workspace_members`, `skill_endorsements`, `recommendations`, `community_posts`, `community_comments`, `company_pages`, `company_followers`, `subscribers`, `resources`, `announcements`, `opportunity_reports`, `scrape_sources`, `scrape_runs`, `link_check_logs`, `opportunity_verifications`, `ai_usage_log`, `academy_tracks`, `academy_days`, `track_assessments`, `track_checkpoints`, `user_learning_progress` |
| **DB2** | Supabase Project 2 (`jbqjipwanfsxyqkfrrpx`) | Legacy Mirror | `news_archive`, `user_profiles` |
| **Neon 1** | Neon (Analytics & Mirrors) | Analytics + Mirror Storage | `click_events`, `page_views`, `search_queries`, `trending_cache`, `keyword_stats`, `opportunities_mirror`, `news_mirror` |
| **Neon 2** | Neon (Cache Mirror) | Cache Mirror (Subset of Neon 1) | `page_views`, `search_queries`, `click_events` |

---

## 2. Core Tables & Additive Schema (Live Inspected)

### `opportunities` (DB1)
- **Primary Columns**: `id` (UUID PK), `title`, `slug` (UNIQUE), `organization_id` (UUID FK → `organizations.id`), `created_by` (UUID FK → `user_profiles.id`), `employer_id` (UUID FK → `user_profiles.id`), `job_status` (TEXT DEFAULT 'active' CHECK in ('active', 'paused', 'closed', 'draft')), `screening_questions` (JSONB DEFAULT '[]'), `category` (CHECK in ('jrf', 'srf', 'phd', 'fellowship', 'government', 'internship')), `location`, `salary_range`, `eligibility`, `description`, `apply_url`, `tags` (TEXT[]), `source_type`, `is_active` (BOOL), `verification_status`, `posted_date`, `created_at`, `updated_at`.
- **Indexes**: `idx_opportunities_created_by`, `idx_opportunities_employer_id`, `opportunities_slug_key`, `idx_opp_active`, `idx_opp_category`.

### `company_claims` (DB1)
- **Columns**: `id` (UUID PK), `organization_id` (UUID FK → `organizations.id`), `claimed_by` (UUID FK → `user_profiles.id`), `status` (TEXT DEFAULT 'pending' CHECK in ('pending', 'approved', 'rejected')), `reviewed_by` (UUID FK → `user_profiles.id`), `reviewed_at` (TIMESTAMPTZ), `message` (TEXT), `business_email` (TEXT), `created_at`, `updated_at`.
- **RLS**: Enabled. Employers read/create own claims; Admins have full review/mutation access.

### `recruiter_saved_candidates` (DB1)
- **Columns**: `id` (UUID PK), `employer_id` (UUID FK → `user_profiles.id`), `candidate_id` (UUID FK → `user_profiles.id`), `note` (TEXT), `created_at`, `updated_at`.
- **Constraints**: `UNIQUE(employer_id, candidate_id)`.
- **RLS**: Enabled. Employers isolated to own saved candidates.

### `employer_settings` (DB1)
- **Columns**: `employer_id` (UUID PK FK → `user_profiles.id`), `email_alerts` (BOOL DEFAULT true), `instant_applicant_alert` (BOOL DEFAULT true), `weekly_digest` (BOOL DEFAULT true), `dm_notifications` (BOOL DEFAULT true), `default_stage_notes` (TEXT), `created_at`, `updated_at`.
- **RLS**: Enabled. Employers isolated to own settings.

### `workspace_members` (DB1)
- **Columns**: `id` (UUID PK), `employer_id` (UUID FK → `user_profiles.id`), `email` (TEXT), `role` (TEXT DEFAULT 'recruiter' CHECK in ('owner', 'admin', 'recruiter', 'hiring_manager')), `status` (TEXT DEFAULT 'active'), `created_at`, `updated_at`.
- **Constraints**: `UNIQUE(employer_id, email)`.
- **RLS**: Enabled. Employers isolated to own workspace team members.

### `user_profiles` (DB1)
- **Columns**: `id` (UUID PK), `username` (TEXT), `display_name`, `headline`, `bio`, `location`, `country`, `skills` (TEXT[]), `experience_years`, `resume_url`, `linkedin_url`, `github_url`, `website_url`, `avatar_url`, `account_type`, `is_profile_public`, `follower_count`, `following_count`, `connection_count`.
- **Unique Handle Index**: `CREATE UNIQUE INDEX user_profiles_username_lower_key ON public.user_profiles USING btree (lower(username))`.

### Candidate Sub-Resource Tables (DB1 — Phase 9 Verified)
- **`candidate_experiences`**: `id` (UUID PK), `candidate_id` (UUID FK → `user_profiles.id` ON DELETE CASCADE), `company_name`, `role_title`, `employment_type` ('Full-time', 'Part-time', 'Internship', 'Contract', 'Research', 'Apprenticeship'), `location`, `start_date`, `end_date`, `is_current`, `description`, `skills_used` (TEXT[]), `created_at`, `updated_at`. RLS: Public Read (if public), Owner CRUD.
- **`candidate_educations`**: `id` (UUID PK), `candidate_id` (UUID FK → `user_profiles.id` ON DELETE CASCADE), `institution`, `degree`, `field_of_study`, `start_year`, `end_year`, `grade`, `description`, `created_at`, `updated_at`. RLS: Public Read (if public), Owner CRUD.
- **`candidate_projects`**: `id` (UUID PK), `candidate_id` (UUID FK → `user_profiles.id` ON DELETE CASCADE), `title`, `description`, `technologies` (TEXT[]), `project_url`, `github_url`, `start_date`, `end_date`, `created_at`, `updated_at`. RLS: Public Read (if public), Owner CRUD.
- **`candidate_certifications`**: `id` (UUID PK), `candidate_id` (UUID FK → `user_profiles.id` ON DELETE CASCADE), `name`, `issuing_org`, `issue_date`, `expiration_date`, `credential_id`, `credential_url`, `created_at`, `updated_at`. RLS: Public Read (if public), Owner CRUD.
- **`candidate_achievements`**: `id` (UUID PK), `candidate_id` (UUID FK → `user_profiles.id` ON DELETE CASCADE), `title`, `issuer`, `date_awarded`, `description`, `created_at`, `updated_at`. RLS: Public Read (if public), Owner CRUD.

### `applications` (DB1)
- **Columns**: `id` (UUID PK), `user_id` (UUID FK → `user_profiles.id`), `opportunity_id` (UUID FK → `opportunities.id`), `status` (TEXT CHECK in ('applied', 'screening', 'shortlisted', 'interview', 'accepted', 'rejected')), `notes` (TEXT), `applied_at`, `updated_at`.

---

## 3. Row-Level Security & Policy Summary

All user-facing tables enforce strict RLS policies:
- **Public Reads**: `opportunities` (where `is_active = true`), `organizations`, `news_articles`, `user_profiles` (public fields).
- **Candidate Scoped**: `applications` (`user_id = auth.uid()`), `saved_opportunities` (`user_id = auth.uid()`), `resumes` (`user_id = auth.uid()`).
- **Employer Scoped**: `opportunities` mutations (`created_by = auth.uid() OR employer_id = auth.uid()`), `recruiter_saved_candidates`, `employer_settings`, `workspace_members`, `company_claims`.
- **Admin Full Access**: Service role client and users with `role = 'admin'` bypass tenant filters for platform management.

---

## 4. Live Verification Evidence

- Inspected via direct SQL queries against Supabase Management API (`aqauempuwmbizqoaolop`).
- All 5 additive tables, 4 unique indexes, and 15 stateful test gates verified via [`frontend/scripts/forensic-full-suite.mjs`](file:///D:/Tinkerscape/SiliconPath/frontend/scripts/forensic-full-suite.mjs).
