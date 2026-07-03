# GAP_ANALYSIS.md — Intended vs. Actual State

**Date:** July 3, 2026 (Session 13)

Compares `docs/FEATURE_SPEC.md` (intended specification) against `PROJECT_AUDIT.md` (actual current implementation state). Gaps are prioritized according to the platform's core value hierarchy: aggregation integrity first, then SEO/AEO/GEO, then networking, then polish.

---

## Priority Legend

| Priority | Label | Description |
|----------|-------|-------------|
| P0 | 🔴 Critical | Core value — aggregation, data integrity, platform fundamentals |
| P1 | 🟠 High | SEO/AEO/GEO, AI reliability, user-facing polish |
| P2 | 🟡 Medium | Networking-layer completeness, admin tools |
| P3 | 🟢 Low | Nice-to-have features, non-critical UI polish |

---

## Gap 1: ATS API Scraping (P0 — 🔴 Critical)

**Intended (FEATURE_SPEC.md):**
- Tier 1 scraping from ATS public job-board APIs for 25+ semiconductor/electronics companies (Intel, TSMC, Samsung Semiconductor, Qualcomm, NVIDIA, Texas Instruments, etc.)
- Config-driven `scrape_sources` table so new sources can be added by admin without code

**Actual (PROJECT_AUDIT.md):**
- Only 3 HTML scrapers (ISRO, DRDO, CSIR) + RSS from Academic Positions, Scholarship Roof, Jobs.ac.uk
- No ATS API adapters implemented yet
- No `scrape_sources` table exists in the database

**Action:** Build ATS API adapters (Greenhouse, Lever, Workday, SmartRecruiters, Ashby patterns) + create `scrape_sources` config table + admin management UI

**Status (Session 14):** 🔴 P0 — Not started. Requires designing adapter pattern for multiple ATS systems. Implementation deferred to next session due to scope.

---

## Gap 2: Opportunity Verification Pipeline (P0 — 🔴 Critical)

**Intended:**
- Every new item starts `pending`, gets link-checked before appearing publicly
- Periodic re-checks, auto-hide after repeated failures
- Verification badge visible on cards and detail pages

**Actual:**
- `verification_status` column exists on opportunities (verified/unverified/link_unavailable/expired)
- Link checking exists via `/api/check-links` cron endpoint
- VerificationBadge component exists
- But no **pending** state enforced before public display — items can appear without initial verification
- No periodic re-check scheduling beyond manual trigger

**Action:** Add pending state enforcement (filter `is_active=false` until verified), schedule periodic re-checks, add auto-hide logic

**Status (Session 14):** ✅ **Done** — `pending` state added to verification pipeline:
- Migration `20260703000004_scrape_sources_and_verification.sql` adds `pending` to the CHECK constraint
- `/api/opportunities` GET filters out `pending` items by default (`.neq("verification_status", "pending")`)
- `/api/opportunities` POST sets new admin-created items to `pending`
- `/api/scrape` and `/api/scrape-opportunities` now insert with `verification_status: "pending"` and `is_active: false`
- `/api/check-links` now processes both `verified` AND `pending` items — on successful link check, pending items are promoted to `verified` (with `verified_at` timestamp) and set `is_active: true`
- Migration also drops/recreates the CHECK constraint to include `'pending'`

---

## Gap 3: Expanded API Aggregator Integration (P1 — 🟠 High)

**Intended:**
- Aggregator APIs: Adzuna, USAJobs, RemoteOK, Arbeitnow, TheMuse, Academic Positions, Jobs.ac.uk

**Actual:**
- Only Academic Positions, Scholarship Roof, Jobs.ac.uk RSS implemented
- Adzuna, USAJobs, RemoteOK, Arbeitnow, TheMuse not integrated

**Action:** Add API adapters for 5 more aggregator sources

---

## Gap 4: SEO/AEO/GEO — More Schema Types (P1 — 🟠 High)

**Intended:**
- Full schema.org JSON-LD coverage: JobPosting, NewsArticle, Organization, FAQPage, BreadcrumbList, WebSite
- All resource guides in AEO-friendly direct-answer + FAQ format
- Organization/company directory pages with full structured data

**Actual:**
- Homepage has WebSite schema and basic metadata
- Opportunity detail has JobPosting + BreadcrumbList schema
- News detail has NewsArticle schema
- JRF guide has FAQPage + Article schema
- **Was missing:** Organization + BreadcrumbList on organizations page, Organization + BreadcrumbList on companies page
- Organization listing page (`/organizations`) may lack schema

