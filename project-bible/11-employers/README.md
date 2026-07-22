# Employer Features

## Overview

The employer module enables organizations and recruiters to post opportunities, manage applications, and access candidate profiles on BerojgarDegreeWala.

## Current Status

**Employer features are planned but not yet implemented.** The `user_profiles` table includes `company_*` fields, and the database has `company_profiles` and `applications` tables, but the employer-facing UI and API routes are not built.

## Planned Features

### Company Profiles
- Organization can claim a profile page
- Add description, logo, website, social links, size, industry
- Verified badge for confirmed employers

### Employer Dashboard
- Manage company profile
- Post/review/edit opportunities
- View applicants for each opportunity
- Communication tools (in-app messaging or email)

### Application Management
- Applications stored in `applications` table
- Status workflow: submitted → reviewed → shortlisted → rejected → accepted
- Notes/history per application
- Bulk actions

### Candidate Discovery
- Search user profiles
- Filter by skills, experience, track completions
- Connection request to candidates

## Database Tables

```sql
company_profiles (
  id UUID PK,
  user_id UUID FK → auth.users,
  name TEXT,
  slug TEXT UNIQUE,
  description TEXT,
  logo_url TEXT,
  website TEXT,
  linkedin_url TEXT,
  size TEXT, -- 1-10, 11-50, 51-200, 201-1000, 1000+
  industry TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

applications (
  id UUID PK,
  opportunity_id UUID FK → opportunities,
  user_id UUID FK → auth.users,
  status TEXT DEFAULT 'submitted',
  cover_letter TEXT,
  resume_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

## Future Work

1. Employer onboarding flow (claim company → verify → dashboard intro)
2. Job posting form with validation
3. Application review interface
4. Candidate search and filtering
5. Notification system for new applications
6. Employer analytics

## Related Documents

- [employer-flow.md](./employer-flow.md) — Employer user journey
- [company-profiles.md](./company-profiles.md) — Company profile spec
