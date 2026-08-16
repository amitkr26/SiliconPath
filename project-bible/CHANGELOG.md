# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased] - clean/main branch

### Added
- **2026-08-16 — Phase 1 foundation (P0.1–P0.4 partial): real scrape cron, fail-closed guards, verification v1, analytics repoint.** (a) Cron → real engine: `frontend/src/lib/scrapers/run-opportunity-scrape.ts` extracted from `/api/scrape` (real `scrapeAllOpportunities()` + RSS path, writes `scrape_runs`), new `/api/cron/scrape-opportunities` (`requireCronOrAdmin`, fail-closed); `vercel.json` cron 00:00 repointed and 08:00 `/api/cron/check-links` added; `admin/page.tsx` "run all" button repointed. (b) Fail-closed guards: `api/ai/expire` + `api/send-digest` now `requireCron` (removed inverted secret checks). (c) Verification v1 (P0.2): new inserts default `verification_status='unverified'`; `opportunity_verifications` evidence-ledger migration authored (`20260816000001_opportunity_verifications.sql`) — **DDL pending owner application on Supabase db1** (no postgres URL available to agent); `cron/check-links` + `admin/recheck-link` write evidence rows and never auto-promote reachable→`verified`; legacy duplicate `api/check-links` deleted. (d) Analytics repointed to live tables (P0.6/16): `ai_usage_log` → Supabase db1 (`lib/ai/providers.ts` + `analytics/ai-usage` + `analytics/platform`), `platform_analytics` → Neon `click_events` (`analytics/platform`, `admin/analytics`, `admin/performance`), `scrape_logs` → `scrape_runs`. (e) Legacy-column readers fixed via shared `mapDbOpportunityToClient` (`opportunities-feed`, `calendar-export`, `sync-replica`) or column repoint (`admin/recheck-link`); dead duplicates `api/scrape-jobs` + `api/scrape-opportunities` deleted. Build passes; 79 jest tests pass.

- **2026-08-16 — Implementation map (master audit deliverable).** Full code-level audit executed: 4 parallel agent audits (frontend routes/components/auth, API routes/auth guards/legacy fields, database schema/migrations/RLS, 21-feature-system status matrix) + live MCP verification. Delivered as `docs/audit-reports/2026-08-16-implementation-map.md`: verdict (not a rebuild — ~60-70% reusable), P0 defect register (cron → fabricated path, fake verification, org resolution, schema drift, RBAC, fail-open guards, IDOR, mass-assignment), schema drift register (migration files vs live, incl. live-verified: `post_reactions` + `scrape_sources` exist live / `scraper_sources` + `platform_analytics` + Neon `ai_usage_log` do not), live topology discovery (social tables consolidated in Supabase db1; Neon1 holds cache tables), 12-phase file-level plan, route-group migration, decision points for owner, verification protocol. No code modified during audit (per mandate).

- **2026-08-16 — State of the Union audit + documentation overhaul.** Full audit (strategy, codebase reality check with **live database verification**, completion score, 7-day remediation plan) delivered as `docs/audit-reports/2026-08-16-state-of-the-union.md`. Root `README.md` rewritten to the SiliconPath vision ("Career Intelligence Infrastructure for India's Electronics Ecosystem", modular monolith, Discover → Match → Verify → Apply loop, honest current-state section). `ARCHITECTURE.md` rewritten with the 3-portal `(candidate)`/`(employer)`/`(admin)` target folder structure, data-flow diagram, and Known Drift register.
- **2026-08-16 — Documentation restructure.** All documentation centralized: `ARCHITECTURE.md`, `CHANGELOG.md`, `SECURITY.md` (→ `13-security/`), `TESTING.md` (→ `15-testing/`), `CONTENT_UPGRADE_PLAN.md` (→ `23-reference/`), `deploy-stack.txt` (→ `14-devops/`) moved into `project-bible/`. All audit reports moved `project-bible/reports/` → `docs/audit-reports/`. Root duplicates deleted (`trusted_sources_v2/v3.json`, `siliconpath-expanded-global-source-list-v4.md` — copies already tracked in `project-bible/23-reference/`). `PROJECT_BIBLE.md` and `PROJECT_KNOWLEDGE_PACK.md` removed (superseded by the `project-bible/` folder + `MASTER_INDEX.md`). `github-recovery-codes.txt` now gitignored.
- **2026-08-16 — MCP servers wired and verified.** Neon, Supabase, Vercel local MCP servers in `.opencode/mcp-servers/` + `gitmcp` remote server — all live-tested (handshake + real tool calls). Stale credentials in `siliconpath-credentials.txt`/`frontend/.env.local` corrected against live APIs (Neon connection strings rotated, Supabase project-1 key restored to its real legacy service-role JWT, Vercel token replaced).

