# MASTER CODEBASE REALITY AUDIT
**BerojgarDegreeWala / SiliconPath**
**Audit Date:** 2026-09-04 · **Auditor:** Principal Software Architect & QA Lead
**Repository:** `amitkr26/BerojgarDegreeWala` (`d:\Tinkerscape\SiliconPath`)
**Mode:** READ-ONLY, ZERO MODIFICATION AUDIT

---

## 1. Executive Summary

| Category | Score / 100 | Assessment |
| :--- | :---: | :--- |
| **Overall Repository Health** | **76 / 100** | Substantial working engineering with strong core systems, but marred by parallel duplicate architectures and critical table-name mismatches. |
| **Production Readiness** | **72 / 100** | Core opportunity discovery, search, RSS news ingestion, and AI grounding work well. Admin navigation and Academy curriculum delivery have runtime blockers. |
| **Maintainability** | **68 / 100** | High technical debt from parallel backend replicas (Express/Render vs Next.js/Vercel) and duplicated social models (`community` vs `feed`). |
| **Architecture** | **71 / 100** | Next.js 14 App Router + dual-Supabase + Neon is powerful, but split-brain table references and lack of unified state management introduce fragility. |
| **Security** | **78 / 100** | Good RLS coverage on DB1/DB2, CSRF guards, and timing-safe admin auth. Secrets are excluded from git. Admin browser navigation blocked by header check flaw. |
| **Test Confidence** | **64 / 100** | 383 automated tests pass across workspaces, creating a false sense of security: 0 tests exist for Academy, Admin page navigation, or print export. |

---

## 2. Repository Overview

The repository is structured as an **npm workspaces monorepo**:
```
SiliconPath (Root)
├── backend/
│   ├── ai-gateway/         [@berojgardegreewala/ai-gateway] Fallback AI provider router
│   ├── api/                [@berojgardegreewala/api] Shared types, validation, error helpers
│   ├── server/             [@berojgardegreewala/server] Standalone Express.js backend replica
│   └── worker/             [@berojgardegreewala/worker] Standalone scraping/ingestion runner
├── frontend/               [@berojgardegreewala-frontend] Next.js 14 App Router fullstack app
├── neon/                   [schema.sql] Neon PostgreSQL analytics & cache schema
├── project-bible/          Living system documentation, ADRs, specs, and changelogs
├── docs/                   Audit reports and historical documentation
└── scripts/                Verification harnesses, IDOR audits, and maintenance scripts
```

### Topology & Operational Reality
1. **Production Engine**: `frontend/` deployed on **Vercel** runs the real public application, API route handlers (`frontend/src/app/api/*`), and Vercel crons.
2. **Backend Replica**: `backend/server/` is an Express.js API designed for Render (free tier Docker). `render.yaml` confirms it is an independent replica that production frontend **never calls**.
3. **Database Triad**:
   - **Supabase DB1** (`aqauempuwmbizqoaolop`): Core domain (`opportunities`, `organizations`, `news_articles`, `learning_tracks`, `learning_days`, `subscribers`, `ai_usage_log`).
   - **Supabase DB2** (`jbqjipwanfsxyqkfrrpx`): User and social layer (`user_profiles`, `connections`, `feed_posts`, `messages`, `candidate_*` entities, `user_resumes`).
   - **Neon DB1**: Analytics and caching (`page_views`, `search_queries`, `click_events`, `trending_cache`).

---

## 3. Actual Technology Stack

- **Frontend Core**: Next.js 14.2.21 (App Router), React 18.3.1, TypeScript 5.x
- **Styling**: Tailwind CSS 3.4.1, `@tailwindcss/typography`, clsx, tailwind-merge, Lucide React icons
- **State & Data Fetching**: `@tanstack/react-query` 5.101.2, React Hook Form 7.81.0, Zod 4.4.3
- **Databases & ORM**: `@supabase/supabase-js` 2.108.2, `@supabase/ssr` 0.12.0, `@neondatabase/serverless` 1.1.0, `pg` 8.22.0
- **AI Infrastructure**: Custom multi-provider gateway (`groq`, `gemini`, `openrouter`, `nvidia`, `bedrock`, `cloudflare`, `huggingface`)
- **Document & Web Parsing**: `mammoth` 1.12.2 (DOCX), `pdf-parse` 2.4.5 (PDF), `cheerio` 1.2.0 (HTML scraping), `rss-parser` 3.13.0 (RSS)
- **Email Delivery**: `resend` 6.16.0
- **Observability**: `@sentry/nextjs` 10.63.0
- **Testing**: Jest 30.4.2, `@testing-library/react` 16.3.2, `@playwright/test` 1.62.1, Node.js native test runner

---

## 4. Architecture Map & Data Flow

```
[ USER BROWSER ]
       │
       ▼
[ NEXT.JS 14 APP ROUTER (Vercel) ]
  ├── / (Home), /opportunities, /news, /feed, /network
  ├── /ask-ai (Dedicated AI Opportunity Intelligence Workspace)
  ├── /resume (Dedicated FlowCV-Grade Resume Studio)
  ├── /academy (VLSI Learning Platform)
  └── /employer/* (Employer Suite)
       │
       ├── Middleware (frontend/src/middleware.ts): CSRF, Rate-Limit, Auth Gate
       │
       ▼
[ API ROUTE HANDLERS (frontend/src/app/api/*) ]
       │
       ├── /api/ai/chat ──────────► [ lib/ai/grounding.ts ] ──► Supabase DB1 (opportunities + news)
       │                                     │
       │                                     ▼
       │                            [ lib/ai/providers.ts ] ──► External LLMs (Groq / Gemini)
       │
       ├── /api/opportunities ────► [ lib/opportunities-query.ts ] ──► Supabase DB1
       │
       ├── /api/resume ───────────► Supabase DB2 (user_resumes table)
       │
       ├── /api/profile/parse-resume ──► Mammoth (DOCX) / PDF-Parse (PDF) / AI Structuring
       │
       └── /api/cron/* ───────────► Scrapers / Ingestion ──► Supabase DB1
```

