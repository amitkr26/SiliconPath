# Session Report: 2026-08-13 Final Remediation

**Date:** 2026-08-13
**Repo:** BerojgarDegreeWala (main @ `783b797`)
**Type:** Remediation of QA audit findings (P0–P2) + verification
**Status:** All fixes complete in working tree, VERIFIED locally. **NOT committed, NOT pushed, NOT deployed** (awaiting approval).

---

## 1. AI Grounding Fix (P0)

**Root cause (proven in prod):** the AI chain fetched `stipend` (`column opportunities.stipend does not exist`) and the intent gate lacked opportunity/career terms, so every chat grounded to `false`.

**Fix (`frontend/src/lib/ai/grounding.ts`):**
- `.select()` now uses live-schema columns: `salary_range`, `apply_url`, `url`, `source_name`.
- Intent vocabulary expanded with opportunity/career terms (`opportunity`, `careers`, `admissions`, `phd`, `fees`, `jobs`, `stipend`).
- New `filterRelevantOpportunities()`: primary-field keyword match ≥1, OR ≥2 terms total, OR single term ≥8 chars for queries ≤2 terms; no-match queries yield `keepCount: 0`.

**Live-DB retrieval counts (via `/tmp/opencode/newsverify/grounding-counts.cjs`):**

| Query | Retrieved | Kept |
|---|---|---|
| JRF VLSI | 8 | 8 |
| DRDO | 8 | 6 (2 IRDE spam) |
| embedded internships | 8 | 4 |
| semiconductor | 8 | 8 |
| "Zulu Antarctica penguin" | 8 | 0 |

Tests: `src/__tests__/ai/grounding.test.ts` 13/13 pass.

## 2. Organization Backfill (P1)

- Pre-state: 3,253/3,272 rows have `organization` + `organization_id` NULL (19 have names).
- New idempotent script `frontend/scripts/org-backfill.js` matches `organizations.website` host == opportunity URL host.
- **APPLIED to live DB: 138 rows updated, 0 errors** (IIIT Hyderabad 98, BITS Pilani 30, IIT Bombay 4, IIT Madras 3, ISRO 2, VIT 1).
- Join verified: `opportunities.organization_id → organizations.name` resolves to correct name.
- 3,115 rows remain unmatched (no organization row exists for their host) — intentionally left NULL.

## 3. Category Normalization (P1)

- Live values were already canonical (jrf 3170, phd 38, government 29, fellowship 27, srf 6, internship 2) → **no DB writes needed**.
- Empirically verified CHECK constraint vocabulary: `jrf, srf, phd, government, fellowship, internship, industry` (DDL unavailable from sandbox — code adapts to the constraint, no migration possible/needed).
- `src/lib/categories.ts` rewritten: `normalizeCategory` (write path) + `normalizeCategoryParam` (read path) map govt→government, job/private→industry, scholarship→fellowship, trainee→internship.
- Wired into: `api/scrapers/utils.ts` sink, cron `scrape-india` + `scrape-global`, `api/search` + `api/opportunities` params, `search/page.tsx` `CATEGORY_LABEL_TO_CANONICAL` (Govt Job→government, Private Job→industry).
- `frontend/scripts/category-normalize.js` (idempotent backfill for legacy rows): dry-run = 0 rows to change.

## 4. Scraper Title Normalization (P2)

- `cleanTitle` in `src/lib/scrapers/utils.ts` now splits glued `Full-time` / `Part-time` suffixes from the title.
- 4 new regression tests (`src/__tests__/lib/scrapers-utils.test.ts`).
- 81 existing glued rows cleaned deterministically in live DB.

## 5. OG Metadata (P2)

- `news/[slug]`: `og:url` → canonical article URL, `og:type: article`, no duplicated site name in og:title (root title template appends once).
- `opportunities/page.tsx`: `openGraph.url` → `/opportunities` (was root).
- Site-wide: stripped hardcoded `| BerojgarDegreeWala` suffixes from page titles (template adds them exactly once): resources `*`, `organizations/[slug]`, `opportunities/location/[city]`, `opportunities/[slug]` fallback, `profile/[username]`, etc.
- `opportunities/[slug]`: `orgName` fallback — no "null" in `<title>`, og:title, or jsonLd.
- Experiment verified: root layout's explicit `url` + `canonical` were left intact (removing them made default pages lose og:url/canonical entirely — worse). Pages WITHOUT their own metadata keep og:url=root (pre-existing behavior).

## 6. Environment Cleanup (P2)