- **2026-08-14 — Applications unique constraint + saved_opportunities FK (Part 2 fixes).** Added `UNIQUE(user_id, opportunity_id)` constraint to `applications` table (eliminates race condition in check-then-insert). Added foreign key `saved_opportunities.opportunity_id REFERENCES opportunities(id)` enabling PostgREST join — removes need for API fallback path. Migration: `20260814000001_applications_unique_fk.sql`.
- **2026-08-14 — Network suggestions test-account filter.** `isTestAccount()` in `/api/network/suggestions` now checks both `username` and `display_name` for username-like patterns (`test`, `qa`, `probe`, `api-test`, `hiring lead`, etc.) and boilerplate bios ("Microelectronics & semiconductor specialist."). Filters 4 known QA seed accounts from production suggestions. Verified live: only genuine profiles appear.
- **2026-08-14 — Documentation overhaul.** README rewritten with current 4-DB architecture, complete env var tables (frontend + standalone API), feature set (network, messages, bookmarks, applications, AI RAG, admin), setup steps. CHANGELOG updated with dated entries. SECURITY.md created with credential rotation history and secret management policy. `frontend/.env.example` created matching all 30+ env vars actually read by code.
- **2026-08-12 — News slug migration + regression test.** `news_articles` had no `slug` column, so `/api/news/[slug]` 404'd for every article, the detail page could not load real articles, news sync upserts silently failed, and news disappeared from `/sitemap.xml`. Migration `20260812000001_news_slug_column.sql` adds the column, backfills deterministic slugs from `title`, and indexes them (applied to the live project). Added `news-slug.test.ts` (3 tests) pinning the API contract. Verified live: API returns the stored record, detail page renders the stored title, sitemap now emits all 33 news URLs.
- **2026-08-12 — Live data QA cleanup.** Removed test subscriber `qa-audit-test@example.com` from `subscribers` (1 remaining genuine subscription). DB ground truth: 3,269 active opportunities, 33 news articles, 4 categories (jrf 942 / government 29 / fellowship 27 / internship 2).
- **2026-08-10 — Standalone Express REST API (`backend/server` workspace).** New `@berojgardegreewala/server` package mirroring the Next.js internal API: `GET /health`, `/api/v1/opportunities` (pagination + filters, slug/UUID lookup), `/api/v1/profiles/:username` (new indexed username lookup) + `/me`, `/api/v1/organizations`, `/api/v1/news`, `/api/v1/applications` + `/api/v1/saved-opportunities` (user-scoped via Bearer tokens), `POST /api/v1/ai/insights` (wraps `@berojgardegreewala/ai-gateway`), `GET /api/v1/admin/stats` (constant-time `X-Admin-Password`). Reuses `@berojgardegreewala/api` zod validation + error hierarchy. Added to root npm workspaces; `npm ci && npm run build --workspace @berojgardegreewala/server` builds it.
- **2026-08-10 — Server test suite (16 tests).** node:test + select-aware fake Supabase client in `backend/server/tests` — run with `npm test --workspace @berojgardegreewala/server`; no credentials required.
- **2026-08-10 — Deployment artifacts.** Root-context multi-stage Dockerfile (`backend/server/Dockerfile`) + `deploy-stack.txt` (Render/Docker steps, env var table, verification curls) + `backend/server/.env.example`.
- **2026-08-10 — README migration map.** Mirrored routes marked DONE with route→file mapping; remaining ~120 Next.js routes queued IN PROGRESS in priority order (social layer, academy, full AI surface, admin, employer/companies, resume/search, scrapers & cron, misc).

