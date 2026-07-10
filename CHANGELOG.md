# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0] - 2026-07-10
### Added
- **Validation layer**: Zod schemas for opportunities, profiles, community posts/comments, messages, feed posts, subscribe, and report-issue — 9 POST/PATCH routes validated server-side
- **Structured logging**: JSON logger with levels (info/warn/error/debug) and timestamps; `apiError()` helper now logs structured errors
- **API error handler**: Centralized `apiError()` utility — generic production messages, detailed dev messages
- **Loading skeletons**: Added `loading.tsx` for organizations list/detail, category listing, location-based opportunities
- **Data quality**: Expanded garbage-title skip patterns (26 nav/menu terms) across all 5 HTML scrapers; added shared `GARBAGE_TITLE_PATTERNS` regex in utils.ts
- **ATS category inference**: Replaced hardcoded `"JRF"` default with title-based category inference (`"Engineering"` default for company roles)
- **Type safety**: `CompanyConfig` interface created; `Promise<any[]>` → `Promise<ScrapedOpportunity[]>` in all 4 ATS adapters; removed `job: any`, `body: any`, `adapterModule as any` in scrapers

### Fixed
- **Vercel build errors**: 3 API routes now re-throw `DynamicServerError` instead of logging it
- **Parse-resume 503**: Added `hasAIProviderConfigured()` guard for clear error when no AI keys are set
- **500 error exposure**: Root `error.tsx` and `academy/error.tsx` no longer display `error.message` in `<pre>` tags to users
- **Academy infinite loading**: All 3 academy pages have 15s timeout + error state with retry
- **OpenRouter model**: Updated from deprecated `google/gemma-2-9b-it:free` to `meta-llama/llama-3.1-8b-instruct:free`
- **JSON.parse safety**: `summarizer.ts` wrapped in try/catch with bracket extraction + fallback defaults
- **Empty states**: Search page now shows actionable guidance ("Try different keywords", "Try a different name or skill")
- TypeScript compiles clean (`npx tsc --noEmit` passes)

### Security
- **Admin auth**: Migrated from `NEXT_PUBLIC_ADMIN_PASSWORD` (client-exposed) to server-only `ADMIN_PASSWORD` verified via `/api/admin/auth` endpoint
- **API auth**: Scrape-sources (GET/POST/PUT/DELETE) and backend scrape trigger now require `verifyAdmin()`
- **Profile PATCH**: Body spread replaced with 13-field allowlist
- **Search sanitization**: Special chars `{}()"\,.` stripped from search input; capped at 100 chars
- **CI cleanup**: `NEXT_PUBLIC_ADMIN_PASSWORD` removed from `.github/workflows/ci.yml`
- Credential rotation flagged for: `ADMIN_PASSWORD`, `SUPABASE_SERVICE_ROLE_KEY`, `NEON_1_DATABASE_URL`, all AI provider keys, `CRON_SECRET`

### Known Issues (remaining)
- `generate_opp_slug()` function still has no body — all trigger-based inserts fail
- Cross-database foreign keys not enforceable in Supabase
- Conflicting migration files produce ambiguous schema state
- In-memory rate limiter ineffective in serverless (Vercel isolate per request)
- Lint (ESLint) setup not fully configured — only TypeScript type checking is enforced

## [0.2.0] - 2026-07-04
### Added
- Full security audit across 37+ issues (9 critical, 10 high, 10 medium, 8 low).
- Documentation updates reflecting audit findings and project reality.
- Bug tracking for broken `generate_opp_slug()` function.

### Fixed
- Documentation: All references updated from "ElectroBridge" → "SiliconPath".
- Documentation: URLs updated from `electrobridge.vercel.app` → `siliconpath.vercel.app`.
- Documentation: API reference updated with actual auth status (including missing auth gaps).

### Known Issues (from audit)
- `generate_opp_slug()` function has no body — all trigger-based inserts fail.
- Admin API endpoints lack authentication — full DB CRUD exposed.
- `NEXT_PUBLIC_ADMIN_PASSWORD` exposed in client-side JS bundles.
- Cross-database foreign keys not enforceable in Supabase.
- Conflicting migration files produce ambiguous schema state.

## [0.1.0] - 2026-07-04
### Added
- Complete UI overhaul with Tailwind CSS and Next.js App Router.
- 4-Database architecture across Supabase (DB1, DB2) and Neon (DB3, DB4).
- Multi-provider AI Fallback chain for intelligent parsing of DRDO/ISRO job postings.
- `JobPosting` and `ItemList` schema injections for improved SEO.
- `/resources` hub with comprehensive guides for JRF vs SRF, fully funded PhDs abroad, and DRDO recruitment.
- Complete documentation suite (Architecture, Security, API Reference, Testing).

### Changed
- Pivoted primary application focus from a logged-in LinkedIn clone to a frictionless, no-login aggregator.
- Moved all social and networking links (Feed, Network, Messages) to the footer navigation.
- Consolidated `render-backend` into native Next.js API routes (`src/app/api`).
- Resolved various strict ESLint warnings regarding unescaped entities and `react-hooks/exhaustive-deps`.

### Removed
- Legacy Express backend (`render-backend/`).
- Outdated root documentation and scratch files.
