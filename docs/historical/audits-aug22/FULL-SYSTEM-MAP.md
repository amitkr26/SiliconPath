⚠️ SUPERSEDED by 2026-08-29 Final Platform Reality Audit. This map reflects Aug 22 state only.

# SiliconPath / BerojgarDegreeWala — Full System Map

## Version
2026-08-22 (Post-Forensic-Gate)

## Last Generated
2026-08-22 from code inspection

---

## 1. ARCHITECTURAL OVERVIEW

SiliconPath operates as a **modular monolith** on Next.js 14 (App Router) deployed to Vercel, backed by a unified Supabase PostgreSQL database (`aqauempuwmbizqoaolop`) and Neon analytics database.

The application serves **four discrete, authoritative user experiences** from a single codebase and authentication system:

1. **Public Portal**: Deep-tech intelligence, news, opportunities, academy, and search
2. **Candidate Portal**: Career management, applications, saved jobs, networking, messaging, and profile/resume builder
3. **Employer / Recruiter Suite**: Full recruitment cockpit, job posting studio, multi-stage ATS pipeline, talent sourcing, recruiter messaging, company branding, team seats, settings, and analytics
4. **Admin Console**: Opportunity verification, scraping fleet health, announcements, and platform performance

---

## 2. CORE COMPONENTS

### 2.1 Frontend
- **Framework**: Next.js 14 (App Router)
- **Deployment**: Vercel
- **UI Primitives**: Custom `ui/` primitives (Button, Card, Badge, Input, SectionHeader) using `design-tokens.ts`
- **Pages**: `frontend/src/app/` — all routes under App Router
- **API Routes**: `frontend/src/app/api/` — all backend handlers
- **Middleware**: `frontend/src/middleware.ts` — auth/rate-limit/CSP headers

### 2.2 Backend (Supabase)
- **Database**: Supabase PostgreSQL (DB1 — core platform data), Neon (DB2 — user/social, DB3 — analytics)
- **Auth**: Supabase Auth (email/password + Google OAuth)
- **RLS**: Row Level Security on core tables
- **REST/GraphQL**: Supabase auto-generated REST API + direct SQL queries via `supabaseAdmin`

### 2.3 Backend Replication (Independent)
- **`backend/server`**: Express on :8080 (Render free plan, deployed 2026-08-20)
- **`backend/worker`**: Scheduled process (`node --import tsx dist/index.js news|isro`)
- **`backend/ai-gateway`**: 9-provider AI chain (Groq, Gemini, OpenRouter, etc.)
- **All share the same Supabase DB1**

### 2.4 Scrapers / Data Ingestion
- **3 Vercel cron jobs**: scrape-opportunities (00:00), check-links (08:00), news/sync (06:00)
- **`frontend/src/lib/scrapers/`**: 18 scraper modules
- **`backend/worker`**: RSS sync + ISRO government scraper replica
- **Shared module**: `backend/api/src/content/news-sync.ts` (single implementation)

### 2.5 AI System
- **Gateway**: `backend/ai-gateway` — 9-provider chain
- **Providers**: Groq (qwen/qwen3.6-27b), Gemini, OpenRouter, NVIDIA, HuggingFace
- **Endpoints**: `/frontend/src/lib/ai/providers.ts`, `/backend/ai-gateway/src/gateway/index.ts`
- **Usage logging**: `services/ai-usage.ts` → `ai_usage_log` table

### 2.6 Cron / Scheduled Jobs
- **Vercel**: 3 crons (scrape-opportunities, check-links, news-sync)
- **Render**: Deployed web service, no cron (Phase 7 decision)
- **Worker**: `backend/worker` process for ISRO scraping + news sync

### 2.6 Environment Configuration
- **`frontend/.env.local`**: Local dev — SUPABASE keys, ADMIN_PASSWORD, AI keys, Telegram/Resend
- **`siliconpath-credentials.txt`**: Local reference only — gitignored, never committed
- **Vercel**: Env vars stored encrypted on platform (not CLI-recoverable)
- **Render**: Env vars on Render dashboard

---

## 3. FOUR DISCRETE PLATFORM SURFACES

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Surface             Layout Shell            Key Pages                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│ 1. Public Portal    Navbar + Footer         /, /opportunities, /news, /academy, │
│                                             /organizations, /resources, /search │
│ 2. Candidate Portal Candidate Layout        /dashboard, /applications, /saved,  │
│                                             /network, /messages, /profile       │
│ 3. Employer Suite   EmployerSuiteShell      /employer/dashboard, /employer/jobs,│
│                     + EmployerNav           /employer/post-job, /employer/talent│
│                                             /employer/applicants, /employer/team│
│                                             /employer/settings, /employer/stats │
│ 4. Admin Console    Admin Dashboard Shell   /admin, /admin/scrape-health,       │
│                                             /admin/companies, /admin/performance│
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. DATABASE FLOW

