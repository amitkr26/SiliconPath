# 22 - Roadmap

## Phase 0 - Foundation (DONE)
- Next.js + Tailwind frontend, Express scraper backend, 3 databases, AI fallback chain.
- v2 schema reset + seeds. Security hardening (admin auth, field whitelists, input sanitization, SSRF checks, safe AI JSON parse).
- Two-sided signup + onboarding.

## Phase 1 - Trustworthy aggregator (IN PROGRESS, highest priority)
- Purge stale/garbage opportunity rows on the live DB.
- Data-quality gate: title extraction (no nav headings), correct category classification, real org resolution, working apply URL, AI validation before `verified`.
- Fix `generate_opp_slug()` (empty body breaks trigger inserts).
- Redeploy so the data-quality code actually serves live.
- Roll out remaining scraper adapters in batches of 20-30, verifying each.

## Phase 2 - Academy live (NEXT)
- Fix academy landing hang in production (code has timeout+fallback; needs deploy).
- Wire real track/day content + gated assessments.
- Resume builder save + ATS score.

## Phase 3 - Social layer functional
- Reconcile all social API routes to the live schema (connections, feed_posts, messages, user_profiles column drift).
- End-to-end: profiles, connections, feed, messaging, notifications.
- Provider portal: post opportunities + dashboard + talent pool.

## Phase 4 - Scale & polish
- Durable rate limiting (Upstash).
- Monitoring/alerting on scraper health and error rates.
- SEO/AEO/GEO, sitemaps, structured data.
- Performance pass, accessibility audit.

## Future
- Personalized recommendations, saved searches + alerts, employer analytics, mobile app.
