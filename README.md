# SiliconPath

**Open career aggregator & self-guided learning platform for the Indian semiconductor, VLSI, and hardware engineering industry.**

No friction. No login required. Aggregating academic research and industry opportunities in one place.

<p align="center">
  <a href="#key-features">Key Features</a> •
  <a href="#system-architecture">System Architecture</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#deployment">Deployment</a> •
  <a href="#environment-variables">Environment Variables</a>
</p>

---

## Key Features

### 1. Unified Opportunity Aggregator

**473 sources** across **17 batches**, covering:
- **Junior & Senior Research Fellowships (JRF/SRF)** in electronics, VLSI, and hardware
- **Fully Funded PhDs** at IITs, IISc, and global institutions
- **Government & PSU Scientist Positions** (DRDO, ISRO, CSIR, BARC)
- **Private Sector VLSI Roles** (RTL, Physical Design, Verification, DFT)
- **International Fellowships & Internships**

### 2. VLSI Academy Learning Path

7-stage sequential curriculum with gated assessments:
1. Digital Logic Fundamentals
2. Verilog HDL
3. SystemVerilog for Verification
4. Universal Verification Methodology (UVM)
5. RTL Design & Synthesis
6. Physical Design & Backend
7. VLSI Interview Preparation

Each track unlocks only after passing the previous track (≥70%). Progress saved in LocalStorage for anonymous users or Synced to Supabase for logged-in users.

### 3. AI-Powered Fallback Chain

7-provider resilient fallback chain: Groq → OpenRouter → Cloudflare → Gemini → Bedrock → HuggingFace → NVIDIA. OpenRouter model updated from deprecated `google/gemma-2-9b-it:free` to `meta-llama/llama-3.1-8b-instruct:free`. Used for parsing unstructured job descriptions, PDFs, and HTML listings.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    electrobridge/                        │
│  Next.js 14 App Router + Tailwind CSS + Supabase SSR    │
│  ┌──────────────────────────────────────────────────┐   │
│  │   Pages: 35+   │   API Routes: 40+   │ Components │   │
│  └──────────────────────────────────────────────────┘   │
│               │                                          │
│               ▼                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │   Supabase Primary (core data, auth, academy)    │   │
│  │   Supabase Secondary (social, archive)           │   │
│  │   Neon Primary (analytics)                       │   │
│  │   Neon Secondary (read replica / cache)          │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                         │
                         │ API Proxy (via RENDER_BACKEND_URL)
                         ▼
┌─────────────────────────────────────────────────────────┐
│                      backend/                            │
│  Express + TypeScript + node-cron                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │   473 sources · 17 batches · 7 adapters         │   │
│  │   Workday · Greenhouse · Lever · SmartRecruiters │   │
│  │   Schema.org · HTML · RSS                        │   │
│  └──────────────────────────────────────────────────┘   │
│  Deployed on Render (Docker)                             │
└─────────────────────────────────────────────────────────┘
```

---

## Quick Start

### Prerequisites
- Node.js v20+
- npm / pnpm
- Supabase account (2 projects recommended)
- Neon account (2 projects recommended)
- AI provider API keys (at least 1 of the 7)

### 1. Clone & Install

```bash
git clone https://github.com/amitkr26/SiliconPath.git
cd SiliconPath

# Frontend
cd electrobridge
cp .env.local.example .env.local
pnpm install
pnpm dev            # → http://localhost:3000

# Backend (separate terminal)
cd ../backend
cp .env.example .env.local
npm install
npm run dev          # → http://localhost:3001
```

### 2. Set Up Databases

Apply migrations to your Supabase projects:
```bash
cd electrobridge
npx supabase db push
```

### 3. Verify

```bash
# Backend health
curl http://localhost:3001/health

# Backend source overview
curl http://localhost:3001/scrape/explore

# Trigger a scrape (requires SCRAPER_SECRET)
curl -X POST http://localhost:3001/scrape/run \
  -H "Authorization: Bearer $SCRAPER_SECRET"
```

---

## Deployment

### Frontend → Vercel

1. Push `electrobridge/` to GitHub
2. In Vercel Dashboard → Import repository
3. Set **Root Directory** to `electrobridge`
4. Add all environment variables (see table below)
5. Deploy — auto-deploys on every `main` push

**Cron Jobs:** Configured in `electrobridge/vercel.json`. Vercel Pro required for multiple cron jobs.

### Backend → Render (Docker)

1. In Render Dashboard → New Web Service → Connect repo
2. Set **Root Directory** to `backend`
3. Render auto-detects `render.yaml` or `Dockerfile`
4. Add all environment variables (see table below)
5. Service starts at `https://siliconpath-backend.onrender.com`

**Free tier note:** Render free web services sleep after inactivity. Use UptimeRobot (free) pinging `/health` every 14 minutes to keep it awake.

### Integration

