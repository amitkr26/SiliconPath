# Database Architecture

Verified live August 30, 2026. Sources: `frontend/src/lib/db/index.ts`, `frontend/src/lib/supabase.ts`, `frontend/supabase/migrations/*`.

---

## 1. Topology

| DB | Provider | Role | Live Tables |
|:---|:---|:---|:---|
| **DB1** | Supabase Project 1 (`aqauempuwmbizqoaolop`) | Core Platform Data | `opportunities`, `organizations`, `news_articles`, `scraper_sources`, `company_claims`, `recruiter_saved_candidates`, `employer_settings`, `workspace_members`, `ai_usage_log`, `subscribers`, `suggestions`, `link_check_results`, `opportunity_reports`, `organization_announcements`, `opportunities_verification` |
| **DB2** | Supabase Project 2 (`jbqjipwanfsxyqkfrrpx`) | User & Social Layer | `user_profiles`, `user_resumes`, `saved_opportunities`, `applications`, `user_alerts`, `user_follows`, `connection_requests`, `feed_posts`, `community_posts`, `community_comments`, `community_votes`, `conversations`, `messages`, `notifications`, `skill_endorsements`, `recommendations`, `candidate_experiences`, `candidate_educations`, `candidate_projects`, `candidate_certifications`, `candidate_achievements`, `company_followers` |
| **Neon 1** | Neon (Analytics & Mirrors) | Analytics + Cache | `click_events`, `page_views`, `search_queries`, `trending_cache`, `keyword_stats` |

---

## 2. Core Tables & Schema

### `opportunities` (DB1)
- **Primary Columns**: `id` (UUID PK), `title`, `slug` (UNIQUE), `organization_id` (UUID FK → `organizations.id`), `created_by` (UUID FK → `user_profiles.id`), `employer_id` (UUID FK → `user_profiles.id`), `job_status` (TEXT DEFAULT 'active' CHECK in ('active', 'paused', 'closed', 'draft')), `screening_questions` (JSONB DEFAULT '[]'), `category` (CHECK in ('jrf', 'srf', 'phd', 'fellowship', 'government', 'internship')), `location`, `salary_range`, `eligibility`, `description`, `apply_url`, `tags` (TEXT[]), `source_type`, `is_active` (BOOL), `verification_status`, `posted_date`, `created_at`, `updated_at`.
- **Indexes**: `idx_opportunities_created_by`, `idx_opportunities_employer_id`, `opportunities_slug_key`, `idx_opp_active`, `idx_opp_category`.

### `user_profiles` (DB2)
- **Columns**: `id` (UUID PK), `username` (TEXT), `display_name`, `headline`, `bio`, `location`, `country`, `skills` (TEXT[]), `experience_years`, `resume_url`, `linkedin_url`, `github_url`, `website_url`, `avatar_url`, `account_type`, `is_profile_public`, `follower_count`, `following_count`, `connection_count`.
- **Unique Handle Index**: `CREATE UNIQUE INDEX user_profiles_username_lower_key ON public.user_profiles USING btree (lower(username))`.

### `applications` (DB2)
- **Columns**: `id` (UUID PK), `user_id` (UUID FK → `user_profiles.id`), `opportunity_id` (UUID FK → DB1 `opportunities.id`), `status` (TEXT CHECK in ('saved', 'applied', 'under_review', 'shortlisted', 'interview', 'offer', 'accepted', 'rejected', 'withdrawn')), `notes` (TEXT), `applied_at`, `updated_at`.

### `company_claims` (DB1)
- **Columns**: `id` (UUID PK), `organization_id` (UUID FK → `organizations.id`), `claimed_by` (UUID FK → `user_profiles.id`), `status` (TEXT DEFAULT 'pending' CHECK in ('pending', 'approved', 'rejected')), `reviewed_by` (UUID FK → `user_profiles.id`), `reviewed_at` (TIMESTAMPTZ), `message` (TEXT), `business_email` (TEXT), `created_at`, `updated_at`.
- **RLS**: Enabled. Employers read/create own claims; Admins have full review/mutation access.

### `recruiter_saved_candidates` (DB1)
- **Columns**: `id` (UUID PK), `employer_id` (UUID FK → `user_profiles.id`), `candidate_id` (UUID FK → `user_profiles.id`), `note` (TEXT), `created_at`, `updated_at`.
- **Constraints**: `UNIQUE(employer_id, candidate_id)`.
- **RLS**: Enabled. Employers isolated to own saved candidates.

### Candidate Sub-Resource Tables (DB2 — Phase 9 Verified)
- **`candidate_experiences`**: `id` (UUID PK), `candidate_id` (UUID FK → `user_profiles.id` ON DELETE CASCADE), `company_name`, `role_title`, `employment_type` ('Full-time', 'Part-time', 'Internship', 'Contract', 'Research', 'Apprenticeship'), `location`, `start_date`, `end_date`, `is_current`, `description`, `skills_used` (TEXT[]), `created_at`, `updated_at`. RLS: Public Read (if public), Owner CRUD.
- **`candidate_educations`**: `id` (UUID PK), `candidate_id` (UUID FK → `user_profiles.id` ON DELETE CASCADE), `institution`, `degree`, `field_of_study`, `start_year`, `end_year`, `grade`, `description`, `created_at`, `updated_at`. RLS: Public Read (if public), Owner CRUD.
- **`candidate_projects`**: `id` (UUID PK), `candidate_id` (UUID FK → `user_profiles.id` ON DELETE CASCADE), `title`, `description`, `technologies` (TEXT[]), `project_url`, `github_url`, `start_date`, `end_date`, `created_at`, `updated_at`. RLS: Public Read (if public), Owner CRUD.
- **`candidate_certifications`**: `id` (UUID PK), `candidate_id` (UUID FK → `user_profiles.id` ON DELETE CASCADE), `name`, `issuing_org`, `issue_date`, `expiration_date`, `credential_id`, `credential_url`, `created_at`, `updated_at`. RLS: Public Read (if public), Owner CRUD.
- **`candidate_achievements`**: `id` (UUID PK), `candidate_id` (UUID FK → `user_profiles.id` ON DELETE CASCADE), `title`, `issuer`, `date_awarded`, `description`, `created_at`, `updated_at`. RLS: Public Read (if public), Owner CRUD.

---

## 3. Row-Level Security & Policy Summary

All user-facing tables enforce strict RLS policies:
- **Public Reads**: `opportunities` (where `is_active = true`), `organizations`, `news_articles`, `user_profiles` (public fields).
- **Candidate Scoped**: `applications` (`user_id = auth.uid()`), `saved_opportunities` (`user_id = auth.uid()`), `user_resumes` (`user_id = auth.uid()`).
- **Employer Scoped**: `opportunities` mutations (`created_by = auth.uid() OR employer_id = auth.uid()`), `recruiter_saved_candidates`, `employer_settings`, `workspace_members`, `company_claims`.
- **Admin Full Access**: Service role client and users with `role = 'admin'` bypass tenant filters for platform management.

---

## 4. Cross-DB Reference Pattern

Since DB1 and DB2 are separate Supabase projects, foreign key relationships between them are enforced at the application level, not the database level:
- `DB2.applications.opportunity_id` → `DB1.opportunities.id`
- `DB2.saved_opportunities.opportunity_id` → `DB1.opportunities.id`
- `DB2.feed_posts.opportunity_id` → `DB1.opportunities.id`

Application code validates these references before writes.
