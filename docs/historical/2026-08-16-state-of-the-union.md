# SILICONPATH (BEROJGARDEGREEWALA) — STATE OF THE UNION AUDIT

**Date:** 2026-08-16
**Method:** Product Architecture Blueprint vs. code vs. **live database queries** — no claim included that wasn't re-verified against the running system (spec rule #1).

---

## PART 1: STRATEGIC ANALYSIS

### 1. Identity

**A confused but salvageable hybrid.** The Blueprint (`project-bible/23-reference/berojgardegreewala-master-specification.md`) is unambiguous: *"Not LinkedIn for semiconductors... breadth-of-features is not the moat; niche-specific matching and aggregation is."* The codebase contains **both** products:

- **Career Intelligence Engine** (the vision): opportunities, news, academy, AI matcher/assistant, verification pipeline → the strongest ~40% of the code.
- **LinkedIn clone** (feature bloat): feed, network/connections, DMs, notifications, community Q&A, skill endorsements — ~60 API routes, fully built, previously leading the README's feature list and primary nav.

**Verdict:** identity drift toward bloat, but the moat (verify/match) is code-complete enough to win back. The product decision needed is the one the Blueprint already made: **de-emphasize social, lead with verified intelligence.**

### 2. SWOT

| | |
|---|---|
| **Strengths** | Niche positioning (semiconductor/VLSI/electronics India) with real moat potential · Neobrutalist UI distinct and fast · **AI is genuinely DB-grounded** (live-verified) · Real scraper engine exists (ISRO/DRDO/CSIR/PSU/academic + Greenhouse/Lever/Workday/SmartRecruiters adapters, retry + health logging) · Free-tier cost discipline · Academy with progress gating · Multi-DB split mostly sane |
| **Weaknesses (live-verified)** | **95% of opportunities have no organization** (3,115/3,272 `organization_id IS NULL`) · **"Verified" is a static insert default** — 3,269/3,272 rows marked `verified`, zero `unverified`, no verification pipeline has ever run · **Person-name orgs still live** ("Sadia Munir" ×18, "Muhammad Faizan" ×2 in the Neon mirror — the exact bug §12 of the spec flagged) · **The daily scrape cron is a no-op** (fabricated-scraper path; last real inserts 2026-08-02) · Miscategorized ATS garbage ("Software Engineering Opportunities" → category `jrf`, no deadline/stipend/org) · RBAC is UI-hiding · Schema drift: repo migrations ≠ live DB, legacy-column routes (`apply_link`/`stipend`/`organization`) break at runtime · Mirror desync (29 rows vs 3,272) |
| **Improvements (kill/deprioritize)** | **Deprioritize** the social layer (feed/network/messages/community/notifications) — out of the primary nav, keep code dormant · **Kill** the fabricated-scraper path from cron (`SCRAPER_ALLOW_FABRICATED` is dev-only by its own header comment) · **Kill** the "150+ sources / 4 databases" marketing claims until true · **Fix, don't kill:** verification pipeline, org attribution, RBAC |

### 3. The 3-Portal Architecture

| Question | Answer |
|---|---|
| How structured? | **Flat URLs, not route groups.** Candidate at root, employer at `/post-job` `/employers` `/employer/*`, admin at `/admin/*`. No `(candidate)`/`(employer)`/`(admin)` groups. |
| RBAC in middleware? | **No.** `frontend/src/middleware.ts`: `if ((isGated || isEmployerOnly) && !user)` — login-only; `EMPLOYER_ONLY_PATHS` never checks role. **Any logged-in user can reach `/post-job` and `/employer/*`.** Admin is a separate HMAC console (`ADMIN_PASSWORD` → signed token, constant-time compare — solid). RBAC is UI-hiding plus a login gate, not role enforcement. |
| What's done well | CSRF guard, per-route-class rate limiting, CSP + security headers, cron/admin guards on the scraper runner |

---

## PART 2: CODEBASE REALITY CHECK

### 1. Completion score vs "Phase 1: Stabilize"