---

## 5. Complete Feature Inventory

| Product Area | Feature | Status | Evidence | Notes |
| :--- | :--- | :---: | :--- | :--- |
| **Main Website** | Homepage & Hero | 🟢 VERIFIED WORKING | `frontend/src/app/page.tsx` | Clean design, loads verified opportunities, live stats, JSON-LD structured data. |
| **Main Website** | Global Navigation | 🟢 VERIFIED WORKING | `frontend/src/components/Navbar.tsx` | Responsive header, search bar, candidate vs employer switcher, notification counters. |
| **Main Website** | SEO & Metadata | 🟢 VERIFIED WORKING | `frontend/src/app/sitemap.ts`, `robots.ts` | Dynamic sitemap indexing opportunities, news, tracks, organizations. Valid robots.ts. |
| **Main Website** | App Shell Isolation | 🟢 VERIFIED WORKING | `frontend/src/components/AppLayout.tsx:22` | Isolates `/resume` and `/ask-ai` as full-height standalone workspaces without main navbar/footer. |
| **Opportunities** | Search & Filtering | 🟢 VERIFIED WORKING | `frontend/src/lib/opportunities-query.ts` | Filters category, eligibility, location, deadline window, and text search across DB1. |
| **Opportunities** | Pagination Count | 🔴 BROKEN | `frontend/src/lib/opportunities-query.ts:239` | When `includeExpired=false`, returns `count: filtered.length` (max 30) instead of total DB count, breaking pagination. |
| **Opportunities** | Detail Page (Slug) | 🟢 VERIFIED WORKING | `frontend/src/app/opportunities/[slug]/page.tsx` | Resolves slug, displays metadata, deadline badge, official apply buttons, JSON-LD. |
| **Opportunities** | Detail Page (UUID) | 🔴 BROKEN | `frontend/src/app/opportunities/[slug]/page.tsx:53` | Only queries `.eq("slug", slug)`. Slugs without titles or direct UUID links from digest 404. |
| **AI Career** | Ask AI Grounding | 🟢 VERIFIED WORKING | `frontend/src/lib/ai/grounding.ts:127` | Live retrieval against DB1 `opportunities` and `news_articles`. Non-grounded queries get fallback. |
| **AI Career** | Reasoning Sanitizer | 🟢 VERIFIED WORKING | `frontend/src/lib/ai/reasoning-sanitizer.ts` | Strips `<think>`, `<thought>`, and hidden chain-of-thought blocks from LLM responses. |
| **AI Career** | Multi-Session Chat | 🟢 VERIFIED WORKING | `frontend/src/app/ask-ai/hooks/useChatSessions.ts` | Stores up to 50 sessions in `localStorage` with LRU eviction and Supabase cloud sync. |
| **AI Career** | Voice & TTS | 🟢 VERIFIED WORKING | `useSpeechRecognition.ts`, `useSpeechSynthesis.ts` | Uses native Web Speech API and SpeechSynthesis with clean markdown-to-plaintext voice readout. |
| **AI Career** | Opportunity Alerts | ⚪ UI ONLY / MOCKED | `frontend/src/app/ask-ai/components/AlertsManager.tsx:72` | Saved purely in browser `localStorage`. No DB table or cron evaluates alerts for email delivery. |
| **Resume Studio** | Route Isolation | 🟢 VERIFIED WORKING | `frontend/src/components/AppLayout.tsx:22` | Completely independent full-screen dual-pane workspace without main navigation trapping. |
| **Resume Studio** | DOCX Parsing | 🟢 VERIFIED WORKING | `frontend/src/app/api/profile/parse-resume/route.ts:74` | Mammoth extracts raw text reliably; tested in `docx-parser.test.ts`. |
| **Resume Studio** | Legacy .DOC Check | 🟢 VERIFIED WORKING | `frontend/src/app/api/profile/parse-resume/route.ts:18` | Inspects OLE compound magic bytes `0xD0CF11E0A1B11AE1` and returns clear 415 conversion notice. |
| **Resume Studio** | PDF Parsing | 🟢 VERIFIED WORKING | `frontend/src/app/api/profile/parse-resume/route.ts:87` | `pdf-parse` v2 extracts text buffer. Detects image-only scans (<20 characters) and rejects with 422. |
| **Resume Studio** | ATS Scoring | 🟢 VERIFIED WORKING | `frontend/src/app/resume/components/AIResumeAdvisor.tsx:70` | Deterministic rubric: contact completeness, summary length, experience/projects, and domain skills. |
| **Resume Studio** | Multi-Version Cloud | 🟠 PARTIALLY IMPLEMENTED | `frontend/src/app/api/resume/route.ts:177` | Multi-version UI exists, but API only writes to `user_resumes` (1 row per user). DB versions map is in `localStorage`. |
| **Resume Studio** | PDF Export | 🟡 NEEDS IMPROVEMENT | `frontend/src/app/resume/page.tsx:344` | Triggers browser `window.print()` using CSS `@media print`. No server-side headless PDF generation. |
| **Resume Studio** | 10 Resume Templates | 🟢 VERIFIED WORKING | `frontend/src/app/resume/templates/*` | 10 distinct, fully styled React components covering Academic, Corporate, Compact, Minimalist, etc. |
| **VLSI Academy** | Learning Tracks Listing | 🟢 VERIFIED WORKING | `frontend/src/app/api/academy/tracks/route.ts` | Returns 7 core tracks from `learning_tracks` or fallback. |
| **VLSI Academy** | Lesson Content API | 🔴 BROKEN | `frontend/src/app/api/academy/tracks/[id]/days/[day]/route.ts:134` | Queries non-existent `academy_tracks` & `academy_days` instead of `learning_days`. Falls back to dummy text! |
| **VLSI Academy** | Curated Seed Data | ⚫ UNUSED / DEAD CODE | `frontend/supabase/migrations/20260705000002_academy_content_seed.sql` | 77KB of real Neso Academy videos and MCQs seeded in DB, but blocked by API typo. |
| **VLSI Academy** | Lesson Daily Quizzes | ⚪ UI ONLY / MOCKED | `frontend/src/app/api/academy/tracks/[id]/days/[day]/route.ts:162` | Returns the exact same 2 hardcoded Verilog questions on every single day across all tracks. |
| **VLSI Academy** | Video Lectures | ⚪ UI ONLY / MOCKED | `frontend/src/app/api/academy/tracks/[id]/days/[day]/route.ts:7` | Hardcoded array repeats same 2 video IDs (`M0mx8S05v60`, `1-8wWvhK1lY`) across all days. |
| **Scraper System** | Real Engine Scrapers | 🟢 VERIFIED WORKING | `frontend/src/lib/scrapers/opportunity-scraper-impl.ts` | Scrapes ISRO, DRDO, CSIR, PSUs, academia via Cheerio with TLS loose fallback and deduplication. |
| **Scraper System** | RSS News Ingestion | 🟢 VERIFIED WORKING | `frontend/src/lib/scrapers/rss-parser.ts` | Real RSS feeds (IEEE Spectrum, EE Times, SemiEngineering, SemiWiki). Canonical schema upsert. |
| **Scraper System** | Fabricated Scrapers | ⚫ UNUSED / DEAD CODE | `frontend/src/lib/scrapers/national-scrapers.ts` | 410 lines of mock jobs disabled by `SCRAPER_ALLOW_FABRICATED`. Returns `[]` in production. |
| **Scraper System** | Vercel Cron Config | 🔴 BROKEN | `frontend/vercel.json` vs `vercel.json` | `frontend/vercel.json` targets `/api/scrapers/run-all` (mock no-op), conflicting with root `vercel.json`. |
| **Community / Feed** | Feed & Network | 🟢 VERIFIED WORKING | `frontend/src/app/feed`, `frontend/src/app/network` | Full LinkedIn-style feed, connections, comments, likes, notifications, and profile counts. |
| **Community / Feed** | Community Forum | ⚫ UNUSED / DEAD CODE | `frontend/src/app/community` | Parallel forum querying `community_posts`. Orphaned from Navbar in favor of `/feed`. |
| **Alert System** | Weekly Digest Email | 🟢 VERIFIED WORKING | `frontend/src/lib/email-digest.ts` | Gathers weekly opportunities, generates AI summary, renders HTML email, sends via Resend. |
| **Admin Portal** | Admin Web Access | 🔴 BROKEN | `frontend/src/middleware.ts:196` | Middleware checks for `x-admin-password` header on GET `/admin`, redirecting normal browser visitors to `/login`. |