### Fixed
- **2026-08-14 — AI grounding context selection bug.** `lib/ai/grounding.ts` was selecting wrong context chunks (off-by-one in similarity threshold). Fixed threshold and added `grounding.test.ts` (7 tests) pinning retrieval behavior.
- **2026-08-14 — Profile fabricated-content fix.** Profile editor was allowing fabricated bios/headlines to persist. Added server-side validation in `api/profile/[userId]/route.ts` + client-side guards in `ProfileEditor.tsx`.
- **2026-08-14 — Security header additions.** `middleware.ts` now sets `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` on all responses. Verified via `security-scan.yml` workflow.
- **2026-08-14 — Neon/Supabase credential rotations.** All 4 database credentials rotated post-git-history-rewrite. Vercel env vars updated. MCP server configs (`.opencode/mcp-servers/*`) now read from `siliconpath-credentials.txt` + `frontend/.env.local` only.
- **2026-08-14 — Search/OG image/contact form fixes.** `/api/search` now returns consistent shape with `results` array. OG image generation (`/api/og/opportunity/[slug]`) handles missing images gracefully. Contact form (`/api/contact`) validates honeypot + rate limits via Upstash.
- **2026-08-14 — Table-name mismatches resolved.** Codebase standardized on `saved_opportunities` (not `saved_jobs`/`bookmarks`), `connection_requests` → `connections` (v2 schema with `requester_id/addressee_id/status`), `conversations`/`messages` (v2 schema with `participant_a/participant_b`). All API routes updated.

### Security
- **2026-08-07 — Git history force-rewritten to purge secrets.** Hardcoded Supabase service keys, a Vercel token, and Neon DB passwords that were committed in `frontend/scripts/*`, `frontend/src/lib/db/multi-db.ts`, and `test-db.js` were removed from the repository AND rewritten out of all git history (`git filter-branch` + force-push; remote `main` rewritten, old HEAD was `078c59a`). **Collaborators must `git fetch origin && git reset --hard origin/main` (or re-clone) — do NOT `git pull`** — the shared history has been rewritten. Keys were rotated on Supabase/Neon; Vercel env vars updated.
- Deleted all QA scripts with hardcoded credentials (19 files + `multi-db.ts` + `test_neon.js`). Secrets must only come from environment variables.

### Removed
- `docs/10-api-specification.md` (duplicate of `10-api-spec.md`)
- `docs/13-environment.md` (duplicate of `13-environment-variables.md`)
- `docs/ARCHITECTURE.md` (duplicate of `07-architecture.md`)
- `docs/DATABASE.md` (duplicate of `09-database.md` + `DATA_MODEL.md`)
- `docs/PRD.md` (duplicate of `03-prd.md`)
- `docs/ROADMAP.md` (duplicate of `22-roadmap.md`)
- `docs/SECURITY.md` (duplicate of `12-security.md` + `SECURITY_AND_COMPLIANCE.md`) — **recreated as new SECURITY.md**
- `docs/API_REFERENCE.md` (duplicate of `API_SPEC.md`)
- `docs/00-README.md` (redundant with `docs/README.md`)
- `berojgardegreewala/api_test_results.txt` (test artifact)
- `berojgardegreewala/audit_report.json` (test artifact)
- `berojgardegreewala/batch1_results.json` (test artifact)
- `berojgardegreewala/live_test_results.txt` (test artifact)
- `berojgardegreewala/LEGACY_READONLY.md` (obsolete legacy notice)

### Changed
- `docs/README.md` - Consolidated as single documentation index with complete navigation
- `README.md` - Rewritten with clear platform vision, 4-DB architecture, and setup guide
- `.gitignore` - Added patterns to prevent test artifacts from being committed

---

## [0.9.0] - 2026-07-10

### Added
- Academy learning paths with career progression
- Resume builder with AI analysis
- DB reset migrations for clean Supabase schema
- Batch 1 scrape sources configuration

---

## [0.8.0] - 2026-07-05

### Added
- LinkedIn-style social features (profiles, connections, messages)
- AI opportunity matching and analytics
- Community feed and posts
- Company pages
- Neon analytics database integration

---

## [0.7.0] - 2026-07-03

### Added
- Multi-database architecture (2x Supabase + 2x Neon)
- Scrape sources and verification system
- User profiles and onboarding
- Notification system

---

## [0.6.0] - 2026-06-30

### Added
- Supabase Auth integration (Google, GitHub, Email)
- User profiles table
- Protected routes and middleware

---

## [0.5.0] - 2026-05-01

### Added
- Core scraping infrastructure
- News feed with AI curation
- Opportunity verification badges
- SEO/AEO/GEO optimization
- Admin dashboard
- Email digest system

---

## [0.1.0] - 2026-03-15

### Added
- Initial project setup
- Next.js 14 frontend (berojgardegreewala)
- Express.js backend scraping service
- Basic opportunity listing
- Category filtering