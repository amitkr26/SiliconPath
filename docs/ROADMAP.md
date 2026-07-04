# SiliconPath Roadmap

## Current Status (Phase 1)
**Focus:** High-performance, no-login aggregator.
- [x] Next.js App Router migration and architecture setup.
- [x] 4-Database split (Supabase Core/Social, Neon Analytics/Cache).
- [x] Basic UI with cyber-blob animations.
- [x] AI Fallback Chain (AWS Bedrock, Nvidia, Cloudflare).
- [x] Core resource guides (JRF vs SRF, PhD Abroad, DRDO).

## Next Steps (Phase 2)
**Focus:** Expanding scraping capabilities and fixing dormant keys.
- [ ] Rotate and fix invalid keys for Groq, Gemini, and OpenRouter in the AI fallback chain.
- [ ] Add more scraping targets (e.g., TSMC, Intel, Texas Instruments global career pages).
- [ ] Ensure Vercel Cron is actively executing the scrape jobs in production and inserting rows into DB1.
- [ ] Implement actual email dispatch via Resend in the `/api/cron/digest` endpoint.

## Future Exploration (Phase 3)
**Focus:** The Social Graph.
*The following features are currently fully built in the API and UI layers, but are dormant/hidden from the primary user flow. Re-enabling them requires shifting to a logged-in user strategy.*
- [ ] Re-activate `/feed` and `/network` pages in the main header.
- [ ] Enable the messaging system via WebSocket/Real-time DB2 subscription.
- [ ] Allow users to "Apply" directly through their profile rather than just clicking out to the institution's page.

*Note: The pivot to these Phase 3 features depends on product validation of the Phase 1 aggregator.*