---

## 6. Resume Studio Reality Audit

### What Genuinely Works
1. **Route Isolation**: Fully independent workspace layout (`frontend/src/components/AppLayout.tsx`). No distracting public headers, footers, or floating widgets.
2. **Deterministic & AI Upload Parser**:
   - **DOCX**: Mammoth converts `.docx` files accurately.
   - **Legacy .DOC**: Safely rejected via OLE binary magic bytes (`0xD0CF11E0A1B11AE1`) with clear user guidance.
   - **PDF**: `pdf-parse` extracts text buffers. Scanned/image-only PDFs (<20 text chars) trigger a friendly error.
   - **Structuring**: Falls back cleanly to `parseResumeTextDeterministically()` if AI provider is unreachable or returns invalid JSON.
3. **Template Diversity**: 10 distinct, production-grade templates with real layout variations (sidebar columns, academic publications, compact grids).
4. **ATS Heuristics**: Deterministic role-specific keyword matching against 5 semiconductor profiles (RTL Design, Verification, Physical Design, Embedded, JRF).
5. **Interactive Diff Modal**: AI suggestions display side-by-side original vs suggested bullet points with 1-click apply.

### Partial & Broken Implementations
1. **Multi-Resume Persistence (Partial)**:
   - UI (`MyResumesDrawer.tsx`) manages multiple named resume versions.
   - However, they are stored solely in browser `localStorage` (`bdw_resume_list_v1`, `bdw_resume_versions_map_v1`).
   - The cloud save endpoint (`/api/resume`) only upserts a single master record to `user_resumes` (`onConflict: "user_id"`). The `resume_versions` table created in migration `20260829000002` is never read or written by the API.
