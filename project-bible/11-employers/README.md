# Employer & Recruiter Portal Suite

## 1. Overview

The Employer & Recruiter portal (`BerojgarDegreeWala | Employer Suite`) operates inside the unified Next.js application, co-existing with the Public, Candidate, and Admin surfaces while sharing the unified Supabase database and authentication.

It delivers a dedicated hiring product comparable to LinkedIn Recruiter or Indeed Employer, with zero exposure of candidate-only controls.

---

## 2. Four Authoritative Surfaces

1. **Public Intelligence**: News, Opportunities, Academy, Organizations, Resources, Search.
2. **Candidate Career Platform**: Feed, Applications, Saved, Resume, Network, Messages, Profile.
3. **Employer / Recruiter Suite**: Cockpit Dashboard, Job Management, ATS Applicant Pipeline, Candidate Talent Sourcing, Recruiter Messaging, Company & Lab Profile, Team Seats, Analytics, Post Position Studio.
4. **Admin Control Center**: Opportunity Verification, Scrapers Fleet, Analytics, Announcements.

---

## 3. Employer Pages & Route Matrix

| Route | Feature Description | Backed By |
|---|---|---|
| `/employer` & `/employer/dashboard` | Recruiter cockpit with live metrics, applicant stream, and active postings | `opportunities`, `applications`, `user_profiles` |
| `/employer/jobs` | Job postings manager (All, Active, Paused), 1-click status pause/resume, share URL | `opportunities`, `organizations` |
| `/employer/jobs/[id]` | Single job detail with metric counters and applicant overview | `opportunities`, `applications` |
| `/employer/jobs/[id]/edit` | Dedicated position editor | `opportunities` |
| `/employer/jobs/[id]/applicants` | Single job applicant review pipeline | `applications`, `user_profiles` |
| `/employer/post-job` & `/employer/jobs/new` | Multi-step Post Position Studio with DST JRF/SRF quick-fill templates | `opportunities`, `organizations` |
| `/employer/applicants` | Multi-stage Applicant Tracking System (ATS) (Applied, Screening, Shortlisted, Interview, Accepted, Rejected) | `applications`, `user_profiles` |
| `/employer/applicants/[id]` | Candidate Application Inspector with stage advancement and recruiter notes | `applications`, `user_profiles` |
| `/employer/talent` | Candidate Talent Sourcing search engine with domain and experience filters | `user_profiles` |
| `/employer/talent/[username]` | Candidate talent dossier with Direct Reachout & Invitation Modal | `user_profiles`, `opportunities` |
| `/employer/messages` | Recruiter Candidate Messaging interface | `conversations`, `messages` |
| `/employer/company` & `/employer/company/edit` | Company & Research Lab workspace branding and EDA infrastructure | `company_pages`, `organizations` |
| `/employer/company-claim` | Official domain and company claim verification review | `company_claims`, `organizations` |
| `/employer/team` | Recruiting team seats & permission management (Owner, Admin, Recruiter, Hiring Manager) | `workspace_members` |
| `/employer/settings` | Notification preferences, application alerts, and security settings | `employer_settings` |
| `/employer/analytics` | Live SQL-computed conversion velocities and recruitment funnel | `opportunities`, `applications` |

---

## 4. Employer API Suite (`/api/employer/*`)

| Endpoint | Method | Purpose | Auth & IDOR Check |
|---|---|---|---|
| `/api/employer/stats` | `GET` | Summary counters for cockpit dashboard | Authenticated Employer |
| `/api/employer/jobs` | `GET`, `POST` | List employer jobs, create new position | `created_by = auth.uid()` |
| `/api/employer/jobs/[id]` | `GET`, `PATCH`, `DELETE` | Read, mutate, delete single job | Strict IDOR check: `created_by === user.id \|\| employer_id === user.id` |
| `/api/employer/applicants` | `GET` | Filter applicants across all or specific job | Scoped to employer's jobs only |
| `/api/employer/applicants/[id]` | `GET`, `PATCH` | View dossier, mutate stage, save notes | Strict IDOR check: verifies employer owns job |
| `/api/employer/talent` | `GET` | Search candidates across verified profiles | Authenticated Employer |
| `/api/employer/talent/[username]` | `GET` | Fetch detailed candidate profile | Authenticated Employer |
| `/api/employer/invite` | `POST` | Dispatch direct job interview invitation | Verifies employer owns job; creates conversation + message + notification |
| `/api/employer/saved-candidates` | `GET`, `POST`, `DELETE` | Manage recruiter starred candidates list | `recruiter_saved_candidates` table; employer isolated |
| `/api/employer/company` | `GET`, `PATCH` | Read/update company workspace profile | Authenticated Employer |
| `/api/employer/claim` | `GET`, `POST`, `PATCH` | Submit claim, review claims (Admin) | `company_claims` table; Admin review RBAC |
| `/api/employer/team` | `GET`, `POST`, `DELETE` | Manage workspace recruiter seats | `workspace_members` table; employer isolated |
| `/api/employer/settings` | `GET`, `PATCH` | Read/update recruiter notification settings | `employer_settings` table; employer isolated |
| `/api/employer/analytics` | `GET` | Live recruitment funnel and velocity computation | Scoped strictly to employer's jobs |

---

## 5. Security & IDOR Enforcement

- **Dual-Token Helper** (`frontend/src/lib/employer-auth.ts`): Universal authentication extracting JWT from cookies and `Authorization: Bearer` headers.
- **Strict Server Boundary**: Non-employers receive HTTP 403 Forbidden; unauthenticated requests receive HTTP 401 Unauthorized.
- **IDOR Protection**: 7 active cross-employer attack scenarios verified blocked with HTTP 403.
- **Case-Insensitive Usernames**: Enforced at the database level via `user_profiles_username_lower_key`.
- **Zero Production Mocks**: All simulated delays and placeholder data eliminated across all employer flows.