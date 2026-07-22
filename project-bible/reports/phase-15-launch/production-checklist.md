# Production Launch Checklist — v1.0.0

## Pre-Launch (verified)

- [x] Branch: `phase-15-launch` created from `main`
- [x] All tests pass: 424/424 across 10 workspaces
- [x] TypeScript compiles: `tsc --noEmit` passes all workspaces
- [x] Frontend build: Next.js `build` compiled successfully (123 static pages)
- [x] ESLint: 1 remaining warning (academy/page.tsx — false positive)
- [x] No secret files tracked in git (Gitleaks configured in CI)
- [x] Security headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy (via middleware.ts)
- [x] Rate limiting: Applied to all `/api/*` routes (via middleware + Upstash)
- [x] Admin auth: All 15 admin routes protected via `requireAdmin()` or `verifyAdmin()`
- [x] Cron jobs configured: 4 Vercel cron routes (scrape-india, scrape-global, check-links, digest)
- [x] Sentry error tracking: Configured via `@sentry/nextjs` (server + client instrumentation)
- [x] Plausible analytics: Script loaded in root layout
- [x] Sitemap: Dynamic sitemap.xml with all static, category, resource, and dynamic opportunity pages
- [x] Robots.txt: Allows all, disallows `/admin` and `/api/`, points to sitemap
- [x] Open Graph + Twitter Cards: Full metadata in root layout
- [x] OG image: `/api/og` route for social sharing images
- [x] Database migrations: All 20+ migration files version-controlled
- [x] Dockerfile: Backend has multi-stage Docker build for Render
- [x] Environment templates: `.env.local.example` (frontend) and `.env.example` (backend) documented
- [x] Rate limit verification: CSP, security headers, rate limiting all verified in middleware
- [x] Duplicate scraper dedup: Normalization + NULL guard applied in all routes

## Launch Steps

1. **Merge PR** phase-15-launch → main
2. **Vercel Deploy**: Auto-deploys from main (verify at https://berojgardegreewala.vercel.app)
3. **Verify Frontend**:
   - [ ] Homepage loads (no Sentry errors)
   - [ ] Opportunities page renders with data
   - [ ] Auth flow (login/signup) works
   - [ ] Search returns results
   - [ ] OG image renders at /api/og
4. **Verify Backend**:
   - [ ] Render deployment succeeds from Dockerfile
   - [ ] Health endpoint returns OK
   - [ ] Scrape runs complete
5. **Verify Cron**:
   - [ ] Scrape routes execute (check scrape_runs table)
   - [ ] Digest route works
6. **Verify Monitoring**:
   - [ ] Sentry captures errors
   - [ ] Plausible shows page views
   - [ ] Vercel dashboard shows no build errors
7. **Final DNS check**: berojgardegreewala.vercel.app resolves
