# Scraper Architecture

> Last reconciled: 2026-08-19

## Overview

All scraping runs inside the Next.js app: `frontend/src/lib/scrapers` (24 files, measured 2026-08-19). Triggered by Vercel cron and admin/cron-guarded API routes. There is no external scraping service.

## Modules

### Built-in opportunity scrapers (8 real, wired into `scrapeAllOpportunities`)

`isro-scraper.ts`, `drdo-scraper.ts`, `csir-scraper.ts`, `india-psu-scraper.ts`, `india-academic-scraper.ts`, `global-semiconductor-scraper.ts`, `international-academic-scraper.ts`, `fellowship-scraper.ts`.

### ATS adapters (4, for DB-configured sources)

`greenhouse-adapter.ts`, `lever-adapter.ts`, `workday-adapter.ts`, `smartrecruiters-adapter.ts`. Board token comes from `app_config.greenhouse_board_token`; adapter dispatch lives in `opportunity-scraper-impl.ts`.

### RSS feeds (13, `rss-parser.ts`)

12 news feeds: IEEE Spectrum, Semiconductor Engineering, EE Times, Electronics Weekly, Chip Design Magazine, SemiWiki, Electronics For You, The Electronics Media, The Register, Power Electronics News, Science Daily, Phys.org. 1 opportunity feed: Scholarship Roar (type `opportunity`). News goes to `news_articles` (columns `url`/`source_name`); opportunities join the opportunity pipeline.

### Fabricated postings (10 functions in 2 files)

`national-scrapers.ts` (6: space-defence, scientific-research, electronics-semiconductor, psu-electronics, railways, universities/institutes) and `global-master-scraper.ts` (4: research labs, universities, semiconductor companies, EDA/equipment). Hand-written demo postings, gated by `SCRAPER_ALLOW_FABRICATED=true`, **disabled in production**, and never flow through `runOpportunityScrape`.

### Other

`deep-scraper.ts` (detail-page enrichment), `news-filter.ts` (blocklist + whitelist, below), `utils.ts` (`cleanTitle`, `normalizeUrl`, `GARBAGE_TITLE_PATTERNS`), `ats-adapters.ts` (ATS tag/keyword patterns), `types.ts`, `opportunity-scraper.ts`, `govt-scraper.ts` (exists but not wired into the active pipeline).

## Pipeline

### `scrapeAllOpportunities` (`opportunity-scraper-impl.ts`)

- DB-configured ATS sources (sequential) + 8 built-ins (concurrent via `Promise.allSettled`).
- Retry x3 with exponential backoff (`1000 * 2^attempt`, cap 15s).
- Per-source `scrape_runs` logging; `scrape_sources` health tracking (`last_scrape_at`, `last_success_at`, `consecutive_failures`, `last_error`).

### `runOpportunityScrape` (`run-opportunity-scrape.ts`)

- Combines built-in + RSS results.
- `cleanTitle` + `GARBAGE_TITLE_PATTERNS` filter (rejects nav/garbage titles, <10 chars).
- Dedupe: skip if `source_url` already exists or title matches via `ilike`.
- Category normalized to lowercase CHECK-constraint values via `CAT_MAP`.
- Deadline parsed to `YYYY-MM-DD`, null when unparseable.
- `resolveOrganizationId`: evidence-gated (domain/token/name/title match, person-name guard) — never blind org creation.
- Insert with `verification_status = 'unverified'` (link-check pipeline is the only path to `verified`).
- Deep-enrich first 5 new rows via `deep-scraper.ts` (description, eligibility, salary_range, deadline, location, tags).

### News filter (`news-filter.ts`)

48 blocklist regexes, 338 whitelist keywords, hard/soft electronics checks, `autoTagArticle` caps at 6 tags; applied in `rss-parser.ts`.

## Routes

| Route | Guard | Purpose |
|---|---|---|
| `/api/cron/scrape-opportunities` | requireCronOrAdmin | daily scheduled run (00:00 UTC) |
| `/api/scrape` | requireAdmin | manual full scrape |
| `/api/scrapers/*` (14 handlers incl. run-all, [slug], per-scraper) | requireCronOrAdmin | individual scrapers / run-all |
| `/api/scrape-sources` | verifyAdmin | source registry; `isSafePublicUrl` SSRF guard |

## Scheduling

Only `/api/cron/scrape-opportunities` (daily 00:00 UTC) is scheduled in `vercel.json`; news sync via `/api/news/sync` (daily 06:00 UTC) — see `project-bible/07-api/README.md`. `cron/scrape-news`, `cron/scrape-india`, `cron/scrape-global`, `cron/digest`, `cron/cleanup`, `send-digest`, `sync-replica`, `archive-news`, `cleanup-news` exist as routes but are **not** scheduled.

## Verification note

A recent successful production scrape run was **not** verified during the 2026-08-19 audit (no evidence found). Daily-run status: UNKNOWN.
