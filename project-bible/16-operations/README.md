# Operations

## Overview

Operational procedures for BerojgarDegreeWala: monitoring, incident response,
backup/recovery, deployment, maintenance windows, and capacity planning.
Verified against the live setup 2026-08-19.

## Monitoring

### Health Checks
- Frontend: `GET /api/health` — checks db1/db2 (Supabase) and neon1/neon2 (Neon).
- Backend (LIVE since 2026-08-20): `GET /health` and `GET /health/ready` on
  https://berojgardegreewala-backend.onrender.com (Render web service, auto-deploy
  on push to main; `free` plan — sleeps after ~15 min idle, cold first request
  measured at ~22 s on 2026-08-20 (Phase 7), warm ~1.7 s).
- AI (LIVE since 2026-08-20, Phase 6.6): `POST /api/v1/ai/summarize` (Bearer JWT) →
  200, provider groq / model `qwen/qwen3.6-27b`; telemetry in db1 `ai_usage_log`.
  Frontend `/api/ai/summarize` verified 200 on the production site.
- Cron: Vercel cron log for `/api/cron/scrape-opportunities`, `/api/cron/check-links`, `/api/news/sync`.
  - **WATCH (KNOWN_ISSUES #16, Phase 8):** `/api/cron/scrape-opportunities` has
    silently inserted ZERO opportunity rows since 2026-08-02 — the pipeline writes
    `verification_status:"unverified"` which violates the live CHECK constraint
    (3240 verified / 29 link_unavailable / 3 expired / 0 pending / 0 unverified;
    `max(created_at)` across opportunities = 2026-08-02). Owner fix required in
    `frontend/src/lib/scrapers/run-opportunity-scrape.ts` (→ `pending`).
- Render cron: **NOT part of the architecture** (Phase 7 — KNOWN_ISSUES #14 CLOSED
  as NOT REQUIRED/OUT OF SCOPE; no billing card needed). Manual fallback:
  `GET /api/v1/cron/news-sync` with the `CRON_SECRET` bearer. Worker entrypoint
  verified in production mode (2026-08-20): news — exit 0, idempotent (0 inserts /
  0 duplicates on re-run), news_articles stable at 285.
- Scraper worker command (Phase 8, on-demand — never scheduled): `node
  backend/worker/dist/index.js isro` (ISRO government scraper replica). Live runs
  2026-08-20: fetched 18 / inserted 0 / duplicates 0 / skipped 18, exit 0,
  idempotent across 2 runs; health persisted to `scrape_sources` (ISRO row
  `bcd8749d-…`) + `scrape_runs`. Zero inserts is honest parity with the frontend
  (KNOWN_ISSUES #17/#18); insert path proven by tests + the live `pending` CHECK
  probe. NOTE: until KNOWN_ISSUES #17/#18 are fixed, this is the only working
  opportunity-ingestion path (writes valid `pending` rows).

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

### Render deployment (backend/server) — COMPLETE (2026-08-20, Phase 7)
1. The web service is live on `plan: free` — `render.yaml` matches (Phase 7: free
   web service only; no cron section; no billing card required, KNOWN_ISSUES #14
   CLOSED as NOT REQUIRED/OUT OF SCOPE). Vercel remains production and the frontend
   never calls Render — the replica is independent.
2. Health: `/health` + `/health/ready` 200 (measured 2026-08-20, Phase 7: cold
   ~22 s after idle, warm ~1.7 s — free-tier sleep behavior is expected, no
   keep-alives).
3. Manual news sync: `GET /api/v1/cron/news-sync` with `Authorization: Bearer
   <CRON_SECRET>` (idempotent — re-runs insert 0; the worker entrypoint already
   exits 0 in production mode).

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
- LIVE since 2026-08-20 (Phase 6.5) on Render — https://berojgardegreewala-backend.onrender.com,
  auto-deploy on push to main, `free` plan. Docker (`backend/server/Dockerfile`,
  non-root + HEALTHCHECK); the API boots with empty env, DB routes return 503 until
  keys are set. AI route verified 200 (Phase 6.6). Deployment decision: KNOWN_ISSUES #0 (closed).

### Deployment Checklist
- [ ] All tests passing (104 frontend jest + 97 api jest + 15 ai-gateway jest + 46 server node:test + 9/9 Playwright)
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