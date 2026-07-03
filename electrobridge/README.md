# ElectroBridge — Active App

Next.js 14.2.21 App Router application deployed at [electrobridge.vercel.app](https://electrobridge.vercel.app).

## Quick Start

```bash
cp .env.local.example .env.local   # fill in keys
npm install
npm run dev                        # → http://localhost:3000
npm run build                      # 94+ routes, 0 TS errors
```

## Architecture

- **30+ pages** — opportunities, news, match, chat, community, resume, admin, dashboard, feed, network, messages, notifications, companies, search, people profiles
- **40+ API routes** — CRUD, AI, scraping, analytics, cron jobs, LinkedIn features (feed, network, messaging, notifications, endorsements)
- **25+ components** — navbar, cards, filters, modals, AI panels, feed posts, reaction picker
- **4 databases** — Supabase (core + archive), Neon (analytics + read replica)
- **31 tables** across Supabase Primary (including 12 LinkedIn-feature tables)
- **7 AI providers** — Bedrock → Groq → NVIDIA → Gemini → OpenRouter → Cloudflare → HuggingFace
- **6 cron jobs** — scraping, digests, archival, sync-replica, link checks, expiry

## Key Directories

```
src/
├── app/              Pages + API routes (including /feed, /network, /messages, /notifications, /companies, /search, /people)
├── components/       React components
├── lib/              DB router, AI providers, scrapers, utils, notifications helper
├── types/            TypeScript interfaces
└── middleware.ts     Auth middleware

supabase/migrations/  9 SQL migrations
```

See the [root README](../README.md) for full project details.
