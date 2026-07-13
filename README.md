# SiliconPath

> The one-stop career platform for semiconductor, VLSI, and research professionals.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## What is SiliconPath?

SiliconPath eliminates the need to check dozens of websites (DRDO, ISRO, BARC, universities, research labs, semiconductor companies) for opportunities. Everything lives in one place.

### Two-Tier Platform

**Public (No Account Required)**
- Browse all aggregated opportunities from 100+ sources
- Filter by category, location, deadline, organization
- Apply directly to any opportunity with one click
- Read semiconductor industry news and updates
- Search companies and research organizations

**Registered (Full LinkedIn-like Experience)**
- Professional profile with skills, experience, education
- Network with connections, follow companies
- Direct messaging between professionals
- Personalized feed with AI-curated content
- Resume builder with AI suggestions
- Application tracking dashboard
- Community posts and discussions
- Company pages for employers
- Job posting for recruiters/employers
- AI-powered opportunity matching
- Email digests and notifications

---

## Architecture

```
SiliconPath/
├── electrobridge/          # Next.js 14 frontend (Vercel)
│   ├── src/app/            # App Router pages
│   ├── src/components/     # React components
│   ├── src/lib/            # Utilities, DB clients, AI
│   └── supabase/           # Migrations for DB1 + DB2
├── backend/                # Express.js scraping service (Render)
│   └── src/
│       ├── scrapers/       # Source adapters + orchestrator
│       ├── lib/            # DB, AI providers, metrics
│       └── routes/         # API endpoints
├── neon/                   # Neon DB schema
├── docs/                   # All project documentation
└── scripts/                # Setup and utility scripts
```

### Databases (4 Total)

| DB | Provider | Role |
|----|----------|------|
| DB1 | Supabase | Core data: opportunities, news, companies, categories |
| DB2 | Supabase | Social: profiles, connections, messages, applications |
| Neon1 | Neon | Analytics: views, clicks, search metrics, AI usage |
| Neon2 | Neon | Backend: scraper state, job queues, cron health |

---

## Quick Start

### Prerequisites
- Node.js 18+
- npm or pnpm
- Supabase account (2 projects)
- Neon account (2 databases)

### Frontend (electrobridge)
```bash
cd electrobridge
cp .env.local.example .env.local
# Fill in your Supabase, Neon, and API keys
npm install
npm run dev
```

### Backend (scraping service)
```bash
cd backend
cp .env.example .env
# Fill in your Neon and AI provider keys
npm install
npm run dev
```

### Database Setup
```bash
# Apply Supabase migrations
cd electrobridge
npx supabase db push

# Apply Neon schema
psql $NEON_DATABASE_URL < neon/schema.sql
```

---

## Key Features

| Feature | Status | Tier |
|---------|--------|------|
| Opportunity Aggregator | ✅ Live | Public |
| Industry News Feed | ✅ Live | Public |
| Company Directory | ✅ Live | Public |
| Search + Filters | ✅ Live | Public |
| User Auth (Google/GitHub/Email) | ✅ Live | Registered |
| User Profiles | ✅ Live | Registered |
| Connections/Network | ✅ Live | Registered |
| Messaging | ✅ Live | Registered |
| Application Tracking | ✅ Live | Registered |
| AI Opportunity Matching | ✅ Live | Registered |
| Resume Builder | ✅ Live | Registered |
| Community Feed | ✅ Live | Registered |
| Academy (Learning Paths) | ✅ Live | Registered |
| Email Digests | ✅ Live | Registered |
| Admin Dashboard | ✅ Live | Admin |
| Company Pages (Employers) | 🚧 WIP | Registered |
| Job Posting (Recruiters) | 🚧 WIP | Registered |

---

## Documentation

See [docs/README.md](./docs/README.md) for the complete documentation index.

---

## Contributing

See [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md) for guidelines.

---

## License

MIT License. See [LICENSE](./LICENSE).
