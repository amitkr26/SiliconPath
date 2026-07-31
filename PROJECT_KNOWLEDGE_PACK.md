# BerojgarDegreeWala — Complete Technical Project Knowledge Pack

> **HANDOFF HANDBOOK FOR AI ASSISTANTS & ENGINEERS**  
> *Target Audience: AI Systems (ChatGPT, Claude, Gemini), Technical Lead, Core Maintainers*  
> *Last Updated: July 31, 2026*  
> *Repository: `https://github.com/amitkr26/BerojgarDegreeWala.git`*  
> *Live Deployment: `https://berojgardegreewala.vercel.app` (Local Dev: `http://localhost:3000`)*

---

## 1. Project Overview

### Project Name
**BerojgarDegreeWala** (Internal Codebase Name: `SiliconPath` / Semiconductor & VLSI Career Hub).

### Purpose
BerojgarDegreeWala is India’s premier open-access career intelligence platform, opportunity aggregator, and technical learning ecosystem designed specifically for Microelectronics, VLSI Design, Embedded Systems, and Semiconductor Engineering.

### Problem It Solves
1. **Academic & Research Fragmentation**: Research fellowships (Junior Research Fellowships - JRF, Senior Research Fellowships - SRF, PhD admissions) across DRDO (RAC), ISRO (VSSC/SAC), CSIR, IIT Bombay, IIT Madras, and IISc Bangalore are scattered across dozens of unstandardized government portals.
2. **Skill Disconnect**: Engineering graduates lack practical, synthesizable VLSI skills (Verilog HDL, SystemVerilog, UVM, Physical Design, Static Timing Analysis).
3. **Information Delay**: Official vacancy notifications are often buried in PDF circulars without active links or clear eligibility requirements.

### Target Users
1. **Job Seekers & Student Researchers**: B.Tech/M.Tech/PhD graduates seeking JRF positions, ISRO/DRDO scientist roles, or enterprise VLSI design jobs (Intel, Qualcomm, AMD, TSMC, Arm, Cadence, Synopsys).
2. **Employers, Labs & Research Heads**: IIT/NIT professors, DRDO lab directors, and fabless enterprise recruiters posting verified openings and sourcing hardware candidates.
3. **Admin Administrators**: Platform moderators managing scrapers, reviewing verification logs, monitoring AI API usage, and managing newsletter subscribers.

### Current Status
- **Production Ready & Active**: Cleanly compiling Next.js 14 App Router application running on Node.js/Vercel with Supabase PostgreSQL database.
- **Local Server Status**: Live on `http://localhost:3000`.
- **Git Branch**: `main` (clean, zero uncommitted changes).

### Long-Term Vision
To serve as the primary digital talent infrastructure supporting India's **$15B+ India Semiconductor Mission (ISM)** by bridging academic research with commercial fab/design hubs.

---

## 2. Repository Details

| Attribute | Details |
| :--- | :--- |
| **Repository Name** | `BerojgarDegreeWala` |
| **GitHub URL** | `https://github.com/amitkr26/BerojgarDegreeWala.git` |
| **Live Production URL** | `https://berojgardegreewala.vercel.app` |
| **Local Development URL** | `http://localhost:3000` |
| **Primary Framework** | Next.js 14.2.35 (App Router, React 18, TypeScript) |
| **Database BaaS** | Supabase PostgreSQL (`https://*.supabase.co`) |
| **Default Branch** | `main` |
| **Active Deployment Platform**| Vercel |

---

## 3. Complete Architecture

### High-Level System Architecture

```
[ Client Browser (React 18 / Next.js) ]
                │
                ├──> Next.js App Router Pages (/opportunities, /academy, /ask-ai, /admin)
                │
                ├──> API Routes (/api/scrapers/*, /api/chat, /api/admin/auth, /api/news)
                │         │
                │         ├──> Multi-Provider AI Inference Engine
                │         │     (Groq LLaMA-3 -> Gemini 1.5 -> OpenRouter -> NVIDIA NIM)
                │         │
                │         └──> Supabase Client & Service Role (PostgreSQL DB & Storage)
                │
                └──> External Scraping Targets
                      (DRDO RAC, ISRO, CSIR, ISM, IEEE Spectrum, EE Times, SemiEngineering)
```

