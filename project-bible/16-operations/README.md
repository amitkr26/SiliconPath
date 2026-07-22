# Operations

## Overview

Operational procedures for running BerojgarDegreeWala: monitoring, incident response, backup/recovery, deployment, maintenance windows, and capacity planning.

## Monitoring

### Health Checks
- Backend: `GET /health` → `{ status: 'ok', db: 'connected', lastScrapeRun: '...' }`
- Frontend: Vercel status page → uptime monitoring
- Database: Supabase dashboard → active connections, query performance
- Cron: Scrape run log in `scrape_runs` table

### Alerting
- Sentry: Error threshold alerts (5+ errors in 5 minutes)
- Cron failure: Admin notification if scrape run fails 3 consecutive times
- Database connection: Alert if pool exhaustion approaches
- Rate limiting: Alert if hitting Upstash quota

### Key Metrics (Prometheus)
- Backend: `scrape_jobs_total`, `scrape_errors_total`, `scrape_duration_seconds`
- API: `http_requests_total`, `http_request_duration_seconds`, `http_errors_total`
- Database: `db_connections_active`, `db_query_duration_seconds`

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
1. **Identify**: Check Sentry, health checks, logs
2. **Assess**: Determine severity level
3. **Respond**: Apply fix or rollback
4. **Communicate**: Status page / in-app notice
5. **Post-mortem**: Document root cause and prevention

## Backup Recovery

### Supabase
- Point-in-time recovery (7 days on free tier)
- Export via `supabase db dump` weekly
- Full schema in migration files

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
- Auto-deploy from `main` branch
- Preview deployments for PR branches
- Rollback via Vercel dashboard to any previous deployment

### Backend (Render)
- Manual deploy from GitHub or `render.yaml`
- Blue-green via Render's built-in deployment
- Rollback via Render dashboard

### Deployment Checklist
- [ ] All tests passing (CI green)
- [ ] Migration files reviewed and tested
- [ ] Environment variables updated
- [ ] Preview deployment verified
- [ ] Database backup current
- [ ] Monitoring confirms healthy

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
| Resource | Limit | Current Usage | Growth Margin |
|----------|-------|---------------|---------------|
| DB1 storage | 500 MB | ~150 MB | 70% |
| DB2 storage | 500 MB | ~50 MB | 90% |
| Vercel bandwidth | 100 GB | ~20 GB/mo | 80% |
| Vercel builds | 6000 min | ~500 min/mo | 92% |
| Render hours | 750 hr | ~500 hr/mo | 33% |
| Upstash commands | 10K/day | ~2K/day | 80% |

### Upgrade Triggers
- DB storage > 80% → request Supabase Pro upgrade
- Vercel bandwidth > 80% → optimize images/ISR or upgrade
- Render visits reaching free tier limit → upgrade to Starter ($7/mo)

## Related Documents

- [incident-response.md](./incident-response.md) — Incident runbooks
- [runbooks.md](./runbooks.md) — Common operations runbooks
- [maintenance-checklist.md](./maintenance-checklist.md) — Scheduled maintenance
