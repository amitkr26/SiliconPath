# SiliconPath Roadmap

## Current Status (Phase 1)
**Focus:** High-performance, no-login aggregator.
- [x] Next.js App Router migration and architecture setup.
- [x] 4-Database split (Supabase Core/Social, Neon Analytics/Cache).
- [x] Basic UI with cyber-blob animations.
- [x] AI Fallback Chain (AWS Bedrock, Nvidia, Cloudflare, Groq, Gemini, OpenRouter, HuggingFace).
- [x] Core resource guides (JRF vs SRF, PhD Abroad, DRDO).

## Immediate Fixes Required (from Audit)
**Focus:** Security, stability, and data integrity.
- [ ] **CRITICAL:** Fix broken `generate_opp_slug()` function — has no body, slug auto-generation fails on INSERT
- [ ] **CRITICAL:** Add authentication to admin write endpoints (`POST/PATCH/DELETE /api/opportunities`, `/api/admin/recheck-link`, `/api/scrape-sources`)
- [ ] **CRITICAL:** Move `NEXT_PUBLIC_ADMIN_PASSWORD` to a non-public env var
- [ ] **HIGH:** Replace in-memory rate limiter with persistent store (Redis/Supabase)
- [ ] **HIGH:** Add try/catch around all `JSON.parse` on AI output
- [ ] **HIGH:** Resolve conflicting migrations (`linkedin_features.sql` vs `db2_user_social.sql`)
- [ ] **HIGH:** Add input validation / field whitelist for profile and feed update endpoints
- [ ] **HIGH:** Fix CI config — remove `package-lock.json` or switch CI to `pnpm`
- [ ] **MEDIUM:** Create `.env.example` file
- [ ] **MEDIUM:** Move hardcoded Google verification and Plausible domain to env vars

## Next Steps (Phase 2)
**Focus:** Expanding scraping capabilities and fixing dormant keys.
- [ ] Rotate and fix invalid keys for Groq, Gemini, and OpenRouter in the AI fallback chain
- [ ] Update OpenRouter model slug (current one is deprecated/paid)
- [ ] Add more scraping targets (e.g., TSMC, Intel, Texas Instruments global career pages)
- [ ] Ensure Vercel Cron is actively executing the scrape jobs in production
- [ ] Register ATS adapters for Lever, Workday, SmartRecruiters in the orchestrator
- [ ] Implement provider cooldown mechanism to avoid retrying known-failed providers

## Future Exploration (Phase 3)
**Focus:** Social Graph & Interactivity.
- [x] Re-activate `/feed` and `/network` pages in the main header.
- [x] Enable the messaging system via WebSocket/Real-time DB2 subscription.
- [ ] Allow users to "Apply" directly through their profile rather than just clicking out to the institution's page.
- [ ] Add further advanced scraper targets (requiring Playwright/browser-impersonation to bypass WAF blocks).

