# SiliconPath Backend

**Part of SiliconPath v0.3.0**

Standalone Node.js scraping backend for SiliconPath — handles long-running ATS API scraping and batch processing that Vercel serverless functions cannot accommodate due to 10s execution time limits.

## Architecture

```
backend/
├── src/
│   ├── index.ts                  # Express entry point (port 3001)
│   ├── lib/
│   │   ├── db.ts                 # 4-database architecture
│   │   ├── ai-providers.ts       # 7-provider AI fallback chain
│   │   └── logger.ts
│   ├── scrapers/
│   │   ├── types.ts               # ScrapedOpportunity, SourceConfig interfaces
│   │   ├── adapters/
│   │   │   ├── workday-adapter.ts
│   │   │   ├── greenhouse-adapter.ts
│   │   │   ├── lever-adapter.ts
│   │   │   ├── smartrecruiters-adapter.ts
│   │   │   ├── schema-jobposting-adapter.ts
│   │   │   ├── html-generic-adapter.ts
│   │   │   └── rss-adapter.ts
│   │   ├── source-config.ts       # 473 sources across 17 batches
│   │   └── orchestrator.ts        # Batch execution engine
│   ├── cron/
│   │   └── scheduler.ts           # node-cron schedules
│   └── routes/
│       ├── health.ts              # GET /health
│       └── scrape-trigger.ts      # POST /scrape/run, /scrape/batch/:id, etc.
├── Dockerfile
├── render.yaml
└── package.json
```

## Scraper Sources

**473 sources** across **17 batches** — all `active: true`.

| Batch | Sources | Description |
|-------|---------|-------------|
| 1 | 30 | India Government/PSU + Top 10 Global Semiconductor |
| 2 | 31 | Remaining IDMs + Fabless |
| 3 | 30 | Fabless & EDA |
| 4 | 30 | Equipment & Research |
| 5 | 30 | National Lab - India |
| 6 | 30 | Additional sources |
| 7 | 30 | Additional sources |
| 8 | 36 | Additional sources |
| 9 | 40 | Additional sources |
| 10 | 35 | Additional sources |
| 11 | 39 | Additional sources |
| 12 | 10 | Additional sources |
| 13 | 10 | Additional sources |
| 14 | 30 | Expanded coverage |
| 15 | 28 | Expanded coverage |
| 16 | 32 | Expanded coverage |
| 17 | 32 | Expanded coverage |

7 adapter types: **Workday**, **Greenhouse**, **Lever**, **SmartRecruiters**, **Schema.org**, **HTML**, **RSS**.

## Required Environment Variables

| Variable | Source |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Primary project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Primary service role key |
| `SUPABASE_2_URL` | Supabase Secondary project URL |
| `SUPABASE_2_SERVICE_ROLE_KEY` | Supabase Secondary service role key |
| `NEON_1_DATABASE_URL` | Neon Primary connection string |
| `NEON_2_DATABASE_URL` | Neon Secondary connection string |
| `GROQ_API_KEY` | AI provider #1 |
| `OPENROUTER_API_KEY` | AI provider #2 |
| `CLOUDFLARE_AI_TOKEN` | AI provider #3 |
| `CLOUDFLARE_ACCOUNT_ID` | AI provider #3 |
| `GEMINI_API_KEY` | AI provider #4 |
| `AWS_BEARER_TOKEN_BEDROCK` | AI provider #5 |
| `HUGGINGFACE_API_KEY` | AI provider #6 |
| `NVIDIA_NIM_API_KEY` | AI provider #7 |
| `SCRAPER_SECRET` | Shared secret for HTTP scrape triggers |
| `ALLOWED_ORIGINS` | CORS origins (comma-separated) |
| `RATE_LIMIT_MAX` | Requests per minute per IP |
| `PORT` | Server port (default 3001) |

## Deployment to Render

### Option A: Blueprint (auto-detect render.yaml)

1. Push this repo to GitHub
2. Render Dashboard → Blueprint → Connect repo
3. Set **Root Directory** to `backend`
4. Add env vars that have `sync: false` in Render dashboard (especially `SCRAPER_SECRET`)
5. Deploy

### Option B: Manual Docker

1. Render Dashboard → New Web Service → Connect repo
2. Set **Root Directory** to `backend`
3. Runtime: Docker
4. Add all env vars in Render dashboard
5. Deploy

### Free Tier Notes

- Render free web services sleep after **15 minutes of inactivity**
- Service wakes on HTTP request (first request may take 30-60s)
- **Recommendation:** Use UptimeRobot (free) pinging `/health` every 14 minutes to keep it awake
- 512 MB RAM — sufficient for sequential batch processing (30 sources/batch)
- 15-second request timeout — each batch stays within this limit

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | — | Service info |
| GET | `/health` | — | DB health, last runs, uptime |
| GET | `/scrape/explore` | — | Source overview (batches, counts, adapters) |
| GET | `/scrape/status` | — | Current run status |
| POST | `/scrape/run` | Bearer token | Run all active sources |
| POST | `/scrape/run`?batch=1 | Bearer token | Run specific batch |
| POST | `/scrape/batch/:batchId` | Bearer token | Run specific batch by ID |
| POST | `/scrape/test/:sourceId` | — | Test a single source |

## Integration with Frontend

In `electrobridge/`, set:

```
RENDER_BACKEND_URL=https://electrobridge-api.onrender.com
SCRAPER_SECRET=<same shared secret>
```

The Vercel cron routes forward to this backend:

```
POST /api/cron/scrape-india  →  POST /scrape/run (with batch param)
POST /api/cron/scrape-global →  POST /scrape/run (with batch param)
```

## Local Development

```bash
cp .env.example .env.local   # fill in real keys
npm install
npm run dev                   # → http://localhost:3001
```

## Verification

```bash
# Health check
curl http://localhost:3001/health

# Source overview
curl http://localhost:3001/scrape/explore

# Trigger full scrape
curl -X POST http://localhost:3001/scrape/run \
  -H "Authorization: Bearer $SCRAPER_SECRET"
```
