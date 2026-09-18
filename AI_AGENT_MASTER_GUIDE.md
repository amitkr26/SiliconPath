# BerojgarDegreeWala — Master AI Agent & Engineering Guide
**Unified Architectural Blueprint, Product Vision, Codebase Map, and Debugging Playbook**

*Document Version: 2026-09-18*  
*Repository: https://github.com/amitkr26/BerojgarDegreeWala*  
*Production URL: https://berojgardegreewala.vercel.app/*  

---

## 1. Executive Summary & Product Vision

### 1.1 What is BerojgarDegreeWala?
**BerojgarDegreeWala** is India’s premier, high-trust career intelligence and research opportunity network tailored specifically for students, researchers, and engineers in **Deep-Tech Hardware**—including:
- **Semiconductors & VLSI** (Analog, Mixed-Signal, Digital ASIC, Physical Design, Verification, DFT, RISC-V, EDA).
- **Space & Defence Electronics** (ISRO, DRDO, BEL, HAL, ADA, BrahMos, avionics, payload engineering).
- **National Research Laboratories** (CSIR, BARC, SAMEER, C-DAC, TIFR, SCL Mohali).
- **Premier Academia** (IISc Bangalore, IITs, IIITs, NITs, BITS Pilani - JRF, SRF, Project Assistant, PhD, Postdoc).
- **Global & Indian Semiconductor IDMs, Foundries & Startups** (Intel, AMD, NVIDIA, Qualcomm, TI, Micron, Applied Materials, Lam Research, Mindgrove, Signalchip, InCore, Saankhya, Tata Electronics).

### 1.2 The Core Problem We Solve
Generic job portals (Naukri, LinkedIn, Indeed) suffer from severe flaws for core engineering:
1. **Spam & IT Noise**: 98% of listings are IT services, full-stack web development, or sales consulting.
2. **Dead Links & Stale Openings**: Scraped listings without deadline tracking lead users to 404 pages or expired forms.
3. **Obscure Government Notifications**: Important JRF/SRF circulars at DRDO, ISRO, and IIT research projects are buried inside multi-page PDF gazettes and regional project offices with zero digital discoverability.
4. **Fragmented Ecosystem**: Hardware students cannot easily find which companies do what in India (e.g. who designs RFICs vs who does Physical Design in Bangalore).

### 1.3 The Value Proposition: "100% Verified, 0% Spam"
- **Authoritative Circular Extraction**: Only official circulars, career pages, and verified employer postings.
- **Evidence-Gated Verification**: No organization or opportunity is verified without strict cryptographic/domain evidence.
- **Deep-Tech Intelligence**: Integrated organization directory (100+ verified Bangalore semiconductor labs, fabless startups, and national research institutes).
- **Multi-Surface Platform**: Public intelligence portal, candidate application tracker, employer talent suite, and automated ingestion scrapers.

---

## 2. Monorepo Topology & Codebase Map

The project is structured as an **npm workspaces monorepo**:

