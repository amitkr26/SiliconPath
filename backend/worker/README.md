# `@berojgardegreewala/worker`

Standalone scheduled scraper worker and background ingestion engine for BerojgarDegreeWala / SiliconPath.

## Overview

A resilient CLI-driven and cron-compatible background worker that scrapes official Indian semiconductor, VLSI, academic, government (DRDO, ISRO, CSIR), and enterprise job boards.

- **Sources Monitored**: Official career portals, RSS feeds, and recruitment notices.
- **Deduplication & Sanitization**: URL normalization, slug collision safety, and quality-scoring pipeline before database upserts.
- **Idempotency**: Safe to run on schedule without producing duplicate opportunities or news articles.
- **Scrape Health Telemetry**: Every `scrape_runs` entry increments the source's `total_runs`/`total_results` counters and stamps `last_scrape_at`/`last_success_at` on `scrape_sources` (ISRO run seeded to 1 on first insert).
- **Source Active-State Preservation**: A source deactivated by an admin (`is_active = false`, e.g. a dead feed) is never silently re-enabled by a subsequent cron tick — `run-news-sync.ts` preserves the admin's state while still incrementing counters on the row.
- **Dead-Feed Hygiene**: Backend ship removed non-functional feeds (Chip Design Magazine, The Electronics Media, The Register — Hardware, Science Daily's dead `computers_math` URL) on 2026-09-18; remaining 8 live feeds are covered by backend/api `NEWS_SOURCES`. Removed sources persist as deactivated `scrape_sources` rows, never hard-deleted.

## Commands

```bash
# Start default worker
npm run start:worker

# Run news RSS scrapers
npm run start:news

# Run ISRO opportunity scraper
npm run start:isro

# Run automated scraper tests (31/31 — incl. news deactivated-source preservation + counter assertions)
npm test

# Check types
npm run typecheck
```
