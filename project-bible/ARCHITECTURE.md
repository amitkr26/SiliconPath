# SiliconPath (BerojgarDegreeWala) — Technical Architecture

**Version:** 2026-08-16 · **Pattern:** Modular Monolith on Next.js & Supabase

---

## 1. Architectural Pattern

A **modular monolith**: one Next.js 14 (App Router) application on Vercel serves all three portals (candidate, employer, admin) from a single deploy, sharing one typed data layer and one auth model. The optional Express API (`backend/server`) mirrors read routes under `/api/v1/*` and is the future home of background workers (scrape/verify) — it is not a second system of record.

This is deliberate: at this scale, microservices would add operational cost and zero user value. When a component genuinely needs isolation (the scrape/verify worker outgrows serverless), it extracts to a worker — not before.

---

## 2. Three-Portal Structure (Target)

Next.js Route Groups keep portal-specific UI in separate trees while sharing `layout.tsx`, middleware, and API routes. **This is the target; the repo currently uses flat routes** (`/admin`, `/employer/*`, root-level candidate pages) and must be migrated segment-by-segment.

```
frontend/src/app/
├── (candidate)/                     # Public + logged-in candidate experience
│   ├── page.tsx                     # Landing (hero, featured, stats)
│   ├── opportunities/
│   │   ├── page.tsx                 # Search/filter grid
│   │   └── [slug]/page.tsx          # Verified detail page
│   ├── news/
│   ├── academy/                     # Tracks → days → checkpoints
│   ├── match/page.tsx               # AI matcher
│   ├── ask-ai/page.tsx              # AI career assistant
│   ├── saved/page.tsx               # Bookmarks (login)
│   ├── applications/page.tsx        # Application tracking (login)
│   ├── profile/
│   ├── resume/                      # Resume builder (login)
│   └── resources/                   # JRF/SRF/PhD/VLSI guides
│
├── (employer)/                      # Employer portal
│   ├── employers/page.tsx           # Directory / landing
│   ├── post-job/page.tsx            # Job posting (role-gated)
│   └── employer/
│       ├── dashboard/page.tsx
│       └── company-claim/page.tsx
│
├── (admin)/                         # Admin command center
│   └── admin/
│       ├── page.tsx                 # Overview + verification queue
│       ├── opportunities/           # verify / reject / edit
│       ├── companies/
│       ├── analytics/
│       ├── scrape-health/
│       └── announcements/
│
├── api/                             # Shared API routes (portal-agnostic)
│   ├── opportunities/  news/  organizations/  search/
│   ├── ai/             # chat, match, classify, summarize, expire, enhance
│   ├── scrapers/       # engine + fabricated-runner (gated)
│   ├── cron/           # scrape, news-sync, check-links, digest, cleanup
│   ├── admin/  employer/  auth/  resume/  applications/  bookmarks/
│   └── community/  feed/  network/  messages/  notifications/
│
└── middleware.ts                     # Auth + RBAC + CSRF + rate-limit + security headers
```

**Migration rule:** move one segment at a time, verify routes/links/redirects, keep URL paths unchanged (`(candidate)` route groups do not alter URLs).

---

## 3. Data Layer

### Databases (3, consolidated from the original 4-database plan)

| DB | Role | Key tables | Access |
| :--- | :--- | :--- | :--- |
| **Supabase db1** (`aqauempuwmbizqoaolop`) | Core transactional | `opportunities`, `news_articles`, `organizations`, `scrape_sources`, `app_config`, `subscribers` | RLS public-read, service role server-side |
| **Supabase db2** (`jbqjipwanfsxyqkfrrpx`) | User & social | `user_profiles`, `saved_opportunities`, `applications`, `feed_posts`, `conversations`, `messages`, `notifications`, `company_pages`, `learning_*` | RLS owner-scoped |
| **Neon** (1 instance) | Analytics & mirrors | `page_views`, `click_events`, `search_queries`, `opportunities_mirror`, `news_mirror`, `trending_cache`, `keyword_stats` | Service access via `NEON_1_DATABASE_URL` |

`frontend/src/lib/db/index.ts` exports the purpose router (`db1`, `db2`, `neon1`) plus `neonPrimary`/`neonSecondary` aliases. DB1 → DB2 profile sync via `syncProfile`.

### The `opportunities` table (source of truth)

Structured, not raw HTML: `organization_id` (FK → `organizations`), `category` (CHECK: `jrf|srf|phd|government|fellowship|internship|industry`), `location`, `salary_range`, `deadline` (date), `eligibility`, `description`, `apply_url`, `source_url`, `source_type` (`scraped|employer_posted`), `verification_status` (`verified|unverified|expired`), `slug`, `tags`.

Legacy names that must NOT be used in new code: `apply_link`, `stipend`, `organization` (text). See Known Drift below.

