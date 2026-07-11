# 08 - Folder Structure

```
SiliconPath/
├── backend/                     # Express scraper service (Render, Docker)
│   └── src/
│       ├── index.ts             # Express entry (port 3001)
│       ├── scrapers/
│       │   ├── adapters/        # greenhouse, lever, smartrecruiters, workday, html, rss, schema
│       │   ├── source-config.ts # source list
│       │   ├── orchestrator.ts  # batch runner, concurrency, retry
│       │   └── types.ts
│       ├── cron/scheduler.ts    # node-cron schedules
│       ├── lib/                 # logger, metrics, api-docs
│       └── routes/              # health.ts, scrape-trigger.ts (auth-guarded)
│   ├── Dockerfile
│   └── render.yaml
├── electrobridge/               # Next.js frontend + API (Vercel)
│   ├── src/
│   │   ├── app/                 # App Router pages + API routes
│   │   │   ├── (public pages)   # opportunities, organizations, news, resources, academy
│   │   │   ├── (auth pages)     # login, signup, onboarding, feed, network, messages, profile,
│   │   │   │                    #   notifications, companies, dashboard, resume, people/[username]
│   │   │   ├── admin/           # add-opportunity, edit-opportunity, add-news, talent-pool, scrape-health
│   │   │   └── api/             # route handlers (see 10-api-spec.md)
│   │   ├── components/          # shared React components
│   │   ├── lib/
│   │   │   ├── supabase.ts      # anon + admin (service role) clients (DB1)
│   │   │   ├── supabase/        # server.ts, client.ts (SSR cookie clients)
│   │   │   ├── db/index.ts      # db1/db2 helpers
│   │   │   ├── academy/         # queries.ts, types.ts (incl. FALLBACK_TRACKS)
│   │   │   ├── scrapers/        # utils.ts (GARBAGE_TITLE_PATTERNS, cleanTitle, slugify)
│   │   │   ├── ai/              # provider chain, safe-parse
│   │   │   ├── validation.ts    # Zod schemas
│   │   │   ├── rate-limiter.ts   # durable limiter (Upstash in prod)
│   │   │   └── utils.ts         # mapDbOpportunityToClient, formatDate, isExpired
│   │   └── middleware.ts        # Supabase SSR auth gating
│   ├── supabase/migrations/     # SQL migrations (NOTE: may drift from live; live is truth)
│   ├── supabase/seed/           # verified org + academy + resource seeds
│   └── vercel.json              # cron config
├── neon/schema.sql              # analytics schema
├── docs/                        # this documentation set
└── scripts/
```

Rule: no new top-level folders without an ADR. Keep frontend under `electrobridge/`, scraper under `backend/`.