```
BerojgarDegreeWala/
├── frontend/                               # Primary Next.js 14 Web Application & API
│   ├── public/                             # Static public assets
│   │   ├── images/                         # Authentic production imagery (about/, brand/, homepage/, news/)
│   │   ├── favicon.ico / favicon.png       # Official brand favicon
│   │   ├── logo.png                        # Official high-res logo
│   │   └── llms.txt                        # AI crawler documentation file
│   ├── src/
│   │   ├── app/                            # Next.js 14 App Router (Pages & API routes)
│   │   │   ├── page.tsx                    # Landing page (PublicHome)
│   │   │   ├── layout.tsx                  # Root layout (Universal Providers, Fonts, Global Nav/Footer)
│   │   │   ├── opportunities/              # /opportunities (Public search & filterable directory)
│   │   │   │   ├── page.tsx
│   │   │   │   ├── OpportunitiesClient.tsx
│   │   │   │   └── [id]/page.tsx           # Opportunity detail & direct apply view
│   │   │   ├── organizations/              # /organizations (Verified directory of 106+ institutions & companies)
│   │   │   │   ├── page.tsx
│   │   │   │   ├── OrganizationsClient.tsx
│   │   │   │   └── [slug]/page.tsx         # Organization profile & active circulars
│   │   │   ├── news/                       # /news (Deep-tech news, updates, and research circulars)
│   │   │   ├── resources/                  # /resources (Roadmaps, VLSI interview guides, textbooks, syllabus)
│   │   │   ├── about/                      # /about (Mission, team, research methodology)
│   │   │   ├── employer/                   # /employer/* (Dedicated Recruiter & Employer Suite)
│   │   │   │   ├── dashboard/              # Metrics, active jobs, pipeline overview
│   │   │   │   ├── post-job/               # Multi-step job posting studio
│   │   │   │   ├── jobs/                   # Job management & candidate review
│   │   │   │   ├── talent/                 # Verified candidate search & filters
│   │   │   │   └── settings/               # Company branding, logo, team members
│   │   │   ├── admin/                      # /admin/* (Admin verification console & scrape health)
│   │   │   └── api/                        # Serverless Next.js Route Handlers
│   │   │       ├── opportunities/          # CRUD & search for opportunities
│   │   │       ├── organizations/          # Organization directory APIs
│   │   │       ├── employer/               # Employer portal endpoints (IDOR-protected)
│   │   │       ├── ai/                     # Classification, AI search, resume parsing
│   │   │       ├── cron/                   # Scheduled scrapers (scrape-india, scrape-global)
│   │   │       └── admin/                  # Verification, scrape-health, metrics
│   │   ├── components/                     # Reusable React UI Components
│   │   │   ├── Navbar.tsx                  # The SINGLE authoritative header across all public routes
│   │   │   ├── Footer.tsx                  # The SINGLE authoritative footer across all public routes
│   │   │   ├── OpportunityCard.tsx         # Standardized opportunity card with verification badge
│   │   │   ├── VerificationBadge.tsx       # "Verified by BerojgarDegreeWala" badge
│   │   │   ├── DeadlineCountdown.tsx       # Real-time deadline pill (e.g., "Closes in 3 days")
│   │   │   ├── home/PublicHome.tsx         # Production landing page matching official designs
│   │   │   └── ui/                         # Atomic UI primitives (Card, Button, Modal, ImageWithFallback)
│   │   ├── config/                         # Scraper configurations & social links
│   │   │   ├── scrapers/                   # companies.json, institutions.json, global-master-sources.json
│   │   │   └── socials.ts                  # Official community channels & handle definitions
│   │   ├── data/                           # Verified static data fallbacks
│   │   │   └── semiconductor-orgs.ts       # 106 verified organizations with Bangalore R&D focus
│   │   ├── lib/                            # Business logic, helpers, and database clients
│   │   │   ├── supabase.ts                 # Client-side Supabase client (Browser sessions)
│   │   │   ├── supabase-admin.ts           # Server-side Supabase client (Service Role bypass)
│   │   │   ├── availability.ts             # Availability filter & IST date computation
│   │   │   ├── permissions.ts              # RBAC & candidate/employer role guards
│   │   │   └── organizations/resolve.ts    # Evidence-gated organization resolver
│   │   ├── types/                          # TypeScript definitions (Opportunity, Organization, User, etc.)
│   │   └── middleware.ts                   # Universal authentication, session refresh & route gating
│   ├── supabase/                           # Database migrations & seeds
│   │   ├── migrations/                     # 40+ PostgreSQL migration scripts
│   │   └── seed/                           # 01_organizations, 04_expanded, 05_semiconductor_100.sql
│   └── package.json
│
├── backend/                                # Standalone microservices & packages
│   ├── api/                                # @berojgardegreewala/api (Shared domain types & client)
│   ├── ai-gateway/                         # @berojgardegreewala/ai-gateway (Resilient multi-LLM router)
│   ├── server/                             # Express.js backend replica (alternative deployment)
│   └── worker/                             # Background scraping & ingestion fleet
│
├── project-bible/                          # Living Engineering Bible
│   ├── ARCHITECTURE.md                     # Deep technical architecture
│   ├── PRODUCT.md                          # Product vision, user personas, roadmap
│   ├── SECURITY.md                         # Security protocols, IDOR defense, RBAC
│   ├── DEVELOPMENT.md                      # Developer environment setup & CLI guide
│   └── CHANGELOG.md                        # Exhaustive semantic version history
│
├── docs/                                   # Audit reports, SEO analysis & design blueprints
└── scripts/                                # Utility maintenance, backfill & scraper runner scripts
```

---

## 3. Technology Stack & Key Dependencies