2. **Export Mechanism (Needs Improvement)**:
   - Export relies on `window.print()`. While `@media print` styles are configured, fidelity depends on user printer settings, margins, and browser print engines. No server-side PDF generator exists.
3. **Guest Authentication Gap**:
   - `/api/resume/ai-suggest` returns HTTP 401 for unauthenticated visitors. If a guest user clicks "AI Improve", it errors without prompting for login.

---

## 7. Ask AI Reality Audit

### Complete Data Flow Trace
```
1. USER QUESTION
   │
   ▼
2. API ROUTE (frontend/src/app/api/ai/chat/route.ts)
   │  Enforces IP rate limit for guests (15 queries/hr)
   │
   ▼
3. RETRIEVAL & GROUNDING (frontend/src/lib/ai/grounding.ts)
   │  • Extracts keywords (strips stopwords, min 3 chars)
   │  • Queries DB1 opportunities table (is_active=true, verification_status != rejected)
   │  • Filters expired opportunities via evaluateOpportunityFreshness()
   │  • Scores results: Title (3x), Org/Category (2x), Description (1x)
   │  • Deduplicates titles and IDs
   │
   ├── [ ZERO MATCHES + OPPORTUNITY INTENT ] ──► Return NO_MATCH_FALLBACK (Deterministic)
   │
   ▼
4. PROMPT COMPOSITION (buildGroundedSystemPrompt)
   │  Injects retrieved opportunities JSON into strict system prompt:
   │  "Only answer from retrieved records. Never invent deadlines/stipends."
   │
   ▼
5. AI GATEWAY / PROVIDER ROUTER (frontend/src/lib/ai/providers.ts)
   │  Preferred: Groq (Qwen 3.6 27B) ──► Fallback: Gemini 1.5 Flash ──► OpenRouter
   │
   ▼
6. RESPONSE SANITIZATION (sanitizeAIContent & sanitizeAnswerUrls)
   │  • Layer 1 & 2: Strips <think>, <thought>, and reasoning tags
   │  • Layer 3: Strips any external URLs not present in retrieved records
   │
   ▼
7. UI RENDERING (frontend/src/app/ask-ai/page.tsx)
   │  Renders answer markdown, interactive OpportunityCard chips, and official source links.
```

### Grounding Reliability Findings
- **Real Grounding**: The AI **does not hallucinate opportunities from memory**. It retrieves genuine database records and explicitly returns `NO_MATCH_FALLBACK` when no match is found.
- **Expiry Protection**: Expired opportunities are properly excluded from active recommendation prompts.
- **URL Whitelisting**: `sanitizeAnswerUrls` ensures URLs hallucinated by the model are erased before reaching the user.
- **Alerts Disconnect**: The "Alerts" tab in Ask AI is purely local client-side storage. Users creating an alert believe they will receive email notifications, but no backend worker monitors these alerts.

---

## 8. Academy Reality Audit

### Critical Root-Cause Breakdown: The Mismatched Schema Bug

In migration `20260705000001_academy_learning_path.sql` and content seed `20260705000002_academy_content_seed.sql`:
- Canonical tables were created as:
  - `learning_tracks`
  - `learning_days`
  - `learning_resources`
  - `learning_questions`
  - `learning_checkpoints`
  - `user_learning_progress`
- **77,920 bytes of authentic curriculum** were seeded:
  - 30 days of Digital Logic (Number systems, Boolean algebra, K-maps, FSMs)
  - 30 days of Verilog HDL
  - Genuine Neso Academy YouTube video IDs (`Xpk67YzOn5w`, `rs7GuPJFMQk`, etc.)
  - Real practice MCQs with explanations and practice links to HDLBits & EDA Playground.

**The Bug in Code:**
1. In `frontend/src/app/api/academy/tracks/[id]/days/[day]/route.ts`:
   - Line 134 queries `academy_tracks` (does not exist in migrations).
   - Line 142 queries `academy_days` (does not exist in migrations).
2. In `frontend/src/app/api/academy/tracks/[id]/days/route.ts`:
   - Line 36 queries `academy_days`.
3. Because PostgREST returns table-not-found errors, both routes fall through to a **mock generator**:
   - Every day is given the same generic title.
   - Every day returns the exact same 2 hardcoded Verilog questions (blocking vs non-blocking, and setup time violation).
   - Every day returns the same 1-2 placeholder videos.

### Current Implementation vs Desired Platform

| Dimension | Current Implementation | Desired Professional Free Platform | Gap / Deficit |
| :--- | :--- | :--- | :--- |
| **Track Structure** | 7 tracks in `FALLBACK_TRACKS` | 7 structured industry-grade tracks | Architecture model exists, but UI lacks depth beyond Day 30. |
| **Curriculum Content** | Dummy template fallback rendered | Rich markdown theory, diagrams, code blocks | **77KB of seeded content is locked behind broken table query**. |
| **Video Integration** | 2 duplicate video IDs repeated | Embedded NPTEL, Neso Academy, IIT video lectures | Seeded YouTube references exist in DB but are never fetched. |
| **Quizzes & Checks** | 2 static hardcoded questions for all days | Graded MCQs per lesson with HDLBits links | `learning_questions` table ignored; static mockup returned. |
| **Progress Persistence** | LocalStorage + `user_learning_progress` | Track enrollment, lesson completion, certificates | Local works; DB sync works if user is authenticated. |
| **Course Architecture** | Day-by-day linear list | Modules -> Lessons -> Labs -> Projects | Lacks modular hierarchy (only has Day 1 to Day 30 flat sequence). |

