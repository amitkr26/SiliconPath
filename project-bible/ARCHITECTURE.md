# SiliconPath (BerojgarDegreeWala) — Technical Architecture

**Version:** 2026-08-30 (Reconciled & Production Certified) · **Pattern:** Modular Monolith on Next.js & Supabase + Dedicated Employer Suite & Independent Backend Replication

---

## 1. Architectural Overview

SiliconPath operates as a **modular monolith** on Next.js 14 (App Router) deployed to Vercel, backed by a dual Supabase PostgreSQL database architecture (DB1 for core platform, DB2 for user/social layer) and Neon analytics database.

The application serves four discrete, authoritative user experiences from a single codebase and authentication system:
1. **Public Portal**: Deep-tech intelligence, news, opportunities, academy, and search.
2. **Candidate Portal**: Career management, applications, saved jobs, networking, messaging, and profile/resume builder.
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
        ┌─────────────────────────────┼────────────────────────────┐
        ▼                             ▼                            ▼
  Supabase DB1 (Core)           Supabase DB2 (User/Social)    Neon DB1 (Analytics)
  • opportunities               • user_profiles                • click_events
  • organizations               • connections                  • page_views
  • news_articles               • user_follows                 • search_queries
  • scraper_sources             • feed_posts                   • trending_cache
  • company_claims              • applications                 • keyword_stats
  • recruiter_saved_candidates  • saved_opportunities
  • employer_settings           • conversations
  • workspace_members           • messages
  • ai_usage_log                • notifications
                                • community_posts/comments
                                • skill_endorsements
                                • recommendations
                                • candidate_experiences/educations/projects/certs/achievements
                                • company_followers
                                • user_resumes
```

---

## 2. Four Discrete Platform Surfaces

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Surface             Layout Shell            Key Pages                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│ 1. Public Portal    Navbar + Footer         /, /opportunities, /news, /academy, │
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

## 3. Database Architecture

The live database infrastructure uses a dual-Supabase + Neon architecture:

### DB1 — Supabase (Consolidated Platform & User Data)
- **Provider**: Supabase Project 1 (`aqauempuwmbizqoaolop`)
- **Role**: Production authoritative database hosting core platform, opportunities, organizations, news, admin logs, as well as consolidated user profiles, social features, applications, and academy content.
- **Key Tables**: `opportunities`, `organizations`, `news_articles`, `user_profiles`, `applications`, `saved_opportunities`, `feed_posts`, `learning_tracks`, `learning_days`, `learning_questions`, `company_claims`, `recruiter_saved_candidates`, `employer_settings`, `workspace_members`, `ai_usage_log`.

### DB2 — Supabase (Legacy Split Architecture)
- **Provider**: Supabase Project 2 (`jbqjipwanfsxyqkfrrpx` — optional / legacy)
- **Role**: Historically planned user/social partition. In current runtime, when `NEXT_PUBLIC_SUPABASE_DB2_URL` is unset, `frontend/src/lib/supabase-db2.ts` automatically falls back to DB1, operating as a unified single-database instance.

### Neon DB1 — Analytics & Cache
- **Provider**: Neon PostgreSQL
- **Role**: Analytics, click tracking, trending cache
- **Key Tables**: `page_views`, `search_queries`, `click_events`, `trending_cache`, `keyword_stats`

### Cross-DB References
- `saved_opportunities.opportunity_id` references DB1's `opportunities.id` — enforced at application level, not FK-constrained
- `applications.opportunity_id` references DB1's `opportunities.id` — same pattern
- `feed_posts.opportunity_id` references DB1's `opportunities.id` — same pattern

---

## 4. Security, Dual Auth & IDOR Protection

1. **Dual Authentication & Authoritative RBAC (`frontend/src/lib/employer-auth.ts`, `backend/api/src/auth/index.ts`)**:
   - Accepts both browser session cookies (`sb-...-auth-token`) and programmatic Bearer tokens (`Authorization: Bearer <jwt>`).
   - Validates roles against server-managed `app_metadata.role` (or DB tables), explicitly ignoring client-writable `user_metadata.role` for administrative privilege decisions (`AUTH-01`).
   - Admin access is validated via `verifyAdmin` (constant-time password hash / HMAC token verification) or authoritative `isUserAdmin(user)`.
2. **Server-Side Middleware Boundary (`frontend/src/middleware.ts`)**:
   - Strictly intercepts all `/employer/*` and `/api/employer/*` routes, returning 403 Forbidden for non-employer roles and 401 for anonymous traffic.
3. **Multi-Employer IDOR Shield**:
   - Every mutation and review endpoint verifies that the authenticated user owns the referenced opportunity (`created_by === user.id || employer_id === user.id` or `role === 'admin'`).
   - Cross-employer access attempts return HTTP 403 Forbidden.
4. **RBAC Middleware**:
   - Role-based access control with three roles: `candidate`, `employer`, `admin`
   - Capability-based progressive permissions model
   - Middleware enforces role checks at route boundaries
5. **Security Response Headers**:
   - `X-Frame-Options: DENY`
   - `X-Content-Type-Options: nosniff`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Content-Security-Policy: default-src 'self' ...; report-uri /api/csp-report`
   - `Strict-Transport-Security: max-age=31536000; includeSubDomains`

---

## 5. Verification Baseline

- **TypeScript Type Safety**: `npx tsc --noEmit` (0 errors)
- **Unit & Integration Tests**: `npx jest` (passing)
- **Backend Test Baseline**: All passing (46 server + 15 ai-gateway + 97 api)
- **Production Build**: `npm run build` (compiles successfully)
- **Security**: IDOR protection, RBAC middleware, RLS on all tables, CSRF protection, rate limiting
