<div align="center">

# ��� BerojgarDegreeWala

### **India's Premier Verified Portal for Semiconductor, VLSI & Global Research Career Opportunities**

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?style=for-the-badge&logo=docker)](https://www.docker.com/)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-Orchestrated-326CE5?style=for-the-badge&logo=kubernetes)](https://kubernetes.io/)
[![Supabase Primary](https://img.shields.io/badge/Supabase_DB1-Primary-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Supabase Secondary](https://img.shields.io/badge/Supabase_DB2-User_&_Social-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Neon Primary](https://img.shields.io/badge/Neon_DB1-Analytics_&_Logs-00E599?style=for-the-badge&logo=postgresql)](https://neon.tech/)
[![Neon Secondary](https://img.shields.io/badge/Neon_DB2-Search_&_Cache-00E599?style=for-the-badge&logo=postgresql)](https://neon.tech/)
[![Deployment Status](https://img.shields.io/badge/Vercel-Live-000000?style=for-the-badge&logo=vercel)](https://berojgardegreewala.vercel.app)

[**Live Platform**](https://berojgardegreewala.vercel.app) • [**Jobs & Opportunities**](https://berojgardegreewala.vercel.app/opportunities) • [**VLSI Courses**](https://berojgardegreewala.vercel.app/academy) • [**Professional Network**](https://berojgardegreewala.vercel.app/network) • [**Admin Command Center**](https://berojgardegreewala.vercel.app/admin)

> **������ IMPORTANT — 2026-08-14:** Git history was force-rewritten to purge committed secrets (hardcoded Supabase/Neon keys in scripts). **Re-clone or `git fetch origin && git reset --hard origin/main` — do not `git pull`.** See CHANGELOG and SECURITY.md.

</div>

---

## ��� Executive Summary

**BerojgarDegreeWala** is an enterprise-grade career portal and technical learning ecosystem designed specifically for microelectronics, VLSI design, semiconductor manufacturing, embedded systems engineers, and scientific researchers.

By combining real-time multi-source career scrapers, automated RSS news aggregation, structured VLSI Courses, candidate `@username` verified profiles, employer portals, and an AI-driven career assistant with RAG grounding, BerojgarDegreeWala bridges **150+ global national laboratories, universities, semiconductor foundries, and EDA leaders**.

---

## ������ Multi-Database Architecture (4-Database Strategy)

The system operates a high-resilience **Distributed Multi-Database Architecture** utilizing 2 Supabase instances + 2 Neon PostgreSQL connection poolers:

```
                                 ��──────────────────────────────────────────────��
                                 │       BerojgarDegreeWala Application        │
                                 └──────────────────────��───────────────────────��
                                                        │
          ��─────────────────────────��──────────────────��──────────────────��─────────────────────────��
          │                         │                                     │                         │
          ��                         ��                                     ��                         ��
��───────────────────��    ��────────────────────────��            ��───────────────────��    ��───────────────────��
│ Supabase DB 1     │    │ Supabase DB 2          │            │ Neon DB 1         │    │ Neon DB 2         │
│ (Primary App DB)  │    │ (User & Social Layer)  │            │ (Analytics/Logs)  │    │ (Search/Cache)    │
��───────────────────��    └────────────────────────��            └───────────────────��    └───────────────────��
```

| Database Instance | Infrastructure | Purpose & Responsibilities |
| :--- | :--- | :--- |
| **Supabase DB 1 (Primary)** | `NEXT_PUBLIC_SUPABASE_URL` | **Core Public Platform Data**: Opportunities, News Articles, Companies, Scraper Config, Subscribers, Auth (Google/GitHub/Email), Link Check Results, Suggestions. |
| **Supabase DB 2 (Secondary)** | `SUPABASE_2_URL` | **User & Social Layer**: User Profiles (`@username`), Connections/Network, Direct Messages, Feed Posts, Community Posts, Saved Opportunities (Bookmarks), Applications Tracking, Notifications, Skill Endorsements, Recommendations, Company Pages. |
| **Neon DB 1 (Primary)** | `NEON_1_DATABASE_URL` | **Analytics & Operational Logs**: Scraper execution logs, AI usage logs, platform events, link check logs, cron health, error logs. |
| **Neon DB 2 (Secondary)** | `NEON_2_DATABASE_URL` | **Search Acceleration & Cache**: Trending cache, popular companies cache, keyword stats, opportunities search index, API response cache. |

**Cross-DB References**: `saved_opportunities.opportunity_id` and `applications.opportunity_id` in DB2 reference `opportunities.id` in DB1 (same Supabase project in production, logically separate).

---

## ��� 150+ Global Master Source Matrix

### 1. ������� India (Govt, Defence PSUs, Telecom, Power, Railways, Universities)
- **Space & Defence**: DRDO, ISRO, BARC, DAE, IGCAR, RRCAT, VECC, NFC, AERB, ADA, CSIR (CEERI, NPL, CSIO, CMERI, NAL, 4PI, IIP, IMMT, IICT, NEERI, IHBT, CBRI, CCMB, CDRI, CFTRI, NIO, CLRI, NGRI, AMPRI), ICMR, DBT, DST, SERB (ANRF), TIFR, NCBS, JNCASR, ARCI, CSTEP, C-DAC, SAMEER, SCL Mohali, C-MET, NIELIT, STQC, ERNET, MeitY, Digital India Corporation, ISM (India Semiconductor Mission), C2S (Chips to Startup).
- **Defence PSUs**: HAL, BEL, BDL, MIDHANI, BEML, MDL, GSL, GRSE, CSL, AVNL, Yantra India, Munitions India, India Optel, Troop Comforts, AWEIL.
- **Electronics, Telecom & Power**: ECIL, ITI Limited, C-DOT, RailTel, BSNL, MTNL, BHEL, Power Grid, EIL.
- **Railways**: Indian Railways Central, RDSO, RVNL, IRCON, CRIS, DFCCIL.
- **Academic Institutes**: 23 IITs, All NITs, All IIITs, IISc Bangalore, All IISERs, Central & State Universities.

### 2. ������� United States
- **National Labs & Agencies**: DARPA, NASA, NIST, Sandia National Labs, Lawrence Berkeley National Lab (LBNL), Los Alamos National Lab (LANL), Oak Ridge National Lab (ORNL), Argonne National Lab.
- **Top Universities**: MIT, Stanford University, UC Berkeley, Caltech, Carnegie Mellon University (CMU), Georgia Tech, Purdue University, Cornell, UIUC, UCLA, University of Michigan.

### 3. ������� Europe
- **Research Centers & Universities**: CERN, IMEC Belgium, CEA-Leti France, Fraunhofer Society (IIS / IZM), Max Planck Society, CNRS France, ETH Zurich, EPFL Switzerland, TNO Netherlands, Cambridge University, Oxford University, Imperial College London.

### 4. ��� Asia-Pacific & Global Industry Leaders
- **Japan**: RIKEN, AIST, JAXA, NIMS.
- **South Korea**: KAIST, KIST, ETRI.
- **China**: Chinese Academy of Sciences (CAS), Tsinghua University, Peking University.
- **Singapore**: A*STAR, NUS, NTU.
- **Taiwan**: ITRI, Academia Sinica, NTU.
- **Australia**: CSIRO.
- **Top Foundries & Semiconductor Giants**: TSMC, Intel, AMD, NVIDIA, Qualcomm, Broadcom, Samsung Semiconductor, SK hynix, Micron, Texas Instruments, NXP, Infineon, STMicroelectronics, Renesas, ADI, onsemi, GlobalFoundries, UMC, Tower, Wolfspeed, ARM Architecture, Microchip Technology, Espressif Systems, Bosch.
- **Top EDA & Equipment Leaders**: Cadence Design Systems, Synopsys, Siemens EDA, Ansys, Keysight, ASML Lithography, Applied Materials (AMAT), Lam Research, KLA Corporation, Tokyo Electron (TEL).

---

## ��� Tech Stack & Infrastructure Architecture

| Layer | Technology |
| :--- | :--- |
| **Frontend & API** | Next.js 14 (App Router, Standalone Build Output) |
| **Standalone API** | Express 4 + TypeScript (`backend/server`, npm workspace) — mirrors internal routes under `/api/v1/*` |
| **Language** | TypeScript 5.4 |
| **Styling** | Custom Neo-Brutalist & Slate Dark Themes (Vanilla CSS + Tailwind CSS) |
| **Databases** | 2 Supabase DBs + 2 Neon Serverless PostgreSQL Poolers |
| **Caching & Rate Limit** | Redis 7 (Upstash) |
| **AI Integration** | Groq Llama-3.1, OpenRouter, Gemini, NVIDIA NIM, Cloudflare Workers AI, HuggingFace, AWS Bedrock — unified via `@berojgardegreewala/ai-gateway` |
| **Containerization** | Docker Multi-Stage Builds & Docker Compose |
| **Orchestration** | Kubernetes (Deployment, Service, NGINX Ingress, Cert-Manager) |
| **Observability** | Sentry (error tracking), Vercel Analytics |

---

## ������ Migration Map: Next.js Internal API → Standalone Express API

Standalone REST backend lives in `backend/server` (Express, same Supabase tables, same zod validation via `@berojgardegreewala/api`, no schema changes).
It is **deployed-ready but not yet wired to the frontend** — the Next.js app still serves all routes below from `*/route.ts`.

### �� DONE — mirrored by the standalone API

| Frontend route (Next.js) | Standalone route | Backend files |
| :--- | :--- | :--- |
| `GET /api/opportunities`, `/api/opportunities/by-slug/[slug]` | `GET /api/v1/opportunities`, `/:idOrSlug` | `src/routes/opportunities.ts`, `src/repositories/opportunities.ts` |
| `GET /api/profile/[userId]`, `/api/profile/me` | `GET /api/v1/profiles/:username` (indexed username lookup), `GET /api/v1/profiles/me` | `src/routes/profiles.ts`, `src/repositories/profiles.ts` |
| `GET /api/organizations`, `/api/organizations/[slug]` | `GET /api/v1/organizations[...]` | `src/routes/content.ts`, `src/repositories/content.ts` |
| `GET /api/news`, `/api/news/[slug]` | `GET /api/v1/news` | `src/routes/content.ts`, `src/repositories/content.ts` |
| `GET/PATCH/DELETE /api/applications[...]` | `GET/POST/PATCH/DELETE /api/v1/applications` | `src/routes/userdata.ts`, `src/repositories/userdata.ts` |
| `GET/POST/DELETE /api/bookmarks[...]` | `GET/POST/DELETE /api/v1/saved-opportunities` | `src/routes/userdata.ts`, `src/repositories/userdata.ts` |
| `GET /api/health` | `GET /health` | `src/routes/health.ts` |
| AI endpoints (chat/summarize/classify...) | `POST /api/v1/ai/insights` (minimal wrap over `@berojgardegreewala/ai-gateway`) | `src/routes/ai.ts` |
| `GET /api/admin/analytics` | `GET /api/v1/admin/stats` (`X-Admin-Password`) | `src/routes/admin.ts` |

### ��� IN PROGRESS — standalone API delivered, frontend migration not started

The frontend still calls its internal routes for everything below; nothing has been removed from Next.js. Future sessions should mirror these next, in rough priority order:

1. **Social layer (DB2)**: `network/*`, `messages/*`, `feed/*`, `community/*`, `notifications/*`
2. **Academy (DB2)**: `academy/*` (tracks, days, progress)
3. **Full AI surface**: `ai/chat`, `ai/match`, `ai/classify`, `ai/enhance`, `ai/search`, `ai/expire`, `ai/opportunity-summary/[slug]`
4. **Admin panel**: `admin/*` (opportunities verify/reject, companies, subscribers, announcements, performance, scrape control)
5. **Employer**: `employer/*` | **Companies**: `companies/*`
6. **Resume**: `resume/*`, `resume/ai-suggest` | **Search**: `people/search`, `search/opportunities`
7. **Scrapers & cron** (remain server-side, may move to separate workers): `scrapers/*` (18 sources), `cron/*`, `check-links`, `archive-news`, `cleanup-news`, `sync-replica`, `send-digest`, `cron-health`
8. **Remaining**: `auth/*`, `subscribe`, `track-click`, `calendar-export/[id]`, `report-issue`, `resources/*`, `recommendations`, `similar/[id]`, `analytics/*`, `sitemap`, `revalidate`, `csp-report`, `opportunities/featured|stats|feed`, `admin/ai/test`, `admin/recheck-link`, `admin/scrape*`

**Blocked phase — Apps Tracking**: `POST /api/v1/applications` is a v1 addition (the app tracks Apply via external links; no in-app create exists today). Create the `applications` table on DB2 (id, user_id, opportunity_id, status, applied_at, notes, updated_at) before enabling it for users.

**Deferred**: rate limiting (the api lib ships `createRateLimiter` — add to auth/admin/AI routes before public exposure), `ADMIN_HMAC_SECRET` HMAC flow for admin, DB2 wired reads beyond `saved_opportunities`.

Deployment steps (env vars, Render/Docker, verification curls) live in [`deploy-stack.txt`](deploy-stack.txt).

---

## ��� Containerization & Kubernetes Deployment

### 1. Local Container Execution (Docker Compose)
```bash
# Build and launch multi-container stack (Frontend + PostgreSQL + Redis)
docker-compose up -d --build

# View container status and logs
docker-compose ps
docker-compose logs -f frontend
```

### 2. Kubernetes Deployment (`k8s/`)
```bash
# Apply ConfigMap, Secrets, and Deployments
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml

# Verify pod replicas and ingress routing
kubectl get pods -n production
kubectl get ingress -n production
```

---

## ��� Quick Start & Development

### Prerequisites
- Node.js 18.x or 20.x
- npm / yarn / pnpm / Docker

### Local Development Setup (npm workspaces)
```bash
# Install all workspace deps (frontend, backend/api, backend/ai-gateway, backend/server)
npm install

# Frontend only (Next.js, port 3000)
cd frontend && npm run dev

# Standalone Express API (port 8080, tsx watch)
npm run dev --workspace @berojgardegreewala/server
# or run everything:
npm run dev

# Production build check (all workspaces)
npm run build

# Typecheck + tests (all workspaces)
npm run typecheck
npm test
```

### Quick API smoke test (no credentials required)
```bash
curl -s http://localhost:8080/health                       # {"status":"ok"}
curl -s "http://localhost:8080/api/v1/opportunities?limit=1"
```

Full deployment runbook (env vars, Render/Docker, verification curls): [`deploy-stack.txt`](deploy-stack.txt).

---

## ��� Environment Variables

### Frontend (`frontend/.env.local`) — Required

| Variable | Description | Required |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase DB1 project URL (Primary) | �� |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase DB1 anon key (client-safe) | �� |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase DB1 service role key (server-only) | �� |
| `SUPABASE_2_URL` | Supabase DB2 project URL (Social/User layer) | �� |
| `SUPABASE_2_SERVICE_ROLE_KEY` | Supabase DB2 service role key (server-only) | �� |
| `SUPABASE_2_ANON_KEY` | Supabase DB2 anon key (client-safe) | �� |
| `NEON_1_DATABASE_URL` | Neon DB1 connection string (Analytics/Logs) | �� |
| `NEON_2_DATABASE_URL` | Neon DB2 connection string (Search/Cache) | �� |

### Frontend — Feature Flags & Integrations

| Variable | Description | Required |
| :--- | :--- | :--- |
| `GROQ_API_KEY` | Groq API key (Llama-3.1 primary) | For AI features |
| `GEMINI_API_KEY` | Google Gemini API key | For AI features |
| `NVIDIA_NIM_API_KEY` | NVIDIA NIM API key | For AI features |
| `NVIDIA_NIM_BASE_URL` | NVIDIA NIM base URL | For AI features |
| `OPENROUTER_API_KEY` | OpenRouter API key (fallback gateway) | For AI features |
| `CLOUDFLARE_AI_TOKEN` | Cloudflare Workers AI token | For AI features |
| `HUGGINGFACE_API_KEY` | HuggingFace API key | For AI features |
| `AWS_BEARER_TOKEN_BEDROCK` | AWS Bedrock bearer token | For AI features |
| `RESEND_API_KEY` | Resend API key (email notifications) | For email |
| `FROM_EMAIL` | From email address (default: notifications@domain) | Optional |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token | For notifications |
| `TELEGRAM_CHANNEL_ID` | Telegram channel ID | For notifications |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL | For rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token | For rate limiting |
| `CRON_SECRET` | Secret for cron endpoint authentication | �� |
| `REVALIDATE_SECRET` | Secret for ISR revalidation | �� |
| `ADMIN_PASSWORD` | Admin panel password | �� |
| `ADMIN_HMAC_SECRET` | HMAC secret for admin auth (fallback to ADMIN_PASSWORD) | �� |
| `NEXT_PUBLIC_SITE_URL` | Production site URL (for sitemap, emails) | �� |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN for error tracking | Optional |
| `GOOGLE_CLOUD_CREDENTIALS_BASE64` | GCP credentials base64 (Document AI, Storage) | For resume parsing |
| `GCP_PROJECT_ID` | GCP project ID | For Document AI |
| `GCP_DOCUMENT_AI_LOCATION` | Document AI location (default: us) | For Document AI |
| `GCP_DOCUMENT_AI_PROCESSOR_ID` | Document AI processor ID | For Document AI |
| `GCP_STORAGE_BUCKET_NAME` | GCS bucket for resume storage | For resume uploads |
| `SCRAPER_ALLOW_FABRICATED` | Allow fabricated scraping (dev only) | Dev only |

### Standalone API (`backend/server/.env`) — Required

| Variable | Description |
| :--- | :--- |
| `SUPABASE_URL` | Supabase DB1 project URL |
| `SUPABASE_ANON_KEY` | Supabase DB1 anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase DB1 service role key |
| `SUPABASE_2_URL` | Supabase DB2 project URL |
| `SUPABASE_2_SERVICE_ROLE_KEY` | Supabase DB2 service role key |
| `PORT` | Server port (default: 8080) |
| `NODE_ENV` | Environment (production/development) |
| `ALLOWED_ORIGINS` | CORS origins (comma-separated) |
| `ADMIN_PASSWORD` | Admin panel password |
| `ADMIN_HMAC_SECRET` | HMAC secret for admin auth |
| `GROQ_API_KEY` | Groq API key |
| `GEMINI_API_KEY` | Gemini API key |
| `NVIDIA_NIM_API_KEY` | NVIDIA NIM API key |
| `NVIDIA_NIM_BASE_URL` | NVIDIA NIM base URL |
| `OPENROUTER_API_KEY` | OpenRouter API key |
| `CLOUDFLARE_AI_TOKEN` | Cloudflare AI token |
| `HUGGINGFACE_API_KEY` | HuggingFace API key |
| `AWS_BEARER_TOKEN_BEDROCK` | AWS Bedrock bearer token |

**Example files**: `backend/server/.env.example` (committed), `frontend/.env.example` (create from above table — never commit real values).

---

## ��� Current Feature Set

### Core Platform
- **Opportunities**: 3,000+ verified listings across 150+ sources with category filtering (JRF, SRF, PhD, Postdoc, Internship, Govt Job, Private Job, Fellowship, Scholarship, Faculty), location, stipend range, deadline, experience level
- **News & Articles**: AI-curated industry news with categories (industry, research, policy, funding, product, acquisition, hiring, education, international, india), slug-based routing, sitemap integration
- **Organizations**: Company pages with follower counts, verification badges, opportunity counts, HQ locations
- **Search**: Full-text search across opportunities, news, organizations with filters and AI-powered semantic search
- **SEO/AEO/GEO**: Dynamic OG images, sitemap.xml, robots.txt, structured data, AI-crawlable content

### Professional Network (DB2)
- **Profiles**: `@username` verified profiles with headline, bio, skills, experience, avatar, open-to-work status
- **Connections**: Send/accept/decline connection requests, view mutual connections, connection suggestions (with test-account filtering)
- **Direct Messages**: Real-time conversations with unread counts, read receipts, conversation list
- **Feed**: Posts, likes, comments, reposts, opportunity shares, achievements with visibility controls
- **Community**: Q&A posts, discussions, showcases, interview experiences with upvotes/comments
- **Notifications**: Real-time notifications for connections, messages, likes, comments, endorsements

### Career Tools
- **Saved Opportunities (Bookmarks)**: Save/unsave opportunities, persistent across sessions, paginated list
- **Applications Tracking**: Apply to opportunities, track status (saved → applied → under_review → shortlisted → interview → offer/accepted/rejected), notes, deadline tracking
- **Resume Builder**: AI-powered resume parsing (GCP Document AI), ATS scoring, PDF export, AI suggestions
- **VLSI Academy**: Structured learning paths (tracks → days → checkpoints), progress tracking, completion certificates

### AI Assistant (RAG-Grounded)
- **Chat**: Conversational career assistant with context from opportunities, news, user profile
- **Grounding**: Retrieves relevant opportunities/news via semantic search before answering
- **Summarization**: Opportunity summaries, news digests, profile enhancement
- **Classification**: Auto-categorize opportunities, detect expired links, match skills
- **Matching**: AI-powered opportunity-user matching based on profile, skills, preferences

### Admin & Employer
- **Admin Panel**: Opportunity verification/rejection, company management, subscriber management, scrape control, analytics dashboard, AI test console
- **Employer Portal**: Job posting, candidate recommendations, company claim workflow
- **Scraper Management**: 18+ configured sources, cron scheduling, health monitoring, manual triggers

---

## ��� Project Structure

```
BerojgarDegreeWala/
├── frontend/                    # Next.js 14 App Router
│   ├── src/
│   │   ├── app/                 # Pages & API routes (App Router)
│   │   │   ├── api/             # All API routes (*/route.ts)
│   │   │   ├── (pages)/         # Page components
│   │   │   └── layout.tsx
│   │   ├── components/          # React components
│   │   ├── hooks/               # Custom React hooks (TanStack Query)
│   │   ├── lib/                 # Utilities, clients, validators
│   │   │   ├── ai/              # AI gateway, grounding, providers
│   │   │   ├── db/              # Multi-DB clients (db1, db2, neon1, neon2)
│   │   │   ├── scrapers/        # 18+ scraper implementations
│   │   │   ├── supabase/        # Supabase SSR clients
│   │   │   └── validation.ts    # Zod schemas
│   │   └── types/               # TypeScript types
│   ├── supabase/migrations/     # SQL migrations (DB1 + DB2)
│   ├── jest.config.js
│   └── package.json
├── backend/
│   ├── api/                     # Shared API package (@berojgardegreewala/api)
│   │   ├── src/                 # Zod schemas, error hierarchy, types
│   │   └── __tests__/
│   ├── ai-gateway/              # Unified AI provider abstraction
│   │   ├── src/providers/       # Groq, Gemini, NVIDIA, OpenRouter, etc.
│   │   └── src/gateway.ts
│   └── server/                  # Standalone Express API (@berojgardegreewala/server)
│       ├── src/
│       │   ├── routes/          # Express route handlers
│       │   ├── repositories/    # Data access layer
│       │   ├── middleware/      # Auth, rate limit, validation
│       │   └── server.ts
│       ├── tests/               # node:test suite (16 tests)
│       ├── Dockerfile
│       └── .env.example
├── scripts/                     # Automation scripts
├── k8s/                         # Kubernetes manifests
├── docs/                        # Documentation
│   └── session-reports/         # Session summaries
├── project-bible/               # Architecture & design docs
├── .github/workflows/           # CI/CD pipelines
├── docker-compose.yml
├── package.json                 # Root npm workspaces
├── CHANGELOG.md
├── SECURITY.md
├── AGENTS.md                    # AI agent instructions
��── README.md
```

---

## ��� Security & Credential Management

See [SECURITY.md](SECURITY.md) for:
- Credential rotation history
- Secret management policy (never hardcode in scripts)
- Supply chain security
- Incident response procedures

---

## ��� License

© 2026 BerojgarDegreeWala. Built for India's semiconductor and VLSI engineering revolution.