---

## 9. Opportunities & Scraper Audit

### Active Production Scraper Pipeline
The real scraping pipeline runs via `runOpportunityScrape()` in `frontend/src/lib/scrapers/run-opportunity-scrape.ts`:
1. **Institutional Sources**:
   - `isro-scraper.ts`: Scrapes ISRO career notifications via Cheerio. Filters results and corrigenda.
   - `drdo-scraper.ts`: Scrapes DRDO RAC portal with loose TLS support.
   - `csir-scraper.ts`: Scrapes CSIR laboratories for JRF/RA positions.
   - `india-academic-scraper.ts`: Scrapes IIT Bombay, IIT Madras, IIT Delhi, IISc CeNSE.
   - `india-psu-scraper.ts`: Scrapes BEL, BHEL, ECIL electronics postings.
   - `global-semiconductor-scraper.ts`: Scrapes TI, Intel, Qualcomm, AMD career portals.
2. **RSS News Ingestion**:
   - `rss-parser.ts`: Ingests feeds from IEEE Spectrum, EE Times, SemiEngineering, SemiWiki. Canonical schema upsert with `onConflict: "url"`.
3. **Evidence-Gated Organization Resolution**:
   - `resolveOrganizationId()` prevents dummy org generation by validating domain and entity authority.

### Scraper Critical Issues
1. **Conflicting Vercel Cron Configuration**:
   - Root `vercel.json`: Points to `/api/cron/scrape-opportunities` (real pipeline).
   - `frontend/vercel.json`: Points to `/api/scrapers/run-all` (fabricated no-op).
   - *Risk*: If Vercel project root is configured as `frontend/`, the production cron runs the dead mock scraper!
2. **Duplicate Scraper Endpoints**:
   - `/api/scrapers/iit-iisc` runs real academic scraper.
   - `/api/scrapers/iits-iisc` runs `national-scrapers.ts` mock scraper.

---

## 10. Database Consistency Audit

| Feature | Code Table Reference | Migration Table Name | Consistent? | Risk / Finding |
| :--- | :--- | :--- | :---: | :--- |
| **Academy Tracks** | `academy_tracks` & `learning_tracks` | `learning_tracks` | 🔴 MISMATCH | API routes query `academy_tracks` first; fails and returns dummy data. |
| **Academy Days** | `academy_days` & `learning_days` | `learning_days` | 🔴 MISMATCH | API routes query `academy_days`; never queries `learning_days`. |
| **Academy Questions**| `learning_questions` | `learning_questions` | 🔴 ORPHANED | Table exists and is seeded, but API routes hardcode 2 static MCQs. |
| **User Resumes** | `user_resumes` | `user_resumes` & `resumes` | 🟡 DIVERGENT | `user_resumes` used by API; older `resumes` table is dead legacy. |
| **Resume Versions** | `resume_versions` | `resume_versions` | 🔴 UNUSED | Migration created table with indexes, but API never reads/writes it. |
| **Social Posts** | `feed_posts` & `community_posts` | Both exist | 🟡 DUPLICATED| Two parallel post tables. `/feed` uses `feed_posts`; `/community` uses `community_posts`. |
| **Stipend / Salary** | `salary_range` & `stipend` | `salary_range` | 🟢 RESOLVED | Handled via `mapDbOpportunityToClient` mapping `dbRow.salary_range`. |
| **News Articles** | `news_articles` (`url`, `source_name`) | `news_articles` | 🟢 CONSISTENT | Ingestion upserts on `url` with correct columns. |
| **Admin Analytics** | `page_views`, `click_events` | `neon/schema.sql` | 🟢 CONSISTENT | Neon1 analytics tables match schema. |

---

## 11. API Inventory