**38%.** Phase 1: Stabilize = Blueprint foundation-hardening (§11 rule 5 + §12 open items): trustworthy data, unattended pipeline, enforced access.

| Stabilize goal | Score | Evidence |
|---|---|---|
| AI grounding | ✅ 90% | `/api/ai/chat` queries live DB, deterministic fallbacks, URL sanitization |
| Structured schema | ✅ 70% | `organization_id`/`salary_range`/`apply_url`/eligibility exist — but 95% of rows don't use them |
| Scraper engine | ⚠️ 50% | Real engine exists + works; cron never runs it |
| Verification pipeline | ❌ 5% | "verified" is a hardcoded default; zero pipeline evidence |
| Org/data integrity | ❌ 10% | 95% orgless, misattribution live, mirror stale |
| RBAC enforcement | ❌ 20% | Login-only gate on employer routes |
| Schema/repo consistency | ❌ 30% | Migrations drift, legacy columns in 3 routes |
| 4-DB architecture | ⚠️ 50% | Consolidation happened (3 DBs) but docs + sync never followed |

### 2. The "Scraper" Reality

**Three scraper classes — only one is real, and production cron runs the fake one.**

- **Real engine** — `frontend/src/lib/scrapers/opportunity-scraper-impl.ts`: 8 built-in scrapers (ISRO/DRDO/CSIR/IndiaPSU/IndiaAcademic/GlobalSemiconductor/InternationalAcademic/Fellowships) + DB-configured ATS sources via adapters, 3-retry backoff, `scrape_runs` + `scrape_sources` health logging. **Synchronous and in-request** — concurrency inside a serverless function, admin-triggered only via `/api/scrape`.
- **Fabricated** — `national-scrapers.ts` / `global-master-scraper.ts`: hand-written sample postings, header admits *"hand-written postings, not scraped data. Disabled unless SCRAPER_ALLOW_FABRICATED=true"*. **Vercel cron (00:00 UTC daily) calls `/api/scrapers/run-all` → these → `[]` in production → zero inserts.**
- **Broken** — `scrape-opportunities/route.ts` inserts legacy columns (`organization`, `stipend`, `apply_link`) that no longer exist in the live schema.

**Live proof:** newest db1 rows dated **2026-08-02** — 14 days of dead cron.

### 3. Data Integrity

**Schema: structured (good). Data: garbage (bad).** Structured model exists (`organization_id` FK, `salary_range`, `deadline date`, `eligibility`, `apply_url`, `source_type`, `verification_status` CHECK) — nothing stores raw HTML blobs. The pipeline never populated it correctly (all numbers live-verified 2026-08-16):

- 3,115/3,272 (95%) rows `organization_id IS NULL`
- 100% `source_type = scraped`, **0 employer_posted** (marketplace side empty)
- 3,269/3,272 `verification_status = "verified"` — no verification pipeline has ever run (0 `unverified`)
- Person-name orgs live in the mirror; newest rows are unfiltered ATS listing pages miscategorized as `jrf`
- Mirror (`opportunities_mirror`) is 29 rows on a **legacy schema** (`organization` text, `apply_link`, `stipend`) vs 3,272 on the live schema — `sync-replica` uses legacy columns and is broken by design

### 4. AI Grounding

**Pass — the one part that works as spec'd.** `/api/ai/chat`: live retrieval via `retrieveGrounding` → deterministic no-match fallback (no LLM call) → grounded system prompt → two hard output guards (false "no match" parroting replaced with real listings; URLs sanitized to retrieved records only). Multi-provider gateway (Groq primary) with failure cooldowns.

**Caveats:** `ai/expire` fails **open** when `CRON_SECRET` unset (anyone can mass-expire); `ai/search`, `ai/match`, `ai/summarize`, `ai/classify` are public unauthenticated.

**`saved_jobs` vs `saved_opportunities`:** resolved — only `saved_opportunities` exists. Remaining debt is the *legacy-column family* (`apply_link`/`stipend`/`organization`) in `scrape-opportunities`, `check-links`, `sync-replica`, and the `scraper_sources` vs `scrape_sources` table split.

---

