# Employer & Recruiter Portal Suite

## Overview

A dedicated, full-featured Employer & Recruiter portal (`BerojgarDegreeWala | Employer Suite`) operating inside the Next.js application, co-existing with the Public, Candidate, and Admin surfaces while sharing the unified Supabase database and authentication.

---

## Authoritative Surfaces & Architecture

1. **Public Intelligence**: News, Opportunities, Academy, Organizations, Resources.
2. **Candidate Career Platform**: Feed, Applications, Saved, Resume, Network, Messages.
3. **Employer / Recruiter Suite**: Cockpit Dashboard, Job Management, ATS Applicant Pipeline, Candidate Talent Sourcing, Recruiter Messaging, Company & Lab Profile, Team Seats, Analytics, Post Position Studio.
4. **Admin Control Center**: Opportunity Verification, Scrapers Fleet, Analytics, Announcements.

---

## Implemented Routes & Features

| Route | Feature Description | Backed By |
|---|---|---|
| `/employer/dashboard` | Recruiter cockpit with live metrics, applicant stream, and active postings | `opportunities`, `applications`, `user_profiles` |
| `/employer/jobs` | Job postings manager (All, Active, Paused), 1-click status pause/resume, share URL | `opportunities`, `organizations` |
| `/employer/jobs/[id]` | Single job detail with metric counters and applicant overview | `opportunities`, `applications` |
| `/employer/jobs/[id]/edit` | Dedicated position editor | `opportunities` |
| `/employer/jobs/[id]/applicants` | Single job applicant review pipeline | `applications`, `user_profiles` |
| `/employer/post-job` & `/employer/jobs/new` | Multi-step Post Position Studio with DST JRF/SRF quick-fill templates | `opportunities`, `organizations` |
| `/employer/applicants` | Multi-stage Applicant Tracking System (ATS) (Applied, Screening, Shortlisted, Interview, Accepted, Rejected) | `applications`, `user_profiles` |
| `/employer/applicants/[id]` | Candidate Application Inspector with stage advancement and recruiter notes | `applications`, `user_profiles` |
| `/employer/talent` | Candidate Talent Sourcing search engine with domain and experience filters | `user_profiles` |
| `/employer/talent/[username]` | Candidate talent dossier with Direct Invitation Modal | `user_profiles`, `opportunities` |
| `/employer/messages` | Recruiter Candidate Messaging interface | `conversations`, `messages` |
| `/employer/analytics` | Recruitment Pipeline Funnel and conversion analytics | `opportunities`, `applications` |
| `/employer/company` & `/employer/company/edit` | Company & Research Lab workspace branding and EDA infrastructure | `company_pages`, `organizations` |
| `/employer/team` | Recruiting team seats & permission management (Owner, Recruiter, Hiring Manager) | `user_profiles` |
| `/employer/settings` | Notification preferences, application alerts, and security settings | Local & DB |

---

## Security & RBAC Enforcement

- **Server-Side Gate**: `frontend/src/middleware.ts` enforces `EMPLOYER_ONLY_PATHS` (`/employer/*`, `/api/employer/*`, `/post-job`, `/employers`). Non-employers are redirected to `/` with 403 status.
- **IDOR Protection**: Every job mutation and applicant review endpoint (`/api/employer/jobs/[id]`, `/api/employer/applicants/[id]`) strictly validates that the requesting employer owns the opportunity (`created_by === user.id || employer_id === user.id` or `role === admin`).
- **Global Usernames**: Every human recruiter receives a unique `@username` handle stored in `user_profiles.username` alongside the company's `/company/[slug]`.