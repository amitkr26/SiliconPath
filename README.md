# SiliconPath

**A worldwide platform for semiconductor, VLSI, and hardware engineering careers, plus a free self-paced learning academy, plus a professional network.**

One place for every opportunity from government labs (DRDO, ISRO, BARC, CSIR), universities (IITs, IISc, ETH, NUS), and industry (Intel, NVIDIA, TSMC, and more). Browse with no login required. Register to unlock the full professional network: profiles, connections, feed, messaging, and job applications.

> Live: https://siliconpath.vercel.app

---

## What SiliconPath is

SiliconPath has three layers:

1. **Aggregator (open, no login).** JRF/SRF, PhD, postdoc, fellowships, government/PSU roles, and private-sector VLSI jobs from hundreds of sources worldwide, normalized into one searchable feed. Apply directly at the source.
2. **VLSI Academy (open).** A 7-stage sequential curriculum from digital logic to interview prep, built entirely on curated free resources, with gated assessments. Progress saves locally for anonymous users, or syncs to your account.
3. **Professional network (registered users).** LinkedIn-style profiles, connections, a feed, direct messaging, saved opportunities, job applications, and employer/recruiter accounts.

The aggregator and academy are usable by anyone instantly. The network is opt-in for people who register.

---

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 (App Router), React 18, Tailwind CSS |
| Auth & DB | Supabase (Postgres, SSR auth, RLS) |
| Analytics | Neon (serverless Postgres) |
| Scraper backend | Express + TypeScript + node-cron (Docker on Render) |
| AI parsing | Multi-provider fallback (Groq → Gemini → Cloudflare → …) |
| Email | Resend |
| Hosting | Vercel (frontend) + Render (backend) |

---

## Architecture at a glance

```
         ┌──────────────────────────────────────┐
         │            electrobridge/ (Next.js)          │
         │  Pages + API routes + SSR auth middleware    │
         └──────────┬──────────────────────────┘
                    │
     ┌────────────┼───────────────┐
     ▼               ▼                ▼
  Supabase 1     Supabase 2         Neon
  (core data)    (users/social)     (analytics)
     ▲
     │ API proxy (RENDER_BACKEND_URL, SCRAPER_SECRET)
  ┌──┴───────────────────┐
  │  backend/ (Express)   │  scrapers + cron on Render
  └────────────────────┘
```

We use **3 databases** (2 Supabase + 1 Neon), down from 4. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## Quick start

### Prerequisites
- Node.js v20+
- pnpm (frontend) and npm (backend)
- 2 Supabase projects + 1 Neon project
- At least one AI provider key (Groq or Gemini recommended)

### 1. Clone & install
```bash
git clone https://github.com/amitkr26/SiliconPath.git
cd SiliconPath

# Frontend
cd electrobridge
cp .env.local.example .env.local   # fill in values
pnpm install
pnpm dev                            # http://localhost:3000

# Backend (separate terminal)
cd ../backend
cp .env.example .env.local          # fill in values
npm install
npm run dev                         # http://localhost:3001
```

### 2. Set up databases
See **[docs/DATABASE_SETUP.md](docs/DATABASE_SETUP.md)** for the full wipe-and-rebuild runbook. In short:
```bash
# In each Supabase SQL editor, run the migrations in order:
#   electrobridge/supabase/migrations/20260710_000_reset_core.sql   (Project 1)
#   electrobridge/supabase/migrations/20260710_001_reset_social.sql (Project 2)
# Then seed:
#   electrobridge/supabase/seed/01_organizations.sql
#   electrobridge/supabase/seed/02_academy_tracks.sql
# In Neon, run:
#   neon/schema.sql
```

### 3. Verify
```bash
curl http://localhost:3001/health
curl http://localhost:3001/scrape/explore
```

---

## Environment variables

See **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** for the complete table. Key rules:

- **Never** prefix a secret with `NEXT_PUBLIC_`. That bakes it into the client bundle. `ADMIN_PASSWORD` and `CRON_SECRET` are server-only.
- `SCRAPER_SECRET` must be identical in Vercel and Render.
- Rate limiting requires `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` in production (in-memory limiting does not work on serverless).

---

## Project structure

```
SiliconPath/
├─ backend/                     # Express scraper backend (Render/Docker)
│  └─ src/
│     ├─ index.ts              # Express entry (port 3001)
│     ├─ scrapers/             # adapters + orchestrator
│     ├─ cron/                 # node-cron schedules
│     └─ routes/               # health + scrape endpoints (auth-guarded)
├─ electrobridge/               # Next.js frontend (Vercel)
│  ├─ src/app/                 # pages + API routes
│  ├─ src/lib/                 # db clients, auth, ai, scrapers, utils
│  ├─ supabase/migrations/     # DB schema (reset + rebuild)
│  └─ supabase/seed/           # verified seed data
├─ neon/                        # Neon analytics schema
├─ docs/                        # deployment, database, architecture, migration
└─ Makefile
```

---

## Documentation

| Doc | Contents |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design, 3-DB strategy, security model |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Vercel + Render deploy, full env var reference |
| [docs/DATABASE_SETUP.md](docs/DATABASE_SETUP.md) | Wipe + rebuild all databases from scratch |
| [docs/MIGRATION_V2.md](docs/MIGRATION_V2.md) | Upgrade runbook for the v2 rebuild branch |
| [docs/SECURITY.md](docs/SECURITY.md) | Security posture, RLS, disclosure policy |

---

## License

MIT. See [LICENSE](LICENSE).
