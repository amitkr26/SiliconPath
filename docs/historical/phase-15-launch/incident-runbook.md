# Incident Runbook — v1.0.0

## Quick Reference

| Severity | Definition | Response | Communication |
|----------|------------|----------|---------------|
| P0 | Platform down | 15 min | Status page + social |
| P1 | Feature broken (no workaround) | 1 hour | Status page |
| P2 | Feature degraded (workaround) | 24 hours | In-app notice |
| P3 | Minor bug | Next sprint | Bug tracker |

## Runbooks

### P0: Frontend Down (Vercel)
1. Check Vercel dashboard: https://vercel.com/.../berojgardegreewala
2. Check Sentry: https://sentry.io/.../berojgardegreewala
3. Identify: Build failure? Deployment issue? DNS?
4. Rollback: Vercel → Deployments → Promote previous → Production
5. Verify: HTTPS works, homepage loads

### P0: Backend Down (Render)
1. Check Render dashboard: https://dashboard.render.com
2. Restart service: Render → Manual Deploy → Last successful deploy
3. Check health: `GET /health`
4. If persistent: Check Docker logs, verify env vars

### P0: Database Down (Supabase)
1. Check Supabase dashboard: https://supabase.com/dashboard
2. Check query performance, active connections
3. Restart: Supabase → Database → Restart
4. If data issue: Point-in-Time Recovery (7-day retention)

### P1: Scrape Failure (Cron)
1. Check `scrape_runs` table: consecutive failures?
2. Check scraper health: `/admin/scrape-health`
3. Common causes: Source changed format, API key expired, rate limited
4. Manual run: Trigger `/api/scrape` with admin auth
5. Fix source configuration if needed

### P1: Auth Broken
1. Check Supabase Auth settings → Providers
2. Verify OAuth credentials (Google/GitHub)
3. Check redirect URLs in Supabase config
4. Test: /login, /auth/callback
5. Check `NEXT_PUBLIC_SITE_URL` env var

### P1: AI Provider Down
1. Check provider health: All 7 providers are in fallback chain
2. If single provider down: Auto-fallback to next provider
3. Check cooldowns: `providerCooldowns` in memory
4. If all providers down: Feature degrades gracefully

### P2: Rate Limiting False Positives
1. Check Upstash dashboard for command count
2. Check rate limit config in middleware.ts
3. Adjust limits if needed (deploy change)

### P2: Email Delivery Failure
1. Check Resend dashboard: API key valid?
2. Check `RESEND_API_KEY` env var
3. Check FROM_EMAIL domain verification
4. Resend free tier: 100 emails/day limit

## Post-Incident

1. Document root cause
2. Apply fix
3. Deploy fix
4. Update runbook if needed
5. Move incident to "resolved"
