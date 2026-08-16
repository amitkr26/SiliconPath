# Content Quality & Opportunity Data Upgrade — Implementation Plan

> Phase 1 (audit) output. Grounded in the actual codebase as of 2026-08-11.
> **No production behavior has been modified.** Implementation begins only after
> this plan is approved. Every change below is file-specific and reversible.

---

## 0. Audit findings (what is actually broken)

### 0.1 Current data flows

```
NEWS: RSS feeds (17) ─► fetchAllNews() ─► isElectronicsNews() ─► dedup (url|title)
      ─► INSERT {title, url, source_name, summary, published_at, image_url, tags}
      ─► /api/news (DB rows + LIVE RSS + HARDCODED JULY_2026_MAJOR_UPDATES[12])
      ─► NewsCard / news/[slug] page (hardcoded fallback articles)

OPPORTUNITIES: live-fetch scrapers (ISRO, DRDO, CSIR, PSU, academic, global ATS)
      + RSS + ATS adapters + deep-scraper (5 rows/run) + HARDCODED scrapers
      ─► /api/scrape | /api/cron/* | /api/scrapers/* (4 divergent insert paths)
      ─► opportunities table ─► /api/opportunities* ─► OpportunityCard / detail
```

### 0.2 Hallucination / data-loss vectors (ranked)

| # | Vector | Evidence (file:line) |
| :-- | :-- | :-- |
| V1 | **Hardcoded fabricated news served publicly** — `JULY_2026_MAJOR_UPDATES` (12 invented articles: TSMC 2nm risk production, $15B ISM approvals, Intel $8.5B…) injected FIRST in `GET /api/news`, plus hardcoded fallback articles in `app/news/[slug]/page.tsx:13-40` | `frontend/src/app/api/news/route.ts:18-90`, `app/news/[slug]/page.tsx` |
| V2 | **Hardcoded fabricated opportunities** — `national-scrapers.ts` (6 fns) + `global-master-scraper.ts` (4 fns) contain **zero `fetch()` calls**; invented titles/deadlines/stipends inserted as `verification_status:"verified"` via `/api/scrapers/run-all` (Vercel daily cron) | `frontend/src/lib/scrapers/national-scrapers.ts`, `global-master-scraper.ts`, `app/api/scrapers/run-all/route.ts:27` |
| V3 | **Invented deadlines** — ATS adapters set `deadline = postedAt + 30 days`; hardcoded scrapers ship literal future dates; deep-scraper writes unparsed strings ("25 Sep 2026") into a `date` column and treats "date of interview" as deadline | `lib/scrapers/ats-adapters.ts:103-112`, `deep-scraper.ts:28-41`, `app/api/scrape/route.ts:250` |
| V4 | **Uncontrolled categories** — mixed-case free values; `CAT_MAP[unknown] ?? "government"` silently re-buckets everything unrecognized (incl. "job") to "government"; display mapping can also mislabel | `app/api/scrape/route.ts:165-176`, `lib/utils.ts:203-227` |
| V5 | **Schema drift** — 4 of 5 insert paths write legacy columns (`organization`, `stipend`, `apply_link`, `posted_at`) the live table lacks; verification/link-check/search routes query dead columns | `app/api/cron/scrape-india/route.ts:76-91`, `api/scrapers/utils.ts:29-43`, `employer/jobs/route.ts:92-106`, `cron/check-links`, `search/opportunities` |
| V6 | **Auto-"verified" content** — every scrape insert hardcodes `verification_status:"verified"`; the badge implies human/trusted verification that never happens | `app/api/scrape/route.ts:215`, `api/scrapers/utils.ts:39` |
| V7 | **Fabricated fallbacks in presentation** — `stipend || "As per Industry Pay Standard"`, `inferAuthenticOrganization` fallback "Semiconductor Enterprise", employer `apply_url || "https://drdo.gov.in/careers"`, JSON-LD `baseSalary` with free-text pay | `lib/utils.ts:243`, `employer/jobs/route.ts:100`, `app/opportunities/[slug]/page.tsx` |
| V8 | **Dedup holes** — `runScraperRoute` has no dedup (DB UNIQUE is the only guard; hardcoded rows sharing `https://rac.gov.in` collide); cron dedups URL-only; timestamp-suffixed slugs create near-duplicates | `api/scrapers/utils.ts`, `cron/scrape-india/route.ts:54-58` |
| V9 | **Stale content stays listed** — `/api/opportunities` has no `deadline >= today` clamp and no server-side "Expired" filter branch; expiry is a client-side guess on possibly-invented deadlines | `app/api/opportunities/route.ts:146-157`, `lib/utils.ts:131-140` |
| V10 | **News body never exists** — `content` column exists in migration but nothing ever writes it; articles are summaries-only; archive-news moves >30-day rows to DB2 (content loss) | `app/api/scrape/route.ts:51-64`, `app/api/archive-news/route.ts` |

