# Monitoring Report — v1.0.0

## Active Monitoring

| System | Tool | Purpose | Status |
|--------|------|---------|--------|
| Error Tracking | Sentry | Frontend + backend error capture | ✅ Configured (server + client via `@sentry/nextjs`) |
| Analytics | Plausible | Privacy-first page views | ✅ Script loaded in root layout |
| Health Check | Backend `/health` | DB connectivity + last scrape | ✅ Express endpoint |
| Cron Health | `/api/cron-health` | News scrape freshness (48h) | ✅ Next.js API route |
| Scraper Health | `/admin/scrape-health` | Scraper run history | ✅ Admin dashboard route |
| Uptime | Vercel Status | Platform uptime | ✅ Vercel built-in |

## Sentry Configuration

- **DSN**: Via `NEXT_PUBLIC_SENTRY_DSN` env var
- **Traces Sample Rate**: 0.1 (10%)
- **Environment**: `NODE_ENV` (development/production)
- **Client Init**: `src/instrumentation-client.ts`
- **Server Init**: `src/instrumentation.ts` (Next.js register function)
- **Build Integration**: `next.config.mjs` with `withSentryConfig()`

## Health Check Responses

```
GET /health → { status: "ok", db: "connected", lastScrapeRun: "..." }
GET /api/cron-health → { status: "ok", lastNewsScrape: "...", hoursSinceLastScrape: N }
```

## Alert Thresholds

- **Sentry**: 5+ errors in 5 minutes (manual review — no pagers)
- **Cron failure**: 3 consecutive scrape run failures (logged in `scrape_runs`)
- **Link check**: Broken links reported in admin dashboard
- **Rate limiting**: Hitting Upstash quota (10K commands/day)

## Missing (post-launch)

- [ ] Prometheus metrics endpoint on backend (endpoint exists, no scraping configured)
- [ ] Automated uptime monitoring (use uptimerobot.com or similar — free tier)
- [ ] Dashboard/alerts: All manual via dashboard review currently
