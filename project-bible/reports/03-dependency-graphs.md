# Dependency Graphs

## 1. Repository Dependency Graph

```
SiliconPath/
│
├── electrobridge/ ───────────────────────────────────────────── Next.js 14 (Vercel)
│   ├── src/
│   │   ├── app/ ──── pages + API routes
│   │   │   ├── (public)     ─── opportunities, academy, news, orgs, resources
│   │   │   ├── (auth)       ─── login, signup, auth/callback, onboarding
│   │   │   ├── (protected)  ─── feed, network, messages, notifications, profile
│   │   │   ├── (admin)      ─── admin dashboard, scrape health, talent pool
│   │   │   └── api/ ─── 37 route groups (~60 handlers)
│   │   │
│   │   ├── components/ ─── ~29 components
│   │   │   ├── academy/ ─── YoutubeEmbed, PracticeQuiz
│   │   │   ├── profile/ ─── ResumeBuilder
│   │   │   └── shared/  ─── ComingSoon
│   │   │
│   │   ├── lib/ ─── Core library
│   │   │   ├── supabase/ ─── client.ts, server.ts
│   │   │   ├── db/ ──────── index.ts (multi-DB router)
│   │   │   ├── ai/ ──────── providers, matcher, expiry, search, safe-parse
│   │   │   ├── scrapers/ ── 22 files (India + global adapters)
│   │   │   ├── academy/ ─── queries.ts, types.ts
│   │   │   ├── resume/ ──── document-ai-parser.ts
│   │   │   ├── storage/ ─── gcp-storage.ts
│   │   │   ├── utils.ts, api-utils.ts, logger.ts, admin-auth.ts
│   │   │   ├── rate-limiter.ts, validation.ts, feature-flags.ts
│   │   │   └── notifications.ts, email-digest.ts, telegram-bot.ts
│   │   │
│   │   ├── config/ ─── scraper configs (JSON)
│   │   ├── types/ ───── index.ts (all interfaces)
│   │   ├── data/ ────── academyResources.ts
│   │   └── __tests__/ ─ 4 test files
│   │
│   ├── supabase/ ─── 21 migrations + 4 seed files
│   └── scripts/ ─── 16 utility scripts
│
├── backend/ ───────────────────────────────────────────────── Express.js (Render)
│   ├── src/
│   │   ├── routes/ ───── health.ts, scrape-trigger.ts
│   │   ├── scrapers/ ─── orchestrator + 7 adapters + source-config (500+ sources)
│   │   ├── cron/ ──────── scheduler.ts (17 scheduled tasks)
│   │   ├── lib/ ───────── db.ts, logger.ts, ai-providers.ts, metrics.ts
│   │   │                 writer.ts, maintenance.ts, api-docs.ts
│   │   └── __tests__/ ─── metrics.test.ts
│   │
│   ├── Dockerfile
│   └── render.yaml
│
├── neon/ ─── schema.sql (analytics tables)
│
└── project-bible/ ─── 44 documents across 24 directories
```

---

## 2. Module Dependency Diagram