Set this env var in Vercel:
```
RENDER_BACKEND_URL=https://siliconpath-backend.onrender.com
SCRAPER_SECRET=<same value in both Vercel and Render>
```

The frontend's cron endpoints (`/api/cron/*`) proxy scrape requests to the backend.

---

## Environment Variables

### Required (Both Frontend & Backend)

| Variable | Source | Used In |
|----------|--------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Primary project URL | Both |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Primary anon key | Frontend |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Primary service role key | Both |
| `SUPABASE_2_URL` | Supabase Secondary project URL | Both |
| `SUPABASE_2_ANON_KEY` | Supabase Secondary anon key | Frontend |
| `SUPABASE_2_SERVICE_ROLE_KEY` | Supabase Secondary service role key | Both |
| `NEON_1_DATABASE_URL` | Neon Primary connection string | Both |
| `NEON_2_DATABASE_URL` | Neon Secondary connection string | Both |

### AI Providers (at least 1 required)

| Variable | Provider | Priority |
|----------|----------|----------|
| `GROQ_API_KEY` | Groq | 1st |
| `OPENROUTER_API_KEY` | OpenRouter | 2nd |
| `CLOUDFLARE_AI_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Workers AI | 3rd |
| `GEMINI_API_KEY` | Google Gemini | 4th |
| `AWS_BEARER_TOKEN_BEDROCK` | AWS Bedrock | 5th |
| `HUGGINGFACE_API_KEY` | HuggingFace Inference | 6th |
| `NVIDIA_NIM_API_KEY` | NVIDIA NIM | 7th |

### Frontend-Only

| Variable | Purpose |
|----------|---------|
| `CRON_SECRET` | Auth for Vercel cron endpoints |
| `NEXT_PUBLIC_ADMIN_PASSWORD` | Admin panel password |
| `RESEND_API_KEY` | Email sending (Resend) |
| `FROM_EMAIL` | Sender email address |
| `TELEGRAM_BOT_TOKEN` | Telegram notifications |
| `TELEGRAM_CHANNEL_ID` | Telegram channel |
| `NEXT_PUBLIC_SENTRY_DSN` | Error tracking (Sentry) |
| `GOOGLE_CLIENT_ID` | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL |

### Backend-Only

| Variable | Purpose |
|----------|---------|
| `PORT` | Server port (default 3001) |
| `ALLOWED_ORIGINS` | CORS origins (comma-separated) |
| `RATE_LIMIT_MAX` | Max requests/minute/IP |
| `SCRAPER_SECRET` | Shared secret for scrape API auth |

---

## Project Structure

```
SiliconPath/
├── backend/                    # Standalone scraping backend (Render/Docker)
│   ├── src/
│   │   ├── index.ts            # Express entry point (port 3001)
│   │   ├── scrapers/
│   │   │   ├── adapters/       # 7 platform adapters
│   │   │   ├── source-config.ts # 473 sources across 17 batches
│   │   │   └── orchestrator.ts # Batch execution engine
│   │   ├── cron/scheduler.ts   # node-cron schedules
│   │   └── routes/             # Health + scrape trigger endpoints
│   ├── Dockerfile
│   ├── render.yaml
│   └── package.json
├── electrobridge/              # Next.js frontend (Vercel)
│   ├── src/
│   │   ├── app/                # 35+ pages + 40+ API routes
│   │   ├── components/         # 30+ React components
│   │   ├── lib/                # DB, AI, scrapers, utils
│   │   └── middleware.ts       # Supabase SSR auth
│   ├── supabase/migrations/    # Database migrations
│   └── vercel.json             # Cron config
├── docs/                       # Documentation
├── scripts/
│   └── session-setup.sh        # Env var loader (placeholders)
└── Makefile                    # Common commands
```

---

## Scripts Reference

```bash
# Setup environment (loads placeholders — override with real values in shell)
source scripts/session-setup.sh

# Validate env vars are set
make env-check

# Install all dependencies
make install

# Run both frontend and backend in dev mode
make dev

# Typecheck both projects
make typecheck

# Test both projects
make test
```

---

## Documentation

| Doc | Contents |
|-----|----------|
| `docs/ARCHITECTURE.md` | Deep architecture overview |
| `docs/DEPLOYMENT.md` | Vercel deployment details |
| `docs/DATA_MODEL.md` | Database schema |
| `docs/API_REFERENCE.md` | API endpoint reference |
| `docs/SECURITY.md` | Security & RLS policies |
| `docs/CONTRIBUTING.md` | Contributing guidelines |
| `backend/README.md` | Backend-specific deployment and API docs |
| `electrobridge/README.md` | Frontend-specific docs |

---

## Mission

Aggregating every opportunity and learning path for the Indian semiconductor ecosystem. Making high-quality VLSI education and career pathways accessible to all aspirants, regardless of economic background or technical starting point.

**Version 1.0.0** — Built for the Indian semiconductor revolution.
