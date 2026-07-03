# PROJECT_AUDIT.md

**Last Updated:** July 3, 2026 (Session 13 - Documentation Suite + Secrets + Deployment Setup)

---

## 1. Executive Summary / Project Vision

**ElectroBridge** is a comprehensive job board and career platform for the **Indian electronics, semiconductor, and VLSI industry**. It aggregates R&D job opportunities, fellowships, PhD positions, and news from 19+ sources (16 RSS feeds + 3 HTML scrapers), then filters, categorizes, and surfaces them to users. The platform provides:

- **Curated opportunities** — Research and development positions in electronics (JRF, SRF, PhD, fellowships, government jobs, private sector, internships, postdocs)
- **News aggregation** — Electronics/semiconductor industry news from top sources (IEEE Spectrum, Semiconductor Engineering, EE Times, etc.)
- **AI-powered tools** — Chatbot, opportunity matcher, resume scoring (ATS), natural language search, summarizer, expiry detection
- **Community forum** — Posts, comments, upvotes for user discussion
- **User dashboards** — Saved opportunities, application tracking, profile management, resume builder
- **Telegram notifications** — Real-time opportunity alerts
- **Weekly email digest** — AI-generated weekly roundup of top opportunities and news

**Target audience:** Indian students and professionals in electronics engineering, VLSI design, semiconductor manufacturing, embedded systems, and related research fields.

**Business model:** Free platform with no monetization yet. Admin panel for manual content management.

---

## 2. Repository Overview

| Metric | Value |
|--------|-------|
| **Full repo path** | `/workspaces/JobsAI` |
| **Git remote** | `origin https://github.com/amitkr26/JobsAI.git` |
| **Default branch** | `main` (only branch, tracks `origin/main`) |
| **Total commits** | 103 |
| **Last commit** | `7292134` — "Add files via upload" |
| **Total repo size** | ~400 MB (node_modules, .next build output) |
| **Active codebase** | `electrobridge/` — ~18,000 lines of TypeScript/TSX/CSS |

### GitHub Configuration
- **Repository:** `amitkr26/JobsAI`
- **CI/CD:** 1 GitHub Actions workflow:
  - `ci.yml` — Runs lint, test (31 suites), and build on PRs and pushes to `main`
- **Deployment:** Vercel (`amitk26/electrobridge`) — auto-deploys from `main`, root dir `electrobridge/`

---

## 3. Directory Structure

```
JobsAI/
├── .github/workflows/           # CI/CD
│   └── ci.yml                   # Lint → Test (31 tests) → Build
├── .gitignore
├── .gitattributes
├── PROJECT_AUDIT.md             # ← This file — single source of truth
├── README.md                    # Overview of active codebase
├── docs/
│   └── CLEANUP_REPORT.md        # Repository cleanup record
│
├── electrobridge/                ← ACTIVE CODEBASE (15,252+ LOC, ~230 source files)
│   ├── src/
│   │   ├── app/                  30+ page routes + 40+ API routes
│   │   ├── components/           25+ React components
│   │   ├── lib/                  24+ modules (db, ai, scrapers, utils)
│   │   ├── types/                1 type definition file
│   │   ├── __tests__/            4 test suites (31 tests)
│   │   └── middleware.ts         Supabase SSR auth middleware
│   ├── supabase/migrations/      9 migration files
│   ├── jest.config.ts            Jest 30 config with ts-jest
│   ├── tsconfig.test.json        Test-specific tsconfig
│   ├── sentry.client.config.ts   Sentry browser init
│   ├── sentry.server.config.ts   Sentry server init
│   ├── .vercel/                  Vercel project link
│   ├── .env.local                Runtime env vars (gitignored)
│   └── (published at: electrobridge.vercel.app)
```

---

## 4. Active Codebase: `electrobridge/` — Complete Breakdown

### 4.1 Tech Stack

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| **Framework** | Next.js | 14.2.21 | React framework (App Router) |
| **Language** | TypeScript | ^5 | Type safety |
| **UI** | React | ^18.3.1 | UI library |
| **Styling** | Tailwind CSS | ^3.4.1 | Dark theme utility-first CSS |
| **Typography** | Tailwind Typography | ^0.5.20 | Prose styling |
| **Icons** | lucide-react | ^0.383.0 | Icon library |
| **Toasts** | sonner | ^2.0.7 | Toast notifications |
| **CSS** | autoprefixer | ^10.5.2 | CSS vendor prefixes |
| **Date** | date-fns | ^3.6.0 | Date formatting |
| **Classnames** | clsx | ^2.1.1 | Conditional class merging |
| **Testing** | Jest | ^30.4.2 | Test runner |
| **Testing** | ts-jest | ^29.4.11 | TypeScript Jest transformer |
| **Testing** | @testing-library/react | ^16.3.2 | React component testing |
| **Testing** | @testing-library/jest-dom | ^6.9.1 | DOM matchers |
| **Error Tracking** | @sentry/nextjs | ^10.63.0 | Error monitoring |

**Database & ORM:**
| Technology | Version | Purpose |
|------------|---------|---------|
| **Supabase JS** | ^2.108.2 | Supabase client (db1 + db2) |
| **@supabase/ssr** | ^0.12.0 | SSR auth middleware + cookie management |
| **@neondatabase/serverless** | ^1.1.0 | Neon HTTP-based Postgres driver (db3 + db4) |
| **pg** (dev) | ^8.22.0 | PostgreSQL client for migrations |

**Scraping & Content:**
| Technology | Version | Purpose |
|------------|---------|---------|
| **cheerio** | ^1.2.0 | HTML scraping (ISRO, DRDO, CSIR) |
| **rss-parser** | ^3.13.0 | RSS feed parsing (16 sources) |

