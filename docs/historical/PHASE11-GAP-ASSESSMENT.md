# PHASE 11 GAP ASSESSMENT: PRODUCTION HARDENING & BACKEND PARITY

**Date:** 2026-08-23  
**Project:** SiliconPath / BerojgarDegreeWala  
**Status:** **READ-ONLY ASSESSMENT & PLANNING BASELINE**  
**Active Baseline Commit:** `db4bfcb`  
**Master Test Baseline:** **278 / 278 PASS (100%)**

---

## 1. Current Verified State

- **Platform Surfaces**: Public Portal, Candidate Career Portal, Employer & Recruiter Suite, and Admin Control Center are 100% verified and operational on Next.js App Router (Vercel).
- **Database Architecture**: Supabase DB1 (`aqauempuwmbizqoaolop`) is the single authoritative source of truth. All core tables and all 5 Phase 9 candidate sub-resource tables (`candidate_experiences`, `candidate_educations`, `candidate_projects`, `candidate_certifications`, `candidate_achievements`) are physically present with active RLS and foreign key constraints.
- **Master Regression Baseline**:
  - `npx tsc --noEmit`: 0 errors
  - `npx jest` (Frontend): 120 / 120 tests passing (15 suites)
  - `npm run build`: 241 / 241 routes compiled
  - `candidate-network-e2e.mjs`: 12 / 12 gates passing
  - `forensic-full-suite.mjs`: 15 / 15 gates passing
  - `backend` test baseline: 158 / 158 tests passing (46 server + 15 ai-gateway + 97 api)
  - Total automated test cases: **278 / 278 PASS (100%)**

---

## 2. Production-Hardening Gaps (Part A)

| Area | Current Implementation | Gap Identified | Recommended Remediation |
| :--- | :--- | :--- | :--- |
| **A1. Observability** | Basic `console.log` / `console.warn` statements; no unified request ID tracking. | Lack of unified correlation IDs (`x-request-id`) in middleware and API route handlers; no structured duration/status logging. | Implement lightweight request correlation ID injector in `middleware.ts` and structured logger utility for API handlers (redacting sensitive tokens/credentials). |
| **A2. Error Tracking** | `@sentry/nextjs` is installed in `package.json`, CSP allows Sentry ingestion domain. | Root configuration files (`sentry.server.config.ts`, `sentry.client.config.ts`, `sentry.edge.config.ts`) are not yet linked to capture unhandled production exceptions. | Configure Sentry runtime initialization with environment variable guards (`SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN`) fail-soft when unset. |
| **A3. Rate Limiting** | Middleware-based rate limiting via `@berojgardegreewala/api` for `auth`, `search`, `scrape`, `ai`, `api`. | In-memory token bucket limits are process-local; need verification of route bucket boundaries across sensitive mutation endpoints. | Retain process-local rate limiter, verify header exports (`Retry-After`, `X-RateLimit-*`), and ensure tight limits on `/api/employer/invite` and `/api/messages`. |
| **A4. Security Headers & CSRF** | Full CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, HSTS, Permissions-Policy, and CSRF origin/referer checks in `middleware.ts`. | Verified complete; zero structural gaps in security headers. | Maintain active security headers and ensure no regression during future edits. |
| **A5. Accessibility (a11y)** | Semantic layouts across public and candidate pages. | Modal focus traps and ARIA attributes on dynamic tabbed components (`EditProfileModal.tsx`, `NetworkPage.tsx`, `EmployerNav.tsx`) can be enhanced. | Focused accessibility pass: ensure descriptive `aria-label` attributes on icon buttons, form labels, and single authoritative `h1` per page. |

---

## 3. Backend Parity Gaps (Part B)

The independent backend Express REST API (`backend/server`) currently runs on Render (`https://berojgardegreewala-backend.onrender.com`) with 46 route tests, alongside `backend/ai-gateway` (15 tests) and `backend/api` (97 tests).

