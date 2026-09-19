# 🎓 SiliconPath Frontend (BerojgarDegreeWala)

This directory contains the Next.js 14 frontend application for **SiliconPath / BerojgarDegreeWala** — Career Intelligence Infrastructure for India's Electronics Ecosystem (semiconductor, VLSI & microelectronics).

## Quick Links
- **Root README**: [../README.md](../README.md)
- **Architecture Documentation**: [../project-bible/ARCHITECTURE.md](../project-bible/ARCHITECTURE.md)
- **Live Site**: [https://berojgardegreewala.vercel.app](https://berojgardegreewala.vercel.app)

## Local Development Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build production bundle
npm run build

# Start production server
npm run start
```

For full environment variable configuration and system architecture details, please refer to the [Root README](../README.md).

## Notes
- **News RSS fleet** (`frontend/src/lib/scrapers/rss-parser.ts`): 10 live `NEWS_SOURCES` feeds (IEEE Spectrum, Semiconductor Engineering, EE Times, Electronics Weekly, SemiWiki, Electronics For You, Power Electronics News, Science Daily — Electronics, Phys.org — Engineering, Scholarship Roar). Health is persisted to `scrape_sources`/`scrape_runs` by `/api/news/sync` (the scheduled Vercel cron runner).
- **Opportunity scraper** (`frontend/src/lib/scrapers/opportunity-scraper-impl.ts`): `updateSourceHealth` increments `total_runs`/`total_results` and no-ops cleanly (`maybeSingle`) for sources without a DB row.
- See `project-bible/CHANGELOG.md` for the full change history.
