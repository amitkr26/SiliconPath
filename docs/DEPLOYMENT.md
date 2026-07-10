# Deployment Guide

This guide covers deploying SiliconPath from scratch: frontend to Vercel, backend to Render, and wiring up all environment variables.

---

## Overview

| Component | Platform | Root directory |
|---|---|---|
| Frontend (`electrobridge`) | Vercel | `electrobridge` |
| Backend (`backend`) | Render (Docker) | `backend` |
| Core + user DBs | Supabase (2 projects) | — |
| Analytics DB | Neon | — |

---

## 1. Databases first

Before deploying any app, set up the databases. Follow **[DATABASE_SETUP.md](DATABASE_SETUP.md)** end to end. You need:

- Supabase **Project 1** (core data) → run `20260710_000_reset_core.sql` + both seed files
- Supabase **Project 2** (user/social data) → run `20260710_001_reset_social.sql`
- Neon project → run `neon/schema.sql`

Collect these credentials as you go (you'll paste them into Vercel/Render):

- Each Supabase project's URL, anon key, and service role key
- Neon connection string

---

## 2. Frontend → Vercel

1. In the Vercel dashboard, **Import** the GitHub repo.
2. Set **Root Directory** to `electrobridge`.
3. Framework preset: **Next.js** (auto-detected).
4. Add all environment variables from the table below.
5. **Deploy.** Every push to `main` auto-deploys.

### Cron jobs
Cron schedules live in `electrobridge/vercel.json`. Multiple crons require a Vercel **Pro** plan. Current jobs:

| Path | Schedule (UTC) |
|---|---|
| `/api/cron/scrape-india` | `0 6 * * *` |
| `/api/cron/scrape-global` | `0 8 * * *` |
| `/api/cron/check-links` | `0 9 * * *` |
| `/api/cron/digest` | `0 12 * * 0` (weekly) |

Cron endpoints must be protected by `CRON_SECRET` (Vercel automatically sends it as a Bearer token to cron routes).

---

## 3. Backend → Render

1. In Render, **New → Web Service**, connect the repo.
2. Set **Root Directory** to `backend`.
3. Render auto-detects `render.yaml` / `Dockerfile`.
4. Add the backend environment variables (below).
5. Deploy. The service starts at e.g. `https://siliconpath-backend.onrender.com`.

**Free-tier note:** Render free web services sleep after inactivity. Use UptimeRobot to ping `/health` every ~14 minutes to keep it warm.

---

## 4. Wire frontend ↔ backend

Set in Vercel:
```
RENDER_BACKEND_URL=https://siliconpath-backend.onrender.com
SCRAPER_SECRET=<same value in Vercel and Render>
```
The frontend cron routes (`/api/cron/*`) proxy scrape requests to the backend, authenticated with `SCRAPER_SECRET`.

---

## 5. Environment variable reference

### Shared (frontend + backend)
| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project 1 URL (public) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project 1 anon key (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Project 1 service role key (**secret**) |
| `SUPABASE_2_URL` | Supabase Project 2 URL |
| `SUPABASE_2_ANON_KEY` | Project 2 anon key |
| `SUPABASE_2_SERVICE_ROLE_KEY` | Project 2 service role key (**secret**) |
| `NEON_DATABASE_URL` | Neon connection string (**secret**) |

### Frontend only
| Variable | Purpose |
|---|---|
| `ADMIN_PASSWORD` | Admin auth. **Server-only. Never `NEXT_PUBLIC_`.** |
| `CRON_SECRET` | Auth for Vercel cron endpoints |
| `SCRAPER_SECRET` | Shared secret to call the backend |
| `RENDER_BACKEND_URL` | Backend base URL |
| `UPSTASH_REDIS_REST_URL` | Durable rate limiting (required in prod) |
| `UPSTASH_REDIS_REST_TOKEN` | Durable rate limiting token |
| `RESEND_API_KEY` | Email sending |
| `FROM_EMAIL` | Sender address |
| `GROQ_API_KEY` | AI provider (1st priority) |
| `GEMINI_API_KEY` | AI provider (fallback) |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL (public) |
| `NEXT_PUBLIC_SENTRY_DSN` | Error tracking (public DSN) |

### Backend only
| Variable | Purpose |
|---|---|
| `PORT` | Server port (default 3001) |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins |
| `RATE_LIMIT_MAX` | Max requests/min/IP |
| `SCRAPER_SECRET` | Must match the frontend value |

---

## 6. Post-deploy checklist

- [ ] `GET /health` on the backend returns 200
- [ ] Homepage loads and shows verified opportunities
- [ ] `/academy` loads tracks (no infinite spinner)
- [ ] Sign up / log in works (Supabase auth)
- [ ] Admin endpoints return 401 without credentials
- [ ] No `NEXT_PUBLIC_ADMIN_*` variable exists anywhere
- [ ] A manual scrape (`POST /scrape/run` with `SCRAPER_SECRET`) succeeds