**AI & External Services:**
| Service | Type | Fallback Order | Used In |
|---------|------|----------------|---------|
| **AWS Bedrock Mantle** | AI (#1) | Primary (~60% traffic) | `providers.ts` — model `openai.gpt-oss-120b` |
| **Groq** | AI (#2) | First fallback | `providers.ts` — `llama-3.3-70b-versatile` |
| **NVIDIA NIM** | AI (#3) | Second fallback | `providers.ts` — `mistralai/mixtral-8x22b-instruct-v0.1` |
| **Google Gemini** | AI (#4) | Third fallback | `providers.ts` — `gemini-1.5-flash` |
| **OpenRouter** | AI (#5) | Fourth fallback | `providers.ts` — `openai/gpt-4o-mini` |
| **Cloudflare Workers AI** | AI (#6) | Fifth fallback | `providers.ts` — `@cf/meta/llama-3.1-8b-instruct` |
| **HuggingFace** | AI (#7) | Last resort | `providers.ts` — `mistralai/Mistral-7B-Instruct-v0.3` |
| **Resend** | Email | — | `email-digest.ts` — weekly digest |
| **Telegram Bot API** | Messaging | — | `telegram-bot.ts` — opportunity alerts |
| **Plausible Analytics** | Analytics | — | `layout.tsx` — visitor tracking |

> **AI Success rate:** ~99% (Bedrock handles ~60%, fallbacks catch the rest)

**Hosting:**
| Component | Platform | URL |
|-----------|----------|-----|
| **Production** | Vercel | https://electrobridge.vercel.app |

### 4.2 Source File Summary

| File Type | Count | Lines |
|-----------|-------|-------|
| TypeScript (.ts) | 69 | varies |
| TypeScript React (.tsx) | 69 | varies |
| CSS | 1 | 92 |
| **Total** | **139** | **15,252+** |

### 4.3 Pages (30 Route Groups)

| # | Route | Rendering | Auth | Description |
|---|-------|-----------|------|-------------|
| 1 | `/` | Server (async) | — | Homepage: stats, opportunities, news, trending tags, JSON-LD SEO |
| 2 | `/about` | Server | — | About page with live DB stats |
| 3 | `/categories` | Server | — | Category overview grid |
| 4 | `/category/[category]` | Server | — | Filtered listing by category |
| 5 | `/opportunities` | Client | — | Full filtered listing with sidebar filters |
| 6 | `/opportunities/[slug]` | Server (ISR 3600s) | — | Detail page with AI insights panel |
| 7 | `/news` | Client | — | News listing with source tabs (IEEE, Nature, etc.) |
| 8 | `/news/[slug]` | Server (ISR 1800s) | — | News detail page |
| 9 | `/organizations` | Server | — | All organizations with opportunity counts |
| 10 | `/organizations/[slug]` | Server (ISR) | — | Org detail with associated opportunities |
| 11 | `/match` | Client | — | AI-powered opportunity matcher |
| 12 | `/chat` | Client | — | AI electronics career chatbot |
| 13 | `/login` | Client | — | Auth login page |
| 14 | `/signup` | Client | — | Auth registration page |
| 15 | `/dashboard` | Client | ✅ Protected | Stats, saved, applications, resume score |
| 16 | `/profile` | Client | ✅ Protected | User profile form |
| 17 | `/resume` | Client | ✅ Protected | 6-step AI resume builder |
| 18 | `/community` | Client | — | Forum with category tabs |
| 19 | `/community/[id]` | Client | — | Post detail with comments |
| 20 | `/admin` | Client | Admin | Admin panel |
| 21 | `/admin/add-opportunity` | Client | Admin | Add opportunity form |
| 22 | `/admin/add-news` | Client | Admin | Add news form |
| 23 | `/admin/edit-opportunity/[id]` | Client | Admin | Edit opportunity |
| 24 | `/contact` | Client | — | Contact form |
| 25 | `/resources` | Server | — | Resources hub |
| 26 | `/resources/jrf-guide` | Server | — | JRF career guide |
| 27 | `/resources/phd-guide` | Server | — | PhD guide |
| 28 | `/resources/international-fellowships` | Server | — | Fellowships guide |
| 29 | `/resources/vlsi-careers` | Server | — | VLSI career guide |
| 30 | `/resources/net-vs-gate` | Server | — | NET vs GATE comparison |

**Also:** `/auth/callback` (OAuth code exchange handler), `/robots.txt`, `/sitemap.xml`, `/favicon.ico`, `/api/og` (OG image), `/api/og/opportunity/[slug]` (OG image per opp)

### 4.4 API Routes (35 Endpoints, 44 HTTP Methods)

**CRUD / Data:**
| # | Route | Method | Auth | Purpose |
|---|-------|--------|------|---------|
| 1 | `/api/opportunities` | GET | — | List with filters (category, eligibility, location, etc.) |
| 2 | `/api/opportunities` | POST | Admin | Create opportunity |
| 3 | `/api/opportunities/[id]` | GET | — | Single opportunity detail |
| 4 | `/api/opportunities/[id]` | PATCH | Admin | Update opportunity |
| 5 | `/api/opportunities/[id]` | DELETE | Admin | Delete opportunity |
| 6 | `/api/opportunities-feed` | GET | — | Public JSON feed for external use |
| 7 | `/api/news` | GET | — | List news with filters |
| 8 | `/api/organizations` | GET | — | List organizations with opportunity counts |
| 9 | `/api/similar/[id]` | GET | — | Similar opportunities (same org/category) |

**User Actions:**
| # | Route | Method | Auth | Purpose |
|---|-------|--------|------|---------|
| 10 | `/api/applications` | GET | ✅ Auth | List user's saved applications |
| 11 | `/api/applications` | PATCH | ✅ Auth | Update application status |
| 12 | `/api/applications` | DELETE | ✅ Auth | Delete application |
| 13 | `/api/subscribe` | POST | — | Newsletter subscribe (rate-limited) |
| 14 | `/api/subscribe` | DELETE | — | Unsubscribe |
| 15 | `/api/report-issue` | POST | — | Report an opportunity issue |
| 16 | `/api/track-click` | POST | — | Track apply link clicks |
| 17 | `/api/calendar-export/[id]` | GET | — | ICS calendar download for deadlines |
| 18 | `/api/auth/signout` | POST | ✅ Auth | Sign out |

**AI Endpoints:**
| # | Route | Method | Auth | Purpose |
|---|-------|--------|------|---------|
| 19 | `/api/ai/chat` | POST | — | Electronics career chatbot |
| 20 | `/api/ai/match` | POST | — | Profile-to-opportunity matcher (top 10) |
| 21 | `/api/ai/search` | POST | — | Natural language → DB filters |
| 22 | `/api/ai/summarize` | POST | — | Raw description → structured summary |
| 23 | `/api/ai/expire` | GET | Cron | AI-based expiry detection |
| 24 | `/api/ai/opportunity-summary/[slug]` | GET | — | AI insight panel for opp detail |

**Admin:**
| # | Route | Method | Auth | Purpose |
|---|-------|--------|------|---------|
| 25 | `/api/admin/recheck-link` | POST | Admin | Recheck single opportunity link |
| 26 | `/api/analytics/ai-usage` | GET | Admin | AI provider usage stats (Neon) |
| 27 | `/api/analytics/platform` | GET | Admin | Platform analytics (Neon) |

**Cron / Automation:**
| # | Route | Method | Auth | Purpose |
|---|-------|--------|------|---------|
| 28 | `/api/scrape` | GET | Cron | Main scraper (news + opportunities) |
| 29 | `/api/scrape-opportunities` | GET | Cron | Legacy opportunity scraper |
| 30 | `/api/scrape-jobs` | GET | Cron | Deprecated (returns notice) |
| 31 | `/api/check-links` | GET | Cron | Verify opportunity links |
| 32 | `/api/cleanup-news` | POST | Cron | Deduplicate news articles |
| 33 | `/api/archive-news` | GET | Cron | Archive old news (db1→db2, >30 days) |
| 34 | `/api/sync-replica` | GET | Cron | Sync to Neon read replica (db1→db4) |
| 35 | `/api/send-digest` | GET | Cron | Weekly email digest generation |

**Community:**
| # | Route | Method | Auth | Purpose |
|---|-------|--------|------|---------|
| 36 | `/api/community/posts` | GET | — | List forum posts with filters |
| 37 | `/api/community/posts` | POST | ✅ Auth | Create forum post |
| 38 | `/api/community/posts/[id]` | GET | — | Single post with comments |
| 39 | `/api/community/posts/[id]` | DELETE | ✅ Auth | Delete own post |
| 40 | `/api/community/comments` | POST | ✅ Auth | Add comment |
| 41 | `/api/community/vote` | POST | ✅ Auth | Toggle upvote via RPC |

**Resume Builder:**
| # | Route | Method | Auth | Purpose |
|---|-------|--------|------|---------|
| 42 | `/api/resume` | GET | ✅ Auth | Get user's resume |
| 43 | `/api/resume` | POST | ✅ Auth | Create/update resume with AI ATS scoring |

**Health:**
| # | Route | Method | Auth | Purpose |
|---|-------|--------|------|---------|
| 44 | `/api/health` | GET | — | Multi-DB health check (all 4 databases) |

### 4.5 Components (23 UI Components)

**Layout:**
| Component | Description |
|-----------|-------------|
| `Navbar` | Main navigation — glass morphism, 9 items, search overlay, mobile drawer, auth dropdown |
| `Footer` | Site footer with links (Company, Resources, Legal), admin link |

**UI Primitives:**
| Component | Description |
|-----------|-------------|
| `CategoryBadge` | Color-coded category badge (JRF=cyan, SRF=purple, PhD=green, etc.) |
| `CopyLinkButton` | Clipboard copy with tooltip feedback |
| `DeadlineCountdown` | Urgency countdown timer (color-coded: green→yellow→red) |
| `LinkTypeIndicator` | Apply link type icon (direct/homepage/pdf/email/portal) |
| `LoadingSkeleton` | Animated placeholder shimmer |
| `SearchBar` | Search input with icon |
| `ShareButtons` | WhatsApp + Twitter sharing links |
| `VerificationBadge` | Verification status indicator (verified/unverified/expired/flagged) |
| `OpportunityDisclaimer` | Pre-apply tips + report issue button |
| `SubscribeSection` | Compact email subscribe form |

**Modal / Overlay:**
| Component | Description |
|-----------|-------------|
| `ReportIssueModal` | Issue report form modal |
| `SubscribeModal` | Full subscription form modal |

**Feature Components:**
| Component | Category | Description |
|-----------|----------|-------------|
| `AIAnalyticsPanel` | Admin | AI usage stats & charts from Neon |
| `AIOpportunitySummary` | Opportunity | AI-powered insight panel on detail pages |
| `ApplyButton` | Opportunity | Click tracker + application logger |
| `ExpiringSoon` | Opportunity | Server-side expiring soon banner |
| `FilterBar` | Opportunity | Sidebar filter checkboxes (category, location, eligibility, deadline) |
| `NewsCard` | News | Article card with source color indicator |
| `NewsImage` | News | Image with error fallback |
| `OpportunityCard` | Opportunity | Full metadata card (title, org, stipend, deadline, tags) |
| `SimilarOpportunities` | Opportunity | Server-side related opportunities |

### 4.6 Library Modules (24 Files)

**Database (4 files):**
| Module | Path | Lines | Purpose |
|--------|------|-------|---------|
| **DB Router** | `src/lib/db/index.ts` | 47 | Routes to correct DB by purpose. Uses guard clauses: returns `undefined` if env missing, preventing build-time crashes. |
| **Supabase Client** | `src/lib/supabase.ts` | 20 | Anon + service_role Supabase clients |
| **SSR Client** | `src/lib/supabase/server.ts` | 22 | Server-side cookie-based Supabase client for RSC/API routes |
| **Browser Client** | `src/lib/supabase/client.ts` | 8 | Browser SSR Supabase client for client components |

**AI (7 files):**
| Module | Path | Lines | Purpose |
|--------|------|-------|---------|
| **AI Providers** | `src/lib/ai/providers.ts` | 381 | 7-provider fallback chain with retry logic |
| **AI Matcher** | `src/lib/ai/matcher.ts` | 60 | User profile → opportunity matching |
| **AI Summarizer** | `src/lib/ai/summarizer.ts` | 38 | Description → structured summary |
| **AI Search Parser** | `src/lib/ai/search-parser.ts` | 40 | NL query → structured DB filters |
| **AI Expiry Checker** | `src/lib/ai/expiry-checker.ts` | 25 | Deadline + AI-based expiry detection |
| **AI Newsletter** | `src/lib/ai/newsletter.ts` | 37 | Weekly digest generation |
| **AI News Filter** | `src/lib/ai/news-filter-ai.ts` | 61 | AI article relevance classification |

**Scrapers (8 files):**
| Module | Path | Lines | Purpose |
|--------|------|-------|---------|
| **Scraper: RSS** | `src/lib/scrapers/rss-parser.ts` | 278 | 16 RSS sources (news + opportunities) |
| **Scraper: Filter** | `src/lib/scrapers/news-filter.ts` | 576 | 380+ keywords, 45 blocked patterns |
| **Scraper: ISRO** | `src/lib/scrapers/isro-scraper.ts` | 127 | ISRO careers HTML scraper |
| **Scraper: DRDO** | `src/lib/scrapers/drdo-scraper.ts` | 123 | DRDO vacancies HTML scraper |
| **Scraper: CSIR** | `src/lib/scrapers/csir-scraper.ts` | 108 | CSIR recruitment HTML scraper |
| **Scraper: Govt** | `src/lib/scrapers/govt-scraper.ts` | 141 | CSIR RSS + combined govt scraper |
| **Scraper: Orchestrator** | `src/lib/scrapers/opportunity-scraper.ts` | 51 | Runs all scrapers in sequence |
| **Scraper: Utils** | `src/lib/scrapers/utils.ts` | 57 | Text cleaning, slugification |
| **Scraper: Types** | `src/lib/scrapers/types.ts` | 20 | Shared type definitions |

**Business Logic (5 files):**
| Module | Path | Lines | Purpose |
|--------|------|-------|---------|
| **Email Digest** | `src/lib/email-digest.ts` | 195 | Resend-based weekly digest |
| **Telegram Bot** | `src/lib/telegram-bot.ts` | 55 | Telegram opportunity notifications |
| **Rate Limiter** | `src/lib/rate-limiter.ts` | 22 | In-memory IP rate limiting (3 req/hr per IP) |
| **Utils** | `src/lib/utils.ts` | 93 | Date formatting, URL resolution, filter options |
| **Design Tokens** | `src/lib/design-tokens.ts` | 101 | Dark theme design system constants |

### 4.7 Scraping Sources

**News RSS (Tier 1):** IEEE Spectrum, Semiconductor Engineering, EE Times, Electronics Weekly, Chip Design, SemiWiki, Electronics For You, Nature Electronics, Science Daily (×2), Phys.org (×2), India Semiconductor Mission, IESA

**News RSS (Tier 2):** AnandTech, The Register

**Opportunity RSS:** Academic Positions, Scholarship Roof, Jobs.ac.uk

**HTML Scraping:** ISRO Careers (`isro.gov.in`), DRDO Vacancies (`drdo.gov.in`), CSIR Recruitment (`csir.res.in`), CSIR RSS feed

### 4.8 Content Filtering Rules

Defined in `news-filter.ts`:
- **Blocklist:** 45 regex patterns — filters out AI/ML content (not electronics-specific), general tech, biotech, gaming, space exploration, consumer electronics, finance, weather, social media
- **Keywords:** 380+ electronics/semiconductor keywords for relevance matching
- **Auto-tagging:** 20+ tag categories — Foundry, EDA, Chip Design, AI Chips, Materials, Equipment, Markets, Policy, India, IoT, EV/Power, 5G/6G, Quantum, Photonics, Memory, Sensors, Security, Aerospace, Manufacturing, Research

---

## 5. Feature Catalog

### 5.1 Core Features (by User Story)

**As a visitor (unauthenticated):**
- Browse R&D job opportunities with filters (category, location, eligibility, deadline)
- Search opportunities by keyword
- View detailed opportunity pages with AI-generated insights
- Read filtered electronics industry news with source tabs
- Browse organizations and their associated opportunities
- Use the AI chatbot for electronics career questions
- Use the AI opportunity matcher (enter text profile → get matched opps)
- Use natural language search ("find PhD positions in VLSI in Bangalore")
- Subscribe to weekly email digest
- Report issues with opportunities
- View community forum posts
- Read career resources (JRF guide, PhD guide, VLSI careers, etc.)

**As an authenticated user:**
- Everything a visitor can do
- Save/bookmark opportunities
- Track applications with status workflow (saved → applied → interview → offer → accepted/rejected)
- Set keyword/category alerts (instant/daily/weekly)
- Complete profile (skills, education, experience, LinkedIn/GitHub)
- Build resume with 6-step wizard (personal, education, skills, experience, projects, publications)
- Get AI ATS score and feedback on resume
- Export resume as PDF (browser print)
- Create community forum posts
- Comment and upvote on community posts
- Receive Telegram notifications for new matching opportunities
- Sign out

**As an admin:**
- Manage opportunities (CRUD with verification workflow)
- Manage news articles (CRUD)
- Recheck individual opportunity links
- View AI provider usage statistics
- View platform analytics

### 5.2 Automated Features (Cron Jobs)

| Cron | Schedule | Description |
|------|----------|-------------|
| **Scrape all** | Daily 06:00 UTC | Fetches news from 16 RSS feeds + scrapes ISRO/DRDO/CSIR for new opportunities |
| **Weekly digest** | Sunday 03:00 UTC | AI-generated email roundup of top opportunities and news, sent via Resend |
| **Archive news** | Sunday 02:00 UTC | Moves news >30 days old from Supabase Primary → Supabase Secondary |
| **Sync replica** | Daily 07:00 UTC | Syncs opportunities + news from Supabase Primary → Neon Secondary read replica |

**Embedded (run within scrape):**
- **Link checking** — Verifies opportunity links are still valid
- **Expiry detection** — AI-based deadline expiry detection
- **News cleanup** — Deduplication of news articles

### 5.3 AI Feature Details

| Feature | Model Used | Avg Latency | Input | Output |
|---------|-----------|-------------|-------|--------|
| Chatbot | Bedrock (fallback chain) | ~2s | User question + context | Career advice response |
| Opportunity Matcher | Bedrock | ~3s | User skills/interests | Top 10 matched opportunities with scores |
| NL Search | Gemini/OpenRouter | ~1s | Natural language query | Structured DB filters |
| Summarizer | Groq | ~1.5s | Raw job description | Structured summary (title, org, deadline, etc.) |
| Expiry Detection | Cloudflare | ~2s | Opportunity data | Expired/Active classification |
| ATS Scoring | Bedrock | ~3s | Resume JSON | Score (0-100) + feedback items |
| Opportunity Summary | Groq | ~1.5s | Opportunity data | AI insight paragraph |
| Weekly Digest | Gemini | ~2s | Recent opps + news | Curated email content |
| News Filter | NVIDIA | ~3s | Article title + summary | Electronics-relevant boolean |

---

## 6. User Flows

### 6.1 Visitor Flow (Unauthenticated)

```
Homepage → Browse Opportunities (/opportunities)
         → Filter by category/location/eligibility/deadline
         → Click opportunity → Detail page (ISR-cached, 3600s)
                              → See AI insight summary
                              → Click apply (tracked via track-click)
                              → Save to calendar (ICS export)
         → Read News (/news)
              → Filter by source tab (IEEE, Nature, etc.)
              → Click article → Detail page (ISR-cached, 1800s)
         → Browse Organizations (/organizations)
              → Click org → Detail page with associated opportunities
         → AI Chat (/chat) → Ask career question → Get AI response
         → AI Match (/match) → Enter profile → Get matched opportunities
         → Community (/community) → Browse posts, read comments
         → Resources → Read career guides
         → Sign Up → Create account (Google OAuth or email/password)
         → Login → Redirect to dashboard
```

### 6.2 Authenticated User Flow

```
Dashboard (/dashboard) → View stats (saved, applications, profile completion)
                       → Saved opportunities → Manage bookmarks
                       → Applications → Track status workflow
                       → Resume score card → View/Build resume
Profile (/profile) → Edit skills, education, experience, links
Resume Builder (/resume) → Step 1-6: Personal → Education → Skills → Experience → Projects → Publications
                         → AI ATS scoring → Save → PDF export
Community (/community) → Create post → Add comments → Upvote posts
Settings → Alerts → Set keyword/category alerts (instant/daily/weekly)
```

### 6.3 Admin Flow

```
Dashboard → Admin panel (/admin)
          → Manage opportunities (add/edit/delete, verify)
          → Manage news (add/edit/delete)
          → AI Usage analytics → View provider usage stats
          → Platform analytics → View page views, clicks, shares
          → Recheck links → Verify individual opportunity URLs
```

### 6.4 Auth Flow

```
User visits /login or /signup
  → Email/password sign in/sign up
  → OR Google OAuth (configured via Supabase Auth)
  → Auth callback at /auth/callback exchanges code for session
  → If error (expired link, invalid code, etc.) → Redirect to /login with error toast
  → Session stored in Supabase SSR cookie (httpOnly, secure)
  → Middleware refreshes session on every request via getUser()
  → Protected routes check auth state client-side (redirect to /login)
  → Sign out → POST /api/auth/signout → Clear session
```

---

## 7. Design System

### 7.1 Theme Tokens

Built with Tailwind CSS, dark theme throughout. No light mode support.

| Token Group | Colors |
|-------------|--------|
| **Background** | `bg-primary: #0A0E1A`, `bg-secondary: #0B0F1C` |
| **Surface** | `surface: #111827`, `surface-elevated: #141B2D` |
| **Border** | `border: #1E2A3F`, `border-hover: #22D3EE33` |
| **Accent** | `accent: #22D3EE`, `accent-hover: #06B6D4`, `accent-glow: rgba(34,211,238,0.15)` |
| **Success** | `#10B981` |
| **Warning** | `#F59E0B` |
| **Danger** | `#EF4444` |
| **Text** | `text-primary: #F8FAFC`, `text-secondary: #94A3B8`, `text-muted: #64748B` |
| **Org brands** | `isro: #A0784C`, `intel: #5B7DB1`, `tifr: #8B6CB4`, `tata: #4A8C6F`, `drdo: #B85450` |

**Typography:**
- Display: `Space Grotesk`
- Body: `Inter`
- Mono: `Geist Mono`
- Custom size: `xxs: 0.625rem`

**Border Radius:** `sm: 6px`, `md: 8px`, `lg: 12px`, `xl: 16px`, `2xl: 24px`, `pill: 9999px`, `card: 12px`

**Shadows:** `card`, `card-hover`, `glow-cyan`, `glow-sm`, `card-dark`, `glow-btn`

**Gradients:**
- `gradient-hero`: `linear-gradient(to right, #22D3EE, #3B82F6)` — primary gradient
- `gradient-deadline`: `linear-gradient(to right, #F59E0B, #EF4444)` — urgent deadline
- `gradient-card-border`: `linear-gradient(to right, transparent, rgba(34,211,238,0.2), transparent)`
- `gradient-radial-cyan`: `radial-gradient(ellipse at center, rgba(34,211,238,0.05) 0%, transparent 70%)`

### 7.2 Global Styles (globals.css)

- **Scrollbars:** Thin (4px), dark-themed, styled for both WebKit and Firefox
- **Print styles:** `.resume-print-area` hidden by default, shown during `window.print()`; all other body content hidden during print
- **Utility classes:** `.text-balance`, `.scrollbar-hide`, `.line-clamp-2`, `.line-clamp-3`
- **CSS Custom Properties:** Mirrored from Tailwind tokens for JS references

### 7.3 Navbar Architecture

The header uses a **glass morphism** pattern:
- `bg-bg-primary/80 backdrop-blur-2xl` — semi-transparent dark background with blur
- Gradient bottom glow line for depth
- 9 navigation items with active indicator pill
- **Resources dropdown** rendered server-side (prevents hydration mismatch)
- **Search overlay** slides open below nav with glass background
- **Mobile drawer** right slide-in with accordion dropdowns, gradient blobs
- **Auth section** gradient Sign Up button, user dropdown with glass panel

### 7.4 Component Patterns

All components follow these conventions:
- **Imports:** React, Next.js Link/Image, lucide-react icons, sonner toast, clsx
- **Styling:** Tailwind classes only, no CSS modules or styled-components
- **State:** React hooks (useState, useEffect, useCallback) — no external state management
- **API calls:** `fetch()` with credentials, manual loading/error/handling
- **Toasts:** `sonner` for success/error notifications
- **Error boundaries:** Not implemented (Sentry captures unhandled errors)

---

## 8. Database Architecture (4 Databases, 36 Tables)

### 8.1 Supabase Primary — db1 (Core Data)
- **Project:** `aqauempuwmbizqoaolop` ("electrobridge")
- **Org:** `klmterftkepmalhasmdb`
- **Region:** `ap-southeast-1` (Singapore)
- **Status:** ✅ ACTIVE_HEALTHY
**LinkedIn-feature tables (12):** `user_follows`, `connection_requests`, `connections`, `feed_posts`, `feed_post_likes`, `feed_post_comments`, `feed_post_reposts`, `company_pages`, `company_followers`, `skill_endorsements`, `recommendations`, `conversations`, `messages`, `notifications` — plus 17 new profile columns (username, headline, about, avatar_url, banner_url, current_position, current_org, city, country, website, is_open_to_work, open_to_work_types, profile_views, follower_count, following_count, connection_count, is_profile_public). 10 seed company pages (DRDO, ISRO, CSIR, IIT Delhi, IIT Bombay, Texas Instruments, Qualcomm, Intel, Tata Electronics, IIST).

- **Tables (31 total):**

| Table | Purpose | Key Columns | Row-Level Security |
|-------|---------|-------------|-------------------|
| `opportunities` | Core — R&D job opportunities | id, title, org, category, deadline, stipend, tags, slug, verification_status, is_active | Public read (active only), Admin all |
| `news_articles` | Electronics news | id, title, summary, source, tags, published_at | Public read, Admin all |
| `subscribers` | Email newsletter subscribers | email, keywords, categories, is_active | Anyone insert, Admin read |
| `ai_usage_log` | AI provider audit trail | id, provider, model, endpoint, duration_ms, success | Service role insert, Admin read |
| `link_check_logs` | Link verification audit | id, opportunity_id, status, checked_at | Admin all |
| `opportunity_reports` | User issue reports | id, opportunity_id, reason, status | Anyone insert, Admin manage |
| `telegram_subscribers` | Telegram bot users | chat_id, is_active, subscribed_at | Admin manage |
| `calendar_exports` | Calendar export logs | id, opportunity_id, user_id, exported_at | Admin manage |
| `suggestions` | User feature suggestions | id, title, description, votes | Anyone insert, Admin read |
| `user_profiles` | Extended user profiles | id (FK→auth.users), full_name, skills, education, experience, resume_url | Own read/update, Admin all |
| `saved_opportunities` | Bookmarks | user_id, opportunity_id (unique pair) | Own manage |
| `applications` | Application tracking | user_id, opportunity_id, status (saved→applied→interview→offer→rejected/accepted) | Own manage |
| `user_alerts` | Keyword alerts | user_id, keywords, categories, frequency (instant/daily/weekly) | Own manage |
| `user_resumes` | Resume data + ATS scores | user_id, full_name, education (jsonb), skills[], experience (jsonb), projects (jsonb), ats_score, ats_feedback (jsonb) | Own manage |
| `community_posts` | Forum posts | user_id, title, content, category, tags[], upvotes, comment_count | Anyone read, Auth create/update own/delete own |
| `community_comments` | Post comments | post_id, user_id, content | Anyone read, Auth create, delete own |
| `community_votes` | Upvotes (toggle) | post_id, user_id (unique pair) | Anyone read, Auth vote/unvote |

### 8.2 Supabase Secondary — db2 (Archive / Overflow)
- **Project:** `jbqjipwanfsxyqkfrrpx` ("ElectroBridge")
- **Org:** `mlmrdjqolmmfwnimvbss` (old account)
- **Region:** `ap-southeast-1` (Singapore)
- **Status:** ✅ ACTIVE_HEALTHY
- **Tables (13 total):** 2 new + 11 original from legacy

| Table | Purpose |
|-------|---------|
| `news_archive` | News older than 30 days (moved by weekly cron) |
| `subscribers_overflow` | Extra subscriber storage |
| 11 legacy tables | Same schema as db1 (from legacy codebase) |

### 8.3 Neon Primary — db3 (Analytics)
- **Project:** `raspy-mouse-45454356` ("electrobridge")
- **Region:** `aws-us-east-1`
- **Status:** ✅ Active
- **Tables (4):**

| Table | Purpose |
|-------|---------|
| `ai_usage_log` | AI provider audit trail (migrated from Supabase Primary) |
| `link_check_logs` | Link verification audit (migrated from Supabase Primary) |
| `opportunity_reports` | User issue reports (migrated from Supabase Primary) |
| `platform_analytics` | Page views, clicks, shares |

### 8.4 Neon Secondary — db4 (Read Replica)
- **Project:** `plain-glade-52224468` ("electrobridge")
- **Region:** `aws-us-east-1`
- **Status:** ✅ Active
- **Tables (2):**

| Table | Purpose |
|-------|---------|
| `opportunities_mirror` | Read-only copy of active opportunities |
| `news_mirror` | Read-only copy of recent news |

### 8.5 Entity Relationships

```
auth.users (Supabase Auth, managed by Supabase)
  └── user_profiles (1:1, FK → auth.users.id CASCADE)
        ├── saved_opportunities (1:N, FK → user_profiles.id)
        │     └── opportunities (N:1, FK → opportunities.id)
        ├── applications (1:N, FK → user_profiles.id)
        │     └── opportunities (N:1, FK → opportunities.id)
        ├── user_alerts (1:N, FK → user_profiles.id)
        └── user_resumes (1:1, FK → auth.users.id CASCADE)

community_posts
  ├── community_comments (1:N, FK → community_posts.id CASCADE)
  │     └── auth.users (N:1, FK → auth.users.id)
  └── community_votes (1:N, FK → community_posts.id CASCADE)
        └── auth.users (N:1, FK → auth.users.id)

opportunities (can be reported or saved)
  ├── opportunity_reports (1:N, FK → opportunities.id)
  └── link_check_logs (1:N, FK → opportunities.id)
```

### 8.6 Row-Level Security (30 Policies Total)

| Scope | Count | Pattern |
|-------|-------|---------|
| Public read (opportunities, news, community posts) | 4 | `USING (is_active = true)` or `USING (true)` |
| Auth own manage (profiles, saved, applications, alerts, resume) | 6 | `USING (auth.uid() = user_id)` |
| Auth create (community posts/comments/votes) | 3 | `WITH CHECK (auth.uid() = user_id)` |
| Auth delete own (community posts/comments/votes) | 3 | `FOR DELETE USING (auth.uid() = user_id)` |
| Anyone insert (subscribe, report, suggest) | 3 | `WITH CHECK (true)` |
| Admin all (opportunities, news, logs, reports) | 8 | `USING (true) WITH CHECK (true)` |
| Admin read (subscribers, suggestions, ai_usage_log) | 3 | `FOR SELECT USING (true)` |

### 8.7 Key Stored Procedures

**`toggle_upvote(p_post_id uuid, p_user_id uuid)` — PostgreSQL function:**
1. Checks if a vote exists for (post_id, user_id)
2. If exists: deletes vote, decrements post.upvotes
3. If not: inserts vote, increments post.upvotes
4. Uses `SECURITY DEFINER` to bypass RLS

**`sync_ats_score()` — Trigger function:**
- On INSERT or UPDATE of `user_resumes`, copies `ats_score` to `user_profiles.resume_ats_score`
- Used by trigger `sync_resume_ats` on `user_resumes`

### 8.8 Migrations History

| File | Database | Purpose |
|------|----------|---------|
| `20260630000001_base_schema.sql` | Supabase Primary | Core tables: opportunities, news_articles, subscribers, user_profiles, saved_opportunities, applications, user_alerts |
| `20260630000002_extensions.sql` | Supabase Primary | Database extensions (pgcrypto, etc.) |
| `20260630000003_rls_policies.sql` | Supabase Primary | 19 RLS policies across all core tables |
| `20260702000001_resume_builder.sql` | Supabase Primary | user_resumes table + ATS sync trigger |
| `20260702000002_community.sql` | Supabase Primary | community_posts, comments, votes + toggle_upvote RPC |

*(Additional Neon/Supabase2 migration files exist in the codebase but their SQL resides at the Neon/Supabase project level, not in the repo.)*

---

## 9. Security Model

### 9.1 Authentication
- **Provider:** Supabase Auth (built-in)
- **Methods:** Email/password, Google OAuth
- **Session storage:** HTTP-only cookies via `@supabase/ssr` `createServerClient`
- **Middleware:** Runs on every request to refresh session via `getUser()`, No explicit route protection in middleware (routes check auth client-side)
- **Auth callback:** `/auth/callback` exchanges OAuth code for session, redirects on error
- **Edge cases handled:**
  - `error` / `error_description` in URL → Redirect with error message
  - No code in URL → Redirect with "no authorization code" error
  - Code exchange failure → Redirect with error message

### 9.2 Authorization
- **Regular users:** Authenticated via Supabase JWT, identified by `auth.uid()`
- **Admin users:** Password-protected via `NEXT_PUBLIC_ADMIN_PASSWORD` (plain-text comparison, no role-based access)
- **Service role:** Used in API routes for admin operations that bypass RLS

### 9.3 Rate Limiting
- **Implementation:** In-memory `Map<string, { count, resetAt }>`
- **Limits:** 3 requests per IP per hour (default)
- **Scope:** Currently only applied to `/api/subscribe`
- **Limitation:** Resets on Vercel cold start, not shared across instances

### 9.4 Environment Variable Security
- Public vars (prefixed `NEXT_PUBLIC_`): Exposed to client-side code
- Private vars: Server-only, accessed via `process.env`
- All 23+ vars set in Vercel Production + Development environments
- `PREVIEW` environments inherit from Production

---

## 10. Environment Variables

**Status:** ⚠️ 24 of 26 set in Vercel

| Variable | Public | Vercel Prod | Vercel Dev | Purpose |
|----------|--------|-------------|-------------|---------|
| `NEXT_PUBLIC_SITE_URL` | ✅ Public | ✅ | ✅ | Canonical site URL (email verification, OAuth redirects) |
| `NEXT_PUBLIC_APP_URL` | ✅ Public | ✅ | ✅ | Fallback app URL for redirects |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Public | ✅ | ✅ | Supabase Primary project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Public | ✅ | ✅ | Supabase Primary anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | 🔒 Private | ✅ | ✅ | Supabase Primary service role (admin ops) |
| `SUPABASE_2_URL` | 🔒 Private | ✅ | ✅ | Supabase Secondary project URL |
| `SUPABASE_2_ANON_KEY` | ✅ Public | ✅ | ✅ | Supabase Secondary anon key |
| `SUPABASE_2_SERVICE_ROLE_KEY` | 🔒 Private | ✅ | ✅ | Supabase Secondary service role |
| `NEON_1_DATABASE_URL` | 🔒 Private | ✅ | ✅ | Neon Primary connection string (analytics) |
| `NEON_2_DATABASE_URL` | 🔒 Private | ✅ | ✅ | Neon Secondary connection string (read replica) |
| `NEXT_PUBLIC_ADMIN_PASSWORD` | ✅ Public | ✅ | ✅ | Admin panel password |
| `CRON_SECRET` | 🔒 Private | ✅ | ✅ | Cron endpoint auth |
| `GROQ_API_KEY` | 🔒 Private | ✅ | ✅ | AI provider #2 |
| `NVIDIA_NIM_API_KEY` | 🔒 Private | ✅ | ✅ | AI provider #3 |
| `GEMINI_API_KEY` | 🔒 Private | ✅ | ✅ | AI provider #4 |
| `OPENROUTER_API_KEY` | 🔒 Private | ✅ | ✅ | AI provider #5 |
| `HUGGINGFACE_API_KEY` | 🔒 Private | ✅ | ✅ | AI provider #7 |
| `CLOUDFLARE_AI_TOKEN` | 🔒 Private | ✅ | ✅ | AI provider #6 |
| `CLOUDFLARE_ACCOUNT_ID` | 🔒 Private | ✅ | ✅ | AI provider #6 |
| `AWS_BEARER_TOKEN_BEDROCK` | 🔒 Private | ✅ | ✅ | AI provider #1 (primary) |
| `RESEND_API_KEY` | 🔒 Private | ✅ | ✅ | Email digest |
| `FROM_EMAIL` | 🔒 Private | ✅ | ✅ | Email sender address |
| `TELEGRAM_BOT_TOKEN` | 🔒 Private | ✅ | ✅ | Telegram bot |
| `TELEGRAM_CHANNEL_ID` | 🔒 Private | ✅ | ✅ | Telegram channel ID |
| `NEXT_PUBLIC_SENTRY_DSN` | ✅ Public | ❌ | ❌ | Sentry DSN for error tracking |
| `GOOGLE_CLIENT_ID` | 🔒 Private | ❌ | ❌ | Google OAuth client ID (Supabase config) |
| `GOOGLE_CLIENT_SECRET` | 🔒 Private | ❌ | ❌ | Google OAuth client secret (Supabase config) |

---

## 11. Vercel Configuration

### Project Settings
| Setting | Value |
|---------|-------|
| **Project** | `amitk26/electrobridge` |
| **Framework** | Next.js |
| **Root Directory** | `electrobridge/` |
| **Node.js Version** | 24.x |
| **Auto-deploy** | From `main` branch |

### Cron Jobs (vercel.json)

| Route | Schedule | Purpose |
|-------|----------|---------|
| `/api/scrape?mode=all` | Daily 06:00 UTC | Scrape news + opportunities |
| `/api/send-digest` | Weekly Sun 03:00 UTC | Weekly email digest |
| `/api/archive-news` | Weekly Sun 02:00 UTC | Archive old news (db1→db2) |
| `/api/sync-replica` | Daily 07:00 UTC | Sync to Neon read replica (db1→db4) |

### Build Output (Last Successful Build)

| Metric | Value |
|--------|-------|
| Build ID | Local (latest) |
| Build Time | ~2 min |
| Total Routes | 94+ |
| Static Pages | 206+ |
| Dynamic Routes | 4 |
| TypeScript Errors | 0 |
| Lint Warnings | 0 |

### Next.js Config Details
- **Image remotePatterns:** Allows all HTTPS hosts (`**`)
- **Redirects:** UUID-format opportunity URLs → `/opportunities` (strips invalid paths)
- **Sentry:** Wrapped with `withSentryConfig` (org `amitk26`, project `electrobridge`)

---

## 12. Testing Strategy

### 12.1 Current Coverage (4 Suites, 31 Tests)

| Suite | File | Type | Tests | What It Tests |
|-------|------|------|-------|---------------|
| News Filter | `__tests__/lib/news-filter.test.ts` | Pure function | 16 | Keyword matching, blocked content, edge cases |
| Utils | `__tests__/lib/utils.test.ts` | Pure function | 7 | `getURL`, `getDaysUntilDeadline`, `isExpired`, `formatDate`, `getDaysAgo`, `isNew` |
| DeadlineCountdown | `__tests__/components/DeadlineCountdown.test.tsx` | Component | 4 | Renders correctly, shows days remaining, shows expired state |
| Opportunities API | `__tests__/api/opportunities.test.ts` | API integration | 4 | GET list, GET with filters, POST (unauthorized), POST (authorized) |

### 12.2 Test Patterns

**Pure function tests** (News Filter, Utils):
```typescript
import { functionUnderTest } from '@/lib/...';
describe('feature', () => {
  it('handles case X', () => {
    expect(functionUnderTest(input)).toBe(expectedOutput);
  });
});
```

**Component tests** (DeadlineCountdown):
```typescript
import { render, screen } from '@testing-library/react';
import { DeadlineCountdown } from '@/components/...';
describe('DeadlineCountdown', () => {
  it('shows remaining days', () => {
    render(<DeadlineCountdown deadline={futureDate} />);
    expect(screen.getByText(/days remaining/i)).toBeInTheDocument();
  });
});
```

**API integration tests** (Opportunities):
```typescript
// Uses mocked fetch, tests route handlers with various auth states
```

### 12.3 Configuration
- **Runner:** Jest 30 with `jsdom` environment
- **Transformer:** `ts-jest` using `tsconfig.test.json` (which overrides `jsx` to `react-jsx`)
- **Path aliases:** `^@/(.*)$` → `<rootDir>/src/$1`
- **Test discovery:** `**/__tests__/**/*.test.(ts|tsx)`
- **jest-dom matchers:** Imported globally via `setupFiles` config

### 12.4 CI Integration
- **CI workflow:** Runs `npm test` before `npm run build`
- **Secrets in CI:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET` (set as GitHub secrets or fallback to empty string)

### 12.5 What's NOT Tested
- No E2E tests (Playwright/Cypress)
- No integration tests with real databases
- No visual regression tests
- No snapshot tests
- No performance/load tests

---

## 13. Monitoring & Observability

### 13.1 Sentry Error Tracking
- **Configured:** `sentry.client.config.ts` + `sentry.server.config.ts`
- **DSN:** `NEXT_PUBLIC_SENTRY_DSN` (not yet set in Vercel — ❌)
- **Traces sample rate:** 0.1 (10%)
- **Environment:** Auto-detected from `NODE_ENV`
- **Next.js integration:** Wrapped via `withSentryConfig` in `next.config.mjs`

### 13.2 Plausible Analytics
- **Self-hosted or cloud:** Script loaded in `layout.tsx`
- **Tracks:** Page views, visitor stats

### 13.3 Health Endpoint (`GET /api/health`)
Returns JSON with:
```
{
  status: "ok" | "degraded",
  timestamp: "2026-07-02T...",
  databases: {
    supabase_primary: "ok" | "error",
    supabase_secondary: "ok" | "error",
    neon_primary: "ok" | "error",
    neon_secondary: "ok" | "error"
  },
  last_scrape: "2026-07-01T06:00:00Z",
  last_news: "2026-07-01T06:00:00Z",
  opportunities_count: 1234,
  news_count: 5678
}
```

### 13.4 Monitoring Gaps
- No uptime monitoring (Pingdom, UptimeRobot, etc.)
- No cron job failure alerting
- No database backup verification
- No error alerting via Sentry (DSN not yet set)

---

## 14. Known Issues & TODOs

| # | Issue | Priority | Impact | Status |
|---|-------|----------|--------|--------|
| 1 | `calendar_exports` table exists but never written to | Low | Feature gap — user's ICS downloads not logged | ⚠️ Open |
| 2 | `telegram_subscribers` has no subscription UI | Low | Users cannot subscribe/unsubscribe via web UI | ⚠️ Open |
| 3 | Cron jobs (archive-news, sync-replica) have never triggered | Medium | Weekly archive + daily sync may not have first-run data | ⚠️ Pending schedule |
| 4 | No E2E tests (Playwright/Cypress) | Medium | Critical user flows untested end-to-end | ⚠️ Not started |
| 5 | No monitoring/alerting for cron job failures | Medium | Silently failing cron jobs go unnoticed | ⚠️ Not started |
| 6 | Rate limiter is in-memory (resets on Vercel cold start) | Low | Rate limits reset after periods of inactivity | ⚠️ Consider Redis |
| 7 | No analytics dashboard for non-admin users | Low | Users can't see their own usage stats | ⚠️ Not started |
| 8 | *(Resolved — legacy codebase removed in repo cleanup)* | — | — | ✅ Done |
| 9 | No database backup verification process | Medium | No automated verification that backups are restorable | ⚠️ Not started |
| 10 | No CDN for static assets (images, fonts) | Low | All assets served directly from Vercel | ⚠️ Not started |
| 11 | Storybook / component library not set up | Low | No isolated component development environment | ⚠️ Not started |
| 12 | No OpenAPI/Swagger docs for API routes | Medium | API consumers have no reference documentation | ⚠️ Not started |
| 13 | Vercel deploy via GitHub Actions blocked | **High** | `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` not set as GitHub secrets | ⚠️ **Blocked** |
| 14 | `NEXT_PUBLIC_SENTRY_DSN` not set in Vercel | Medium | Sentry error tracking non-functional until DSN is configured | ⚠️ Not started |
| 15 | No database migration for Neon/Supabase2 in repo | Medium | Schema for db2/db3/db4 exists only at project level, not version-controlled | ⚠️ Open |

---

## 15. Roadmap

**→ See `docs/ROADMAP.md` for the full, current roadmap (this supersedes the inline roadmap below).**

*The roadmap below is preserved for historical reference only. All future roadmap updates go in `docs/ROADMAP.md`.*

### Short Term
1. Set `NEXT_PUBLIC_SENTRY_DSN` in Vercel → enable error tracking
2. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` plus enable in Supabase Dashboard → unblock Google OAuth
3. Wire notification creation into remaining API routes (follow, like, comment, repost, endorse, recommendation)
4. Implement "Open to Work" profile toggle + opportunity sidebar match + admin talent pool

### Medium Term
5. Add E2E tests with Playwright (critical flows: auth, browse, apply, community, feed, network)
6. Admin panel updates: company management, feed moderation, notification logs
7. Add CDN for static assets (cloudinary, imgix, or Vercel image optimization)
8. Set up database backup verification
9. Add light mode theme toggle
10. Write API documentation (OpenAPI/Swagger)

### Long Term
11. Real-time messaging (WebSocket/Supabase Realtime for chat)
12. Mobile app (React Native or PWA)
13. AI-powered company recommendations & opportunity salary insights
14. Talent pool / recruiter dashboard

---

## 16. Cost & Infrastructure

| Service | Tier | Monthly Cost | Notes |
|---------|------|-------------|-------|
| **Vercel** | Pro/Hobby | $0–20 | 2 concurrent builds, 100GB bandwidth, serverless functions |
| **Supabase Primary** | Free | $0 | 500MB DB, 2GB bandwidth, 50K monthly active users |
| **Supabase Secondary** | Free | $0 | Same limits (separate project) |
| **Neon Primary** | Free | $0 | 0.5GB DB, 100 compute hours/month |
| **Neon Secondary** | Free | $0 | Same limits (separate project) |
| **Resend** | Free | $0 | 100 emails/day |
| **Sentry** | Free | $0 | 5K events/month |
| **Plausible** | Self-hosted/Cloud | $0–9 | Open-source option available |
| **AI Providers** | Various free tiers | $0 | Bedrock, Groq, NVIDIA, Gemini, OpenRouter, Cloudflare, HuggingFace all have free tiers |

**Current total: ~$0/month** (all services on free tiers)

---

## 17. What Was Done — Session Summary

### Session 1 (Initial Setup)
- Repository cloned, scanned, and audited
- Build fixed for Node.js v24 compatibility (Next.js 14.2.0 → 14.2.21)
- All 21 database tables created and verified

### Session 2 (Core Features)
- User profiles, saved opportunities, applications tracking, alerts
- Telegram bot integration for opportunity notifications
- Email digest system via Resend
- Expiring opportunities detection
- Similar opportunities component

### Session 3 (Resume Builder + Community Forum)
- Resume builder: 6-step wizard, AI ATS scoring, PDF export (browser print)
- Community forum: posts, comments, upvotes with toggle RPC
- Dashboard enhancements: resume score card, app status dropdown
- Navbar links for Community + Resume

### Session 4 (Multi-DB Architecture)
- 4-database architecture designed: Supabase Primary (core), Supabase Secondary (archive), Neon Primary (analytics), Neon Secondary (read replica)
- Smart DB router (`src/lib/db/index.ts`) with `getDB(purpose)` routing
- Neon schema: analytics tables + mirror tables
- Supabase 2 schema: archive + overflow tables
- Cron jobs configured in vercel.json

### Session 5 (DB Provisioning + Env Vars)
- All 4 databases provisioned and connected
- All 23 env vars set in Vercel Production + Development
- Build verified: 0 TypeScript errors

### Session 6 (Premium Header Redesign)
- Glass morphism navbar with backdrop blur and gradient glow
- Refined logo in gradient-bordered container
- 9-item desktop nav with active indicator and glass dropdowns
- Search overlay, mobile drawer, responsive breakpoints

### Session 7 (README Overhaul + Single Auth Button)
- Consolidated auth: single "Get Started" button → `/login`
- Admin moved to footer
- Navbar simplified (removed 300+ lines of over-engineered effects)
- Root README rewritten for electrobridge/ as primary codebase

### Session 8 (Auth Fixes, Testing, Sentry, Health)
- Auth callback error handling (handles all edge cases)
- DB lazy init guard clauses (prevents build crashes)
- Jest 30 + ts-jest + @testing-library/react (31 tests, 4 suites)
- Sentry client + server config (DSN not yet set in Vercel)
- Health endpoint (checks all 4 databases)
- Docs cleanup (root docs/ → legacy/, electrobridge/docs/ reorganized)
- Build: 203 static pages, 0 TS errors, 0 lint warnings
- CI workflow updated to include `npm test`

### Session 9 (Auth Rewrite, Header Redesign, Feature Audit, Deep Scrape, Vercel Deploy)
- **Auth localhost bug fixed:** `getURL()` in `src/lib/utils.ts` — replaced `??` chain with `||` chain using `.trim()` so empty-string env vars correctly fall through to production URL
- **Google OAuth root cause identified:** Not a code issue — must be toggled ON in Supabase Dashboard → Authentication → Providers → Google, with Client ID/Secret from Google Cloud Console and redirect URI `https://aqauempuwmbizqoaolop.supabase.co/auth/v1/callback`
- **Supabase Dashboard configured via API:** `site_url` → `https://electrobridge.vercel.app`, `uri_allow_list` set with production URLs, `external_google_enabled` → `true`
- **`.env.local` populated:** All AI provider keys (Groq, Gemini, HuggingFace, Bedrock, OpenRouter, Cloudflare), Resend API key, admin password, site URL — previously tokens were stored in `.env.tokens.local` which Next.js never loads
- **Header redesigned:** Complete `Navbar.tsx` rewrite — icons on all nav items, News/Community promoted to desktop nav, enhanced glass morphism, gradient accent line on scroll, user dropdown with Resume shortcut, mobile drawer, `⌘K` search shortcut
- **Home nav item removed** — logo already returns to home
- **Dummy homepage hero search fixed:** Replaced decorative input with `HeroSearch` client component — proper controlled form routes to `/opportunities?search=...`
- **AI Analytics Panel fixed:** Empty admin password header → reads from `NEXT_PUBLIC_ADMIN_PASSWORD` env var
- **Chat Recent Chats:** Hardcoded mock data → `localStorage` persistence with 20-entry limit
- **Chat "+ New Chat" button wired:** Resets messages to initial assistant greeting
- **Deep scrape built** (`src/lib/scrapers/deep-scraper.ts`): After listing scrape inserts new opportunities, pipeline visits each `apply_link` (up to 5 per cron run), extracts full description/eligibility/stipend/deadline/location/tags from detail page HTML, detects `apply_link_type`, stores `official_page_url`
- **Vercel env vars set:** `NEXT_PUBLIC_SITE_URL`, `GROQ_API_KEY`, `GEMINI_API_KEY`, `HUGGINGFACE_API_KEY`, `OPENROUTER_API_KEY`, `CLOUDFLARE_AI_TOKEN` added to Development environment
- **Vercel deploy:** Production aliased to `https://electrobridge.vercel.app` (200 OK)
- **Build:** 203 static pages, 0 TS errors, 0 lint warnings
- **Tests:** 31/31 passing across 4 suites

### Session 10 (LinkedIn Features + Repository Cleanup)
- **12 new DB tables + 17 profile columns + 10 seed companies** created via migration `20260703000003_linkedin_features.sql`
- **Enhanced profiles:** Banner/avatar header, headline, about textarea, skills tags (add/remove with endorsement), open-to-work toggle, public profile at `/people/[username]`
- **Home feed:** 3-column layout, create post with type selector (Post/Article/Achievement/Question), reaction picker (5 types), comments with inline expand, repost toggle, people/company suggestions sidebar
- **Network page:** 6-tab layout (Connections, Following, Followers, Sent, Received, Suggestions), inline accept/decline/withdraw, mutual-connection scoring algorithm
- **Company pages:** List grid with search + follow, detail page with banner, about section, follower count
- **Direct messaging:** Conversation list sidebar, real-time chat with read receipts, create conversation from profile
- **Notifications page:** Full notification list with type icons, actor links, mark-read, mark-all-read, unread count badge in navbar
- **Search page:** Two tabs (Opportunities + People), search filters, connect buttons on people results
- **Navbar updated:** Added Feed, Network, Companies links; notification bell with live count; Messages link in user dropdown; mobile menu links
- **Notification wiring helper** created and wired into: connect request/accept, follow, post like/comment/repost, skill endorse, recommendation API routes
- **Repository cleanup:** Legacy `ElectroBridge Web App Design/` (152 files), `docs/legacy/` (16 files), `REFACTOR_SUMMARY.md`, root `supabase/migrations/`, old CI workflows, `opencode.json`, `electrobridge_logo.png` — all removed. `.gitignore` hardened. Backup tag `pre-cleanup-backup` pushed to origin.
- **Build:** 94+ routes, 206+ static pages, 0 TS errors. Tests: 31/31 passing.

---

## 19. LinkedIn Features — Complete Feature Set

| Feature | Status | Pages | API Routes |
|---------|--------|-------|------------|
| Enhanced Profiles (banner, headline, about, skills, open-to-work) | ✅ Done | `/profile`, `/people/[username]` | `profile/[userId]`, `profile/[userId]/endorse`, `profile/[userId]/recommendations` |
| Home Feed (posts, reactions, comments, reposts) | ✅ Done | `/feed` | `feed`, `feed/posts/[id]/like`, `comment`, `repost` |
| Network (connections, followers, following, requests, suggestions) | ✅ Done | `/network` | `network/connections`, `followers`, `following`, `suggestions`, `connect`, `follow` |
| Company Pages (list, detail, follow) | ✅ Done | `/companies`, `/companies/[slug]` | `companies`, `companies/[id]`, `companies/[id]/follow` |
| Direct Messaging (conversations, chat UI) | ✅ Done | `/messages` | `messages`, `messages/[conversationId]` |
| Notifications (page, bell, read tracking) | ✅ Done | `/notifications` | `notifications`, `notifications/[id]`, `notifications/count` |
| People Search | ✅ Done | `/search?tab=people` | `people/search` |
| Navbar Integration | ✅ Done | `Navbar.tsx` | — |
| Notification Wiring | ✅ Done | — | Wired into connect, follow, like, comment, repost, endorse, recommendation routes |
| Open to Work (profile toggle, opportunity banner, admin talent pool) | ✅ Done | `/profile`, opportunity sidebar, `/admin/talent-pool` | `/api/profile/me` |
| **Tables:** 12 new tables + `user_profiles` extended with 17 columns + 10 seed company pages | | | |
| **Phase 12:** Final build — **0 errors**, 223 static pages, 94+ routes, 31/31 tests passing. LINKEDIN_FEATURES.md created. | ✅ Done | | |

### Session 13 (Documentation Suite + Secrets Management + Deployment Setup)
- **Secrets management:** Created `SECRETS.md` at repo root with all API keys/tokens. Added to `.gitignore`. Created full `electrobridge/.env.local` with 26 env vars.
- **Database credentials fetched via API:** Supabase Primary, Secondary, Neon Primary, Secondary — all connection strings and keys captured.
- **Vercel CLI setup:** Project `amitk26/electrobridge` linked, production env vars pulled, 24/26 confirmed set.
- **Phase 2 — Complete documentation suite (11 files):** PRD.md, FEATURE_SPEC.md, ARCHITECTURE.md, DATA_MODEL.md, API_SPEC.md, DESIGN_SYSTEM.md, SEO_AEO_GEO_STRATEGY.md, CONTENT_SOURCES_AND_SCRAPING.md, AI_INTEGRATION.md, SECURITY_AND_COMPLIANCE.md, ROADMAP.md, GLOSSARY.md.
- **Phase 3 — Gap Analysis:** 20 gaps identified (2 P0, 7 P1, 4 P2, 5 P3) in `docs/GAP_ANALYSIS.md`.
- **Build:** 306 static pages, 94+ routes, 0 TS errors, 0 build errors. Tests: 31/31 passing.