| Domain | Technology / Library | Role / Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 14/15 (App Router)** | Server Components, Server Actions, Streaming SSR, Route Handlers |
| **Language & Types** | **TypeScript 5.x** | Strict typing across frontend, shared packages, and scrapers |
| **Styling** | **Tailwind CSS + Vanilla CSS** | Curated palette (`#F8FAFC`, dark slate, emerald, purple tokens) |
| **Icons & Micro-interactions** | **Lucide React**, **Sonner** | Clean feather icons, modern toast notifications |
| **Database (Primary DB1)** | **Supabase PostgreSQL** | Public data (`organizations`, `opportunities`, `companies`, `news`) |
| **Database (Secondary DB2)** | **Supabase PostgreSQL / Auth** | User auth, profiles, applications, social feed, bookmarks |
| **Database (Analytics)** | **Neon Serverless PostgreSQL** | Click events, page views, query telemetry, trending search cache |
| **AI Ingestion Gateway** | **Gemini, Groq, Claude, Document AI**| PDF circular parsing, classification, reasoning sanitization |
| **Object Storage** | **Google Cloud Storage / Supabase Storage** | Resumes, company logos, circular attachments |
| **Testing & Quality** | **Jest, Playwright, TypeScript (`tsc`)** | 26 test suites (259+ unit tests), E2E flows, strict compile checks |
| **Monitoring** | **Sentry Next.js SDK** | Production error catching and performance tracing |

---

## 4. The Four Core Platform Surfaces

```
┌──────────────────────────────────────────────────────────────────────────┐
│                   Next.js Modular Monolith (Vercel)                      │
├───────────────────┬────────────────────┬────────────────┬────────────────┤
│   PUBLIC PORTAL   │  CANDIDATE PORTAL  │ EMPLOYER SUITE │  ADMIN CONSOLE │
│  (Navbar + Hero)  │ (Candidate Shell)  │(Employer Shell)│ (Admin Shell)  │
├───────────────────┴────────────────────┴────────────────┴────────────────┤
│       Universal Auth Guard (Cookie Session + Authorization Bearer JWT)   │
├──────────────────────────────────────────────────────────────────────────┤
│                  API Route Handlers (frontend/src/app/api/*)             │
│            • Public Reads  • Candidate Actions  • Employer Endpoints     │
└─────────────────────────────────────┬────────────────────────────────────┘
```

### 4.1 Surface 1: Public Intelligence Portal
- **Homepage (`/`)**: High-impact editorial landing page with hero search, domain pills (Semiconductors, Space/Defence, National Labs, Premier Academia), handpicked opportunities grid, verified news feed, mobile app promo, and unified footer.
- **Opportunities Directory (`/opportunities`)**: Dynamic search by Keyword, Category (JRF, SRF, PhD, Postdoc, Core Job, Internship), Field (VLSI, Embedded, RF, MEMS), Location (Pan-India, Bengaluru, Hyderabad, Delhi NCR, Remote), and Eligibility (B.Tech, M.Tech, PhD, GATE).
- **Organizations Directory (`/organizations`)**: Verified directory of 106+ deep-tech organizations with location filters, sector badges, verified Bangalore R&D operations, and static offline fallback.
- **News (`/news`)**: Curated deep-tech hardware updates, DRDO/ISRO circulars, semiconductor industry announcements.
- **Resources (`/resources`)**: Roadmaps for Digital VLSI, Analog IC Design, Embedded Systems, and GATE preparation.

### 4.2 Surface 2: Candidate Career Portal
- Located under `/dashboard`, `/applications`, `/saved`, `/network`, `/messages`, `/profile`, `/resume`.
- Allows candidates to maintain an engineering profile (GATE score, VLSI projects, publications, GitHub/LinkedIn), save opportunities, track application stages (Applied, Under Review, Shortlisted, Interviewing, Offered, Rejected), and network with peers.

### 4.3 Surface 3: Employer & Recruiter Suite
- Located under `/employer/*` (`/employer/dashboard`, `/employer/post-job`, `/employer/jobs`, `/employer/talent`, `/employer/settings`).
- Enables semiconductor companies and research labs to claim company profiles, post specialized hardware jobs with custom eligibility criteria, review applicants in a Kanban-style ATS pipeline, and source candidates based on EDA tool experience (e.g. Cadence Virtuoso, Synopsys Design Compiler, Siemens Questa).
- **Security**: Hardened against IDOR (Insecure Direct Object Reference). Employers can only access applicants who applied to *their* active postings.

