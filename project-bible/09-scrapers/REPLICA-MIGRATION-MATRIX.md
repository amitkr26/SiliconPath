# SCRAPER REPLICA-MIGRATION-MATRIX — Phase 7 (2026-08-20)

> Actual scraper inventory of the production fleet (`frontend/src/lib/scrapers/`
> + the API routes that drive it) vs. the backend replica.
> Phase 7 scope: **inventory only — do NOT copy scrapers yet** (owner mandate §16).
> The only replicated scraper is the news RSS pipeline (`backend/api/src/content/news-sync.ts`).

## Inventory

| Existing scraper / surface | Type | Production location | Replica status | Priority | Notes |
|---|---|---|---|---|---|
| News RSS (13 feeds + Scholarship Roar opps) | RSS | `frontend/src/lib/scrapers/rss-parser.ts` | **REPLICATED** — `backend/api/src/content/news-sync.ts` (12 feeds, same write contract: `news_articles` onConflict url, ignoreDuplicates, is_active, slugify) | DONE | Production execution stays on the Vercel cron (`/api/news/sync` 06:00 UTC); replica runs it via `GET /api/v1/cron/news-sync` (manual/parity) and the worker entrypoint (`backend/worker/dist/index.js news`). Production-mode evidence: KNOWN_ISSUES #12/#13. |
| News filtering (dedupe, source normalization) | RSS | `frontend/src/lib/scrapers/news-filter.ts` | **REPLICATED** (logic folded into news-sync build/filter steps) | DONE | — |
| Core opportunity scraper | custom HTTP | `opportunity-scraper.ts` (registry) + `opportunity-scraper-impl.ts` | NOT MIGRATED | High | Port to `backend/server/src/services/scrapers` when scoped |
| Opportunity runner | custom HTTP | `run-opportunity-scrape.ts` | NOT MIGRATED | High | Fold into the future worker `opportunities` command |
| ISRO | government | `isro-scraper.ts` (+ `api/scrapers/isro`) | NOT MIGRATED | Medium | — |
| DRDO | government | `drdo-scraper.ts` (+ `api/scrapers/drdo`) | NOT MIGRATED | Medium | — |
| CSIR | government | `csir-scraper.ts` (+ `api/scrapers/csir`) | NOT MIGRATED | Medium | — |
| India PSU | government | `india-psu-scraper.ts` (+ `api/scrapers/psu-electronics`) | NOT MIGRATED | Medium | — |
| India academic (IIT/IISc) | institutional | `india-academic-scraper.ts` (+ `api/scrapers/iit-iisc`, `iits-iisc`) | NOT MIGRATED | Medium | — |
| National aggregator | government | `national-scrapers.ts` | NOT MIGRATED | Medium | Aggregates the above |
| Govt umbrella | government | `govt-scraper.ts` | NOT MIGRATED | Medium | — |
| International academic | institutional | `international-academic-scraper.ts` (+ `api/scrapers/electronics-semiconductor`, `scientific-research`) | NOT MIGRATED | Medium | — |
| Fellowship | institutional | `fellowship-scraper.ts` | NOT MIGRATED | Medium | — |
| Global semiconductor | custom HTTP | `global-semiconductor-scraper.ts` (+ `api/scrapers/semiconductor`, `space-defence`, `railways`) | NOT MIGRATED | Low | — |
| Deep search | search | `deep-scraper.ts` | NOT MIGRATED | Low | — |
| Global master | other (fabricated) | `global-master-scraper.ts` (+ `api/scrapers/global-master`, `run-all`) | NOT MIGRATED | None | Gated by `SCRAPER_ALLOW_FABRICATED` — disabled in prod; keep out of the replica |
| ATS adapters (Lever, Greenhouse, Workday, SmartRecruiters) | ATS | `ats-adapters.ts`, `lever-adapter.ts`, `greenhouse-adapter.ts`, `workday-adapter.ts`, `smartrecruiters-adapter.ts` | NOT MIGRATED | Low | Auth-heavy; lowest value-to-effort |
| Shared helpers | — | `types.ts`, `utils.ts` | N/A (shared) | — | Port per-scraper with its migration |
| API surfaces driving the fleet | CRON/WORKER | `api/cron/scrape-opportunities|news|india|global`, `api/scrapers/*` (14), `api/scrape`, `api/scrape-sources`, `api/admin/scrape|status|scrape-health`, `api/cron/digest`, `api/send-digest` | NOT MIGRATED (production owners stay on Vercel) | — | Replica exposes only `GET /api/v1/cron/news-sync` (news). Opportunity/ATS fleet migration deferred per Phase 7 §16. |

## Summary

- RSS news pipeline: **REPLICATED** (only migration completed; shared module + worker + guarded endpoint).
- Government (6) + institutional (4) + custom HTTP (2) + search (1) + ATS (1 family) + fabricated (1): **NOT MIGRATED** — inventory done, porting explicitly deferred to a later phase with per-scraper effort estimates.
- No production scraper was removed, replaced, or rerouted; Vercel cron ownership unchanged.