### Priority Replication Gaps:
1. **Priority 1: Social & Candidate Identity**: Replicate feed posts, likes, comments, connections, mutual connections calculation, follow/unfollow, notifications count/list, and candidate-to-candidate messaging in Express routes.
2. **Priority 2: AI Gateway Breadth**: Port grounding search, opportunity matcher, resume enhancer, category classifier, and usage telemetry logging to backend Express routes.
3. **Priority 3: Scraper & Background Workers**: Port RSS news sync, link verification checking, and scheduled opportunity cleanup to `backend/worker`.
4. **Priority 4: Content & Search**: Replicate full-text opportunity search and people search in `backend/server`.
5. **Priority 5: Admin & Analytics**: Replicate admin statistics and verification audit routes with HMAC / password security.

---

## 4. Endpoint Parity Matrix Summary

```
┌──────────────────────────────┬──────────────────┬─────────────────┬──────────────────┐
│ Category                     │ Total Endpoints  │ Backend Parity  │ Status           │
├──────────────────────────────┼──────────────────┼─────────────────┼──────────────────┤
│ Auth & Session               │ 5                │ 2 Complete      │ PARTIAL          │
│ Opportunities & Search       │ 12               │ 4 Complete      │ PARTIAL          │
│ News & Articles              │ 5                │ 2 Complete      │ PARTIAL          │
│ AI Gateway                   │ 9                │ 4 Complete      │ PARTIAL          │
│ Bookmarks & Applications     │ 6                │ 4 Complete      │ PARTIAL          │
│ Candidate Profile Entities   │ 10               │ 1 Complete      │ IN TRANSITION    │
│ Social / Network / Messages  │ 18               │ 0 Complete      │ PRIORITY 1 QUEUE │
│ Employer Cockpit & ATS       │ 14               │ 0 Complete      │ PRIORITY 5 QUEUE │
│ Admin Console                │ 13               │ 1 Complete      │ PRIORITY 5 QUEUE │
│ Background Workers / Cron    │ 12               │ 1 Complete      │ PRIORITY 3 QUEUE │
└──────────────────────────────┴──────────────────┴─────────────────┴──────────────────┘
```

---

## 5. Security & Isolation Invariants

1. **No Frontend Code Deletion**: Frontend remains the sole production authority; backend code is additive and decoupled.
2. **Zero Traffic Redirection**: Production DNS and Vercel routing continue serving traffic directly.
3. **Identity Derivation**: All replicated backend endpoints must derive user identity directly from Supabase JWT tokens via `supabaseAdmin.auth.getUser(token)`.
4. **Credential Protection**: No secrets, management tokens, service-role keys, or HMAC passwords logged or exposed in telemetry.

---

## 6. Recommended Implementation Order

1. **Step 1 (Part A Hardening)**: Implement unified request correlation ID (`x-request-id`) in frontend middleware + structured error logger utility with safe metadata redaction.
2. **Step 2 (Part A Hardening)**: Configure fail-soft Sentry error tracking wrappers with environment variable guards.
3. **Step 3 (Part A Hardening)**: Accessibility pass across core public, candidate, and employer layout templates.
4. **Step 4 (Part B Backend Parity - Priority 1)**: Implement backend Social Layer routes (`/api/v1/feed`, `/api/v1/network/*`, `/api/v1/messages/*`, `/api/v1/notifications/*`) with dedicated tests.
5. **Step 5 (Part B Backend Parity - Priority 2)**: Replicate AI Gateway endpoints (`/api/v1/ai/chat`, `/api/v1/ai/classify`, `/api/v1/ai/match`, `/api/v1/ai/search`, `/api/v1/ai/enhance`).
6. **Step 6 (Part B Backend Parity - Priority 3)**: Replicate independent news sync and link verification worker tasks.
7. **Step 7 (Final Regression)**: Execute complete platform verification baseline (278+ tests passing).

---

## 7. Exact First Implementation Task

**Task 1**: Implement Request Correlation ID (`x-request-id`) & Structured Observability Logger in `frontend/src/middleware.ts` and `frontend/src/lib/logger.ts` without breaking existing middleware auth/RBAC gates.