### 4.4 Surface 4: Admin Verification & Operations Console
- Located under `/admin/*` (`/admin`, `/admin/scrape-health`, `/admin/opportunities`, `/admin/organizations`).
- Scraping health telemetry: tracks consecutive failures, total results, and duration across 40+ scrapers.
- Opportunity verification queue: human-in-the-loop review to verify AI-parsed PDF circulars before public publication.

---

## 5. Database Schema & Data Models

### 5.1 `organizations` Table (Core Deep-Tech Entities)
```sql
CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  type text CHECK(type IN ('government', 'research_lab', 'academic', 'private', 'international', 'psu')),
  country text DEFAULT 'India',
  location text,                      -- e.g. 'Bengaluru, Karnataka, India'
  website text,                       -- Official URL
  logo_url text,                      -- Logo image or null (renders SVG monogram fallback)
  description text,                   -- Verified operations & R&D focus
  is_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### 5.2 `opportunities` Table (The Core Currency)
```sql
CREATE TABLE opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  organization text NOT NULL,
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  category text NOT NULL CHECK(category IN (
    'JRF', 'SRF', 'PhD', 'Postdoc', 'Research Associate',
    'Internship', 'Trainee', 'Govt Job', 'Private Job',
    'Fellowship', 'Scholarship', 'Faculty'
  )),
  department text,
  location text NOT NULL,
  stipend text,
  deadline date,                      -- NULL means rolling or open until filled
  official_link text NOT NULL,        -- Must be direct official career/circular URL
  pdf_url text,                       -- Direct link to official PDF gazette/circular
  eligibility text,                   -- Degree, GATE cutoff, minimum marks
  description text NOT NULL,
  requirements text[],
  is_active boolean DEFAULT true,
  verification_status text DEFAULT 'pending' CHECK(verification_status IN (
    'pending', 'verified', 'rejected', 'expired', 'link_unavailable'
  )),
  verified_at timestamptz,
  verified_by uuid,
  source text,                        -- 'isro_scraper', 'drdo_feed', 'employer_post', etc.
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### 5.3 Availability & Freshness Logic
- Located in `frontend/src/lib/availability.ts`.
- Computes Indian Standard Time (IST, UTC+5:30) today: `computeIstToday()`.
- Filter: An opportunity is active and visible if `is_active = true`, `verification_status = 'verified'`, and `(deadline >= today OR deadline IS NULL)`.
- **Deadline Countdown**: `DeadlineCountdown.tsx` automatically displays:
  - `< 24 hours`: Red pulsing alert badge ("Closing Today").
  - `<= 3 days`: Amber warning ("Closes in X days").
  - `> 3 days`: Slate information badge.

---

## 6. AI Ingestion & Evidence-Gated Architecture

### 6.1 Scraper Architecture
- Scrapers live in `backend/worker/src/scrapers/` and `frontend/src/app/api/cron/`.
- Scrape targets:
  - **Government / Defense Portals**: ISRO SAC/URSC/VSSC, DRDO RAC, CSIR CEERI/NPL, BARC.
  - **Workday ATS API**: Intel, Micron, Broadcom, Marvell, Analog Devices (`method: "workday_api"`).
  - **Greenhouse / Lever ATS API**: Semiconductor startups, fabless design firms.