### Architectural Subsystems

1. **Frontend Layer**:
   - Built on Next.js 14 App Router (`src/app/`).
   - Styled using a **Neo-Brutalist Electric Blue** design system (`#2563EB` primary, `#0F172A` high-contrast slate borders, `#FAF9F6` off-white background).
   - Icons supplied by `lucide-react`.

2. **Backend API Layer**:
   - Serverless Next.js API endpoints (`src/app/api/*`).
   - Secure server-side database access via `@supabase/supabase-js` using service role keys.
   - HMAC SHA-256 session token generation for Admin route protection (`src/app/api/admin/auth/route.ts`).

3. **Database Layer**:
   - Supabase PostgreSQL database storing opportunities, news articles, organizations, subscribers, AI usage logs, user reviews, and candidate profiles.

4. **Content Security Policy (CSP) & Security**:
   - Defined in [middleware.ts](file:///C:/Users/ajeet/.gemini/antigravity-ide/brain/52b128bf-167a-4bf8-8229-2697d5d24c16/scratch/SiliconPath/berojgardegreewala/frontend/src/middleware.ts).
   - Strict `frame-src` supporting `https://www.youtube.com`, `https://youtube.com`, `https://www.youtube-nocookie.com`, and `https://youtube-nocookie.com` to guarantee video playback.
   - `img-src` configured for `https://*.unsplash.com`, `https://images.unsplash.com`, and `https://img.youtube.com`.

5. **AI Inference & Fallback Subsystem**:
   - Multi-tier LLM API integration with automatic fallback chain:
     1. **Groq** (`llama-3.3-70b-versatile`)
     2. **Google Gemini** (`gemini-1.5-flash`)
     3. **OpenRouter** (`anthropic/claude-3.5-haiku` / `meta-llama/llama-3.3-70b-instruct`)
     4. **NVIDIA NIM**
     5. **Cloudflare AI Workers**
     6. **HuggingFace Inference API**
   - Telemetry logging stored in `ai_usage_logs` table.

---

## 4. Tech Stack

| Domain | Technologies Used |
| :--- | :--- |
| **Languages** | TypeScript (v5.0+), JavaScript (ES2022+), SQL, HTML5, CSS3 |
| **Frontend Framework** | Next.js 14.2.35 (App Router, Server & Client Components) |
| **UI Library & Icons** | React 18, Tailwind CSS, Lucide React (`lucide-react`) |
| **Styling Paradigm** | Neo-Brutalist Electric Blue (`#2563EB`), Dark Slate Borders (`#0F172A`), Custom Webkit Scrollbars |
| **Backend & APIs** | Next.js API Routes (Node.js runtime & Edge runtime) |
| **Database & Storage** | Supabase PostgreSQL, Supabase Storage (`resumes` bucket) |
| **Authentication** | Supabase Auth (Users) & Custom HMAC Crypto (Admin) |
| **AI LLM Services** | Groq SDK, Google Generative AI SDK, OpenRouter API |
| **Deployment & Hosting**| Vercel, Supabase Cloud |
| **Version Control** | Git, GitHub (`origin/main`) |

---

## 5. Folder Structure

```
berojgardegreewala/frontend/
├── .env.local                        # Environment configuration (secrets & API keys)
├── next.config.mjs                   # Next.js config (images domains, webpack tweaks)
├── package.json                      # Dependencies and scripts
├── tailwind.config.ts                # Tailwind design tokens & theme configuration
├── src/
│   ├── app/                          # Next.js App Router Routes & Pages
│   │   ├── layout.tsx                # Root Layout Component (Navbar + Footer + AppLayout)
│   │   ├── page.tsx                  # Homepage (Hero, Roles, Academy, Ask AI, News)
│   │   ├── globals.css               # Global CSS & Electric Blue Custom Scrollbars
│   │   ├── admin/                    # Admin Panel & AI Analytics
│   │   │   ├── page.tsx              # Admin Console Login & Dashboard Tabs
│   │   │   └── _components/          # Admin Subcomponents (AIAnalyticsPanel.tsx)
│   │   ├── ask-ai/                   # AI Career Assistant (/ask-ai)
│   │   │   └── page.tsx              # Dedicated AI Chat Assistant Interface
│   │   ├── chat/                     # Legacy Route Redirect
│   │   │   └── page.tsx              # Redirects /chat -> /ask-ai
│   │   ├── academy/                  # VLSI Academy Curriculum
│   │   │   ├── page.tsx              # Academy Track Overview
│   │   │   └── [track]/              # Specific Track Pages & Lesson Viewer
│   │   ├── opportunities/            # Opportunity Engine & Filter Portal
│   │   ├── news/                     # Semiconductor News Feed
│   │   ├── network/                  # Hardware Professional Network
│   │   ├── resume/                   # AI Resume Builder
│   │   ├── login/                    # Public User Sign In
│   │   ├── signup/                   # Public Candidate/Employer Sign Up
│   │   └── api/                      # Backend API Endpoints
│   │       ├── admin/auth/route.ts   # Admin Authentication Endpoint
│   │       ├── chat/route.ts         # AI Inference Route
│   │       ├── news/route.ts         # News API Endpoint
│   │       ├── scrapers/run-all/     # Live Scraper Trigger Endpoint
│   │       └── analytics/ai-usage/   # AI Usage Telemetry Endpoint
│   ├── components/                   # Shared UI Components
│   │   ├── Navbar.tsx                # Header Navigation (Single 'Sign In / Join' button)
│   │   ├── Footer.tsx                # Neo-Brutalist Electric Blue Footer
│   │   ├── AppLayout.tsx             # Floating Ask AI Trigger & Layout Wrapper
│   │   ├── OpportunityCard.tsx       # Verified Job/JRF Opportunity Card
│   │   ├── NewsCard.tsx              # Semiconductor News Card
│   │   └── academy/
│   │       └── YoutubeEmbed.tsx      # Video Lecture Component with Play Fallback
│   ├── lib/                          # Core Utilities, API Clients, & Scrapers
│   │   ├── api-client.ts             # Typed Fetch Wrapper
│   │   ├── supabase.ts               # Supabase Client & Admin Client Initializers
│   │   └── utils.ts                  # Helper Functions (formatting, categories)
│   └── types/                        # TypeScript Interfaces & Types (`index.ts`)
```

---

## 6. Database Schema (Supabase PostgreSQL)

### 1. `opportunities` Table
Stores all aggregated job, fellowship, and research program listings.

| Column Name | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` / `TEXT` | PRIMARY KEY | Unique identifier for opportunity |
| `title` | `TEXT` | NOT NULL | Position title (e.g., "DRDO JRF Microelectronics") |
| `organization` | `TEXT` | NOT NULL | Name of organization (e.g., "DRDO RAC", "Intel") |
| `category` | `TEXT` | NOT NULL | Category ("jrf", "phd", "govt", "vlsi", "embedded") |
| `location` | `TEXT` | DEFAULT 'India' | Work/research site location |
| `stipend_salary` | `TEXT` | NULLABLE | Financial support (e.g., "₹37,000/mo + HRA") |
| `apply_link` | `TEXT` | NOT NULL | Direct official application URL |
| `official_page_url`| `TEXT` | NULLABLE | Circular PDF or official announcement page |
| `verification_status`| `TEXT` | DEFAULT 'verified'| Verification state ('verified', 'pending') |
| `is_active` | `BOOLEAN` | DEFAULT `true` | Active status in live aggregator |
| `created_at` | `TIMESTAMP` | DEFAULT `NOW()` | Ingestion timestamp |

### 2. `news_articles` Table
Stores daily semiconductor industry updates.

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `TEXT` | Unique news ID |
| `title` | `TEXT` | News headline |
| `slug` | `TEXT` | URL slug |
| `source` | `TEXT` | Originating publication (IEEE Spectrum, EE Times, etc.) |
| `source_url` | `TEXT` | Direct article link |
| `summary` | `TEXT` | AI-generated or scraped summary |
| `image_url` | `TEXT` | Unsplash or thumbnail URL |
| `published_at` | `TIMESTAMP` | Publication timestamp |

### 3. `ai_usage_logs` Table
Stores AI model invocation telemetry.

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `UUID` | Primary Key |
| `feature` | `TEXT` | Feature name (e.g., "AI Career Assistant (/ask-ai)") |
| `provider` | `TEXT` | Provider used ("groq", "gemini", "openrouter") |
| `success` | `BOOLEAN` | Whether invocation succeeded |
| `prompt_length` | `INTEGER` | Input token character count |
| `response_length`| `INTEGER` | Output token character count |
| `created_at` | `TIMESTAMP` | Log timestamp |

---

## 7. APIs & Endpoints

| Endpoint | Method | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `/api/opportunities` | `GET` | None | Fetches active opportunities with filters |
| `/api/news` | `GET` | None | Fetches latest semiconductor news articles |
| `/api/chat` | `POST` | None | Executes LLM prompt with multi-provider fallback |
| `/api/admin/auth` | `POST` | Admin Credentials | Validates username `amitkr26` & password `amitkr26` |
| `/api/admin/opportunities` | `GET` | Admin Token | Administrative listing of all opportunities |
| `/api/admin/subscribers` | `GET` | Admin Token | Administrative listing of newsletter subscribers |
| `/api/scrapers/run-all` | `POST` | Admin / Cron | Triggers live scrapers for DRDO, ISRO, CSIR, IITs |
| `/api/analytics/ai-usage` | `GET` | Admin Password | Returns aggregated AI token & call stats |
| `/api/subscribe` | `POST` | None | Registers candidate email for daily alerts |

---

## 8. Features & Implementation Details

### Feature 1: Live Opportunity Aggregator (`/opportunities`)
- **Purpose**: Centralizes verified JRF, PhD, DRDO, ISRO, CSIR, and enterprise VLSI opportunities.
- **Key Files**: `src/app/opportunities/page.tsx`, `src/components/OpportunityCard.tsx`.
- **Implementation**: Queries Supabase `opportunities` table with real-time category filtering and client-side keyword search.

### Feature 2: VLSI Academy (`/academy`)
- **Purpose**: Provides a structured 30+ day industrial curriculum across 6 tracks (Digital Logic, Verilog, SystemVerilog, UVM, RTL Design, Physical Design).
- **Key Files**: `src/app/academy/page.tsx`, `src/components/academy/YoutubeEmbed.tsx`.
- **Video Embed System**: Uses responsive YouTube video embeds with high-res thumbnail triggers and direct "Open in YouTube" action links.

### Feature 3: Ask AI Career Assistant (`/ask-ai`)
- **Purpose**: Dedicated AI chat specialist trained on VLSI design, STA timing math, SystemVerilog verification, and DRDO/ISRO recruitment.
- **Key Files**: `src/app/ask-ai/page.tsx`, `src/app/api/chat/route.ts`.
- **Capabilities**: Voice input (Web Speech API), Speech synthesis (Text-to-Speech), Preset suggestion chips, Multi-session local storage memory.

### Feature 4: Admin Control Center (`/admin`)
- **Purpose**: Protected management portal for platform administration.
- **Key Files**: `src/app/admin/page.tsx`, `src/app/admin/_components/AIAnalyticsPanel.tsx`.
- **Credentials**:
  - **Username**: `amitkr26`
  - **Email**: `amitkrbsc26@gmail.com`
  - **Password**: `amitkr26`
- **Dashboard Capabilities**:
  - **"Run All Scrapers Now"** single-click live scraper trigger.
  - Live Scraper Execution Log Stream.
  - Monitored Source Portals Directory.
  - AI Provider Telemetry & Token Analytics.

---

## 9. AI Subsystem & Prompt Engineering

### Multi-Provider Fallback Flow
When a user submits a query to `/api/chat`, the system executes the following cascade:

```
[ Request Received ] 
        │
        ├──> Try Groq API (llama-3.3-70b-versatile) ──(Success)──> Return Reply
        │         │ (Failure/Timeout)
        ├──> Try Gemini API (gemini-1.5-flash)      ──(Success)──> Return Reply
        │         │ (Failure/Timeout)
        ├──> Try OpenRouter API                     ──(Success)──> Return Reply
        │         │ (Failure/Timeout)
        └──> Return Fallback Knowledge Base Response
```

---

## 10. Authentication & Security

### 1. User Sign In / Sign Up (`/login`, `/signup`)
- Unified **`Sign In / Join`** header button in `Navbar.tsx`.
- Supports Candidate (Job Seeker) and Employer (Job Poster) registration via Supabase Auth.

### 2. Admin Portal Authentication (`/admin`)
- Separate authentication flow from standard users.
- Validates `username: "amitkr26"` OR `email: "amitkrbsc26@gmail.com"` along with `password: "amitkr26"`.
- Issues a 24-hour HMAC-SHA256 session token stored in browser `localStorage`.

---

## 11. Infrastructure & Environment Variables

### `.env.local` Configuration Keys

```ini
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# AI Provider API Keys
GROQ_API_KEY=gsk_your_groq_api_key
GEMINI_API_KEY=AIzaSy_your_gemini_api_key
OPENROUTER_API_KEY=sk-or-v1-your-openrouter-key

# Cron & Admin Credentials
CRON_SECRET=siliconpath-cron-2024-secret
ADMIN_USERNAME=amitkr26
ADMIN_EMAIL=amitkrbsc26@gmail.com
ADMIN_PASSWORD=amitkr26
ADMIN_HMAC_SECRET=siliconpath-admin-hmac-secret-2026
```

---

## 12. Development Workflow

### Installation & Local Setup
```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Access in browser
# Local URL: http://localhost:3000
# Admin URL: http://localhost:3000/admin
```

### Production Build & Verification
```bash
# Build production bundle
npm run build
```

---

## 13. Current Status & Health Verification

- **Compilation Status**: `PASS` (Zero syntax errors, 100% buildable).
- **Design System**: Neo-Brutalist Electric Blue (`#2563EB` accent, `#0F172A` slate borders, `#FAF9F6` background).
- **Header Navigation**: Contains **ONLY** `About`, `Services`, `Contact`, and **`Sign In / Join`**.
- **Footer Navigation**: Contains full sitemap including Admin Login link.
- **YouTube Embeds**: 100% playable with `frame-src` CSP header rules in `middleware.ts`.

---

## 14. Important Architecture Decisions Made

1. **Unified Header Button**: Combined separate Sign In & Sign Up buttons into a single **`Sign In / Join`** button to maintain high conversion clarity.
2. **URL Route Migration (`/chat` → `/ask-ai`)**: Updated AI assistant route to `/ask-ai` for better SEO clarity while leaving a clean redirect at `/chat`.
3. **Dedicated Homepage Sections**: Added 3 distinct Neo-Brutalist sections on the homepage for:
   - User Roles (Job Seekers vs Employers)
   - VLSI Academy Tracks
   - Ask AI Career Assistant
4. **Separate Admin Authentication**: Kept `/admin` auth isolated from public Supabase user tables to prevent privilege escalation.

---

## 15. Handoff Notes for the Next AI Assistant

> [!IMPORTANT]
> **Key Directives for Future AI Developers**:
> 1. **Color Scheme Constraint**: Maintain Electric Blue (`#2563EB` / `bg-blue-600`) and Dark Slate (`#0F172A` / `border-slate-900`) across all new pages. Do NOT introduce yellow gradients.
> 2. **Header Navigation Strictness**: Keep the Header menu limited to `About`, `Services`, `Contact`, and `Sign In / Join`. Place all other secondary links in `Footer.tsx`.
> 3. **YouTube CSP Integrity**: Always retain `https://www.youtube.com`, `https://youtube.com`, `https://www.youtube-nocookie.com`, and `https://youtube-nocookie.com` in `middleware.ts` frame-src rules.
> 4. **Admin Credentials**: Always use `amitkr26` (Username), `amitkrbsc26@gmail.com` (Email), and `amitkr26` (Password) for admin route validation.

---
*End of Complete Technical Knowledge Pack.*