```
                    ┌──────────────┐
                    │  middleware  │
                    │  (auth gate) │
                    └──────┬───────┘
                           │ depends on
                    ┌──────▼───────┐
                    │  API Routes  │
                    │  (60 routes) │
                    └──────┬───────┘
                           │ depends on
              ┌────────────┼────────────┬──────────────┐
              │            │            │              │
       ┌──────▼─────┐ ┌───▼────┐ ┌────▼─────┐  ┌─────▼──────┐
       │  supabase  │ │  ai/   │ │scrapers/ │  │ validation │
       │  client(s) │ │providers│ │(22 files)│  │  (Zod)     │
       └──────┬─────┘ └───┬────┘ └────┬─────┘  └─────┬──────┘
              │            │          │              │
              │      ┌─────▼──────┐   │              │
              │      │ safe-parse │   │              │
              │      └─────┬──────┘   │              │
              │            │          │              │
       ┌──────▼────────────┴──────────┴──────────────┘
       │                 lib/
       │   utils.ts, api-utils.ts, logger.ts, admin-auth.ts
       │   rate-limiter.ts, feature-flags.ts, notifications.ts
       └──────┬───────────┬──────────┬──────────────┐
              │           │          │              │
       ┌──────▼───┐ ┌────▼─────┐ ┌──▼──────┐  ┌────▼──────┐
       │  types/  │ │config/   │ │ data/   │  │components/│
       │index.ts  │ │scrapers/ │ │academy  │  │(29 files) │
       └──────────┘ └──────────┘ └─────────┘  └────┬──────┘
                                                   │
                                            ┌──────▼──────┐
                                            │  app/pages  │
                                            │ (38 routes) │
                                            └─────────────┘

Backend Module Dependencies:

                    ┌──────────────┐
                    │  index.ts    │
                    │ (entrypoint) │
                    └──────┬───────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
     ┌──────▼──────┐ ┌────▼──────┐ ┌─────▼──────┐
     │ routes/     │ │ cron/     │ │ scrapers/  │
     │ health.ts   │ │scheduler  │ │orchestrator│
     │ scrape-     │ │(17 tasks) │ │+ 7 adapters│
     │ trigger.ts  │ └───────────┘ │+ source-   │
     └──────┬──────┘              │ config.ts  │
            │                     └──────┬──────┘
            │                            │
     ┌──────▼────────────────────────────▼──────────┐
     │                   lib/                        │
     │  db.ts, logger.ts, ai-providers.ts, metrics.ts│
     │  writer.ts, maintenance.ts, api-docs.ts       │
     └───────────────────────────────────────────────┘
```

---

## 3. API Dependency Diagram

```
Client Browser
    │
    ├──→ Public Pages (Server Components + ISR 300s)
    │     GET /opportunities ──────→ supabaseAdmin.query(opportunities)
    │     GET /academy/tracks ─────→ supabaseAdmin.query(academy_tracks) OR FALLBACK_TRACKS
    │     GET /news ───────────────→ supabaseAdmin.query(news_articles)
    │     GET /organizations ──────→ supabaseAdmin.query(organizations)
    │     GET /resources ──────────→ supabaseAdmin.query(resources)
    │
    ├──→ Client API Calls
    │     GET /api/opportunities ──→ supabaseAdmin (list + filter + paginate)
    │     GET /api/opportunities/[slug] ──→ supabaseAdmin (detail)
    │     GET /api/search ──────────→ supabaseAdmin (full-text search)
    │     POST /api/subscribe ──────→ supabaseAdmin (subscribers)
    │
    ├──→ Protected API (Auth Required)
    │     middleware.ts (check session) → 401 if no session
    │     │
    │     ├── GET /api/profile ────→ supabaseAdmin (user_profiles)
    │     ├── PATCH /api/profile ──→ supabaseAdmin + Zod validation
    │     ├── GET /api/feed ───────→ supabaseAdmin (feed_posts)
    │     ├── GET /api/network ────→ supabaseAdmin (connections)
    │     ├── GET /api/messages ───→ supabaseAdmin (messages)
    │     ├── GET /api/notifications → supabaseAdmin (notifications)
    │     └── POST /api/ai/chat ───→ AI Provider Chain → safe-parse → Response
    │
    └──→ Admin API (Admin Password Required)
          verifyAdmin() → 401 if invalid
          │
          ├── POST /api/admin/scrape-health → backend SCRAPER_SECRET
          ├── POST /api/ai/enhance ──────────→ AI Provider Chain
          └── GET /api/analytics/platform ───→ supabaseAdmin

Vercel Cron ──→ POST /api/cron/scrape-*
                  │
                  ├──→ POST backend/scrape/run (with SCRAPER_SECRET)
                  │     │
                  │     └──→ orchestrator → adapter chain → supabaseAdmin (upsert)
                  │
                  └──→ supabaseAdmin (direct queries for India sources)
```

---

## 4. Database Dependency Diagram