### 0.3 What is already good (reuse, don't rebuild)
- `isElectronicsNews` + `autoTagArticle` keyword taxonomy (`lib/scrapers/news-filter.ts`) — solid base for secondary_category derivation.
- `normalizeUrl`/`slugify`/`cleanTitle` (`lib/scrapers/utils.ts`).
- `@berojgardegreewala/api` (workspace lib with jest infra) — validation schemas, error classes; **frontend already imports it**.
- `@berojgardegreewala/ai-gateway` — provider fallback chain for article generation.
- Scraper source registries: `config/scrapers/institutions.json`, `companies.json` (per-source type metadata).
- `scrape_sources` table + `updateSourceHealth()` health tracking (ATS).

---

## 1. Architecture decision (the whole plan rests on this)

**All pure content-quality logic goes into the `@berojgardegreewala/api` workspace**
(`backend/api/src/content/`), which already has jest configured and is already a
frontend dependency. Reasons: zero new dependencies, unit-testable without a
database, shared by the Next.js routes AND the standalone server later. The
frontend gets thin route-level wrappers + the AI pipeline.

New module layout in `backend/api/src/content/`:
```
content/
├── taxonomy.ts     # controlled primary/secondary category taxonomy + mapping rules
├── dates.ts        # labeled date extraction + ISO normalization + raw-text preservation
├── status.ts       # opportunity status derivation (upcoming/open/closing_soon/closed/archived/unknown)
├── sources.ts      # source_type classification + official-source preference + validation
├── dedup.ts        # canonical URL + title-similarity + cross-source canonicalization
├── seo.ts          # SEO title/meta/OG/canonical/schema builders (article + breadcrumb + FAQ)
├── linking.ts      # related article/opportunity discovery (keyword+org overlap, top-N)
├── quality.ts      # pre-publish validation gate (Phase 11 checklist)
├── provenance.ts   # sources[] metadata shape + audit timestamps
└── index.ts
```

---

## 2. Phased implementation

### PHASE 0 — STOP THE BLEEDING (highest risk, smallest diff)
Do first, independently shippable, no schema changes:

1. **Remove V1 fabrication** — delete `JULY_2026_MAJOR_UPDATES` injection from
   `app/api/news/route.ts` and the hardcoded fallback map in
   `app/news/[slug]/page.tsx` (replace fallback with the 404/no-content path).
   Fixes "AI/fabricated content" at the source: these are hand-written claims,
   not scraped facts.
2. **Remove V2 fabrication** — gate `national-scrapers.ts` +
   `global-master-scraper.ts` behind `SCRAPER_ALLOW_FABRICATED=false` (default
   off): return `[]` until each entry gets a real source URL + live fetch or is
   removed. `run-all` keeps working with the 5 real scrapers + ATS + RSS.
3. **Stop invented deadlines** — delete `extractDeadline()` +30-day fabrication
   in `ats-adapters.ts` (deadline stays `null` = "Not specified"); stop
   hardcoded deadline strings (they die with P0.2); deep-scraper: return
   **labeled** dates only (application deadline / exam date / interview date).
