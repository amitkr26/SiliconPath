# Engineering Backlog

## Overview

Complete engineering backlog for the BerojgarDegreeWala platform, derived from
the Project Bible specification and validated against the existing repository.
Per-epic status annotated 2026-08-19 against the code.

## Epic Index

| Epic | Title | Status (2026-08-19) | Notes |
|------|-------|---------------------|-------|
| 01 | Infrastructure & Monorepo Restructure | DONE | npm workspaces: `backend/api`, `backend/ai-gateway`, `backend/server`, `frontend` |
| 02 | API Route Completion | PARTIAL | 136 Next.js route files in `frontend/src/app/api`; backend parity in progress (`backend/docs/API-PARITY.md`: 7 COMPLETE / 8 PARTIAL / ~95 MISSING) |
| 03 | UI Component Library | PARTIAL | Shared components exist across the app; no consolidated library deliverable |
| 04 | Social & Engagement Features | DONE | Production E2E 9/9 (2026-08-18/19); social core E2E 17/17; see CHANGELOG 2026-08-18/19 |
| 05 | Employer Tools | PARTIAL | Posting (POST/PATCH jobs, dashboard) done; ATS (applicant list, status workflow) not built |
| 06 | AI Gateway & Intelligence | DONE | 9 providers in `backend/ai-gateway` `PROVIDER_CONFIG` (groq, gemini, nvidia, openrouter, bedrock, cloudflare, huggingface, agentrouter, omnirouter) |
| 07 | Database & Schema Consolidation | PARTIAL | DB1/DB2 split live; drift items remain (see audit reports 2026-08-16/18) |
| 08 | Scraper Consolidation | DONE | 18 scraper/ATS modules consolidated in `frontend/src/lib/scrapers` |
| 09 | Testing Infrastructure | DONE | 104 jest tests + 6 playwright specs (production E2E 9/9) |
| 10 | Security Hardening | MOSTLY DONE | See `13-security/README.md`; known issue: stale Project 1 service-role key in local `siliconpath-credentials.txt` |
| 11 | Performance & Scale | PARTIAL | PWA task 11.3.3.1 OPEN — only a stray `public/manifest.json` exists, no service worker |
| 12 | Documentation & Machine Specs | PARTIAL | This reconciliation (2026-08-19) |

## Priority Definitions

- **P0**: Must do before any feature work — infrastructure, security, data integrity
- **P1**: Core features — social, employer, AI
- **P2**: Quality of life — performance, documentation

## How to Use

1. Start with Epic 07 (Database) then Epic 10 (Security) — fix the foundation
2. Run Epic 09 (Testing) in parallel with any feature work
3. Epic 01 (Monorepo) can be deferred until Phase 4 of the roadmap
4. Feature epics (04, 05, 06) can be implemented in parallel
5. Epic 12 (Docs) should be updated continuously

## Dependency Graph

```
Epic 07 (DB) ──→ Epic 10 (Security) ──→ Epic 02 (API) ──→ Epic 04 (Social)
                                    │                    └──→ Epic 05 (Employers)
                                    └──→ Epic 09 (Tests) ──→ Epic 03 (UI)
Epic 08 (Scrapers) ──→ Epic 06 (AI) ──→ Epic 11 (Performance)
Epic 01 (Monorepo) ──→ (all epics, optional infra)
Epic 12 (Docs) ──→ (continuous, track after each epic)
```

## Backend Replication (active work)

Baseline: frontend is the source of truth; parity is COPY/REIMPLEMENT, never a
destructive move (see `21-governance/README.md`). The backend is not deployed.

Docs: `backend/docs/API-PARITY.md` (generated 2026-08-19 from full audit).

Active tasks, in priority order (from API-PARITY):

1. Social layer — DB2 client wired; feed/network/messages/notifications/community
   routes still MISSING in server
2. AI endpoint breadth + `ai_usage_log` usage logging (server never calls
   `gateway.setLogger`)
3. Cron/scraper port — news sync first (`/api/v1/cron/news-sync`), then
   archive/cleanup/expire routes
4. News `:slug` + search (people) + `auth/signup`
5. Admin breadth — server has `GET /api/v1/admin/stats` only