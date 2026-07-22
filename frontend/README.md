# BerojgarDegreeWala — Frontend

**Part of BerojgarDegreeWala v0.3.0**

Next.js 14 frontend for the BerojgarDegreeWala semiconductor opportunities platform. Deployed on Vercel.

| Environment | URL | Branch |
|-------------|-----|--------|
| **Frontend (Vercel)** | [berojgardegreewala.vercel.app](https://berojgardegreewala.vercel.app) | `main` |
| **Backend (Render)** | [berojgardegreewala-api.onrender.com](https://berojgardegreewala-api.onrender.com) | `main` |

## Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 14.2.21 (App Router) |
| **UI** | React 18, Tailwind CSS 3.4, lucide-react |
| **Database** | Supabase (Primary + Secondary), Neon (Primary + Secondary) |
| **AI** | 7-provider fallback: Groq → OpenRouter (`meta-llama/llama-3.1-8b-instruct:free`) → Cloudflare → Gemini → Bedrock → HuggingFace → NVIDIA |
| **Auth** | Supabase SSR (email/password + Google OAuth) |
| **Scraping** | cheerio + rss-parser (lightweight); heavy lifting delegated to backend/ |
| **Deployment** | Vercel (auto-deploy from `main`) |

## Quick Start

```bash
cd berojgardegreewala
cp .env.local.example .env.local   # fill in real keys
pnpm install
pnpm dev                           # → http://localhost:3000
```

## Key Features

- **Opportunity Aggregator** — JRF/SRF, PhD, PSU, private sector VLSI roles
- **VLSI Academy** — 7-stage gated curriculum with video embeds and quizzes
- **Semiconductor News** — Aggregated RSS with AI relevance filtering
- **AI Chat** — Career assistant for semiconductor/VLSI opportunities
- **AI Match** — Profile-to-opportunity scoring
- **AI Resume Builder** — 6-step wizard with ATS scoring
- **Community Forum** — Posts, comments, upvotes
- **Weekly Digest** — AI-generated email newsletter

## Database Architecture

| DB | Provider | Purpose | Tables |
|----|----------|---------|--------|
| Supabase Primary | PostgreSQL | Core data (opportunities, news, auth, academy) | 38 |
| Supabase Secondary | PostgreSQL | Social data (profiles, connections, messages) | 13 |
| Neon Primary | PostgreSQL | Analytics (AI usage, platform metrics) | 4 |
| Neon Secondary | PostgreSQL | Read replica / cache | 2 |

## Deployment to Vercel

### Initial Setup

1. Push `berojgardegreewala/` to GitHub
2. Vercel Dashboard → Add New Project → Import repository
3. Set **Root Directory** to `berojgardegreewala`
4. **Framework Preset:** Next.js (auto-detected)
5. Add all environment variables (see below)
6. Deploy

### Environment Variables in Vercel

Add these in Vercel Project Settings → Environment Variables (Production):

**Required:**
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase Primary URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase Primary anon key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase Primary service role key
- `SUPABASE_2_URL` — Supabase Secondary URL
- `SUPABASE_2_ANON_KEY` — Supabase Secondary anon key
- `SUPABASE_2_SERVICE_ROLE_KEY` — Supabase Secondary service role key
- `NEON_1_DATABASE_URL` — Neon Primary connection string
- `NEON_2_DATABASE_URL` — Neon Secondary connection string
- `NEXT_PUBLIC_SITE_URL` — `https://berojgardegreewala.vercel.app`
- `SCRAPER_SECRET` — Shared secret (must match backend)
- `RENDER_BACKEND_URL` — `https://berojgardegreewala-api.onrender.com`

**AI Providers (at least 1):**
- `GROQ_API_KEY`, `OPENROUTER_API_KEY`, `CLOUDFLARE_AI_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`, `GEMINI_API_KEY`, `AWS_BEARER_TOKEN_BEDROCK`, `HUGGINGFACE_API_KEY`, `NVIDIA_NIM_API_KEY`

**Optional:**
- `CRON_SECRET` — Auth for cron endpoints
- `ADMIN_PASSWORD` — Admin panel (server-side only)
- `RESEND_API_KEY` + `FROM_EMAIL` — Email digests
- `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHANNEL_ID` — Notifications
- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` — Google OAuth
- `NEXT_PUBLIC_SENTRY_DSN` — Error tracking

### Cron Jobs

Defined in `vercel.json` — Vercel **Pro** plan required for multiple crons:

| Cron | Schedule | Action |
|------|----------|--------|
| `scrape-india` | Daily 06:00 UTC | Scrape India-specific sources |
| `scrape-global` | Daily 08:00 UTC | Scrape global sources |
| `check-links` | Daily 09:00 UTC | Verify opportunity links |
| `digest` | Weekly Sun 12:00 UTC | Generate email digest |

### Supabase Auth Configuration

In Supabase Dashboard → Authentication → Settings:
- **Site URL:** `https://berojgardegreewala.vercel.app`
- **Redirect URLs:** `https://berojgardegreewala.vercel.app/auth/callback`, `http://localhost:3000/auth/callback`

For Google OAuth: Enable Google provider and configure OAuth 2.0 Web Client in Google Cloud Console.

## Integration with Backend

This frontend delegates **heavy scraping** to the backend (`backend/`) running on Render:

```
Frontend API Route → fetch(https://berojgardegreewala-api.onrender.com/scrape/run, { headers: { Authorization: Bearer SCRAPER_SECRET }})
```

The `RENDER_BACKEND_URL` and `SCRAPER_SECRET` env vars connect the two tiers.

## Verification

```bash
# Local
pnpm dev                   # → http://localhost:3000
pnpm test                  # Run tests
pnpm run lint              # Lint check
pnpm run build             # Production build

# Backend integration (if backend is running)
curl http://localhost:3001/health
```