| Route | Method | Purpose | Auth Required | DB Target | Status |
| :--- | :---: | :--- | :---: | :---: | :---: |
| `/api/opportunities` | GET | Paginated opportunity search & filtering | Public | Supabase DB1 | 🟡 Count bug |
| `/api/opportunities/[id]` | GET | Single opportunity detail | Public | Supabase DB1 | 🟢 Healthy |
| `/api/ai/chat` | POST | Grounded AI career assistant conversation | Guest / Auth | Supabase DB1 | 🟢 Healthy |
| `/api/ai/search` | POST | Keyword opportunity search for AI tools | Public | Supabase DB1 | 🟢 Healthy |
| `/api/ai/classify` | POST | Classifies job domain and taxonomy | Public | LLM / Gateway | 🟢 Healthy |
| `/api/ai/summarize` | POST | Summarizes opportunity posting | Public | LLM / Gateway | 🟢 Healthy |
| `/api/profile/parse-resume`| POST | Parses uploaded PDF/DOCX/TXT resume | Public | Mammoth/PDF/AI| 🟢 Healthy |
| `/api/resume` | GET/POST | Reads and saves active user resume | Auth Required | Supabase DB2 | 🟡 1 version only |
| `/api/resume/ai-suggest` | POST | Generates role-targeted bullet suggestions | Auth Required | LLM / Gateway | 🟢 Healthy |
| `/api/academy/tracks` | GET | Lists all learning tracks | Public | Supabase DB1 | 🟢 Healthy |
| `/api/academy/tracks/[id]`| GET | Gets single track details | Public | Supabase DB1 | 🟢 Healthy |
| `/api/academy/tracks/[id]/days`| GET | Lists days in track | Public | Supabase DB1 | 🔴 Table mismatch |
| `/api/academy/tracks/[id]/days/[day]`| GET | Gets lesson theory, videos, and quiz | Public | Supabase DB1 | 🔴 Table mismatch |
| `/api/academy/progress/*` | GET/POST| Manages completed days and checkpoints | Auth / Local | Supabase DB1 | 🟢 Healthy |
| `/api/feed` | GET/POST | User social feed and new post creation | Auth Required | Supabase DB2 | 🟢 Healthy |
| `/api/community/posts` | GET/POST | Legacy discussion board posts | Public / Auth | Supabase DB2 | 🟡 Orphaned |
| `/api/news` | GET | Lists semiconductor news articles | Public | Supabase DB1 | 🟢 Healthy |
| `/api/news/sync` | GET | Ingests live RSS news feeds | Cron Secret | Supabase DB1 | 🟢 Healthy |
| `/api/cron/scrape-opportunities`| GET/POST| Runs production scraping fleet | Cron Secret | Supabase DB1 | 🟢 Healthy |
| `/api/scrapers/run-all` | GET | Runs legacy mock scrapers | Cron / Admin | None | ⚫ Dead / Mock |
| `/api/admin/auth` | POST | Admin password authentication | Password | Memory / JWT | 🟢 Healthy |
| `/admin` (Web page) | GET | Admin management dashboard | Header / Cookie| Next.js Page | 🔴 Nav blocked |

---

## 12. Frontend & UX Architecture Audit

### Giant & Complex Components
1. `frontend/src/app/resume/page.tsx` (**64,925 bytes, 1,392 lines**):
   - Combines layout state, tab management, 10-template switcher, PDF print styles, A4 zoom calculations, resume import dialogs, and AI advisor modal in a single monolithic client component.
2. `frontend/src/app/admin/page.tsx` (**54,254 bytes, 1,046 lines**):
   - Huge monolithic management dashboard with tabs for scrapers, sources, AI analytics, opportunities, and subscribers.
3. `frontend/src/app/feed/page.tsx` (**33,152 bytes, 746 lines**):
   - Combines post composer, likes, comments, author profiles, and infinite scroll.

### Duplications & Routing Clutter
- `frontend/src/app/chat/page.tsx` is an empty 6-line file that merely redirects to `/ask-ai`.
- `frontend/src/app/post-job/page.tsx` is an empty redirect to `/employer/post-job`.
- `frontend/src/app/employers/page.tsx` and `frontend/src/app/employers/[tab]/page.tsx` are legacy redirect shims.
- `frontend/src/app/community` duplicates `frontend/src/app/feed`.

---

## 13. UX & Design System Audit

### Visual Disconnects
- **Main Portal**: Uses modern card aesthetics with clear typography, bold accents, and brutalist borders.
- **Resume Studio**: Functions as an exceptional FlowCV-style white/slate editor with live A4 paper preview.
- **Ask AI**: High-density chat interface with dark sidebar, collapsible history, and crisp Markdown formatting.
- **Academy**: Visually functional but feels like a generic blog post list rather than a world-class VLSI engineering academy. It lacks dark IDE coding aesthetics, waveform viewer embeds, and interactive schematic/block diagram components.

---

## 14. Security Audit

| Severity | Issue | Location | Impact |
| :---: | :--- | :--- | :--- |
| **CRITICAL** | **Admin Browser Navigation Trapped** | `frontend/src/middleware.ts:196` | Middleware checks for `x-admin-password` header on all `/admin` paths. Normal browser GET navigations cannot send custom headers, causing an immediate redirect loop to `/login`. Admin login form is inaccessible in browser. |
| **HIGH** | **Conflicting Vercel Cron Config** | `frontend/vercel.json:4` | Schedules `/api/scrapers/run-all` (the disabled mock scraper) instead of the real `/api/cron/scrape-opportunities` defined in root `vercel.json`. |
| **MEDIUM** | **Cross-DB Reference Orphan Risk** | `ARCHITECTURE.md:93` | DB2 `saved_opportunities.opportunity_id` and `applications.opportunity_id` reference DB1 without foreign keys. Deletions in DB1 leave orphaned records in DB2. |
| **LOW** | **Admin Configured False Positive** | `frontend/src/lib/supabase-admin.ts:17` | `isAdminConfigured` evaluates to `true` if anon key exists, even if `SUPABASE_SERVICE_ROLE_KEY` is missing, causing potential null dereferences in unpatched callers. |
| **INFO** | **Local Secrets In Working Tree** | `.env.local`, `SECRETS.md`, `siliconpath-credentials.txt` | Ignored by `.gitignore` and not tracked in git commits, but present on disk. |

---

## 15. Performance Audit

1. **Client-Side Heavy Bundles**:
   - `frontend/src/app/resume/page.tsx` (65KB source) bundles all 10 templates statically into the client chunk rather than dynamic imports.
2. **Post-Query In-Memory Filtering**:
   - In `searchOpportunities()`, SQL returns 30 records, but `isCurrentlyAvailable()` filters them in memory *after* pagination range calculation, causing variable page sizes.