**Action:** Add missing schema types

**Status (Session 14):** ✅ **Done (org/company pages)** — Added:
- `Organization` + `BreadcrumbList` JSON-LD to `/organizations/[slug]` (server-rendered)
- `Organization` + `BreadcrumbList` JSON-LD to `/companies/[slug]` (client-side injected via script tags)
- Remaining gap: `/organizations` listing page could benefit from WebPage schema

---

## Gap 5: AI Provider Key Gaps (P1 — 🟠 High)

**Intended:**
- 7 providers in fallback chain, all operational

**Actual:**
- `NVIDIA_NIM_API_KEY` ✅ provided in Session 14
- `CLOUDFLARE_ACCOUNT_ID` not provided — needed for Cloudflare AI
- Some providers may have older keys that need rotation

**Action:** Obtain `CLOUDFLARE_ACCOUNT_ID` from owner. NVIDIA NIM key set in `.env.local`. **Needs owner action** for Cloudflare account ID.

---

## Gap 6: LinkedIn Networking Layer — Notification Wiring (P1 — 🟠 High)

**Intended:**
- All actions (follow, like, comment, repost, endorse, recommendation, connection request) create notifications
- Bell icon with unread count updates in real time

**Actual:**
- Notifications table exists with RLS
- Basic bell icon in navbar
- `createNotification()` wired into: comment, like, repost, follow, connect send, connect accept, skill endorse (7 callers verified)

**Action:** ✅ **Already done.** All major notification paths are wired. GAP_ANALYSIS.md was outdated.

---

## Gap 7: "Open to Work" Feature (P1 — 🟠 High)

**Intended:**
- Profile toggle for "Open to Work" with work types
- Admin talent pool view of open-to-work users
- Matching sidebar on opportunity detail pages

**Actual:**
- ✅ Profile toggle: implemented in `src/app/profile/page.tsx` with `is_open_to_work` checkbox and work type selectors
- ✅ Admin talent pool: implemented in `src/app/admin/talent-pool/page.tsx` with search/filter
- ✅ Opportunity sidebar: `OpenToWorkBanner` component rendered on opportunity detail page
- ✅ People profile page (`/people/[username]`) shows open-to-work badge
- ✅ DB migration exists in `20260703000003_linkedin_features.sql`

**Action:** ✅ **Already done.** Full implementation complete. Sidebar matching shows generic banner (not intelligent matching), but the feature is fully functional.

---

## Gap 8: Google OAuth Unblocked (P1 — 🟠 High)

**Intended:**
- Email/password + Google OAuth sign in

**Actual:**
- Email/password works
- Google OAuth blocked — `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` not set in Supabase Dashboard
- Auth callback handler exists but cannot complete Google OAuth flow

**Action:** Create Google Cloud OAuth credentials, set client ID/secret in Supabase Auth settings

---

## Gap 9: Sentry Error Tracking Enabled (P2 — 🟡 Medium)

**Intended:**
- Sentry captures and reports errors

**Actual:**
- `sentry.client.config.ts` and `sentry.server.config.ts` configured
- `NEXT_PUBLIC_SENTRY_DSN` not set in Vercel — Sentry non-functional

**Action:** Create Sentry project, get DSN, set in Vercel env vars

---

## Gap 10: Vercel GitHub Actions Deploy (P2 — 🟡 Medium)

**Intended:**
- CI/CD auto-deploys to Vercel on push to main

