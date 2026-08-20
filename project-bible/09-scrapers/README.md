# Scraper Architecture

> Last reconciled: 2026-08-20

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

## Backend worker (Phase 6, 2026-08-19) — news RSS migrated, rest deferred

The first backend workload was extracted WITHOUT touching the frontend scrapers
(replicate-never-move):

- Shared ingestion logic now lives in **`backend/api/src/content/news-sync.ts`**
  (12 news feeds, relevance filter, bounded fetch concurrency 4, retry policy 1+2
  on network/5xx/429, run-level URL dedup, per-source execution contract,
  `news_articles` upsert onConflict `url` ignoreDuplicates, `is_active: true`,
  null-url rows never written — the exact frontend `/api/news/sync` contract).
- **`backend/worker`** (`@berojgardegreewala/worker`) runs it as a process:
  `node --import tsx dist/index.js news`. Writes per-run `scrape_runs` rows +
  `scrape_sources` health (name-keyed read-then-write, same contract as the
  frontend pipeline; no schema changes). Exit 0 when ≥1 feed succeeded, 1 when all
  failed or the DB write failed. Structured JSON summary on stdout.
- The backend cron route `/api/v1/cron/news-sync` now uses the same module (this
  FIXED a parity bug: it previously upserted `news_archive` onConflict `slug`).
- **Not migrated (deliberate):** opportunity scrapers, ATS adapters, Scholarship
  Roar feed, fabricated-postings path, deep-scraper — all stay in the frontend.
  Vercel remains the production cron owner. The worker has no fabricated-data
  path at all (all-feeds-fail ⇒ zero rows, covered by test).

## Scheduling

Only `/api/cron/scrape-opportunities` (daily 00:00 UTC) is scheduled in `vercel.json`; news sync via `/api/news/sync` (daily 06:00 UTC) — see `project-bible/07-api/README.md`. `cron/scrape-news`, `cron/scrape-india`, `cron/scrape-global`, `cron/digest`, `cron/cleanup`, `send-digest`, `sync-replica`, `archive-news`, `cleanup-news` exist as routes but are **not** scheduled.

## Verification note

A recent successful production scrape run was **not** verified during the 2026-08-19 audit (no evidence found). Daily-run status: UNKNOWN.

**Production evidence (2026-08-20, Phase 6.5):** the deployed backend's
`GET /api/v1/cron/news-sync` (Render, same shared module) ran successfully:
first run ingested **58 new `news_articles` rows** (12 feeds attempted, 8
succeeded — Chip Design Magazine, The Electronics Media, The Register - Hardware,
Science Daily - Electronics failed at feed level), second and third runs
scraped 92 items each and inserted **0** (idempotent upsert, no duplicates);
`news_articles` total stable at 280. The **worker process itself** has not run in
production — the Render cron job is blocked on workspace billing (KNOWN_ISSUES
#14). Vercel cron `/api/news/sync` (06:00 UTC) remains the production owner;
DB evidence of its daily runs: 08-14 (43 rows), 08-15 (31), 08-16 (1); none on
08-17/18/19 (all-duplicate or missed runs — unverified).