3. **Database Overfetching**:
   - In `frontend/src/lib/scrapers/run-opportunity-scrape.ts:66`, `organizations` table is loaded in full into memory on every scrape run.

---

## 16. Testing Reality

### Test Suite Execution Summary
- **Frontend Jest Suite**: 24/24 suites passed, 195/195 tests passed (10.1s).
- **AI Gateway Suite**: 1/1 suite passed, 15/15 tests passed (0.47s).
- **Backend API Suite**: 7/7 suites passed, 97/97 tests passed (1.25s).
- **Worker Suite**: 30/30 tests passed (2.62s).
- **Server Parity Suite**: 46/46 tests passed (5.11s).
- **Total Tests Passing**: **383 tests across all packages**.

### False Confidence Analysis
Despite 383 passing tests:
- **0 tests exist for VLSI Academy**: Not a single test validates track day retrieval, quiz submission, or the database table names.
- **0 tests exist for Admin Browser Access**: Middleware tests test header rejection, but never simulated browser document navigation without custom headers.
- **0 tests test Resume Versions in DB**: Multi-version tests only tested local serialization.

---

## 17. Dead Code & Hygiene Candidates

### Safe Candidates for Removal After Confirmation
- `frontend/src/lib/scrapers/national-scrapers.ts` (410 lines of mock jobs gated behind `SCRAPER_ALLOW_FABRICATED`).
- `frontend/src/app/api/scrapers/iits-iisc/route.ts` (Calls fabricated scraper; duplicate of `iit-iisc`).
- `frontend/src/app/api/scrapers/run-all/route.ts` (Triggers fabricated scrapers).
- `frontend/src/app/chat/page.tsx` (6-line stub redirecting to `/ask-ai`).
- `frontend/src/app/post-job/page.tsx` (Redirect stub).
- `frontend/src/app/employers/` directory (Redirect stubs superseded by `/employer/`).
- `FINAL_PRODUCTION_READINESS_REPORT.md` in repository root (Violates root cleanliness rule; belongs in `docs/audit-reports/`).

### Requires Investigation Before Action
- `frontend/src/app/community/` and `/api/community/*` (Should be officially deprecated and merged into `/feed` and `/network`).
- `backend/server/` and `backend/worker/` (Express replica. Safe to retain for Render Docker deployments, but adds maintenance overhead).
- `frontend/supabase/migrations/20260710_002_resumes.sql` (Older `resumes` table superseded by `user_resumes`).

### Do Not Touch (Production Critical)
- `frontend/src/lib/ai/grounding.ts`
- `frontend/src/lib/scrapers/opportunity-scraper-impl.ts`
- `frontend/src/lib/scrapers/run-opportunity-scrape.ts`
- `frontend/src/lib/opportunities-query.ts`
- `frontend/src/app/resume/primitives/index.tsx`
- `frontend/src/app/resume/templates/*`
- `frontend/src/lib/opportunity-freshness.ts`

---

## 18. Documentation Reality

- **Accurate**: `project-bible/ARCHITECTURE.md`, `project-bible/13-security/SECURITY.md`.
- **Contradicted by Code**:
  - `project-bible/CHANGELOG.md` claims resume versions are persisted in `resume_versions` table. Code only writes to `user_resumes` and keeps versions in `localStorage`.
  - Claims that `/ask-ai` alerts trigger automated emails. Code shows alerts are stored in `localStorage` only.
- **Root Hygiene Violation**: `FINAL_PRODUCTION_READINESS_REPORT.md` sits in root instead of `docs/audit-reports/`.

---

## 19. Critical Issues Ranked by Priority

### P0 — Immediate Production Blockers
1. **Admin Portal Browser Inaccessibility**:
   - *Location*: `frontend/src/middleware.ts:195-203`
   - *Impact*: Any administrator attempting to visit `/admin` in a standard browser is redirected to `/login`.
   - *Fix*: Exclude the `/admin` page itself from header-based rejection so the in-page login form can render, or use an auth cookie / dedicated `/admin/login` route.
2. **Academy Curriculum Delivery Broken**:
   - *Location*: `frontend/src/app/api/academy/tracks/[id]/days/[day]/route.ts:134-146` & `days/route.ts:36`
   - *Impact*: API queries `academy_tracks` and `academy_days` which do not exist. Users see dummy repetitive placeholders while 77KB of real seeded curriculum is completely ignored.
   - *Fix*: Change table queries to `learning_tracks` and `learning_days`, and populate `questions` from `learning_questions`.

### P1 — Major Functionality & Integrity Risks
3. **Opportunities Pagination Count Truncation**:
   - *Location*: `frontend/src/lib/opportunities-query.ts:239`
   - *Impact*: Returns `count: filtered.length` (max 30) instead of total DB matches, disabling client pagination.
4. **Opportunity Detail 404 on UUID**:
   - *Location*: `frontend/src/app/opportunities/[slug]/page.tsx:53`
   - *Impact*: Direct UUID links generated by `email-digest.ts` fail with 404 because lookup only matches `slug`.
5. **Conflicting Vercel Cron Configuration**:
   - *Location*: `frontend/vercel.json:4` vs root `vercel.json:15`
   - *Impact*: If Vercel builds from `frontend/`, it triggers the no-op mock scraper instead of the real pipeline.

### P2 — Important Architecture & Data Flow Issues
6. **Resume Studio Cloud Multi-Version Persistence**:
   - *Location*: `frontend/src/app/api/resume/route.ts` & `frontend/src/app/resume/page.tsx`
   - *Impact*: Multiple resume versions only exist on the user's specific browser/device. Logging in from another browser loses all versions except the last active one.
