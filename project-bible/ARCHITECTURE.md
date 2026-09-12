# BerojgarDegreeWala — Technical Architecture

**Version:** 2026-09-12 (Production Certified & UI/UX Redesigned) · **Pattern:** Modular Monolith on Next.js & Supabase + Dedicated Employer Suite & Independent Backend Replication

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
  • scraper_sources + company_claims
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
- **Key Tables**: `opportunities`, `organizations`, `news_articles`, `user_profiles`, `applications`, `saved_opportunities`, `feed_posts`, `company_claims`, `recruiter_saved_candidates`, `employer_settings`, `workspace_members`, `ai_usage_log`.

### DB2 — Supabase (Legacy Split Architecture)
- **Provider**: Supabase Project 2 (`jbqjipwanfsxyqkfrrpx` — optional / legacy)
- **Role**: In current runtime, `frontend/src/lib/supabase-db2.ts` automatically falls back to DB1 when `NEXT_PUBLIC_SUPABASE_DB2_URL` is unset, operating as a unified single-database instance.

### Neon DB1 — Analytics & Cache
- **Provider**: Neon PostgreSQL
- **Role**: Analytics, click tracking, trending cache
- **Key Tables**: `page_views`, `search_queries`, `click_events`, `trending_cache`, `keyword_stats`

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
5. **Security Response Headers**:
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
   - Tier 2: Official verified logo or avatar.
   - Tier 3: Deterministic monogram (`getDeterministicInitials`, `getDeterministicPalette`) derived from name hash.
   - Tier 4: Designed editorial fallback banner with newspaper icon, source tag, category, and date.
3. **Storage & Media Security**:
   - `next.config.mjs`: Strict `remotePatterns` without wildcard hosts (`**`), confined to Supabase storage, GitHub avatars, Google user content, LinkedIn media, `*.gov.in`/`*.res.in`/`*.ac.in`, and certified publishers.
   - Magic Byte Validation: Upload routes (`/api/profile/avatar`, `/api/employer/company/logo`) check binary headers for JPEG (`0xFFD8FF`), PNG (`0x89504E47`), and WebP (`RIFF...WEBP`). Disguised SVG, HTML, and executables are rejected with HTTP 400.
   - Size limit: Capped at 2MB per image.
   - Decoupling of Logo Upload from Verification: User and employer logo uploads update visual branding only; `is_verified` remains strictly an administrative trust decision.
4. **OpenGraph & SEO**:
   - Edge routes (`/api/og`, `/api/og/opportunity/[slug]`) dynamically render self-contained PNG cards with official BerojgarDegreeWala branding.

---

## 7. Verification Baseline

- **TypeScript Type Safety**: `npx tsc --noEmit` (0 errors across monorepo workspaces)
- **Unit & Integration Tests**: 25 frontend test suites, 233 tests passing; 324 tests passing monorepo-wide (46 server + 15 ai-gateway + 30 worker + 233 frontend)
- **Production Build**: `npm run build` (compiles cleanly, 273 static and dynamic routes generated)
- **Security**: Fail-closed IDOR protection, message participant guards, company claim integrity, media magic byte validation, RBAC middleware, RLS, CSRF protection, and rate limiting.