```
DB1: Supabase Primary (aqauempuwmbizqoaolop)
═════════════════════════════════════════════════════
│
├── Core Tables:          Used by:
│   opportunities         All public pages, search, admin
│   organizations         All public pages, admin
│   news_articles         News pages, cron cleanup
│   resources             Resources page
│   subscribers           Newsletter, digest
│   scrape_sources        Scraper config
│   scrape_runs           Scrape health dashboard
│   link_check_results    Link checker cron
│   opportunity_reports   Report issue feature
│
├── Academy Tables:
│   academy_tracks        Academy pages (fallback to learning_tracks)
│   academy_days          Academy track days
│   track_checkpoints     Academy assessments
│   user_learning_progress Academy progress tracking
│
├── Social Tables:
│   user_profiles         Profile pages, auth sync
│   connections           Network features
│   feed_posts            Feed features
│   messages              Messaging features
│   notifications         Notification features
│   saved_opportunities   Bookmarks (planned)
│   applications          Job applications
│   company_profiles      Company pages
│   resumes               Resume builder
│   community_posts       Community features


DB2: Supabase Secondary (jbqjipwanfsxyqkfrrpx) [UNDERUTILIZED]
═════════════════════════════════════════════════════
│
├── news_archive         Archived news (from DB1 cleanup cron)
└── subscribers_overflow Overflow subscribers (speculative)


Neon 1: Analytics (plain-glade-52224468)
═══════════════════════════════════════════
│
├── page_views           Analytics tracking
├── search_queries       Search analytics
└── click_events         Click tracking


Neon 2: Cache/Background (jolly-haze-11306362)
═════════════════════════════════════════════════
│
└── (schema not confirmed)
```

---

## 5. Runtime Data Flow

```
User Request
    │
    ▼
┌──────────────────────────────┐
│        Vercel Edge           │
│   middleware.ts (auth gate)  │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│     Next.js Server/API       │
│   ┌──────────────────────┐   │
│   │  Server Components   │   │
│   │  (ISR, 300s TTL)     │───┼──→ Supabase DB1 (read)
│   └──────────────────────┘   │
│   ┌──────────────────────┐   │
│   │  API Routes          │───┼──→ Supabase DB1 (read/write)
│   │  (60 handlers)       │───┼──→ Supabase DB2 (archive)
│   │                      │───┼──→ AI Providers (7-chain)
│   └──────────────────────┘   │
│   ┌──────────────────────┐   │
│   │  Cron Routes         │───┼──→ Render Backend (SCRAPER_SECRET)
│   │  (4-6 handlers)      │───┼──→ Supabase DB1 (direct scrape)
│   └──────────────────────┘   │
└──────────────────────────────┘
           │
           ▼
┌──────────────────────────────┐
│     Render Backend           │
│   ┌──────────────────────┐   │
│   │  Scraper Orchestrator│───┼──→ External APIs (Greenhouse, etc.)
│   │  (5 concurrent)      │───┼──→ HTML pages (cheerio)
│   │                      │───┼──→ RSS feeds
│   └──────────────────────┘   │
│   ┌──────────────────────┐   │
│   │  Writer + Dedup      │───┼──→ Supabase DB1 (upsert)
│   │                      │───┼──→ Neon 2 (replica sync)
│   └──────────────────────┘   │
│   ┌──────────────────────┐   │
│   │  Cron Tasks          │───┼──→ Supabase DB2 (archive)
│   │  (node-cron)         │───┼──→ Neon 1 (replica)
│   └──────────────────────┘   │
└──────────────────────────────┘
```

---

## 6. Key Dependency Issues

| Issue | Severity | Description |
|-------|----------|-------------|
| Frontend scrapers depend on frontend API | HIGH | India scraper routes in frontend create coupling between API layer and scraping logic |
| Backend AI providers duplicated | MEDIUM | Same AI chain in both frontend and backend, different implementations |
| DB2 underutilized | MEDIUM | Secondary Supabase has only archive tables |
| No ORM/SQL builder | LOW | Raw Supabase queries throughout codebase increase coupling |
| Feature flags at module scope | MEDIUM | Cannot be changed dynamically |