## PART 3: DOCUMENTATION OVERHAUL (delivered)

- `README.md` rewritten → SiliconPath brand, *"Career Intelligence Infrastructure for India's Electronics Ecosystem"*, modular monolith on Next.js & Supabase, core loop **Discover → Match → Verify → Apply**, honest "Current State" with audit numbers, 3-portal table, corrected 3-DB architecture, de-emphasized social. (Old file had broken UTF-8 mojibake — fixed.)
- `ARCHITECTURE.md` rewritten → modular monolith rationale, explicit `(candidate)`/`(employer)`/`(admin)` folder tree with migration rule, data-layer map, data-flow diagram (cron fix marked inline), authN/authZ model, AI grounding rules, **Known Drift register** (8 items, priority-ordered).

---

## PART 4: THE 7-DAY ACTION PLAN

| Day | # | Action | Root cause | Verify |
|---|---|---|---|---|
| 1 | 1 | **Point Vercel cron at the real engine** (`/api/cron/scrape-opportunities` with CRON_SECRET auth → `scrapeAllOpportunities` + RSS; drop `run-all` from `vercel.json`) | Cron drives gated fabricated path; real engine admin-only | Rows appear with next `created_at`; `scrape_runs` success |
| 1 | 2 | **Fail-closed `ai/expire`** (mirror `scrape-opportunities`'s missing-secret 500) | `if (cronSecret && …)` inverted | No secret → 500; with secret → works |
| 2 | 3 | **Verification pipeline v1**: `check-links` cron (live columns) + default `unverified` on inserts; weekly `ai/expire` | "verified" hardcoded at insert | Live `unverified` > 0; admin queue populated |
| 2–3 | 4 | **Org attribution backfill**: map `organization_id` via heuristics + org name matching; fix ATS adapter + RSS byline stripping | 95% orgless; byline misattribution | `organization_id IS NULL` < 10%; "Sadia Munir" gone |
| 3 | 5 | **RBAC in middleware**: role from `app_metadata`; employer paths require `role: employer` | Employer paths check login only | Non-employer gets 401/redirect on `/post-job` |
| 4 | 6 | **Fix legacy-column routes** (`scrape-opportunities`, `check-links`, `sync-replica`) → live columns; schedule `sync-replica` daily | Post-rename drift | `sync-replica` syncs 3,272 rows; links checked correctly |
| 5 | 7 | **Reconcile `scraper_sources` vs `scrape_sources`**; add current/reset migration to repo | Two tables, two owners | Admin "trigger scrape" reflects engine's table |
| 5–6 | 8 | **De-emphasize social**: out of primary nav (keep routes); merge `/chat` into `/ask-ai` | Identity bloat | Nav shows Tier-1 + account links only |
| 6 | 9 | **News/quality sweep**: re-verify news filter (`tktk`, off-niche), dead `/api/alerts` call, `user_id` vs `author_id` notification bug | Audit findings | Spec §12 items live-checked |
| 7 | 10 | **CHANGELOG entries per fix** (rule 7) + re-run this audit's live queries, publish before/after | Doc rot | Audit numbers improve |

**Not in scope (deliberately):** employer marketplace build-out, academy content expansion, standalone-API frontend migration, new scrapers (spec rule 5: foundation first).

---

*Appendix — live verification commands/data (2026-08-16):* Supabase db1 REST counts via service-role (`organization_id=is.null → 3115`, `verification_status=eq.verified → 3269`, `source_type=eq.employer_posted → 0`, newest 5 rows shown above); Neon `opportunities_mirror` via pg (`total 29`, `verification_status` split 19/10, top org "Sadia Munir" 18). Files cited: `frontend/src/middleware.ts`, `frontend/src/app/api/ai/chat/route.ts`, `frontend/src/lib/scrapers/opportunity-scraper-impl.ts`, `frontend/src/lib/scrapers/national-scrapers.ts`, `frontend/src/app/api/scrapers/{utils,run-all/route}.ts`, `frontend/src/app/api/scrape/route.ts`, `vercel.json`, `neon/schema.sql`.
