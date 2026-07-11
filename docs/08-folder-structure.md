# 08 — Folder Structure

```
SiliconPath/
├─ backend/                     # Express scraper (Render/Docker)
│  └─ src/
│     ├─ index.ts              # Express entry (port 3001)
│     ├─ scrapers/
│     │  ├─ adapters/          # greenhouse, lever, smartrecruiters, workday, html, rss, schema
│     │  ├─ source-config.ts   # source registry (see docs/24)
│     │  └─ orchestrator.ts    # batch execution, concurrency, retry
│     ├─ cron/scheduler.ts
│     ├─ routes/              # health, scrape-trigger (auth-guarded)
│     └─ lib/                 # logger, metrics, api-docs
├─ electrobridge/               # Next.js frontend (Vercel)
│  ├─ src/
│  │  ├─ app/                 # pages + /api route handlers
│  │  │  ├─ (public)          # home, opportunities, academy, news, organizations, resources
│  │  │  ├─ (auth-gated)      # feed, network, messages, notifications, profile, dashboard
│  │  │  ├─ admin/            # admin + scrape-health
│  │  │  └─ api/              # all route handlers
│  │  ├─ components/          # shared React components
│  │  ├─ lib/                 # supabase clients, db, ai, scrapers, academy, utils, validation
│  │  └─ middleware.ts        # Supabase SSR auth, gated-path redirects
│  ├─ supabase/migrations/     # DB schema (reset + reconcile migrations)
│  ├─ supabase/seed/           # verified seed data
│  └─ vercel.json              # cron config
├─ neon/                        # Neon analytics schema
├─ docs/                        # THIS folder (source of truth)
└─ Makefile
```

**Rules:**
- Frontend code lives only under `electrobridge/`.
- Scraper code lives only under `backend/`.
- Never create a second frontend or duplicate a page.
- Route handlers use kebab or resource folders matching the URL exactly.
