# Session Report — Phase 8: First Government Scraper Replica (ISRO) (2026-08-20)

## Objective

Migrate **exactly one** government/institutional opportunity scraper from
`frontend/src/lib/scrapers/` into `backend/worker` as an **independent replica**
and prove the scraper-replication architecture end to end: no frontend/Next.js
runtime imports, no schema changes, no Render Cron, no paid Render, no fabricated
data, Vercel production untouched, verification lifecycle + dedup contract
preserved. Then report and STOP for owner review.

## Selection (evidence-based)

ISRO (`https://www.isro.gov.in/Careers.html`) over DRDO/CSIR:

- All three live-verified HTTP 200 (PowerShell probe, 2026-08-20).
- ISRO has the richest parse: 21 `<tr>` rows, ~13 kept after garbage filtering;
  title anchors are the **full titles** (not nav buttons); page shows real
  July–Aug 2026 notices.
- DRDO close second (12 `.vacanciess-title`/`-desc` pairs → 2 result rows), CSIR
  sparse (6 rows). Matrix order already ranks ISRO first in the government block.

## Deliverables (all new, `backend/worker`)

| File | Role |
|---|---|
| `src/scrapers/opportunity-utils.ts` | Ported `ScrapedOpportunity`, `GARBAGE_TITLE_PATTERNS`, `cleanTitle`, `slugify`, `normalizeUrl`, `CATEGORY_MAP`/`normalizeCategory`, `toDeadlineDate` — byte-identical to the frontend (pure, zero imports). |
| `src/scrapers/org-resolve.ts` | Evidence-gated `resolveOrganization` + `extractBoardToken` + `looksLikePersonName` (P0.3 guard: never create orgs from bare person names). |
| `src/scrapers/isro.ts` | Pure `parseISROCareersHtml(html)` + deps-injected `scrapeISRO({fetchHtml})`; TLS verification ON; throws on HTTP non-ok; 20-row cap. |
| `src/run-isro-scrape.ts` | Orchestrator: org resolution (hits db1 ISRO org `2b23230a-…` via host-label rule), dedup (`source_url` orig+normalized OR title ilike), slug-collision suffix, insert `{… verification_status:"pending", is_active:true, source_type:"scraped"}`, health persistence (`scrape_sources` get-or-create + `scrape_runs` with the real source_id), structured summary. |
| `src/index.ts` | `isro` subcommand; usage `node dist/index.js news\|isro`. |
| `package.json` | cheerio `^1.2.0` (already in root lockfile — no new third-party dep) + `start:isro`. |
| `tests/isro.test.ts` | 13 tests incl. **frontend-vs-replica parity on frozen HTML** (stubbed global fetch) — the regression guard for the copy. |

## Production bugs surfaced (evidence-backed; frontend untouched per mandate)

| # | Bug | Evidence |
|---|---|---|
| **16** | Vercel cron writes `verification_status:"unverified"` → violates the live CHECK (`pending/verified/rejected/expired/link_unavailable`) → **silently ZERO opportunity inserts since 2026-08-02** | `max(created_at)` across ALL opportunities = 2026-08-02; distribution 3240 verified / 29 link_unavailable / 3 expired / 0 pending / 0 unverified; live probe: `unverified` insert → error **23514** (rolled back), `pending` insert → **accepted** (rolled back, `pending_probe_rows=0` residue). |
| **17** | Live ISRO page anchors now end in " Read More" (e.g. "…and Stenographers Read More") → the garbage filter rejects **all 18 live rows** → production ISRO scraper outputs 0 today | Live page probe + live scrape runs (18 parsed, 18 verdict "read more"). |
| **18** | `GARBAGE_TITLE_PATTERNS` contains unanchored `search`, which matches inside "Research" → every Research listing is dropped | Unit-level: "Research Personnel" skipped by the production filter. |

## Deliberate replica divergences (documented)

- TLS verification **ON** — the frontend's `NODE_TLS_REJECT_UNAUTHORIZED=0` hack is
  dropped (site serves valid certs, probed).
- **Fail-loud** on HTTP non-ok (worker exit-1 contract) vs the frontend's silent `[]`.
- Insert **`pending`** — the only CHECK-valid status (corrects #16's invalid value).
- Health rows use the **real `scrape_sources` uuid** — the frontend passes the
  source NAME string into a uuid column, also silently broken there.

## Verification

- **Regression (all green):** worker **30/30** (17 news + 13 ISRO), server **46/46**,
  api **97/97**, ai-gateway **15/15**; tsc × 4 (worker/server/api/ai-gateway); server
  build; frontend build exit 0; **production E2E 9/9** (pre-run residue scan = zero).
- **Live smoke × 2** against the real ISRO page (fresh service-role key via the
  Management API, temp script deleted after):
  - Run 1: fetched 18 / inserted 0 / duplicates 0 / skipped 18 / **exit 0**.
  - Run 2: identical — **idempotent**.
  - After-state: `scrape_sources` ISRO row created (`bcd8749d-…`, adapter html,
    category opportunity, consecutive_failures 0); 2 success `scrape_runs`
    (results_count 18) with the real source_id; `opportunities` unchanged (28 rows,
    0 pending) — no duplicates, no fabricated data.
  - Zero inserts is **honest parity**: the frontend's own ISRO path also outputs 0
    rows on today's page (#17/#18). The insert/dedup/verification lifecycle is
    proven by the deterministic tests and the live `pending` CHECK probe.

## Docs reconciled

REPLICA-MIGRATION-MATRIX (ISRO → REPLICATED), KNOWN_ISSUES (#16/#17/#18 added),
ARCHITECTURE (Phase 8 CURRENT + worker row + transition), IMPLEMENTATION_STATUS
(worker 30 tests + ISRO row), AGENT_STATE, AGENT_HANDOFF (v1.7.0), CHANGELOG
(Phase 8 entry), 09-scrapers / 14-devops / 16-operations READMEs,
BACKEND-PARITY-MATRIX (`T:worker` 17 → 30 + ISRO worker row + divergence #7).

## Next

- Owner decision: fix #16/#17/#18 in the frontend (replica mirrors whatever the
  frontend ships — it is currently the only working opportunity-ingestion path).
- Next scraper candidates: DRDO, CSIR (both live-verified 200) via the ISRO recipe.