---

## 4. Data Flow

```
                    ┌────────────────────────────────────────────────┐
                    │            VERCEL CRON (daily)                 │
                    │  /api/cron/scrape-opportunities (REAL engine)  │ ← FIX THIS (currently /api/scrapers/run-all = no-op)
                    └──────────────────────┬─────────────────────────┘
                                           ▼
        ISRO/DRDO/CSIR/PSU/academic ──┐  scrape_sources (ATS config)
        Greenhouse/Lever/Workday ──────┼──► opportunity-scraper-impl.ts
        RSS feeds ─────────────────────┘      │  normalize + dedupe (source_url)
                                              ▼
                                   organizations (resolve-or-create)
                                              ▼
                                    opportunities (db1)
                                              │   verification pipeline:
                                              ├─► link check (check-links cron)
                                              ├─► deep scrape enrichment
                                              ├─► AI summary / expiry (ai/expire)
                                              ▼
                                   sync-replica (db1 → Neon mirror)
                                              ▼
                               public browse (db1, ISR-revalidated)
```

---

## 5. AuthN / AuthZ

- **Authentication:** Supabase Auth (email/password + Google OAuth). Session validated in `frontend/src/middleware.ts` via `supabase.auth.getUser()` and refreshed cookie handling.
- **Authorization — target model:**
  - `middleware.ts` enforces **login** for gated paths AND **role** for portal paths (role from `app_metadata.role`: `candidate | employer | admin`).
  - Route groups are cosmetic; middleware is the enforcement boundary. **Today the employer check is login-only — role enforcement is a gap (see Known Drift).**
- **Admin:** separate HMAC session (`/api/admin/auth` → signed token, 24h expiry, constant-time `ADMIN_PASSWORD` compare). All `/api/admin/*` routes call `requireAdmin`/`verifyAdmin`.
- **Cron:** `requireCronOrAdmin` (CRON_SECRET bearer). One exception noted in Known Drift (`ai/expire`).
- Cross-cutting: CSRF guard for mutations (origin allow-list), per-route rate limiting, CSP + security headers in middleware.

---

## 6. AI Layer

- `@berojgardegreewala/ai-gateway` (workspace package): 9-provider fallback chain — Groq primary, then Gemini/OpenRouter/NVIDIA NIM/Cloudflare/HuggingFace/Bedrock — with per-provider failure cooldowns.
- **Grounding (non-negotiable):** `/api/ai/chat` retrieves matching records from the live `opportunities` + `news_articles` tables (`retrieveGrounding`), builds a grounded system prompt, and deterministically guards the answer (no invented deadlines, no URLs outside retrieved records, no-fallback when the DB has no matches). Never bypass grounding for user-facing career answers.
- `ai/expire` / `ai/classify` / `ai/match` / `ai/summarize` / `ai/enhance` sit on the same gateway. AI calls log to Neon `ai_usage_log` (fire-and-forget).

---

## 7. Known Drift (audit, 2026-08-16 — fix in priority order)

1. **Scrape cron is a no-op.** `vercel.json` → `/api/scrapers/run-all` runs fabricated (hand-written) scrapers gated by `SCRAPER_ALLOW_FABRICATED=true`; returns `[]` in production. Real engine (`scrapeAllOpportunities`) is admin-only. → Point cron at the real pipeline with `CRON_SECRET`.
2. **`verification_status` is a static "verified".** No verification pipeline has run; 100% of rows are "verified". → Make verification earned: link-check → deep-scrape → expiry; default `unverified`.
3. **95% orgless rows.** `organization_id IS NULL` on 3,115/3,272. Person-name orgs (e.g. "Sadia Munir") still present in mirror. → Backfill + source-level fix.
4. **RBAC gap.** Employer paths check login only. → Role enforcement in middleware.
5. **Legacy-column routes.** `scrape-opportunities`, `check-links`, `sync-replica` reference `apply_link`/`stipend`/`organization`; break against live schema. Mirror is stale (29 rows vs 3,272).
6. **Schema drift.** Repo migrations ≠ live schema; `scraper_sources` (admin UI) vs `scrape_sources` (engine) split.
7. **Fail-open auth.** `ai/expire` passes when `CRON_SECRET` unset — must fail closed like `scrape-opportunities`.
8. **4-DB docs.** README/specs still describe 2 Supabase + 2 Neon; live is 2 Supabase + 1 Neon.

---

## 8. Quality Gates

- Every non-trivial change: one runnable check; live re-verification before claiming "done" (spec rule).
- No fabricated/demo data in production; `SCRAPER_ALLOW_FABRICATED` is dev-only.
- Secret hygiene: credential scan before any push; rotate anything that touched chat/docs/history.
- Foundation fixes before new features (spec rule 5).
