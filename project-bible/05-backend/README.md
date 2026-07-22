# Backend Architecture

> [!IMPORTANT]
> **Consolidation Note (July 2026)**: The Express.js backend scraper service formerly deployed on Render has been **fully consolidated** into Next.js Serverless API endpoints inside the `berojgardegreewala/` subproject. The directory structure and concurrency models documented below are legacy reference details only.

## Overview

The BerojgarDegreeWala backend is a lightweight Express.js application deployed on Render that handles all scraping, orchestration, and scheduled maintenance tasks. It runs as a Docker container with health checks and Prometheus metrics.

## Stack

- **Runtime**: Node.js 20 (LTS)
- **Framework**: Express.js 4
- **Language**: TypeScript (compiled via `tsx`)
- **Database**: Supabase JS client (DB1 + DB2)
- **Scheduling**: `node-cron`
- **Container**: Docker (multi-stage build)
- **Deployment**: Render (free tier)
- **Monitoring**: Prometheus client, Sentry

## Directory Structure

```
backend/
├── src/
│   ├── scrapers/           # Scraper adapters + orchestrator
│   │   ├── adapters/       # Greenhouse, Lever, Workday, SmartRecruiters, HTML, RSS, Schema
│   │   ├── source-config.ts # 332+ source definitions
│   │   ├── orchestrator.ts # Concurrency-limited orchestration
│   │   └── utils.ts        # Data quality pipeline
│   ├── cron/               # Scheduled tasks
│   │   ├── scheduler.ts    # node-cron schedule definitions
│   │   └── tasks.ts        # Task implementations
│   ├── routes/             # API routes
│   │   ├── scrape.ts       # POST /scrape/run, GET /scrape/status
│   │   ├── health.ts       # GET /health
│   │   └── metrics.ts      # GET /metrics
│   ├── middleware/          # Auth, rate limiting, error handling
│   │   ├── auth.ts         # SCRAPER_SECRET validation
│   │   ├── rate-limit.ts   # Token-bucket rate limiter
│   │   └── error-handler.ts # Global error handler
│   ├── services/           # Shared services
│   │   ├── database.ts     # Supabase client instances
│   │   ├── ai-gateway.ts   # AI integration for parsing
│   │   └── dedup.ts        # Deduplication logic
│   └── utils/              # Utilities
│       ├── url.ts          # URL normalization
│       ├── titian.ts       # Title cleaning
│       └── logger.ts       # Structured logging
├── Dockerfile
├── render.yaml
└── package.json
```

## API Endpoints

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/health` | Public | Health check with DB status |
| GET | `/metrics` | Public | Prometheus metrics |
| POST | `/scrape/run` | `SCRAPER_SECRET` | Trigger scrape job |
| GET | `/scrape/status` | `SCRAPER_SECRET` | Check last run status |

## Concurrency Model

- Scrape orchestrator limits concurrency to 3 simultaneous sources
- Each source adapter handles its own rate limiting
- Token-bucket rate limiter: 120 req/min per IP on the API layer
- Backpressure: when queue exceeds 20 sources, new jobs are queued

## Error Handling

- Global error handler catches uncaught exceptions (reports to Sentry)
- Per-source error isolation: one failing source does not block others
- Retry: failed sources retry once after 30-second delay
- Circuit breaker: a source that fails 5+ consecutive runs is skipped for 24 hours

## Container

Multi-stage Docker build:
1. **Stage 1** (`deps`): `npm ci` with dev dependencies
2. **Stage 2** (`builder`): TypeScript check + compile
3. **Stage 3** (`runner`): `npm ci --omit=dev`, copy dist, run via `node`

Health check: `CMD curl -f http://localhost:$PORT/health || exit 1`

## Related Documents

- [routes.md](./routes.md) — Full route documentation
- [middleware.md](./middleware.md) — Middleware stack
- [docker.md](./docker.md) — Docker configuration
- [render.md](./render.md) — Render deployment
