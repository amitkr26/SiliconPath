# 07 — Architecture

## High level

```
            Browser / User
                 | HTTPS
                 v
     Vercel Edge (CDN + Next.js 14 App Router)
        |                         |
   RSC/SSR pages            /api/* route handlers
        |                         |
        +-----------+-------------+
                    v
   +----------------+------------------+
   |                |                  |
 Supabase 1     Supabase 2           Neon
 (core)         (social/users)       (analytics)
   ^
   | API proxy (RENDER_BACKEND_URL, SCRAPER_SECRET)
 Express scraper backend (Render, Docker, node-cron)
   |
 Multi-provider AI fallback chain (parse unstructured listings)
```

## Components

- **Frontend `electrobridge/`** — Next.js 14 App Router, React 18, Tailwind. Public
  pages are server-rendered (RSC) for SEO/speed; user-specific state is client-fetched.
- **Scraper backend `backend/`** — Express + TypeScript + node-cron, deployed on Render
  as Docker. Runs source adapters, pushes normalized rows into Supabase 1.
- **AI fallback chain** — up to 8 providers tried in order for parsing unstructured
  job descriptions/PDFs. Locked decision: keep multiple providers. See
  [27-adrs.md](27-adrs.md).

## Database strategy (LOCKED at 3)

| DB | Provider | Contents |
|----|----------|----------|
| DB1 | Supabase | Core: organizations, opportunities, scrape sources/runs, news, resources, academy content, subscribers |
| DB2 | Supabase | Social/users: user_profiles, connections, feed, messages, notifications, saved, applications, company_profiles |
| DB3 | Neon | Analytics: page_views, search_queries, click_events |

**Critical operational reality:** user-facing API routes authenticate via Supabase Auth
cookies (`createClient()` → `NEXT_PUBLIC_SUPABASE_URL`), which is **DB1**. Supabase Auth
(`auth.users`) lives on DB1. Therefore the social tables that need `auth.uid()` RLS
must physically live on **DB1**, even though they are conceptually "DB2". DB2 is used
as an overflow/archive store (e.g. news_archive). Do not assume social tables are on
the second Supabase project. Verify against the live DB before any schema change.

## Data flow: scraping

```
Vercel Cron -> /api/cron/* -> (SCRAPER_SECRET) -> backend /scrape/run
  -> orchestrator (concurrency-limited) -> adapters (Greenhouse/Lever/Workday/HTML/RSS/schema)
  -> AI parse (safe JSON, multi-provider fallback) -> normalize
  -> upsert organization -> insert opportunity (verification_status='pending')
  -> admin review -> 'verified' -> shown publicly
```

Only `verification_status='verified'` rows appear publicly.

## Schema-drift discipline (the #1 recurring bug class)

Code and the live DB have repeatedly drifted (e.g. `full_name` vs `display_name`,
`opportunities.organization` vs `organization_id`, `connections.user_id_1/2` vs
`requester_id/addressee_id`, `messages.body` vs `content`, `feed_posts.user_id` vs
`author_id`). **Before writing/editing any query, read the actual live schema and
confirm every table/column exists.** See [09-database.md](09-database.md).
