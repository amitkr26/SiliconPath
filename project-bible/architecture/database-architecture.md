# Database Architecture & Data Integrity Standards

**Platform**: BerojgarDegreeWala  
**Database Engines**: Supabase PostgreSQL (Primary OLTP) & Neon Serverless Postgres (Telemetry & Edge Cache)  
**Document Version**: 1.0 (Phase 30 Unified Architecture)  

---

## 1. Hybrid Multi-Database Architecture

```
                                  ┌────────────────────────┐
                                  │   Next.js 14 Web App   │
                                  │   (Vercel Edge / Node) │
                                  └───────────┬────────────┘
                                              │
                     ┌────────────────────────┴────────────────────────┐
                     ▼                                                 ▼
        ┌─────────────────────────┐                       ┌─────────────────────────┐
        │  Supabase PostgreSQL    │                       │  Neon Serverless PG     │
        │  (Primary OLTP DB)      │                       │  (Telemetry & Edge)     │
        ├─────────────────────────┤                       ├─────────────────────────┤
        │ • user_profiles         │                       │ • click_events          │
        │ • user_resumes          │                       │ • search_queries        │
        │ • opportunities         │                       │ • page_views            │
        │ • applications          │                       │ • keyword_stats         │
        │ • feed_posts & comments │                       │ • trending_cache        │
        │ • messages & convos     │                       │ • news_mirror           │
        │ • organizations         │                       │ • opportunities_mirror  │
        │ • scrape_sources & runs │                       └─────────────────────────┘
        └─────────────────────────┘
```

---

## 2. Core Relational Schemas (Supabase PostgreSQL)

### 2.1 Identity & User Profiles
- **`user_profiles`**:
  - Primary Key: `id UUID REFERENCES auth.users(id) ON DELETE CASCADE`
  - Attributes: `display_name`, `username (UNIQUE)`, `email`, `avatar_url`, `headline`, `bio`, `location`, `country`, `account_type`, `job_title`, `current_company`, `experience_years`, `skills TEXT[]`, `interests TEXT[]`, `linkedin_url`, `github_url`, `website_url`, `is_profile_public`, `is_open_to_work`, `created_at`, `updated_at`.
- **Child Profile Section Tables**:
  - `candidate_experiences`: `(id UUID, candidate_id UUID FK, company_name, role_title, start_date, end_date, is_current, description, skills_used TEXT[])`
  - `candidate_educations`: `(id UUID, candidate_id UUID FK, institution, degree, field_of_study, start_year, end_year, grade)`
  - `candidate_projects`: `(id UUID, candidate_id UUID FK, title, description, technologies TEXT[], project_url, github_url)`
  - `candidate_certifications`: `(id UUID, candidate_id UUID FK, name, issuing_org, issue_date, expiration_date, credential_url)`
  - `candidate_achievements`: `(id UUID, candidate_id UUID FK, title, issuer, date_awarded, description)`

### 2.2 Opportunities & Applications
- **`opportunities`**:
  - Primary Key: `id UUID DEFAULT gen_random_uuid()`
  - Attributes: `title`, `slug (UNIQUE)`, `organization_id UUID FK`, `category`, `specialization`, `description`, `eligibility`, `location`, `country`, `is_remote`, `salary_range`, `apply_url`, `deadline TIMESTAMPTZ`, `verification_status`, `source_type`, `source_url`, `is_active`, `view_count`, `created_at`, `updated_at`.
- **`applications`**:
  - Primary Key: `id UUID DEFAULT gen_random_uuid()`
  - Attributes: `user_id UUID FK`, `opportunity_id UUID FK`, `status (applied|review|interview|offered|rejected)`, `applied_at`, `notes`, `updated_at`.

### 2.3 Social Community & Networking
- **`feed_posts`**: `(id UUID, author_id UUID FK, content, media_urls TEXT[], opportunity_id UUID FK, like_count, comment_count, created_at)`
- **`feed_post_comments`**: `(id UUID, post_id UUID FK, user_id UUID FK, parent_comment_id UUID FK, content, created_at)`
- **`feed_post_likes`**: `(id UUID, post_id UUID FK, user_id UUID FK, reaction, created_at)` (Unique: `post_id, user_id`)
- **`conversations`**: `(id UUID, participant_a UUID FK, participant_b UUID FK, last_message_at, created_at)`
- **`messages`**: `(id UUID, conversation_id UUID FK, sender_id UUID FK, body, is_read, created_at)`
- **`connections`**: `(id UUID, requester_id UUID FK, addressee_id UUID FK, status, created_at, updated_at)`
- **`skill_endorsements`**: `(id UUID, profile_owner_id UUID FK, endorser_id UUID FK, skill, created_at)`

---

## 3. Migration & Safety Rules

1. **Never Make Undocumented DDL Changes**: Every change must be in a versioned migration file.
2. **Preserve Historical Data**: Inactive or expired opportunities, accounts, and applications are marked `archived` or `inactive`, never hard-deleted without backup.
3. **No Duplicate Concepts**: Single canonical table for each entity domain.
