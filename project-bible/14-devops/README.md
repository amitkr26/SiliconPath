# DevOps Architecture

## Deployment Overview

| Service | Provider | Purpose | Plan |
|---------|----------|---------|------|
| Frontend | Vercel | Next.js 14 application | Free (Hobby) |
| DB1 | Supabase | Core platform data | Free |
| DB2 | Supabase | Social + user data | Free |
| Analytics | Neon | Page views, clicks, search | Free |
| Rate Limiting | Upstash | Distributed rate limiting | Free |
| Email | Resend | Transactional emails | Free |
| AI Providers | Groq, etc. | LLM inference | Free tier |
| Error Tracking | Sentry | Error monitoring | Free |
| Analytics | Plausible | Privacy-first analytics | Self-hosted |

## Free Tier Constraints

All infrastructure must operate within free tier limits:
- **Vercel**: 100 GB bandwidth, 6000 build minutes/month, 10 serverless function executions (concurrent)
- **Supabase**: 500 MB database, 2 GB bandwidth, 50,000 monthly active users (free tier)
- **Neon**: 0.5 GB compute, 5 GB storage, shared compute (always-on, but cold starts)
- **Upstash**: 10,000 commands/day, 1 MB data (free tier)

## CI/CD Pipeline

### GitHub Actions
Two workflows:
1. `ci.yml`: Runs on `main` branch — lint, type-check, test, build
2. `ci-berojgardegreewala.yml`: Runs on `berojgardegreewala/*` branches

### Vercel Deployments
- Production: Auto-deploys from `main` branch
- Preview: Auto-deploys from PR branches
- Custom domains: `berojgardegreewala.vercel.app` (primary)

### Render Deployments
- Manual deploy or GitHub integration
- Docker-based build with multi-stage Dockerfile
- `render.yaml` defines service configuration

## Environment Variables

**76+ environment variables** across frontend and backend, documented in:
- `berojgardegreewala/.env.local.example` (frontend template)
- `backend/.env.example` (backend template)
- `project-bible/23-reference/environment-variables.md` (complete catalog)

## Cron Jobs (Vercel)

| Route | Schedule | Purpose |
|-------|----------|---------|
| `/api/cron/scrape-india` | Daily 6:00 AM IST | Scrape India sources |
| `/api/cron/scrape-global` | Daily 8:00 AM IST | Scrape global sources |
| `/api/cron/check-links` | Daily 9:00 AM IST | Verify opportunity links |
| `/api/cron/digest` | Sunday 12:00 PM | Weekly email digest |

## Monitoring

- **Sentry**: Error tracking (frontend + backend)
- **Prometheus**: Custom metrics on backend `/metrics` endpoint
- **Health check**: Backend `GET /health` with DB status, last runs, uptime
- **Scraper health**: Admin dashboard at `/admin/scrape-health`

## Backup Strategy

- **Supabase**: Point-in-time recovery (7-day retention on free tier)
- **Neon**: Automated daily backups (7-day retention)
- **Migration files**: All schema changes in version-controlled SQL files
- **Seed data**: Version-controlled SQL files for development bootstrapping

## Related Documents

- [vercel.md](./vercel.md) — Vercel configuration
- [render.md](./render.md) — Render configuration
- [ci-cd.md](./ci-cd.md) — CI/CD pipeline
- [environments.md](./environments.md) — Environment variables
- [monitoring.md](./monitoring.md) — Monitoring setup
- [backup-recovery.md](./backup-recovery.md) — Backup procedures