4. **Kill presentation fallbacks** — `mapDbOpportunityToClient`: remove
   `stipend || "As per Industry Pay Standard"` (null → UI shows "Not
   specified"), stop forcing `verification_status:"verified"`, remove
   `inferAuthenticOrganization` fake-name fallback; `employer/jobs`: remove
   `|| "https://drdo.gov.in/careers"`.
5. **Auto-verified → pending** — scrape insert paths set
   `verification_status:"pending"` unless a human/verifier approves.

### PHASE 1 — FOUNDATION: schema + taxonomy + dates + status (migration #1)
New migration `frontend/supabase/migrations/20260811_content_quality.sql`
(all `ADD COLUMN IF NOT EXISTS` — idempotent, safe on live DB):

**news_articles**
```sql
ADD COLUMN content text,                      -- long-form body (was never written)
ADD COLUMN category text DEFAULT 'industry',  -- now controlled taxonomy
ADD COLUMN subcategory text[],
ADD COLUMN author text,
ADD COLUMN reading_time_minutes int,
ADD COLUMN updated_at timestamptz,
ADD COLUMN sources jsonb DEFAULT '[]',        -- [{title,url,publisher,source_type,published_at,accessed_at}]
ADD COLUMN quality_status text DEFAULT 'pending' CHECK (quality_status IN
  ('draft','review','verified','published','rejected')),
ADD COLUMN fetched_at timestamptz, ADD COLUMN processed_at timestamptz,
ADD COLUMN rejection_reason text,
ADD COLUMN canonical_source_url text,
ADD COLUMN seo jsonb DEFAULT '{}',            -- {seo_title,meta_description,og_title,og_description,canonical_url}
ADD COLUMN related_article_ids uuid[] DEFAULT '{}',
ADD COLUMN related_opportunity_ids uuid[] DEFAULT '{}'
```

**opportunities**
```sql
ADD COLUMN posted_date date, ADD COLUMN application_start_date date,
ADD COLUMN application_deadline date,          -- replaces ambiguous "deadline"
ADD COLUMN event_date date, ADD COLUMN exam_date date,
ADD COLUMN interview_date date, ADD COLUMN joining_date date,
ADD COLUMN deadline_raw text,                  -- original source text, audit trail
ADD COLUMN last_verified_at timestamptz,
ADD COLUMN primary_category text, ADD COLUMN secondary_category text[],
ADD COLUMN source_name text, ADD COLUMN source_type text CHECK (source_type IN
  ('official','government','university','company','research','reputable_media','aggregator','social','unknown')),
ADD COLUMN official_url text, ADD COLUMN application_url text,
ADD COLUMN notification_url text, ADD COLUMN fetched_at timestamptz,
ADD COLUMN status text CHECK (status IN ('upcoming','open','closing_soon','closed','archived','unknown')),
ADD COLUMN related_article_ids uuid[] DEFAULT '{}',
ADD COLUMN related_opportunity_ids uuid[] DEFAULT '{}'
-- keep existing deadline column for read-compat; new writes go to application_deadline
```

Backfill (same migration): map existing `category` values to
`primary_category` via `taxonomy.mapLegacy()`; set `source_type` from
`source_url` domain rules; `deadline → application_deadline`;
`last_verified_at = verified_at` where present.

**Taxonomy (content/taxonomy.ts)** — the controlled list from the spec
(13 primary × listed technical secondaries). `classify(category, title,
tags)` = deterministic rule table (keyword → primary) then `validate()`
against the taxonomy; unknown input → `other`, never "government".
`mapLegacy()` covers jrf/srf/phd/postdoc/fellowship/internship/government/
industry/job → new primaries.

**Dates (content/dates.ts)** — `extractDates(text)` returns labeled
candidates by regex context (`last date|deadline|closing date|apply by` →
application_deadline; `exam date|date of exam` → exam_date; `interview` →
interview_date; `joining|report by` → joining_date; ISO/DD-MM-YYYY/DD.MM.YYYY/
"25 Sep 2026" formats) + `normalizeDate()` → `YYYY-MM-DD` or `null` +
`date_raw` preserved. **Never guesses**: no input match → null.

**Status (content/status.ts)** — `deriveStatus({application_deadline,
application_start_date, posted_date}, today, closingThresholdDays)`:
closed / open / upcoming / closing_soon / unknown per spec. No deadline →
`unknown` (never "open" from fetch). Server-side only.

### PHASE 2 — NEWS ARTICLE SYSTEM (migration #1 + pipeline)
New pipeline module `frontend/src/lib/news-pipeline/generate-article.ts`:
1. Input: `ParsedArticle` (title, summary, source_url, published_at, tags) + fetched page HTML content when available (`contentSnippet` is the fallback).
2. **Body generation** via existing `@berojgardegreewala/ai-gateway` (frontend `lib/ai/` provider chain): strict prompt with the 11-section structure (only sections the source supports; FAQ only when the source material raises questions), source-grounded instructions per Phase 3/15, explicit "Not specified in the source" rule.
3. **Extraction before generation**: run `extractDates`, `taxonomy.classify`, `sources.build()` (source_type via `sources.ts` domain rules) on the source text; pass ONLY extracted facts into the prompt.
4. **Provenance**: `sources` jsonb always written; `fetched_at`, `processed_at` stamped.
5. Insert with `quality_status='draft'`; **Phase 11 gate** promotes to `published` only when every check passes; else `rejected` + `rejection_reason`. No auto-publish on failure.
6. Wire into `app/api/scrape/route.ts` news branch + `cron/scrape-news` (replacing the summary-only insert).
7. `archive-news`: copy (not move) to DB2 and keep DB1 row (audit continuity).

### PHASE 3 — OPPORTUNITY DATA MODEL & INGEST FIX (migration #1 + routes)
1. Fix all 4 insert paths onto the live schema + new fields (single shared helper `frontend/src/lib/content/ingest.ts` → `buildOpportunityRow(scraped)` used by scrape, cron-india/global, scrapers/utils, employer/jobs — kills the drift for good).
2. Sources per Phase 6: per-scraper `source_type` from a registry map (isro.gov.in→government, iisc.ac.in→university, workday/greenhouse→company, RSS aggregators→aggregator); `official_url` preferred over `apply_url` when the page provides a distinct official link; `notification_url` when a PDF/circular is detected.
3. Verification: `last_verified_at` stamped on insert/verify/recheck; aggregator-sourced rows default `verification_status:'pending'`.
4. Status column computed at write time + read-time recompute in `mapDbOpportunityToClient` (single source of truth = dates).

### PHASE 4 — API & FRONTEND (read-side)
1. `/api/opportunities`: add server-side `status` param + clamp (`status != closed/archived` by default → stops stale rows ranking); map new fields; keep response field names additive.
2. `/api/opportunities/[id]`: route through the same mapper (today it returns raw rows).
3. `/api/news` + `/api/news/[slug]`: return `content`, `sources`, `seo`, `reading_time_minutes`, `related_*`; remove hardcoded fallbacks (done in P0).
4. Frontend:
   - `OpportunityCard` + detail page: labeled dates ("Posted", "Applications Open", "Application Deadline", "Last Verified"), "Not specified" for null, status badge from API status, official-source link.
   - News detail page: render body + reading time + sources/references section + related content (articles & opportunities via `linking.ts` at request time, top-5).
   - Replace any remaining hardcoded fallback content.
   - JSON-LD: emit Article schema (news) and fix JobPosting `datePosted`/`validThrough` to use real fields; `baseSalary` only when salary is numeric, else omit.

### PHASE 5 — SEO + INTERNAL LINKING (migration #1 columns + lib)
1. `content/seo.ts`: seo_title (facts-only, no fake year injection), meta_description (≤160, from real content), canonical_url (domain + slug), OG pair, JSON-LD builders: Article + Breadcrumb always; FAQ schema only when quality-gate confirmed a real FAQ section.
2. `content/linking.ts`: related = top-N by (a) organization-name match, (b) primary_category match, (c) keyword overlap — against both articles and opportunities; write to `related_*` arrays post-publish (batch job endpoint `cron/link-content`), and compute fallback at read time when empty.
3. Wire generated SEO into the news insert + detail page `<head>`.

### PHASE 6 — DEDUP + CROSS-SOURCE CANONICALIZATION
1. `content/dedup.ts`: canonicalUrl (strip tracking params/utm/www/trailing slash — extend `normalizeUrl`), title similarity (token-Jaccard ≥ 0.85 + same org), and cross-source rule: same event from aggregator + official → official wins, aggregator row marked `duplicate_of` (new column) instead of inserted.
2. Enforce in the shared ingest helper (replaces the 3 divergent dedup paths); keep DB UNIQUE on source_url as backstop.
3. Fix `runScraperRoute` to use the same helper (dedup hole closed).

### PHASE 7 — TESTS (Phase 14 spec) — in `backend/api/__tests__/content/`
jest (already configured). Cases per the 12 categories + the 10 scenario list
(complete/missing-deadline/multiple-dates/expired/future/conflicting dates/
aggregator+official/duplicate opp/duplicate article/insufficient source):
`dates.test.ts`, `status.test.ts`, `taxonomy.test.ts`, `dedup.test.ts`,
`sources.test.ts`, `quality.test.ts`, `seo.test.ts`, `linking.test.ts`,
`generation.test.ts` (prompt contract: forbidden-facts list, e.g. assert
prompt contains "Not specified in the source" and no numeric-invention
instructions), plus route-level smoke tests in `frontend` if a runner exists
(else rely on the lib tests + manual QA per TESTING.md).

### PHASE 8 — DEPLOY + BACKFILL
1. Migration run (idempotent, prod-safe).
2. Backfill existing rows (mapLegacy categories, source_type from domains, deadline→application_deadline, status recompute).
3. Rollback plan: every phase is additive; P0 deletions are isolated commits revertable via git.
4. New cron wiring: `vercel.json` — keep run-all + news/sync; add `cron/link-content` (daily) if approved.

---

## 3. Explicit non-goals (safety rules)
- No invented dates/salary/vacancy/eligibility/org/title/link — every claim must trace to a source; unknowns render "Not specified in the source".
- No category proliferation: final category always validated against taxonomy.
- No auto-publish of failed validation.
- No new dependencies (all logic in `@berojgardegreewala/api` + existing libs).
- No changes to auth, admin flows, employer posting UX, or unrelated pages.
- The standalone `backend/server` is untouched this round except optionally
  reusing the new content lib (it already depends on `@berojgardegreewala/api`).
- Known operational risk kept out of scope: hardcoded secrets in
  `frontend/src/lib/db/multi-db.ts` (flagged for a separate security session).

## 4. Final deliverable mapping (task's 14 items)
1. Files changed → per-phase file list above; summarized in final report
2. DB migrations → `20260811_content_quality.sql` (1 file, idempotent)
3. New fields → §1 column list
4. New taxonomy → `content/taxonomy.ts` (controlled lists + rules)
5. News pipeline changes → §PHASE 2
6. Opportunity pipeline changes → §PHASE 3
7. Source verification logic → `content/sources.ts` + §PHASE 3.2-3.3
8. Date extraction logic → `content/dates.ts` (labeled, raw-preserving)
9. SEO changes → `content/seo.ts` + §PHASE 5
10. Validation rules → `content/quality.ts` (Phase 11 checklist, all 13 checks)
11. Tests added → §PHASE 7 (12 suites)
12. Test results → run `npm test --workspace @berojgardegreewala/api` (jest) + regression on frontend build
13. Remaining limitations → reported honestly (e.g., RSS summaries without full text, paywalled sources)
14. Migration/backfill → §PHASE 8

## 5. Suggested execution order (dependency-aware)
P0 (bleeding) → P1 (schema+libs) → P7 lib tests alongside P1-P3 → P2 (news)
→ P3 (opportunities) → P4 (API/frontend) → P5 (SEO/linking) → P6 (dedup)
→ P8 (deploy/backfill) → final report.
