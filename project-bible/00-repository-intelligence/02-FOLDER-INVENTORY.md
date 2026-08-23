# 02-FOLDER-INVENTORY — Recursive Directory Structure

```
frontend/
├── src/
│   ├── app/                      App Router Pages & Route Handlers
│   │   ├── (public)/             Landing, Opportunities, News, Academy, Organizations
│   │   ├── dashboard/            Candidate Cockpit
│   │   ├── employer/             Employer & Recruiter Suite
│   │   │   ├── jobs/             Employer Job Listing & CRUD
│   │   │   ├── post-job/         Job Posting Studio
│   │   │   ├── applicants/       Multi-Stage ATS Pipeline
│   │   │   ├── talent/           Candidate Discovery & Dossiers
│   │   │   ├── messages/         Recruiter Direct Messaging
│   │   │   ├── company/          Company Profile & Branding
│   │   │   ├── team/             Recruitment Team Seats
│   │   │   ├── settings/         Employer Alert & Stage Settings
│   │   │   └── analytics/        Scoped Employer Analytics
│   │   ├── admin/                Admin Moderation & Scraper Health
│   │   └── api/                  165 Serverless Route Handlers
│   ├── components/               React Components (Profile, ATS, Feed, Nav)
│   ├── lib/                      Shared Utilities (Auth, Database, AI, Scrapers)
│   └── types/                    TypeScript Type Contracts
backend/
├── server/                       Standalone Express REST Server
├── api/                          OpenAPI Specs & Contract Tests
├── ai-gateway/                   Multi-Provider LLM Gateway
└── worker/                       Background Scraper Cron Worker
project-bible/                    Authoritative Knowledge Layer
```
