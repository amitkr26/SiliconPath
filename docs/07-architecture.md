# 07 - Architecture

## High level

```
            Client (browser)
                 | HTTPS
        Vercel Edge / Next.js 14 (electrobridge/)
        - Server Components render public pages
        - Route handlers under src/app/api/*
        - SSR auth middleware (Supabase cookies)
                 |
     +-----------+-----------------------------+
     |           |                             |
  Supabase 1  Supabase 2                     Neon
  (core +     (news archive /               (analytics:
   social +    subscriber overflow)          page views,
   auth)                                     searches, clicks)
     ^
     | API proxy (RENDER_BACKEND_URL + SCRAPER_SECRET)
  backend/ (Express + node-cron on Render, Docker)
  - scraper adapters (Greenhouse/Lever/SmartRecruiters/Workday/HTML/RSS/Schema)
  - orchestrator + retry + concurrency limit
  - AI fallback chain for parsing unstructured listings
```

## Components

- **Frontend + API:** Next.js 14 App Router, Tailwind, deployed on Vercel. Root directory is `electrobridge/`.
- **Scraper backend:** Express + TypeScript + node-cron, Docker, on Render. Triggered by Vercel cron routes (`/api/cron/*`) which proxy to it with `SCRAPER_SECRET`.
- **AI:** multi-provider fallback chain (up to 8 providers, e.g. Groq -> OpenRouter -> Cloudflare -> Gemini -> Bedrock -> HuggingFace -> NVIDIA). Used to parse unstructured job descriptions/PDFs into normalized JSON. Output parsed with a tolerant JSON parser.

## The 3-database strategy (CURRENT reality)

> Locked decision: exactly 3 databases. Do not add or remove.

| DB | Provider | Role (as actually wired) |
|----|----------|--------------------------|
| DB1 | Supabase (primary) | Core data (opportunities, organizations, scrape sources/runs, news, resources, academy content) **AND** the social/user layer **AND** Supabase Auth. Everything auth-scoped lives here. |
| DB2 | Supabase (secondary) | News archive / subscriber overflow only. |
| DB3 | Neon (serverless Postgres) | Analytics: page views, search queries, click events. |

**Critical clarification:** although code comments and early design docs imply the social layer lives on DB2, in reality the app's route handlers use `createClient()` which points at DB1 (because Supabase Auth + RLS `auth.uid()` live on DB1). So user_profiles, connections, feed_posts, messages, notifications all physically live on **DB1**. DB2 is effectively just `news_archive`. Any agent must treat DB1 as the home of both core and social tables.

## Data flow: scraping

```
Vercel Cron -> /api/cron/scrape-* -> (SCRAPER_SECRET) -> backend /scrape/run
  -> orchestrator (concurrency-limited, retry w/ backoff)
  -> adapter per source -> raw listings
  -> AI parse (tolerant JSON) + garbage-title filter + category normalize + org resolve
  -> insert into opportunities as verification_status='pending'
  -> admin review -> 'verified' -> public
```

## Known architectural debt

- `generate_opp_slug()` DB function has an empty body; trigger-based inserts fail. Slugs must be generated in app code until fixed.
- Cross-project foreign keys are not enforceable in Supabase; app-layer validation only.
- In-memory rate limiter is a no-op on Vercel serverless; must move to Upstash.
- Conflicting migration files exist; the live schema is the source of truth, not the migration files. Always read the live schema before writing queries.
