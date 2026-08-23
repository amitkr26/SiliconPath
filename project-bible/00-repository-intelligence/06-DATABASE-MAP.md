# 06-DATABASE-MAP — Authoritative Database Schema & Entities

**Primary Production Database:** Supabase PostgreSQL 15 (`aqauempuwmbizqoaolop`)  
**Secondary Analytics Database:** Neon PostgreSQL (`neondb`)

---

## 1. Core Production Tables

1. **`user_profiles`**:
   - `id` (UUID PK FK auth.users), `email`, `username` (lower unique index), `full_name`, `role`, `headline`, `bio`, `location`, `skills`, `avatar_url`, `created_at`, `updated_at`.
2. **`opportunities`**:
   - `id` (UUID PK), `title`, `slug` (UNIQUE), `organization_id` (FK organizations), `created_by` (UUID FK user_profiles), `employer_id` (UUID FK user_profiles), `job_status` (active, paused, closed, draft), `screening_questions` (JSONB), `category`, `location`, `salary_range`, `eligibility`, `description`, `apply_url`, `tags`, `is_active`, `posted_date`, `created_at`, `updated_at`.
3. **`applications`**:
   - `id` (UUID PK), `opportunity_id` (FK opportunities), `user_id` (FK user_profiles), `status` (applied, screening, shortlisted, interview, accepted, rejected), `notes`, `applied_at`, `updated_at`.
4. **`candidate_experiences`** (Phase 9):
   - `id` (UUID PK), `candidate_id` (FK user_profiles ON DELETE CASCADE), `company_name`, `role_title`, `employment_type`, `location`, `start_date`, `end_date`, `is_current`, `description`, `skills_used`, timestamps.
5. **`candidate_educations`** (Phase 9):
   - `id` (UUID PK), `candidate_id` (FK user_profiles ON DELETE CASCADE), `institution`, `degree`, `field_of_study`, `start_year`, `end_year`, `grade`, `description`, timestamps.
6. **`candidate_projects`** (Phase 9):
   - `id` (UUID PK), `candidate_id` (FK user_profiles ON DELETE CASCADE), `title`, `description`, `technologies`, `project_url`, `github_url`, `start_date`, `end_date`, timestamps.
7. **`candidate_certifications`** (Phase 9):
   - `id` (UUID PK), `candidate_id` (FK user_profiles ON DELETE CASCADE), `name`, `issuing_org`, `issue_date`, `expiration_date`, `credential_id`, `credential_url`, timestamps.
8. **`candidate_achievements`** (Phase 9):
   - `id` (UUID PK), `candidate_id` (FK user_profiles ON DELETE CASCADE), `title`, `issuer`, `date_awarded`, `description`, timestamps.
9. **`company_claims`**:
   - `id` (UUID PK), `organization_id` (FK organizations), `claimed_by` (FK user_profiles), `status` (pending, approved, rejected), `reviewed_by`, `reviewed_at`, `message`, timestamps.
10. **`recruiter_saved_candidates`**:
    - `id` (UUID PK), `employer_id` (FK user_profiles), `candidate_id` (FK user_profiles), `note`, timestamps. Constraint: `UNIQUE(employer_id, candidate_id)`.
11. **`employer_settings`**:
    - `employer_id` (UUID PK FK user_profiles), `email_alerts`, `instant_applicant_alert`, `weekly_digest`, `dm_notifications`, `default_stage_notes`, timestamps.
12. **`workspace_members`**:
    - `id` (UUID PK), `employer_id` (FK user_profiles), `email`, `role` (owner, admin, recruiter, hiring_manager), `status`, timestamps. Constraint: `UNIQUE(employer_id, email)`.
13. **`connections` & `user_follows`**:
    - Relational social network tables with bidirectional unique invariants and follow triggers.
14. **`conversations` & `messages`**:
    - Direct messaging tables with participant constraints and timestamp triggers.
15. **`notifications`**:
    - Real-time notification entity with unread badge counters.
