# SiliconPath — Semiconductor, VLSI & Electronics Opportunities Platform

AI-powered platform aggregating verified R&D, JRF, PhD, and engineering opportunities from ISRO, DRDO, CSIR, IITs, IISc, TIFR, and industry. Built for the global semiconductor, VLSI, and electronics research community.

| Component | Live URL | Stack |
|-----------|----------|-------|
| **Production** | [siliconpath.vercel.app](https://siliconpath.vercel.app) | Next.js 14.2.21, App Router, 7 AI providers, 4 databases |

## Codebase: `electrobridge/`

**~18,000 lines** of TypeScript/TSX/CSS — 30+ pages, 40+ API routes, 25+ components, 4 databases, 7 AI providers.

```
electrobridge/
├── src/
│   ├── app/                   30+ pages + auth callback + sitemap + robots
│   │   └── api/               40+ API endpoints
│   ├── components/            25+ React components
│   ├── lib/                   24+ modules (db, ai, scrapers, utils, notifications)
│   │   ├── db/                Multi-database router (4 DBs)
│   │   ├── ai/                7-provider AI fallback chain
│   │   └── scrapers/          ISRO, DRDO, CSIR scrapers + 16 RSS feeds
│   ├── types/                 TypeScript interfaces
│   └── middleware.ts          Supabase SSR auth
├── supabase/migrations/       9 migration files (31 total tables)
├── .vercel/                   Vercel project config
└── docs/                      Deployment checklist
```

### Quick Start

```bash
cd electrobridge
cp .env.local.example .env.local   # fill in real keys
npm install
npm run dev                        # → http://localhost:3000
```

### Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 14.2.21 (App Router) |
| **UI** | React 18, Tailwind CSS 3.4 |
| **Styling** | Dark theme, Space Grotesk + Inter fonts |
| **Database** | Supabase (Primary + Secondary), Neon (Primary + Secondary) — 36 tables across 4 DBs |
| **AI** | 7-provider fallback: Bedrock → Groq → NVIDIA → Gemini → OpenRouter → Cloudflare → HuggingFace |
| **Auth** | Supabase SSR (email/password + Google OAuth) |
| **Email** | Resend (weekly digests) |
| **Messaging** | Telegram Bot API (opportunity notifications) |
| **Icons** | lucide-react |
| **Scraping** | cheerio (ISRO, DRDO, CSIR), rss-parser (16 RSS sources) |
| **Hosting** | Vercel (auto-deploy from `main`) |

### Key Features

- **Verified Opportunities** — R&D roles from top research orgs with link verification and expiry detection
- **Semiconductor News** — Aggregated from RSS sources with AI relevance filtering
- **AI Chat** — Career assistant specialized in semiconductor, VLSI, and electronics opportunities
- **AI Match** — Profile-to-opportunity matching with scoring
- **AI Search** — Natural language query parsing
- **AI Resume Builder** — 6-step wizard with ATS scoring
- **LinkedIn-style Profiles** — Banner, headline, about, skills endorsements, open-to-work status (Coming Soon)
- **Activity Feed** — Posts with reactions, comments, reposts (Coming Soon)
- **Network System** — Connections, followers, following, requests, suggestions (Coming Soon)
- **Company Pages** — Searchable directory with follow, detail pages (Coming Soon)
- **Direct Messaging** — Real-time chat with read receipts (Coming Soon)
- **Notifications** — In-app notifications with bell badge (Coming Soon)
- **Community Forum** — Posts, comments, upvotes
- **Weekly Digest** — AI-generated email newsletter
- **Multi-Database** — 4 databases: Supabase for core data + archive, Neon for analytics + read replica
- **Admin Panel** — Add/edit opportunities/news, view AI usage analytics

### Database Architecture

| DB | Type | Purpose | Tables |
|----|------|---------|--------|
| Supabase Primary | PostgreSQL | Core data (opportunities, news, auth, community) | 31 |
| Supabase Secondary | PostgreSQL | News archive, subscriber overflow, LinkedIn features | 13 |
| Neon Primary | PostgreSQL | Analytics (AI usage, platform analytics) | 4 |
| Neon Secondary | PostgreSQL | Read replica (opportunities mirror, news mirror) | 2 |

### Environment Variables

23 variables required — all set in Vercel (Production + Development). See `.env.local.example` for the full list.

---

## License

Built for the semiconductor & electronics research community. 100% free tier.
