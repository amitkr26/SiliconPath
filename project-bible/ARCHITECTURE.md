# BerojgarDegreeWala — Technical Architecture

**Version:** 2026-09-19 (BDW AI + Security Hardening + DB1 Remediation / RLS Lockdown) · **Pattern:** Modular Monolith on Next.js & Supabase + Dedicated Employer Suite & Independent Backend Replication

---

## 1. Architectural Overview

BerojgarDegreeWala operates as a **modular monolith** on Next.js 14 (App Router) deployed to Vercel, backed by a Supabase PostgreSQL database and Neon analytics database.

The application serves four discrete, authoritative user experiences from a single codebase and authentication system:
1. **Public Portal**: Deep-tech intelligence, news, opportunities, organizations, and search.
2. **Candidate Portal**: Career management, applications, saved jobs, networking, messaging, and profile.
3. **Employer / Recruiter Suite**: Full recruitment cockpit, job posting studio, multi-stage ATS pipeline, talent sourcing, recruiter messaging, company branding, team seats, settings, and analytics.
4. **Admin Console**: Opportunity verification, scraping fleet health, announcements, and platform performance.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                   Next.js 14 Modular Monolith (Vercel)                   │
├───────────────────┬────────────────────┬────────────────┬────────────────┤
│   PUBLIC PORTAL   │  CANDIDATE PORTAL  │ EMPLOYER SUITE │  ADMIN CONSOLE │
│  (Navbar + Hero)  │ (Candidate Shell)  │(Employer Shell)│ (Admin Shell)  │
├───────────────────┴────────────────────┴────────────────┴────────────────┤
│       Universal Auth Guard (Cookie Session + Authorization Bearer JWT)   │
├──────────────────────────────────────────────────────────────────────────┤
│                  API Route Handlers (frontend/src/app/api/*)             │
│            • Public Reads  • Candidate Actions  • Employer Endpoints     │
└─────────────────────────────────────┬────────────────────────────────────┘
                                      │
        ┌─────────────────────────────┼────────────────────┐
        ▼                             ▼                    ▼
  Supabase PostgreSQL (Unified)              Neon DB1 (Analytics)
  • opportunities + user_profiles            • click_events
  • organizations + connections              • page_views
  • news_articles + feed_posts               • search_queries
  • applications + messages                  • trending_cache
  • notifications + community_posts          • keyword_stats
  • ai_usage_log + skill_endorsements
  • scrape_sources + company_claims
  • user_roles + user_permissions            (RLS-locked internal surface:
  • audit_logs + opportunity_verifications    app_config, workloads, audit,
  • announcements + employer_settings         roles — anon exposure = 0)
```

---

## 2. Four Discrete Platform Surfaces

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Surface             Layout Shell            Key Pages                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│ 1. Public Portal    Navbar + Footer         /, /opportunities, /news, /ask-ai,  │
│                                             /organizations, /resources, /search │
│ 2. Candidate Portal Candidate Layout        /dashboard, /applications, /saved,  │
│                                             /network, /messages, /profile,      │
│                                             /resume, /notifications             │
│ 3. Employer Suite   EmployerSuiteShell      /employer/dashboard, /employer/jobs,│
│                     + EmployerNav           /employer/post-job, /employer/talent│
│                                             /employer/applicants, /employer/team│
│                                             /employer/settings, /employer/stats │
│ 4. Admin Console    Admin Dashboard Shell   /admin, /admin/scrape-health,       │
│                                             /admin/companies, /admin/performance│
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Design System & Visual Language Architecture

The visual presentation model is engineered for high information density, rapid scanning, and institutional credibility:

### Design Tokens (`frontend/src/styles/design-tokens.ts`, `globals.css`)
- **Color Palette**:
  - **Canvas / Neutral**: `#F8FAFC` (Slate 50) page background, `#FFFFFF` card surfaces, `#0F172A` (Slate 900) primary text, `#475569` (Slate 600) secondary text, `#94A3B8` (Slate 400) muted labels.
  - **Primary Brand / Precision Blue**: `#2563EB` (Blue 600) for primary actions, `#1D4ED8` (Blue 700) for active/hover states, `#EFF6FF` (Blue 50) for subtle selections.
  - **Semantic Accents**: Verified Emerald (`#059669`), Deadline Amber (`#D97706`), Destructive Rose (`#E11D48`), Informational Cyan (`#0891B2`).
- **Typography**: Inter / system font stack with strict typographic hierarchy (`text-xs` badges, `text-sm` metadata/descriptions, `text-base` body, `text-lg` card headers, `text-2xl` section titles, `text-4xl` page hero).
- **Elevation & Geometry**:
  - Crisp 1px borders (`#E2E8F0` / `#CBD5E1`) replacing legacy 2px neo-brutalist borders.
  - Micro-elevations (`shadow-xs`: `0 1px 2px 0 rgba(0,0,0,0.05)`, `shadow-sm`: `0 1px 3px 0 rgba(0,0,0,0.08)`, `shadow-md`: `0 4px 6px -1px rgba(0,0,0,0.07)`) replacing legacy 4px hard offset drop-shadows.
  - Geometric corner radii (`rounded-md` 6px, `rounded-lg` 8px, `rounded-xl` 12px) replacing pill buttons and pill cards.

---

## 4. Database Architecture

The live database infrastructure uses a dual-Supabase + Neon architecture:

### DB1 — Supabase (Consolidated Platform & User Data)
- **Provider**: Supabase Project 1 (`aqauempuwmbizqoaolop`)
- **Role**: Production authoritative database hosting core platform, opportunities, organizations, news, admin logs, user profiles, social features, applications, and workspace settings.
- **Key Tables**: `opportunities` (+ quality columns `quality_score`, `last_verified_at`, `verification_source`, `audit_notes`), `organizations`, `news_articles`, `user_profiles`, `applications`, `saved_opportunities`, `feed_posts`, `company_claims`, `recruiter_saved_candidates`, `employer_settings`, `workspace_members`, `ai_usage_log`, `scrape_sources`, `scrape_runs`, and the RBAC/lifecycle surface created 2026-09-18: `announcements`, `opportunity_verifications`, `user_roles`, `user_permissions`, `audit_logs`.
- **Migration ledger**: `supabase_migrations.schema_migrations` = **13 records**, all applied to production (`created_by = 'supabase_mgmt_api'`). Schema changes are applied via the Supabase **Management API** (`POST /v1/projects/{ref}/database/query` with `SUPABASE_MGMT_TOKEN`), never re-run ad hoc.

### DB2 — Supabase (Legacy Split Architecture)
- **Provider**: Supabase Project 2 (`jbqjipwanfsxyqkfrrpx` — optional / legacy)
- **Role**: In current runtime, `frontend/src/lib/supabase-db2.ts` automatically falls back to DB1 when `NEXT_PUBLIC_SUPABASE_DB2_URL` is unset, operating as a unified single-database instance.

### Neon DB1 — Analytics & Cache
- **Provider**: Neon PostgreSQL
- **Role**: Analytics, click tracking, trending cache
- **Key Tables**: `page_views`, `search_queries`, `click_events`, `trending_cache`, `keyword_stats`

---

## 4b. Scheduled Pipeline & Scrape Telemetry

- **Schedulers (Vercel cron, `frontend/vercel.json`)**: `/api/cron/scrape-opportunities` (00:00 IST), `/api/cron/check-links` (08:00), `/api/news/sync` (06:00) — these are the **only** scheduled runners in the fleet. The Render worker (`render.yaml`) is deliberately **not** scheduled.
- **News ingestion fleet**:
  - Frontend RSS pipeline (`frontend/src/lib/scrapers/rss-parser.ts`): **10 live feeds** — IEEE Spectrum, Semiconductor Engineering, EE Times, Electronics Weekly, SemiWiki, Electronics For You, Power Electronics News, Science Daily — Electronics (`matter_energy/electronics.xml`, verified live), Phys.org — Engineering, Scholarship Roar.
  - Backend replica (`backend/api/src/content/news-sync.ts`): **8 live feeds** (subset above minus the dead ones). Dead feeds were removed from config 2026-09-18 (Chip Design Magazine, The Electronics Media, The Register — Hardware, Science Daily's dead `computers_math/semiconductors.xml`), never hard-deleted — they persist as `is_active=false` rows in `scrape_sources`.
  - Dead feed handling: 404/DNS/parse failures accumulate `consecutive_failures` (threshold 5 → admin deactivation).
- **Health telemetry write-path**: `/api/news/sync` persists per-source accepted counts, increments `total_runs`/`total_results`, resets `last_scrape_at`/`last_success_at`, and inserts a `scrape_runs` row on every run. The worker (`run-news-sync.ts`, `run-isro-scrape.ts`) mirrors this and preserves admin-set `is_active` state. `opportunity-scraper-impl.ts` `updateSourceHealth` increments counters with `maybeSingle` (clean no-op when no DB row exists).
- **Data quality (2026-09-18)**: `20260918000003_dedup_zombie_opportunities.sql` deleted **2,941** inactive/rejected/expired unreferenced rows (`opportunities` 4,849 → 1,908; ≈1,009 active verified live). Workday ATS board URLs represent many DISTINCT jobs (not deletable by URL); 5 provable per-job duplicates deactivated (reversible), **84 ambiguous groups** flagged in `project-bible/DUPLICATE_REVIEW_2026-09-18.csv` for human admin review.

---

## 5. Security, Dual Auth & IDOR Protection

1. **Dual Authentication & Authoritative RBAC (`frontend/src/lib/employer-auth.ts`, `backend/api/src/auth/index.ts`)**:
   - Accepts both browser session cookies (`sb-...-auth-token`) and programmatic Bearer tokens (`Authorization: Bearer <jwt>`).
   - Validates roles against server-managed `app_metadata.role` (or DB tables), explicitly ignoring client-writable `user_metadata.role` for administrative privilege decisions (`AUTH-01`).
   - Admin access is validated via `verifyAdmin` (constant-time password hash / HMAC token verification) or authoritative `isUserAdmin(user)`.
2. **Server-Side Middleware Boundary (`frontend/src/middleware.ts`)**:
   - Strictly intercepts all `/employer/*` and `/api/employer/*` routes, returning 403 Forbidden for non-employer roles and 401 for anonymous traffic.
3. **Multi-Employer IDOR Shield & Fail-Closed Gates**:
   - Every mutation and review endpoint verifies that the authenticated user owns the referenced opportunity (`created_by === user.id || employer_id === user.id` or `role === 'admin'`).
   - Any resource where `created_by` or ownership is `null` (e.g. scraped jobs or system entries) strictly fails closed (`if (!owner || owner !== user.id) return 403;`), preventing unauthorized modification or deletion by other employers.
   - Cross-employer and cross-tenant access attempts return HTTP 403 Forbidden.
   - Message endpoints (`/api/messages`) enforce participant validation (`participant_a === user.id || participant_b === user.id`), preventing arbitrary cross-user message injection into foreign conversation IDs.
   - Company claim lifecycle (`/api/employer/claim`): Admin approval transitions claims to `approved`, securely links `claimed_by` in `company_pages`, grants verified status, and alerts the applicant via real-time system notification.
4. **RBAC Middleware**:
   - Role-based access control with three roles: `candidate`, `employer`, `admin`.
   - Capability-based progressive permissions model.
   - Middleware enforces role checks at route boundaries.
5. **Row-Level Security (RLS) Lockdown — 2026-09-18/19**:
   - All internal tables are locked for anonymous access, verified empirically with anonymous `HEAD` probes + `Prefer: count=exact` (Content-Range `*/0` rows): `app_config` (held the Greenhouse ATS token — rotate), `ai_usage_log`, `suggestions`, `employer_settings`, `scrape_runs`, `scrape_sources`, `audit_logs`, `user_roles`, `user_permissions`, `opportunity_verifications`, `applications`, `company_claims`, `recruiter_saved_candidates`, `workspace_members`.
   - Technical nuance: the toxic policies were declared `TO PUBLIC` (Postgres pseudo-role), so policy cleanup must use named `DROP POLICY IF EXISTS` (role-LIKE scans miss them).
   - **Public-by-design surfaces only**: `opportunities` (≈1,009 active), `organizations`, `user_profiles`, `news_articles`, `feed_posts`/`comments`/`likes`, `company_pages`, `candidate_*`, `user_follows`, `skill_endorsements`, `announcements` (explicit public-read policy).
   - Treat any re-exposure as a zero-tolerance regression: verify after every migration/policy change.
6. **Security Response Headers**:
   - `X-Frame-Options: DENY`
   - `X-Content-Type-Options: nosniff`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Content-Security-Policy: default-src 'self' ...; report-uri /api/csp-report`
   - `Strict-Transport-Security: max-age=31536000; includeSubDomains`

---

## 6. Production Image & Media Architecture

1. **Information-Dense Discipline**:
   - BDW avoids decorative visual noise, large stock images, or AI-generated blobs.
   - Opportunity cards remain strictly data-driven with compact logo or deterministic monogram.
2. **Universal Fallback Hierarchy**:
   - Tier 1: Real verified image (rendered via Next.js `Image` with safe remote host patterns).
   - Tier 2: Official verified logo or avatar hosted on first-party Supabase Storage CDN (`organization-logos` bucket).
   - Tier 3: Deterministic monogram (`getDeterministicInitials`, `getDeterministicPalette`) derived from name hash modulo 8 palette.
   - Tier 4: Designed editorial fallback banner with newspaper icon, source tag, category, and date.
3. **Storage & Media Security**:
   - **Public Storage Bucket (`organization-logos`)**: Hosted on production Supabase (`aqauempuwmbizqoaolop`), public read, 2MB size limit, MIME-restricted to `image/png`, `image/jpeg`, `image/webp`, `image/svg+xml`. Permanent CDN path: `/storage/v1/object/public/organization-logos/${slug}.png`.
   - **Logo Backfill Pipeline (`scripts/backfill-org-logos.mjs`)**: Verified vector/PNG assets sourced from official institutional archives and Wikimedia Commons (via descriptive User-Agent and Special:FilePath 300px thumbnails), uploaded to Supabase Storage, updating `organizations.logo_url` without touching administrative `is_verified` flags.
   - **News Media RSS Pipeline (`frontend/src/lib/scrapers/rss-parser.ts`)**: Configured with `customFields` extracting XML namespaces (`media:content`, `media:thumbnail`, `enclosure`, and embedded HTML `<img>` in `content:encoded`). Ingestion sync persists `image_url` to Postgres `news_articles`.
   - **Remote Patterns & CSP**: `next.config.mjs` and `frontend/src/middleware.ts` strictly allow trusted origins (Supabase CDN, GitHub avatars, Google user content, LinkedIn media, `*.gov.in`/`*.res.in`/`*.ac.in`, `api.dicebear.com`, and certified news publishers: `images.eetimes.com`, `spectrum.ieee.org`, `powerelectronicsnews.com`, `sciencedaily.com`, `semiwiki.com`, `phys.org`, `theregister.com`). Wildcards (`**`) are prohibited.
   - **Magic Byte Validation**: Upload routes (`/api/profile/avatar`, `/api/employer/company/logo`) check binary headers for JPEG (`0xFFD8FF`), PNG (`0x89504E47`), and WebP (`RIFF...WEBP`). Disguised SVG, HTML, and executables are rejected with HTTP 400.
   - **Size limit**: Capped at 2MB per image.
   - **Decoupling of Logo Upload from Verification**: User and employer logo uploads update visual branding only; `is_verified` remains strictly an administrative trust decision.
4. **OpenGraph & SEO**:
   - Edge routes (`/api/og`, `/api/og/opportunity/[slug]`) dynamically render self-contained PNG cards with official BerojgarDegreeWala branding.

---

## 7. Search Architecture, Technical SEO, AEO & GEO Engine

1. **Canonical Resolution & Inheritance Protection**:
   - `frontend/src/app/layout.tsx` defines `metadataBase` (`https://berojgardegreewala.vercel.app`) but omits root canonical URLs to prevent accidental propagation across child routes in Next.js App Router.
   - Every public indexable route declares its own canonical URL (`alternates: { canonical: ... }`).
   - Legacy routes (`/companies`, `/companies/[slug]`) emit canonical tags pointing to their canonical counterparts (`/organizations`, `/organizations/[slug]`) and are flagged `noindex, follow`.

2. **Crawlability & Indexation Control**:
   - `robots.ts` implements strict disallow boundaries: `/admin`, `/api/`, `/dashboard`, `/saved`, `/applications`, `/messages`, `/network`, `/feed`, `/employer`, `/search`, `/onboarding`, `/notifications`, `/post-job`.
   - `sitemap.ts` generates dynamic, validated XML entries for:
     - Core discovery hubs (home, `/opportunities`, `/news`, `/organizations`, `/categories`, `/about`, `/resources`, `/contact`, `/ask-ai`)
     - Category hubs (`/category/[category]`: `jrf`, `srf`, `phd`, `govt-job`, `fellowship`, `private`, `international`)
     - Geo-targeted semiconductor clusters (`/opportunities/location/[city]`: Bengaluru, Hyderabad, Noida, Pune, Chennai, Ahmedabad)
     - Active, verified, currently available opportunities (`/opportunities/[slug]`)
     - Organizations with verified database profiles (`/organizations/[slug]`)
     - Legitimate news briefings (`/news/[slug]`)
   - Excluded from sitemap: faceted search (`/search`), authentication (`/login`, `/signup`), legacy duplicates (`/companies`), and redirects (`/match`).

3. **Structured Data / Schema.org Graph Architecture**:
   - **JobPosting vs EducationalOccupationalProgram**: Validates employment intent per Google Search Central policies. Real employment, internships, and research staff roles (JRF/SRF) emit `JobPosting` with validated ISO 8601 deadlines (`validThrough`), numeric `MonetaryAmount` parsing (`unitText: "MONTH"` or `"YEAR"`), `applicantLocationRequirements` for India, and `directApply: true`. Non-numeric stipends cleanly omit salary schema to avoid GSC syntax errors. Academic degree programs, PhD admissions, and scholarships emit `EducationalOccupationalProgram` to prevent Google Jobs policy violations and rich result penalties.
   - **NewsArticle**: Author attribution to original publisher, publisher metadata, headline, publication timestamps, and canonical page reference.
   - **Organization**: Official legal entity metadata without hallucinated headcount. Zero-opening state returns HTTP 200 with directory navigation to prevent soft-404 crawl errors.
   - **FAQPage**: Direct question-answer matching between semantic HTML and JSON-LD schema on homepage, `/about`, and research resource guides.
   - **ItemList & BreadcrumbList**: Hierarchical navigational trail across all directory, category, location, and article pages. Individual opportunity pages link directly to employer organization profiles (`/organizations/${org_slug}`) and include semantic breadcrumbs.

4. **Answer Engine Optimization (AEO) & GEO Graphs**:
   - Plain semantic HTML answers for high-value user queries (DST stipend rules: ₹37,000/month JRF, ₹42,000/month SRF; DRDO/ISRO GATE/NET eligibility; direct official application portal links).
   - Reinforced dual knowledge graph:
     - Entity Graph A: Organization → Opportunity → Attributes (Stipend, Deadline, Location, Eligibility) → Official Circular
     - Entity Graph B: Publisher → NewsArticle → Technical Topic → Publication Date → Original Source URL

5. **Search Demand Taxonomy & Programmatic Quality Gate (Phase 2 Strategy)**:
   - **Dual-Pillar Strategy**: Dominates academic/government fellowships (2,834 JRF listings with DST stipend rules) and specialized chip design careers (497 industry roles: 145 Verification, 138 Physical Design, 87 RTL, 51 DFT, 42 Embedded).
   - **Role Hub Architecture (`/opportunities/role/[role]`)**: Dedicated canonical collections planned for the 6 core disciplines with static generation, `ItemList` schema, and semantic breadcrumbs.
   - **Programmatic Quality Gate**: Any programmatic page combination (Role × Location, Category × Location) must require &ge; 3 active verified opportunities to be indexed; combinations with < 3 listings fail closed with `noindex, follow` to prevent doorway-page / thin-content penalties.
   - **Negative Keyword Boundaries**: Explicitly excludes generic IT/software terms ("Python developer", "web developer") and broad non-technical Sarkari terms ("railway jobs", "bank PO") to maintain 100% domain authority in deep-tech hardware.

---

## 8. BDW AI Career Intelligence Engine

### 8.1 Architecture

```
User Query → Intent Detection (7 domains) → RAG Retrieval (opportunities, orgs, news, resources)
→ System Prompt Build (RETRIEVED_DATA + hard rules) → AI Model (BDW/Groq/Gemini)
→ Tool Loop (max 2 rounds, 7 tools) → Response + Citations
```

### 8.2 Key Components

- **BDW Provider** (`backend/ai-gateway/src/providers/bdw.ts`): OpenAI-compatible HTTP client with cooldown and health-check
- **RAG System** (`frontend/src/lib/ai/bdw-rag.ts`): Domain intent detection, structured search extraction, multi-entity retrieval, system prompt builder
- **AI Tools** (`frontend/src/lib/ai/bdw-tools.ts` + `bdw-tools-exec.ts`): 7 tools with server-only execution
- **Chat Route** (`frontend/src/app/api/ai/chat/route.ts`): RAG + tool loop with legacy fallback

### 8.3 Security Controls

- Tool execution server-only (`bdw-tools-exec.ts` never imported into client)
- Auth required on `/api/ai/bdw-tools` (Supabase JWT)
- Input capped at 4000 chars via `sanitizeUserMessage()`
- ILIKE wildcards escaped via `escapeILIKE()`
- Prompt injection defense via `<user_query>` delimiters
- Tool context overflow cap (4000 chars per round)
- Balanced-brace JSON parser for tool call extraction

---

## 9. Verification Baseline

- **TypeScript Type Safety**: `npm run typecheck` (0 errors across all 5 monorepo workspaces)
- **Unit & Integration Tests**: Frontend 34 suites / 361 tests (incl. 31 security regression + 55 SEO tests); Worker 31/31; Backend API 8 suites / 100; AI Gateway 19/19 — all PASS (verified 2026-09-19)
- **Production Build**: `npm run build` (338+ routes compiled)
- **Security**: Fail-closed IDOR, prompt injection defense, SQL ILIKE escaping, auth on AI tool endpoints, CSP headers
- **Database**: DB1 RLS exposure = 0 (anonymous probes show `*/0` on all internal tables); migration ledger = 13 applied records; zombies deduped (4,849 → 1,908)

