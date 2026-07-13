# SiliconPath Documentation

Single source of truth for all project documentation.

## Platform Overview

SiliconPath is a **two-tier career platform** for the semiconductor, VLSI, and research ecosystem:

1. **Public Tier (No Login):** Aggregates opportunities from DRDO, ISRO, BARC, IITs, NITs, semiconductor companies, and research labs into one searchable interface. Users browse and apply directly.
2. **Registered Tier (LinkedIn Features):** Full professional networking with profiles, connections, messaging, feed, company pages, resume builder, application tracking, and community.

---

## Database Architecture (4 Databases)

| Database | Provider | Purpose |
|----------|----------|--------|
| DB1 | Supabase | Core: opportunities, news, companies, categories, scrape sources |
| DB2 | Supabase | Social: user profiles, connections, messages, posts, applications |
| Neon DB1 | Neon | Analytics: page views, click tracking, search metrics, AI usage |
| Neon DB2 | Neon | Backend: scraper state, job queues, cron logs |

---

## Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Vercel
- **Backend:** Express.js, TypeScript, Render
- **Auth:** Supabase Auth (Google, GitHub, Email)
- **AI:** OpenAI GPT-4, Google Gemini (opportunity matching, resume analysis, content curation)
- **Scraping:** Playwright, Cheerio, RSS feeds
