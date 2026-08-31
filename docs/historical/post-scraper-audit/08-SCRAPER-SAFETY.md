# 08 — Scraper Pipeline Safety & Ingestion Architecture

**Audit Date**: 2026-08-26  
**Pipeline Location**: `frontend/src/lib/scrapers/` and `frontend/src/app/api/scrapers/`

---

## 1. Safety Ingestion Lifecycle

```
SCRAPE (Target Sites / RSS Feeds)
  │
  ▼
NORMALIZE (cleanTitle, normalizeUrl, slugify, normalizeCategory)
  │
  ▼
GARBAGE FILTER (GARBAGE_TITLE_PATTERNS / Min Length 15)
  │
  ▼
INITIAL STATUS ASSIGNMENT (`verification_status = 'pending'`)
  │
  ▼
LINK VERIFICATION PIPELINE (`/api/cron/check-links`)
  │
  ▼
DOMAIN & DEADLINE CHECKS
  │
  ▼
PUBLIC ACTIVE PROMOTION (`verification_status = 'verified'`)
```

---

## 2. Invariant Rules

1. **Never Blindly Publish**: Scrapers default to `verification_status = 'pending'`, preventing raw scraped text from appearing on public feeds until link health is validated.
2. **Cron Authentication**: All scrapers are protected by `requireCronOrAdmin(request)` to prevent unauthenticated execution.
3. **Fail-Closed Design**: If database connection or scraper parser errors out, the pipeline aborts cleanly without polluting stored data.
