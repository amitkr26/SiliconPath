# 07-API-MAP — Master API Route Index

## 1. Route Summary
The platform contains **165 Next.js Serverless API Route Handlers** in `frontend/src/app/api/`:

- `/api/opportunities`: Public search, filtering, pagination, creation.
- `/api/profile/me/*`: Candidate profile, experience, education, projects, certifications, achievements CRUD.
- `/api/profile/[userId]/*`: Public and scoped candidate profile inspection.
- `/api/network/*`: Connections, suggestions, followers, following, mutual connections graph.
- `/api/messages/*`: Direct messaging conversations and thread creation.
- `/api/employer/jobs/*`: Employer job creation, updates, status toggles, deletion.
- `/api/employer/applicants/*`: ATS pipeline applicant inspection and stage progression.
- `/api/employer/talent/*`: Recruiter candidate discovery and dossier inspection.
- `/api/employer/invite`: Job candidate interview invitations.
- `/api/employer/company`: Employer company branding.
- `/api/employer/company-claim`: Verification claim submission and status check.
- `/api/employer/team`: Workspace seat addition and removal.
- `/api/employer/settings`: Employer alert and stage configuration.
- `/api/employer/stats`: Scoped employer metrics and KPI analytics.
- `/api/ai/*`: AI chat, matching, semantic search, summarization.
- `/api/admin/*`: Scraper health, moderation, announcements.
