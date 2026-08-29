# PRODUCTION SCHEMA SNAPSHOT (SUPABASE DB1 — `aqauempuwmbizqoaolop`)

**Date:** 2026-08-23  
**Verified Method:** Live direct PostgreSQL PostgREST inspection  
**Project Ref:** `aqauempuwmbizqoaolop` (`https://aqauempuwmbizqoaolop.supabase.co`)

---

## 1. Table Inventory

| Table Name | Physical State | Primary Key | Foreign Keys | RLS |
| :--- | :--- | :--- | :--- | :--- |
| **`user_profiles`** | **LIVE** | `id uuid PK` | `auth.users(id)` | Enabled |
| **`opportunities`** | **LIVE** | `id uuid PK` | `organization_id -> organizations(id)`, `created_by -> user_profiles(id)`, `employer_id -> user_profiles(id)` | Enabled |
| **`applications`** | **LIVE** | `id uuid PK` | `opportunity_id -> opportunities(id)`, `user_id -> user_profiles(id)` | Enabled |
| **`candidate_experiences`** | **LIVE** | `id uuid PK` | `candidate_id -> user_profiles(id) CASCADE` | Enabled |
| **`candidate_educations`** | **LIVE** | `id uuid PK` | `candidate_id -> user_profiles(id) CASCADE` | Enabled |
| **`candidate_projects`** | **LIVE** | `id uuid PK` | `candidate_id -> user_profiles(id) CASCADE` | Enabled |
| **`candidate_certifications`** | **LIVE** | `id uuid PK` | `candidate_id -> user_profiles(id) CASCADE` | Enabled |
| **`candidate_achievements`** | **LIVE** | `id uuid PK` | `candidate_id -> user_profiles(id) CASCADE` | Enabled |
| **`connections`** | **LIVE** | `id uuid PK` | `requester_id -> user_profiles(id)`, `addressee_id -> user_profiles(id)` | Enabled |
| **`user_follows`** | **LIVE** | `id uuid PK` | `follower_id -> user_profiles(id)`, `following_id -> user_profiles(id)` | Enabled |
| **`conversations`** | **LIVE** | `id uuid PK` | `participant_a -> user_profiles(id)`, `participant_b -> user_profiles(id)` | Enabled |
| **`messages`** | **LIVE** | `id uuid PK` | `conversation_id -> conversations(id)`, `sender_id -> user_profiles(id)` | Enabled |
| **`notifications`** | **LIVE** | `id uuid PK` | `user_id -> user_profiles(id)` | Enabled |
| **`company_claims`** | **LIVE** | `id uuid PK` | `organization_id -> organizations(id)`, `claimed_by -> user_profiles(id)` | Enabled |
| **`recruiter_saved_candidates`**| **LIVE** | `id uuid PK` | `employer_id -> user_profiles(id)`, `candidate_id -> user_profiles(id)` | Enabled |
| **`employer_settings`** | **LIVE** | `employer_id uuid PK` | `employer_id -> user_profiles(id)` | Enabled |
| **`workspace_members`** | **LIVE** | `id uuid PK` | `employer_id -> user_profiles(id)` | Enabled |
| **`organizations`** | **LIVE** | `id uuid PK` | — | Enabled |
| **`news_articles`** | **LIVE** | `id uuid PK` | — | Enabled |
| **`feed_posts`** | **LIVE** | `id uuid PK` | `user_id -> user_profiles(id)` | Enabled |

---

## 2. Detailed Column Structure of Reconciled Tables

### `opportunities`
```sql
id (uuid PK)
title (text NOT NULL)
slug (text UNIQUE)
organization_id (uuid FK -> organizations.id)
category (text CHECK in ('jrf', 'srf', 'phd', 'fellowship', 'government', 'internship'))
specialization (text)
description (text)
eligibility (text)
location (text)
country (text)
is_international (boolean)
is_remote (boolean)
salary_range (text)
apply_url (text)
deadline (date)
posted_date (date)
verification_status (text DEFAULT 'unverified')
source_type (text)
source_url (text)
scrape_source_id (uuid)
tags (text[])
is_active (boolean DEFAULT true)
view_count (integer DEFAULT 0)
created_at (timestamptz DEFAULT now())
updated_at (timestamptz DEFAULT now())
organization (text)
apply_clicks (integer DEFAULT 0)
last_link_checked (timestamptz)
link_check_status (text)
verified_at (timestamptz)
created_by (uuid FK -> user_profiles.id)
employer_id (uuid FK -> user_profiles.id)
job_status (text DEFAULT 'active' CHECK in ('active', 'paused', 'closed', 'draft'))
screening_questions (jsonb DEFAULT '[]')
```

### `employer_settings`
```sql
employer_id (uuid PK FK -> user_profiles.id)
email_alerts (boolean DEFAULT true)
instant_applicant_alert (boolean DEFAULT true)
weekly_digest (boolean DEFAULT true)
dm_notifications (boolean DEFAULT true)
default_stage_notes (text)
created_at (timestamptz DEFAULT now())
updated_at (timestamptz DEFAULT now())
```

### `workspace_members`
```sql
id (uuid PK DEFAULT gen_random_uuid())
employer_id (uuid NOT NULL REFERENCES user_profiles(id))
email (text NOT NULL)
role (text DEFAULT 'recruiter' CHECK in ('owner', 'admin', 'recruiter', 'hiring_manager'))
status (text DEFAULT 'active')
created_at (timestamptz DEFAULT now())
updated_at (timestamptz DEFAULT now())
CONSTRAINT workspace_members_employer_email_key UNIQUE (employer_id, email)
```

### `recruiter_saved_candidates`
```sql
id (uuid PK DEFAULT gen_random_uuid())
employer_id (uuid NOT NULL REFERENCES user_profiles(id))
candidate_id (uuid NOT NULL REFERENCES user_profiles(id))
note (text)
created_at (timestamptz DEFAULT now())
updated_at (timestamptz DEFAULT now())
CONSTRAINT recruiter_saved_candidates_employer_candidate_key UNIQUE (employer_id, candidate_id)
```

### `candidate_experiences`
```sql
id (uuid PK DEFAULT gen_random_uuid())
candidate_id (uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE)
company_name (text NOT NULL)
role_title (text NOT NULL)
employment_type (text DEFAULT 'Full-time' CHECK in ('Full-time', 'Part-time', 'Internship', 'Contract', 'Research', 'Apprenticeship'))
location (text)
start_date (date NOT NULL)
end_date (date)
is_current (boolean DEFAULT false)
description (text)
skills_used (text[] DEFAULT '{}')
created_at (timestamptz DEFAULT now())
updated_at (timestamptz DEFAULT now())
CONSTRAINT check_current_end_date CHECK ((is_current = true AND end_date IS NULL) OR (is_current = false))
```