**Actual:**
- CI workflow exists (lint → test → build) but doesn't include Vercel deploy step
- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` not set as GitHub secrets

**Action:** Add Vercel deploy step to CI workflow, set GitHub secrets

---

## Gap 11: Cron Jobs Execution Verification (P2 — 🟡 Medium)

**Intended:**
- Daily scrape, weekly digest, weekly archive, daily replica sync all fire on schedule

**Actual:**
- vercel.json has all 4 cron jobs configured
- Archive-news and sync-replica have never triggered (no first-run data)
- No monitoring/alerting for cron failures

**Action:** Verify first-run data for archive/sync, add cron failure alerts

---

## Gap 12: Telegram Subscription UI (P2 — 🟡 Medium)

**Intended:**
- Users can subscribe/unsubscribe to Telegram notifications via web UI

**Actual:**
- Telegram bot token and channel ID configured
- Telegram bot code exists (`telegram-bot.ts`)
- No subscription UI on the web frontend

**Action:** Add Telegram subscribe/unsubscribe UI to user settings

---

## Gap 13: Calendar Export Logging (P3 — 🟢 Low)

**Intended:**
- ICS calendar downloads logged to `calendar_exports` table

**Actual:**
- `calendar_exports` table exists but is never written to
- Calendar export functionality works but is not tracked

**Action:** Add write to `calendar_exports` on calendar download

---

## Gap 14: E2E Tests (P3 — 🟢 Low)

**Intended:**
- End-to-end tests for critical user flows

**Actual:**
- No E2E tests (Playwright/Cypress) — only unit and component tests

**Action:** Add Playwright tests for auth, browse, apply, community flows

---

## Gap 15: Light Mode Theme (P3 — 🟢 Low)

**Intended:**
- Theme toggle (light/dark) for accessibility

**Actual:**
- Dark-only theme, no light mode support

**Action:** No action — explicitly out of scope per PRD unless separately instructed

---

## Gap 16: OpenAPI/Swagger Documentation (P3 — 🟢 Low)

**Intended:**
- Documented API for external consumers

**Actual:**
- No OpenAPI/Swagger docs

**Action:** Generate OpenAPI spec from route handlers

---

## Gap 17: CDN for Static Assets (P3 — 🟢 Low)

**Intended:**
- CDN for images, fonts to reduce Vercel bandwidth

**Actual:**
- All assets served directly from Vercel

**Action:** Evaluate need — current free tier may suffice

---

## Gap 18: Database Backup Verification (P3 — 🟢 Low)

**Intended:**
- Automated verification that backups are restorable

**Actual:**
- No backup verification process

**Action:** Research Supabase/Neon backup options, set up periodic verification

---

## Gap 19: Migration Files for db2/db3/db4 (P1 — 🟠 High)

**Intended:**
- All database schema version-controlled in repo

**Actual:**
- Supabase Primary (db1) has 5 migration files in repo
- Supabase Secondary (db2) migration exists (`20260703000002_supabase2_schema.sql`)
- Neon Primary (db3) migration exists (`20260703000001_neon_schema.sql`)
- ✅ Neon Secondary (db4) schema **IS included** in `20260703000001_neon_schema.sql` — the file contains both Neon Primary (db3) AND Neon Secondary (db4) schemas in a single file. `opportunities_mirror` and `news_mirror` tables are at lines 59–97.

**Action:** ✅ **Already done.** All 4 databases have migration files. The file naming could be clearer (split db3/db4 into separate files), but the schema is version-controlled.

---

## Gap 20: Render Service Update (P2 — 🟡 Medium)

**Intended:**
- Render runs a dedicated background scrape worker (not the legacy Express backend)

**Actual:**
- Render service `electrobridge-api` runs legacy Express backend from `ElectroBridge Web App Design/backend/`
- Source code for that backend was removed during repo cleanup
- Render should be repurposed to run a dedicated scrape worker script

**Action:** Update Render service to run a scrape worker that responds to Vercel cron triggers

---

## Summary by Priority

| Priority | Count | Status |
|----------|-------|--------|
| 🔴 P0 — Critical | 2 | 1 ✅ done (verification pipeline), 1 🔴 remaining (ATS adapters) |
| 🟠 P1 — High | 7 | 3 ✅ done (notifications, Open to Work, db4 migration), 1 ✅ done (org/company schema), 1 ✅ done (NVIDIA key set), 1 🟠 needs owner (Google OAuth), 1 🟠 needs owner (aggregator API keys) |
| 🟡 P2 — Medium | 4 | All pending |
| 🟢 P3 — Low | 5 | All pending |

**Total gaps identified: 20** — 5 resolved in Session 14, 3 flagged for owner decision, 12 remaining

---

## Next Build Session Priority (Updated Session 14)

1. P0: Build ATS API adapters + scrape_sources admin UI (requires scoping ATS APIs)
2. P1: Google OAuth setup (needs owner to create Google Cloud credentials)
3. P1: CLOUDFLARE_ACCOUNT_ID (needs owner to provide from Cloudflare dashboard)
4. P1: Aggregator API keys (Adzuna, USAJobs, RemoteOK, Arbeitnow, TheMuse — need owner registration)
5. P2: Set Sentry DSN in Vercel, enable error tracking
6. P2: Set up Vercel GitHub Actions deploy
7. P2: Telegram subscription UI
8. P2: Verify cron job execution, add monitoring
9. P2: Update Render service to scrape worker
10. P3: Calendar export logging, E2E tests, OpenAPI docs, CDN, backup verification
