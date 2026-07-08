# SiliconPath Backend

Standalone Node.js scraping backend for SiliconPath — handles long-running ATS API scraping and batch processing that Vercel serverless functions cannot accommodate due to 10s execution time limits.

## Architecture

```
backend/
├── src/
│   ├── index.ts                  # Express entry point (port 3001)
│   ├── lib/
│   │   ├── db.ts                 # Same 4-database architecture as main app
│   │   ├── ai-providers.ts       # 7-provider AI fallback chain
│   │   └── logger.ts
│   ├── scrapers/
│   │   ├── types.ts               # ScrapedOpportunity, SourceConfig interfaces
│   │   ├── adapters/              # Per-platform scrapers
│   │   │   ├── workday-adapter.ts
│   │   │   ├── greenhouse-adapter.ts
│   │   │   ├── lever-adapter.ts
│   │   │   ├── smartrecruiters-adapter.ts
│   │   │   ├── schema-jobposting-adapter.ts
│   │   │   ├── html-generic-adapter.ts
│   │   │   └── rss-adapter.ts
│   │   ├── source-config.ts       # All scraper sources
│   │   └── orchestrator.ts        # Run sources in configured batches
│   ├── cron/
│   │   └── scheduler.ts           # node-cron schedules
│   └── routes/
│       ├── health.ts              # GET /health
│       └── scrape-trigger.ts      # POST /scrape/run, POST /scrape/batch/:id
├── package.json
├── tsconfig.json
├── render.yaml
└── README.md
```

## Required Environment Variables

| Variable | Source |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Primary project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Primary service role key |
| `SUPABASE_2_URL` | Supabase Secondary project URL |
| `SUPABASE_2_SERVICE_ROLE_KEY` | Supabase Secondary service role key |
| `NEON_1_DATABASE_URL` | Neon Primary connection string (analytics) |
| `NEON_2_DATABASE_URL` | Neon Secondary connection string (read replica) |
| `AWS_BEARER_TOKEN_BEDROCK` | AI provider #1 |
| `GROQ_API_KEY` | AI provider #2 |
| `NVIDIA_NIM_API_KEY` | AI provider #3 |
| `GEMINI_API_KEY` | AI provider #4 |
| `OPENROUTER_API_KEY` | AI provider #5 |
| `CLOUDFLARE_AI_TOKEN` | AI provider #6 |
| `CLOUDFLARE_ACCOUNT_ID` | AI provider #6 |
| `HUGGINGFACE_API_KEY` | AI provider #7 |
| `SCRAPER_SECRET` | Shared secret for HTTP scrape triggers |

These are the **same database and AI credentials** used by the main `electrobridge/` Next.js app. Set them in the Render dashboard.

## Deployment to Render

1. Push this repo to GitHub.
2. In Render Dashboard → New Web Service → Connect repo.
3. Render auto-detects `render.yaml` as the Blueprint.
4. Set all env vars (listed above) in Render dashboard.
5. Service starts at `https://siliconpath-backend.onrender.com`.

## Integration with Main App

In the main `electrobridge/` Next.js app, set:

```
RENDER_BACKEND_URL=https://siliconpath-backend.onrender.com
SCRAPER_SECRET=<same shared secret>
```

The existing Vercel cron routes (`/api/scrape`, `/api/scrape-opportunities`) can forward to this backend:

```typescript
await fetch(`${process.env.RENDER_BACKEND_URL}/scrape/run`, {
  method: "POST",
  headers: { Authorization: `Bearer ${process.env.SCRAPER_SECRET}` },
});
```

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | — | Service info |
| GET | `/health` | — | DB health, last runs, uptime |
| POST | `/scrape/run` | Bearer token | Run all active sources (or specific batch) |
| POST | `/scrape/batch/:batchId` | Bearer token | Run specific batch number |

## Free Tier Fit

This backend is designed for Render's free web service tier:
- **Sleep after inactivity** — wakes on HTTP request; the main app's cron will wake it before triggering scrapes (or use a free uptime monitor like UptimeRobot pinging `/health` every 14 min).
- **512 MB RAM** — sufficient for sequential batch scraping (30 sources/batch, each adapter runs sequentially within the orchestrator).
- **Node.js runtime** — fits all dependencies.
- **No build/deploy limits** on free tier.

**Risk:** A very large batch (100+ sources) could exceed the 512 MB limit or the 15-second request timeout if not paced. Current batch size of 30 keeps within limits. The scheduler runs daily, not continuously.
