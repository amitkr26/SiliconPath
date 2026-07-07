# SiliconPath Roadmap

## Current Status (Phase 1)
**Focus:** High-performance, no-login aggregator.
- [x] Next.js App Router migration and architecture setup.
- [x] 4-Database split (Supabase Core/Social, Neon Analytics/Cache).
- [x] Basic UI with cyber-blob animations.
- [x] AI Fallback Chain (AWS Bedrock, Nvidia, Cloudflare).
- [x] Core resource guides (JRF vs SRF, PhD Abroad, DRDO).

## Current Status (Phase 2)
**Focus:** Expanding scraping capabilities and configuring automation.
- [x] Add and configure target companies (Intel, Micron, NVIDIA, NXP, Broadcom, ISRO, DRDO, CSIR, etc.).
- [x] Ensure Vercel Cron is actively executing scrape jobs in production (`vercel.json` configured).
- [x] Implement actual email dispatch via Resend in the `/api/cron/digest` endpoint.
- [x] Setup dead link checking via `/api/cron/check-links`.

## Future Exploration (Phase 3)
**Focus:** Social Graph & Interactivity.
- [x] Re-activate `/feed` and `/network` pages in the main header.
- [x] Enable the messaging system via WebSocket/Real-time DB2 subscription.
- [ ] Allow users to "Apply" directly through their profile rather than just clicking out to the institution's page.
- [ ] Add further advanced scraper targets (requiring Playwright/browser-impersonation to bypass WAF blocks).