- **CRITICAL:** `k8s/configmap.yaml` contained the real Neon password (base64) — same credential previously leaked via `multi-db.ts`. REDACTED to placeholder + comment. Credential scans clean. **Recommended: rotate the Neon password.**
- `NEXT_PUBLIC_LINKEDIN_ENABLED` — audit flagged as dead; **WRONG**: it gates `FEATURES.LINKEDIN_ENABLED` (companies/people/notifications pages). Kept.
- `DATABASE_URL` — not referenced in frontend source (uses `NEON_1/NEON_2_DATABASE_URL`); only k8s/docker-compose. Nothing to remove in code; Vercel-side removal of preview-deployed `DATABASE_URL` (if any) requires platform access — left as recommendation.
- `NEXT_PUBLIC_ADMIN_PASSWORD` (audit E/B): unused in code — recommended Vercel-env removal, unverified platform-side.

## 7. Tests & Static Checks

- `npx jest`: **74/74 pass, 12 suites** (was 67; +4 scraper-utils, +3 grounding relevance).
- `npx tsc --noEmit`: clean (0 errors).
- `npx next lint`: clean except 1 pre-existing `next/no-img-element` warning (`profile/page.tsx`).
- `next build`: hangs at static-gen (~216/240) in sandbox — 3rd identical occurrence, known env limitation; compile/typecheck is the sandbox gate. Vercel prod build is the pass authority (prod unaffected: nothing deployed).

## 8. Production & Runtime Verification

- Prod still runs the pre-fix AI bug (nothing deployed) — **AI grounding NOT claimed fixed in prod**.
- Local dev-server verification of every touched page (handles, metadata, OG, jsonLd):
  - `/news/[slug]`: title "…| BerojgarDegreeWala" single suffix, og:url = canonical article URL, og:type article ✓
  - `/opportunities/[slug]` with org (IIT Madras): title + og + jsonLd include org name ✓
  - `/opportunities/[slug]` with NULL org (BEL): no "null" anywhere ✓
  - `/opportunities`, `/resources`: og:url/canonical = page URL ✓
- Live DB: 3,272 opportunities, 142 news articles; news chain functioning (inserts 2026-08-13 05:02 UTC).

## 9. Remaining Bugs / Known Issues

- 3,115 opportunities have no matching organization row (unmatched hosts) — needs org dataset expansion.
- `next build` static-gen hang in sandbox — env, not code.
- Neon password rotation pending (post-redaction exposure).
- Vercel env hygiene (DATABASE_URL preview/dev, NEXT_PUBLIC_ADMIN_PASSWORD) — platform-side action, not performed.
- List pages without own metadata (news, organizations, academy, contact, /) keep og:url=root — pre-existing, tracked as future polish.

## 10. Files Changed (working tree, uncommitted)

49 modified files, +548/−220. Highlights:
- `frontend/src/lib/ai/grounding.ts`, `frontend/src/app/api/ai/chat/route.ts` — P0
- `frontend/src/lib/categories.ts` + `api/scrapers/utils.ts`, `api/cron/scrape-india|global`, `api/search`, `api/opportunities`, `search/page.tsx` — category normalization
- `frontend/src/lib/scrapers/utils.ts` + `api/archive-news`, `api/news/sync`, `api/subscribe`, `lib/utils.ts`, `lib/api-client.ts`, `hooks/useSearch.ts` — title/param/URL hardening + `cleanTitle`
- OG/metadata: `news/[slug]`, `opportunities/[slug]`, `opportunities`, `organizations/[slug]`, `opportunities/location/[city]`, `resources/*`, `profile/[username]`, `categories`, `sitemap.ts`
- Tests: `grounding.test.ts` (+3), `search.test.ts`, `scrapers-utils.test.ts` (new)
- `k8s/configmap.yaml` — credential redaction
- `opencode.json`, `scripts/auto-daily-scraper.js`, `frontend/package.json` (devDeps from earlier cleanup)

5 untracked (to be added): `frontend/scripts/org-backfill.js`, `frontend/scripts/category-normalize.js`, `frontend/src/__tests__/lib/scrapers-utils.test.ts`, plus pre-existing untracked from audit (`.opencode/`, api test files, `supabase/migrations/20260812000002_link_check_columns.sql`, `admin/auth/session/`).

## 11. Files Deleted (prev commit `783b797`)

63 files, +12/−5265 total: 39 `frontend/scripts/` QA tools, 13 unreferenced components, `data/academyResources.ts`, `src/lib/db/multi-db.ts` (credential leak), Vercel metadata artifacts, `public/robots.txt`; `delete-fake-jobs.js` sanitized.

## 12. Proposed Commit

```
Remediate P0-P2 audit findings: AI grounding, org/category data, scraper titles, OG, secrets
```

Contents: all files above (2 modified dirs: 49 M + 5 untracked). **Do NOT push or deploy until explicitly approved.**