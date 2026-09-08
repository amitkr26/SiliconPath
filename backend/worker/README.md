# `@berojgardegreewala/worker`

Standalone scheduled scraper worker and background ingestion engine for BerojgarDegreeWala / SiliconPath.

## Overview

A resilient CLI-driven and cron-compatible background worker that scrapes official Indian semiconductor, VLSI, academic, government (DRDO, ISRO, CSIR), and enterprise job boards.

- **Sources Monitored**: Official career portals, RSS feeds, and recruitment notices.
- **Deduplication & Sanitization**: URL normalization, slug collision safety, and quality-scoring pipeline before database upserts.
- **Idempotency**: Safe to run on schedule without producing duplicate opportunities or news articles.

## Commands

```bash
# Start default worker
npm run start:worker

# Run news RSS scrapers
npm run start:news

# Run ISRO opportunity scraper
npm run start:isro

# Run automated scraper tests
npm test

# Check types
npm run typecheck
```
