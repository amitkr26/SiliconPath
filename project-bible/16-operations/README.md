# Operations

## Overview

Operational procedures for BerojgarDegreeWala: monitoring, incident response,
backup/recovery, deployment, maintenance windows, and capacity planning.
Verified against the live setup 2026-08-19.

## Monitoring

### Health Checks
- Frontend: `GET /api/health` — checks db1/db2 (Supabase) and neon1/neon2 (Neon).
- Backend: `GET /health` (backend/server) — no DB dependency, returns `{ status: "ok" }`.
- Cron: Vercel cron log for `/api/cron/scrape-opportunities`, `/api/cron/check-links`, `/api/news/sync`.

### Dashboards & Alerting
- Vercel dashboard + runtime logs for the deployed app; Supabase dashboard for DB1/DB2.
- Sentry error tracking via `NEXT_PUBLIC_SENTRY_DSN`.
- Plausible analytics (privacy-first, allowlisted in the middleware CSP).
- No Prometheus; no `/metrics` endpoint. No automated quota alerts.

### Rate Limiting
- In-memory token buckets from `@berojgardegreewala/api` (`createRateLimiter`),
  applied per path in `frontend/src/middleware.ts`:
  api 120/min, auth 10/min, search 30/min, scrape 5/min, ai 20/min.
- Upstash Redis is optional: `frontend/src/lib/rate-limiter.ts` uses Upstash only
  when its env vars are set, otherwise falls back to in-memory buckets.

## Incident Response

### Severity Levels
| Level | Definition | Response Time | Communication |
|-------|------------|---------------|---------------|
| P0 | Platform down | 15 min | Status page + social |
| P1 | Feature broken (no workaround) | 1 hour | Status page |
| P2 | Feature degraded (workaround exists) | 24 hours | In-app notice |
| P3 | Minor bug/visual issue | Next sprint | Bug tracker |
| P4 | Cosmetic/non-functional | Backlog | None |

### Runbook
1. **Identify**: Check Vercel runtime logs, Sentry, health endpoints
2. **Assess**: Determine severity level
3. **Respond**: Apply fix or roll back (Vercel dashboard, previous deployment)
4. **Communicate**: Status page / in-app notice
5. **Post-mortem**: Document root cause and prevention (CHANGELOG entry)

## Backup Recovery

### Supabase
- Point-in-time recovery (7 days on free tier)
- Schema in version-controlled migrations (`frontend/supabase/migrations`),
  including RLS policies — verified live 2026-08-18, do not re-apply blindly

### Neon
- Automated daily backups
- Export via `pg_dump` if needed

### Recovery Procedure
1. Identify the point to restore to
2. Restore Supabase via dashboard or CLI
3. Verify data integrity
4. Update application if schema changed

## Deployment

### Frontend (Vercel)
- Git integration: push to `main` auto-deploys (~15 min build)
- Preview deployments for PR branches
- Rollback via Vercel dashboard to any previous deployment
- `[vercel skip]` commit tokens do not work (no Ignored Build Step); CLI
  `vercel deploy --prod` races the git deploy and must not be used

### Backend (backend/server)
- Not deployed. Self-host via Docker (`backend/server/Dockerfile`) if needed;
  the API boots with empty env, DB routes return 503 until keys are set.

### Deployment Checklist
- [ ] All tests passing (104 jest + 6 playwright specs)
- [ ] Migration files reviewed and tested
- [ ] Environment variables updated (reference: `frontend/.env.example`)
- [ ] Preview deployment verified
- [ ] Database backup current
- [ ] Monitoring confirms healthy (`/api/health`)

## Maintenance Windows

### Scheduled (Weekly, Sunday 2:00-4:00 AM IST)
- Database index maintenance
- Archive old logs/scrape runs
- Update source configurations
- Rotate secrets if needed (quarterly)

### Unscheduled (Security patches)
- Critical CVEs applied within 24 hours
- Normal CVEs applied within weekly window
- No scheduled downtime — all operations are rolling

## Capacity Planning

### Current Limits (Free Tier)
| Resource | Limit | Notes |
|----------|-------|-------|
| DB1 storage | 500 MB | Supabase free tier |
| DB2 storage | 500 MB | Supabase free tier |
| Vercel bandwidth | 100 GB | Hobby |
| Vercel builds | 6000 min | Hobby |
| Neon | shared compute, 5 GB storage | 2 databases |
| Upstash | optional | only when rate-limiter env vars set |

### Upgrade Triggers
- DB storage > 80% → request Supabase Pro upgrade
- Vercel bandwidth > 80% → optimize images/ISR or upgrade
- Build minutes exhausted → reduce build frequency or upgrade

## Related Documents

- [SECURITY.md](../13-security/SECURITY.md) — security policy and secrets handling
- [DevOps](../14-devops/README.md) — deployment architecture and CI/CD