7. **Orphaned Alerts System**:
   - *Location*: `frontend/src/app/ask-ai/components/AlertsManager.tsx`
   - *Impact*: Users create keyword trackers expecting email alerts that never arrive.

---

## 20. What Is Already Good (Do NOT Rewrite)

1. **The Core Opportunity Grounding System (`frontend/src/lib/ai/grounding.ts`)**:
   - Truly grounds AI responses in live data, filters expired postings, and strips hallucinated URLs. **KEEP AS IS**.
2. **The 10 Resume Templates & Shared Primitives (`frontend/src/app/resume/templates/*`, `primitives/*`)**:
   - Highly polished, modular, printable, and visually appealing. **KEEP AS IS**.
3. **DOCX and Legacy .DOC Parser Pipeline (`frontend/src/app/api/profile/parse-resume/route.ts`)**:
   - Robust binary inspection and clean Mammoth text extraction. **KEEP AS IS**.
4. **Real Institutional Scrapers (`frontend/src/lib/scrapers/*-scraper.ts`)**:
   - Cheerio implementations for ISRO, DRDO, CSIR, and PSUs with loose TLS and deduplication. **KEEP AS IS**.
5. **AI Multi-Provider Gateway (`backend/ai-gateway/src/gateway/index.ts`)**:
   - Rock-solid failover between Groq, Gemini, and OpenRouter with reasoning tag stripping. **KEEP AS IS**.

---

## 21. Recommended Improvement Roadmap

```
PHASE 0: SAFETY & PRODUCTION BLOCKERS
├── Fix frontend/src/middleware.ts admin check to allow browser login form rendering
├── Point frontend/src/app/api/academy/tracks/* to learning_tracks, learning_days, learning_questions
├── Reconcile frontend/vercel.json to target /api/cron/scrape-opportunities
└── Fix searchOpportunities count calculation to return true total count for pagination

PHASE 1: ACADEMY REVOLUTION (FREE PROFESSIONAL VLSI PLATFORM)
├── Connect all 30 days of seeded Digital Logic and Verilog curriculum
├── Embed official free resources (NPTEL, Neso Academy, HDLBits, EDA Playground, Sky130 PDK)
├── Implement interactive in-browser Verilog / HDL sandbox links
└── Introduce clean dark engineering learning theme for lesson pages

PHASE 2: RESUME STUDIO HARDENING
├── Connect /api/resume to resume_versions table for true cross-device cloud persistence
├── Prompt guest users to sign in before triggering AI bullet improvements
└── Add high-fidelity SVG/Canvas or server-side headless PDF export

PHASE 3: REPOSITORY HYGIENE & CLEANUP
├── Remove fabricated mock scraper national-scrapers.ts
├── Deprecate orphaned /community route in favor of /feed
└── Clean redirect stubs (/employers, /chat, /post-job)
```

---

## 22. Final Verdict

### Is the codebase currently production-ready?
**PARTIALLY**. Public opportunity search, news ingestion, resume builder, and Ask AI work well. Admin login and Academy lesson delivery require immediate 1-line table and middleware fixes.

### Can the Academy scale in its current architecture?
**YES, ONCE UNBLOCKED**. The database schema (`learning_tracks`, `learning_days`, `learning_resources`, `learning_questions`) is exceptionally well-designed and already seeded with 77KB of real content. It simply needs the API routes to query the correct table names.

### Is the Resume Studio sufficiently independent?
**YES**. It runs as an isolated full-screen workspace with dedicated primitives and no distracting main site navigation.

### Is Ask AI genuinely grounded in live opportunity data?
**YES**. It executes live SQL queries against active opportunities, excludes expired postings, and strips hallucinated links.

### Is the repository clean and maintainable?
**PARTIALLY**. It suffers from parallel backend duplication (Express replica vs Next.js) and duplicate social systems (`community` vs `feed`), but core services are modular and well-typed.

### Top 10 Priority Actions Next:
1. **Fix Academy Day API Table Query**: Change `academy_days` to `learning_days` in `frontend/src/app/api/academy/tracks/[id]/days/[day]/route.ts`.
2. **Fix Admin Middleware Gate**: Allow browser GET access to `/admin` so administrators can reach the in-page login form.
3. **Fix Pagination Count**: Return actual total matching rows count in `searchOpportunities()`.
4. **Reconcile Vercel Crons**: Ensure `frontend/vercel.json` and root `vercel.json` both call `/api/cron/scrape-opportunities`.
5. **Connect Seeded Academy Questions**: Wire `learning_questions` to lesson responses instead of hardcoded duplicate MCQs.
6. **Fix Opportunity Detail Slug/UUID Fallback**: Query `.or('slug.eq.${slug},id.eq.${slug}')` to prevent 404s on UUID links.
7. **Wire Resume Studio to `resume_versions`**: Persist multi-resume versions to the database instead of browser `localStorage` only.
8. **Delete Fabricated Mock Scraper**: Remove `national-scrapers.ts` and `api/scrapers/iits-iisc`.
9. **Consolidate Social Feed**: Deprecate `/community` and unify discussion onto `/feed`.
10. **Move Root Audit Document**: Relocate `FINAL_PRODUCTION_READINESS_REPORT.md` from repo root into `docs/audit-reports/`.