### 6.2 Evidence-Gated Organization Resolution (`resolve.ts`)
To prevent AI hallucinations (e.g. associating a posting with a recruiter's name or a fake company):
- Located at [frontend/src/lib/organizations/resolve.ts](file:///C:/Users/STUDENT/Desktop/Amit/BerojgarDegreeWala/frontend/src/lib/organizations/resolve.ts).
- Never creates or assigns an `organization_id` without cryptographic or domain evidence:
  1. Exact hostname match against known organizations (e.g. `mindgrovetech.in`, `signalchip.com`, `ti.com`).
  2. Stripping generic ATS host labels (`boards`, `job-boards`, `careers`, `myworkdayjobs`).
  3. Strict regex filtering discarding bare person names ("Sadia Munir") or agency names.

### 6.3 Static Fallback & Offline Resilience
- To ensure zero downtime if database connectivity is degraded or during local development without credentials:
  - [frontend/src/data/semiconductor-orgs.ts](file:///C:/Users/STUDENT/Desktop/Amit/BerojgarDegreeWala/frontend/src/data/semiconductor-orgs.ts) holds `ALL_ORGANIZATIONS` (106 verified entities).
  - `frontend/src/app/organizations/page.tsx` and `[slug]/page.tsx` query Supabase and automatically fall back / merge static data.

---

## 7. Design System & Frontend Architecture Rules

Any engineer or AI agent working on the frontend must strictly adhere to these design rules:

1. **Strict 1 Header / 1 Footer Rule**:
   - Exactly **one** `<header>`/`<nav>` in the DOM, housed in [frontend/src/components/Navbar.tsx](file:///C:/Users/STUDENT/Desktop/Amit/BerojgarDegreeWala/frontend/src/components/Navbar.tsx).
   - Exactly **one** `<footer>` in the DOM, housed in [frontend/src/components/Footer.tsx](file:///C:/Users/STUDENT/Desktop/Amit/BerojgarDegreeWala/frontend/src/components/Footer.tsx).
   - Never render a secondary or nested navbar/footer inside page components.
2. **Color Palette Tokens**:
   - Page Background: `#F8FAFC` (Slate-50) for crisp, clean contrast.
   - Primary Headings: `#0F172A` (Slate-900).
   - Accent Purple: `bg-[#7C3AED]` / `text-[#7C3AED]` for featured tags.
   - Accent Blue: `bg-[#2563EB]` for primary CTAs and active tabs.
   - Accent Emerald: `bg-[#059669]` for verified badges and active opportunities.
3. **Typography**:
   - Modern clean sans-serif font family.
   - High typographic hierarchy: large bold titles, clear subheadings, and muted slate metadata.
4. **No Stock Imagery / No Placeholders**:
   - Never link to `unsplash.com` or placeholder URLs.
   - Use high-resolution production assets in `frontend/public/images/` or the SVG monogram fallback in `ImageWithFallback.tsx`.
5. **SEO & Generative Engine Optimization (GEO/AEO)**:
   - Every public page includes JSON-LD structured data (`BreadcrumbList`, `ItemList`, `JobPosting`, or `Organization`).
   - Standard OpenGraph tags and Twitter Cards.

---

## 8. Security & RBAC Guidelines

1. **Authentication Architecture**:
   - Handled via Supabase Auth + Next.js Middleware ([frontend/src/middleware.ts](file:///C:/Users/STUDENT/Desktop/Amit/BerojgarDegreeWala/frontend/src/middleware.ts)).
   - Session tokens passed via HTTP-only cookies and Bearer tokens.
2. **Role-Based Access Control (RBAC)**:
   - `candidate`: Can apply, save jobs, view own profile.
   - `employer`: Can post jobs, manage applicants for owned jobs, update company profile.
   - `admin`: Can verify opportunities, view scrape fleet health, trigger scraper runs.
3. **IDOR Prevention (Insecure Direct Object Reference)**:
   - Employer routes (`/api/employer/jobs/[id]`, `/api/employer/applicants`) strictly verify that the requesting user's `employer_id` owns the `organization_id` or `company_id`.
   - Admin routes require verified `admin` role in user claims.

---

## 9. BDW AI Career Intelligence Engine

### 9.1 Architecture Overview

The BDW AI system provides grounded career intelligence via Retrieval-Augmented Generation (RAG) with tool-use capabilities:

```
User Query → Intent Detection → RAG Retrieval → System Prompt Build → AI Model → Tool Loop (optional) → Response + Citations
```

### 9.2 Key Files

| File | Purpose |
| :--- | :--- |
| `backend/ai-gateway/src/providers/bdw.ts` | BDW AI provider — HTTP client, config, health check |
| `backend/ai-gateway/src/gateway/index.ts` | Core gateway — `"bdw"` provider, `callBdw()` method |
| `frontend/src/lib/ai/bdw-rag.ts` | RAG system — intent detection, retrieval, system prompts |
| `frontend/src/lib/ai/bdw-tools.ts` | 7 tool definitions (OpenAI function-calling schema) |
| `frontend/src/lib/ai/bdw-tools-exec.ts` | **Server-only** tool execution logic |
| `frontend/src/app/api/ai/chat/route.ts` | Chat endpoint — RAG + tool loop + fallback |
| `frontend/src/app/api/ai/bdw-tools/route.ts` | HTTP adapter — requires auth |
| `frontend/src/app/ask-ai/components/ChatMessage.tsx` | Domain badges, citations, tool indicators |

### 9.3 Security Rules (CRITICAL)

1. **Tool execution is server-only** — `bdw-tools-exec.ts` must never be imported into client components
2. **`VALID_BDW_TOOLS` whitelist** — only 7 tools: `search_opportunities`, `search_organizations`, `check_eligibility`, `get_required_skills`, `find_related_opportunities`, `get_career_roadmap`, `search_news`
3. **Input sanitization** — `sanitizeUserMessage()` enforces 4000-char max
4. **SQL ILIKE safety** — `escapeILIKE()` escapes `%`, `_`, `\` in all search queries
5. **Prompt injection defense** — user query wrapped in `<user_query>` delimiters with anti-injection rules
6. **Auth required** — `/api/ai/bdw-tools` requires Supabase JWT
7. **Context overflow cap** — total tool results capped at 4000 chars per round

### 9.4 Environment Variables

```env
BDW_AI_ENABLED=true
BDW_AI_BASE_URL=https://your-bdw-endpoint
BDW_AI_MODEL=your-model
BDW_AI_API_KEY=your-key
BDW_AI_TIMEOUT_MS=30000
```

---

## 10. Developer & AI Agent Playbook

### 10.1 Environment Variables Setup
To run the full stack locally with Supabase, create `frontend/.env.local`:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional Analytics
DATABASE_URL=postgresql://user:pass@host/db
NEON_DATABASE_URL=postgresql://user:pass@host/analytics

# Optional AI Gateway
GEMINI_API_KEY=your-gemini-key
GROQ_API_KEY=your-groq-key
```
*(Note: If `.env.local` is absent, the frontend runs in graceful fallback mode using static datasets).*

### 10.2 Essential Commands
```bash
# 1. Start Frontend Dev Server
cd frontend
npm run dev

# 2. Type Check (Zero Error Tolerance)
npx tsc --noEmit

# 3. Run Unit Test Suite
npm test

# 4. Production Build Verification
npm run build
```

### 10.3 Golden Rules for AI Agents Modifying This Codebase
1. **Always Type-Check First**: After making changes in `frontend/`, immediately run `npx tsc --noEmit`. Fix any typing discrepancy before committing.
2. **Never Break Test Suites**: Run `npm test`. All test suites must pass (317 frontend + 19 gateway tests).
3. **Preserve Navigation Singletons**: Do not insert arbitrary navbars or footers into page components.
4. **Follow Seed Conventions**: When adding organizations or opportunities, use idempotent SQL (`ON CONFLICT (slug) DO UPDATE SET ...`).
5. **Update CHANGELOG.md**: Document every architectural or visual change in `project-bible/CHANGELOG.md`.
6. **No Breaking Migrations**: Do not drop columns in Supabase migrations without a corresponding phased deprecation strategy.
7. **BDW AI Security**: Never import `bdw-tools-exec.ts` into client code. Always validate tool names against `VALID_BDW_TOOLS`. Always escape ILIKE wildcards.

---

## 11. Key File Quick-Reference Directory

| File / Path | Core Responsibility |
| :--- | :--- |
| `frontend/src/components/Navbar.tsx` | Master header & navigation bar |
| `frontend/src/components/Footer.tsx` | Master footer & community links |
| `frontend/src/components/home/PublicHome.tsx` | Official landing page component |
| `frontend/src/app/opportunities/OpportunitiesClient.tsx` | Opportunities search & filter client |
| `frontend/src/app/organizations/OrganizationsClient.tsx` | Organization directory client |
| `frontend/src/data/semiconductor-orgs.ts` | 106 verified organizations static directory |
| `frontend/src/lib/organizations/resolve.ts` | Anti-hallucination domain resolver |
| `frontend/src/lib/availability.ts` | IST date calculations & availability filters |
| `frontend/src/lib/ai/bdw-rag.ts` | BDW AI RAG system — intent, retrieval, prompts |
| `frontend/src/lib/ai/bdw-tools.ts` | BDW AI tool definitions (7 tools) |
| `frontend/src/lib/ai/bdw-tools-exec.ts` | BDW AI tool execution (SERVER-ONLY) |
| `frontend/src/app/api/ai/chat/route.ts` | Chat endpoint — RAG + tool loop |
| `frontend/src/middleware.ts` | Universal session refresh & route protection |
| `frontend/supabase/seed/05_semiconductor_bangalore_100.sql` | 100 verified semiconductor organizations seed |
| `project-bible/CHANGELOG.md` | Full historical change log |