```
Supabase DB1 (aqauempuwmbizqoaolop)
│
├── Core Tables: opportunities, user_profiles, applications, companies
├── Employer Tables: company_claims, recruiter_saved_candidates, employer_settings, workspace_members
├── Social Tables: user_follows, connections, feed_posts, messages, conversations, notifications
├── Analytics Tables: neon1_analytics events
├── RLS Policies: per-table ownership/scoping
│
└── Triggers: social counts (follower_count, following_count, connection_count)
```

---

## 5. AUTHENTICATION FLOW

```
Browser → Next.js Server → createServerClient (supabase/ssr)
│                                    │
│-- Cookie: sb-...-auth-token        │-- Authorization: Bearer <jwt>
│                                    │
│→ supabase.auth.getUser()           → supabaseAdmin.auth.getUser(token)
│                                    │
│→ user object with user_metadata   → role, account_type
│                                    │
│→ middleware.ts:                    → role gate (employer / admin / provider)
│   - isGated / isEmployerOnly      → 401 unauthenticated
│   - RBAC check                     → 403 forbidden (wrong role)
│                                    │
→ Pages/APIs: useUser() hook         → role-based rendering
→ API routes: getAuthenticatedEmployerUser() → cookie + Bearer token support
```

---

## 6. DEPLOYMENT FLOW

```
Code → Git (main branch)
     ↓
     ↓ Vercel auto-deploy (on push to main)
     ↓ Render auto-deploy (on push to main)
     ↓
Production: https://berojgardegreewala.vercel.app
          https://berojgardegreewala-backend.onrender.com
     ↓
Preview: PR deployments on Vercel
     ↓
Rollback: Git revert + redeploy
```

---

## 7. CRON / SCHEDULED JOBS

```
Vercel Cron (00:00):  scrape-opportunities
                    → government institute notices (ISRO, DRDO, CSIR)
                    → opportunity HTML parse
                    → verification_status: pending (CHECK constraint)

Vercel Cron (06:00):  news/sync
                    → 12 RSS feeds fetch
                    → deduplication by URL
                    → news_articles upsert

Vercel Cron (08:00):  check-links
                    → verify opportunity deadlines
                    → mark link_check_status

Render: Web service only (plan: free)
        No cron (Phase 7 decision: NOT REQUIRED)

Render Worker:  backend/worker dist/index.js news|isro
                Executed by cron or manually
                Exit codes: 0 | 1 | 2
```

---

## 8. EXTERNAL INTEGRATIONS

| Integration | Purpose | Key Config |
|-------------|---------|------------|
| Groq API | AI summarization/chat | `gsk_...` key, model `qwen/qwen3.6-27b` |
| OpenRouter API | Multi-provider fallback | `sk-or-v1-...` key |
| Gemini API | AI alternative | `AQ....` key |
| NVIDIA NIM | AI inference | `nvapi-...` key |
| Cloudflare AI | AI inference | `cfat_...` token |
| HuggingFace | AI models | `hf_...` key |
| Telegram Bot | Notifications | `8951787937:AAEw...` |
| Resend | Email digests | `re_...` key |
| Supabase | Auth + DB | URL + anon + service_role keys |
| Neon DB | Analytics | PostgreSQL connection string |

---

## 9. API ROUTE INVENTORY (SELECTED)

**Employer Routes** (22+ endpoints):
- `/api/employer/jobs` (GET/POST)
- `/api/employer/jobs/[id]` (GET/PATCH/DELETE)
- `/api/employer/applicants` (GET/PATCH)
- `/api/employer/invite` (POST)
- `/api/employer/settings` (GET/PATCH)
- `/api/employer/team` (GET/POST)
- `/api/employer/company` (GET/PATCH)
- `/api/employer/claim` (GET/POST/PATCH)
- `/api/employer/analytics` (GET)

**Public Routes**:
- `/api/opportunities` (GET/list, POST)
- `/api/news` (GET/sync, `:slug`)
- `/api/academy` (GET/[track])
- `/api/organizations` (GET/CRUD)
- `/api/companies` (GET/CRUD)
- `/api/search` (GET)
- `/api/profile/me` (GET)

**Admin Routes**:
- `/api/admin/jobs` (CRUD + verify/reject)
- `/api/admin/companies` (CRUD)
- `/api/admin/scrape-health` (GET)
- `/api/admin/performance` (GET)
- `/api/admin/analytics` (GET)

---

## 10. KEY FINDINGS FROM SYSTEM MAP

1. **Four surfaces are properly discrete** — employer routes isolated from candidate/public
2. **Auth flow supports both cookie and Bearer token** — seamless browser + API testing
3. **Employer RBAC enforced at middleware + API layer** — defense in depth
4. **Migration `20260821000001` adds 4 new tables** but NOT applied to production DB (as of audit)
5. **Two independent backend surfaces** — Vercel (production) + Render (replica/standalone)
6. **Scraper worker runs independently** — not tied to Render cron
7. **Admin authentication separate** — `x-admin-password` HMAC, not Supabase session
8. **Middleware path bug fixed** — `/employers` → `/employer`

---
*Generated from code inspection, middleware.ts, migrations, and API route inventory.*