# Changelog

## [Unreleased] - clean/main branch

### Added
- **2026-08-12 — News slug migration + regression test.** `news_articles` had no `slug` column, so `/api/news/[slug]` 404'd for every article, the detail page could not load real articles, news sync upserts silently failed, and news disappeared from `/sitemap.xml`. Migration `20260812000001_news_slug_column.sql` adds the column, backfills deterministic slugs from `title`, and indexes them (applied to the live project). Added `news-slug.test.ts` (3 tests) pinning the API contract. Verified live: API returns the stored record, detail page renders the stored title, sitemap now emits all 33 news URLs.
- **2026-08-12 — Live data QA cleanup.** Removed test subscriber `qa-audit-test@example.com` from `subscribers` (1 remaining genuine subscription). DB ground truth: 3,269 active opportunities, 33 news articles, 4 categories (jrf 942 / government 29 / fellowship 27 / internship 2).
- **2026-08-10 — Standalone Express REST API (`backend/server` workspace).** New `@berojgardegreewala/server` package mirroring the Next.js internal API: `GET /health`, `/api/v1/opportunities` (pagination + filters, slug/UUID lookup), `/api/v1/profiles/:username` (new indexed username lookup) + `/me`, `/api/v1/organizations`, `/api/v1/news`, `/api/v1/applications` + `/api/v1/saved-opportunities` (user-scoped via Bearer tokens), `POST /api/v1/ai/insights` (wraps `@berojgardegreewala/ai-gateway`), `GET /api/v1/admin/stats` (constant-time `X-Admin-Password`). Reuses `@berojgardegreewala/api` zod validation + error hierarchy. Added to root npm workspaces; `npm ci && npm run build --workspace @berojgardegreewala/server` builds it.
- **2026-08-10 — Server test suite (16 tests).** node:test + select-aware fake Supabase client in `backend/server/tests` — run with `npm test --workspace @berojgardegreewala/server`; no credentials required.
- **2026-08-10 — Deployment artifacts.** Root-context multi-stage Dockerfile (`backend/server/Dockerfile`) + `deploy-stack.txt` (Render/Docker steps, env var table, verification curls) + `backend/server/.env.example`.
- **2026-08-10 — README migration map.** Mirrored routes marked DONE with route→file mapping; remaining ~120 Next.js routes queued IN PROGRESS in priority order (social layer, academy, full AI surface, admin, employer/companies, resume/search, scrapers & cron, misc).

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
- `docs/SECURITY.md` (duplicate of `12-security.md` + `SECURITY_AND_COMPLIANCE.md`)
- `docs/API_REFERENCE.md` (duplicate of `API_SPEC.md`)
- `docs/00-README.md` (redundant with `docs/README.md`)
- `berojgardegreewala/api_test_results.txt` (test artifact)
- `berojgardegreewala/audit_report.json` (test artifact)
- `berojgardegreewala/batch1_results.json` (test artifact)
- `berojgardegreewala/live_test_results.txt` (test artifact)
- `berojgardegreewala/LEGACY_READONLY.md` (obsolete legacy notice)

### Changed
- `docs/README.md` - Consolidated as single documentation index with complete navigation
- `README.md` - Rewritten with clear platform vision, two-tier architecture, and setup guide
- `.gitignore` - Added patterns to prevent test artifacts from being committed

---

## [0.9.0] - 2026-07-10

### Added
- Academy learning paths with career progression
- Resume builder with AI analysis
- DB reset migrations for clean Supabase schema
- Batch 1 scrape sources configuration

## [0.8.0] - 2026-07-05

### Added
- LinkedIn-like social features (profiles, connections, messages)
- AI opportunity matching and analytics
- Community feed and posts
- Company pages
- Neon analytics database integration

## [0.7.0] - 2026-07-03

### Added
- Multi-database architecture (2x Supabase + 2x Neon)
- Scrape sources and verification system
- User profiles and onboarding
- Notification system

## [0.6.0] - 2026-06-30

### Added
- Supabase Auth integration (Google, GitHub, Email)
- User profiles table
- Protected routes and middleware

## [0.5.0] - 2026-05-01

### Added
- Core scraping infrastructure
- News feed with AI curation
- Opportunity verification badges
- SEO/AEO/GEO optimization
- Admin dashboard
- Email digest system

## [0.1.0] - 2026-03-15

### Added
- Initial project setup
- Next.js 14 frontend (berojgardegreewala)
- Express.js backend scraping service
- Basic opportunity listing
- Category filtering
