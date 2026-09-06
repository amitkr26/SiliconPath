# SiliconPath (BerojgarDegreeWala) — Master Comprehensive Codebase Reality Audit

**Date:** 2026-09-06  
**Auditor:** Antigravity Senior Engineering Pair  
**Repository:** `D:\Tinkerscape\SiliconPath` (`amitkr26/BerojgarDegreeWala`)  
**Scope:** Complete Codebase (Frontend Next.js 14, Backend Workspaces, Database Schemas, RLS Policies, Scrapers, Pipelines, Tooling, DevOps, Documentation)  
**Standard:** Lazy Senior Dev Mode (`AGENTS.md`) & Root-Cause Analysis

---

## 1. Executive Summary

A comprehensive architectural, security, data pipeline, code quality, and operational audit was executed across the entire repository. The platform consists of a Next.js 14 modular monolith on Vercel (`frontend`), an Express REST backend replica (`backend/server`), a scraper worker (`backend/worker`), an AI Gateway (`backend/ai-gateway`), a shared API library (`backend/api`), PostgreSQL schemas (Supabase DB1 and Neon), Kubernetes manifests, and extensive architectural documentation in `project-bible/`.

### Verification Status & Quality Gate Baseline

| Metric / Check | Command / Target | Result | Status |
| :--- | :--- | :--- | :--- |
| **Monorepo Build** | `npm run build` | All packages compiled | ✅ PASS |
| **Next.js Production Build** | `npm run build --workspace=frontend` | 338+ routes & static SSG paths compiled | ✅ PASS |
| **Backend API Tests** | `npm test --workspace=@berojgardegreewala/api` | 7 suites, 97 tests passed | ✅ PASS |
| **AI Gateway Tests** | `npm test --workspace=@berojgardegreewala/ai-gateway` | 1 suite, 15 tests passed | ✅ PASS |
| **Backend Server Tests** | `npm test --workspace=@berojgardegreewala/server` | 46 tests passed | ✅ PASS |
| **Backend Worker Tests** | `npm test --workspace=@berojgardegreewala/worker` | 30 tests passed | ✅ PASS |
| **Frontend Jest Tests** | `npm test --workspace=frontend` | **1 failed suite, 3 failed tests** (24 passed suites, 202 passed) | ❌ **FAIL** |
| **Monorepo Typecheck** | `npm run typecheck` | Silently skipped frontend (missing script in `frontend/package.json`) | ⚠️ **DEFECT** |
| **Frontend TypeScript Check** | `npx tsc --noEmit` (inside `frontend/`) | 0 compile errors | ✅ PASS |

---

## 2. Issue Severity Matrix

| Severity | ID | Title | Component | Impact |
| :--- | :--- | :--- | :--- | :--- |
| **P0 - CRITICAL** | SEC-01 | Client-Modifiable `user_metadata.role = "admin"` Bypasses IDOR & RLS | Auth & RLS | Complete data leak of all applicants & secrets |
| **P0 - CRITICAL** | AUTH-01 | Admin Web Console Completely Locked Out by Middleware | Middleware & Admin | No operator can log into `/admin` UI |
| **P0 - CRITICAL** | PIPE-01 | Complete Ingestion-to-Publication Pipeline Breakdown | Ingestion & Scrapers | 100% of newly scraped opportunities frozen in `pending` |
| **P1 - HIGH** | TEST-01 | Unit Test Regression in `availability.test.ts` | Test Suite | CI/CD test failure (3 tests failed) |
| **P1 - HIGH** | TOOL-01 | Frontend Omitted from Monorepo `typecheck` Script | Monorepo Tooling | TypeScript errors in frontend not caught in monorepo CI |
| **P1 - HIGH** | SEC-02 | Unbounded MemoryStore Rate-Limiting & IP-Spoofing DoS | Rate Limiter | Memory leak, DoS, and rate-limit bypass |
| **P1 - HIGH** | DATA-01 | Post-Query Pagination Drift & Missing Items | Query Engine | Inconsistent page sizes, missing opportunities |
| **P2 - MEDIUM** | DEVOPS-01 | Broken Dockerfile & Docker Compose Context | Docker / Compose | `docker compose up` fails to build frontend |
| **P2 - MEDIUM** | DOC-01 | Architectural Reality Drift (Dual DB vs Consolidated DB1) | Documentation | `ARCHITECTURE.md` contradicts code and `db/index.ts` |
| **P2 - MEDIUM** | SEC-03 | Sensitive Reference Files in Root & Git History | Secrets / Git Hygiene | Violates `AGENTS.md` root clean mandate |
| **P3 - LOW** | CODE-01 | Admin Performance Route Auth Inconsistency | Admin API | Uses cookie session instead of `requireAdmin` |
| **P3 - LOW** | PERF-01 | Missing React Hook Dependencies & Unoptimized Images | Frontend Components | Slower LCP, potential stale closures |

---

## 3. Deep-Dive Forensic Findings

### [P0 - CRITICAL] SEC-01: Client-Modifiable `user_metadata.role = "admin"` Grants Administrative Bypass in ATS & Database RLS

- **Affected Files:**
  - `frontend/src/app/api/employer/applicants/route.ts:58-74`
  - `frontend/src/app/api/employer/jobs/route.ts:66-74`
  - `frontend/src/app/api/employer/claim/route.ts:41,113`
  - `frontend/src/app/api/employer/analytics/route.ts:28`
  - `frontend/src/app/api/employer/company/route.ts:94`
  - `frontend/src/app/api/employer/invite/route.ts:37`
  - `frontend/src/app/api/employer/jobs/[id]/route.ts:9`
  - `frontend/supabase/migrations/20260829000003_rls_security_hardening.sql:16-18, 30-32, 37-39`
  - `frontend/supabase/migrations/20260829000004_security_release_1.sql:18-20, 76-78`

- **Root Cause Analysis:**
  In Supabase Auth (GoTrue), `user_metadata` (`raw_user_meta_data`) is client-writable via `supabase.auth.updateUser({ data: { role: 'admin' } })`. While `POST /api/profile/me` specifically rejects assigning `"admin"`, this restriction only applies to clients calling that specific endpoint. Any authenticated user can issue a standard update directly against Supabase GoTrue Auth API using their JWT bearer token.
  
  In `frontend/src/app/api/employer/applicants/route.ts`:
  ```typescript
  const role = user.user_metadata?.role;
  if (role !== "admin") {
    // strictly checks employer ownership
  } else {
    // ADMIN BYPASS: returns all applicants across all employers!
  }
  ```
  Additionally, in the SQL RLS hardening migrations:
  ```sql
  CREATE POLICY "Admins can view app config" ON app_config
    FOR SELECT TO authenticated
    USING (
      (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin')
      OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin')
    );
  ```
  Allowing `user_metadata` to grant administrative access invalidates Row Level Security.

- **Impact:**
  Any user can elevate themselves to admin, bypass IDOR protections, and dump candidate PII (names, emails, phones, resumes, notes) across all employers, as well as read sensitive configuration and logs from `app_config` and `ai_usage_log`.

- **Remediation:**
  1. Remove all references to `user_metadata` when granting administrative privileges. Only trusted `auth.jwt() -> 'app_metadata' ->> 'role'` (server-set) or explicit DB RBAC tables must be respected.
  2. In RLS migrations, drop the `OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin')` clauses.

---

### [P0 - CRITICAL] AUTH-01: Admin Web Console Completely Locked Out by Middleware

- **Affected Files:**
  - `frontend/src/middleware.ts:36, 140-154, 194-198`
  - `frontend/src/app/admin/page.tsx:130-134`
  - `frontend/src/app/api/admin/auth/route.ts`

- **Root Cause Analysis:**
  1. `frontend/src/middleware.ts` sets `ADMIN_PATHS = ['/api/admin']`.
  2. Lines 194-198 intercept every request starting with `/api/admin` and reject it with `403 Admin access required` unless `isAdminRequest` is true.
  3. `isAdminRequest` evaluates ONLY whether the `x-admin-password` header matches `process.env.ADMIN_PASSWORD`.
  4. When an operator attempts to log into the Admin Console via `/admin`, the login form executes:
     ```typescript
     await fetch("/api/admin/auth", {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ username: cleanUser, password: cleanPass }),
     });
     ```
     Because this request is sent to `/api/admin/auth` with credentials in the JSON body (no `x-admin-password` header yet), `middleware.ts` blocks it with `HTTP 403 Forbidden` before it ever reaches `api/admin/auth/route.ts`.
  5. Furthermore, once authenticated, the admin console stores an HMAC session token, but `middleware.ts` never inspects `Authorization: Bearer <hmacToken>`.

- **Impact:**
  Operators cannot log into the Admin Console via the web interface. All admin UI actions (manual verification, scraping fleet management, stats) are inaccessible.

- **Remediation:**
  1. Exempt `/api/admin/auth` from the `ADMIN_PATHS` gate in `middleware.ts`.
  2. Allow `middleware.ts` to validate HMAC bearer tokens using constant-time comparison or delegate token verification to `requireAdmin` at the route handler level.

---

### [P0 - CRITICAL] PIPE-01: Complete Ingestion-to-Publication Pipeline Breakdown

- **Affected Files:**
  - `frontend/src/lib/scrapers/run-opportunity-scrape.ts:176`
  - `frontend/src/app/api/cron/check-links/route.ts:95-97`
  - `frontend/src/lib/availability.ts:124`
  - `frontend/src/app/page.tsx:54, 157`
  - `frontend/src/lib/opportunities-query.ts:63`

- **Root Cause Analysis:**
  A circular pipeline blockage exists across three mechanisms:
  1. Scrapers insert newly discovered opportunities with `verification_status: "pending"`.
  2. Commit `4cdbc67` ("homepage trust/data integrity") added `if (opp.verification_status === "pending") return false;` to `isCurrentlyAvailable()` and excluded `pending` from all public database queries and search endpoints.
  3. The link validation cron (`/api/cron/check-links`) specifically does NOT promote `pending` records to `verified` (line 95: *"a reachable link is evidence, not verification. Only the admin verification queue may promote unverified/pending -> verified"*).
  4. As identified in `AUTH-01`, the Admin Console is locked out by `middleware.ts`, preventing manual promotion.

- **Impact:**
  Zero newly scraped opportunities can ever reach the public portal, search index, or homepage. The platform is frozen to historical pre-verified rows.

- **Remediation:**
  1. Restore operator access to the Admin Console by fixing `AUTH-01`.
  2. Implement an automated verification rule for trusted institutional scrapers (e.g. DRDO, ISRO, CSIR, top IITs where the link check passes and domain matches the source registry).

---

### [P1 - HIGH] TEST-01: Unit Test Regression in `availability.test.ts`

- **Affected Files:**
  - `frontend/src/__tests__/lib/availability.test.ts:211, 226, 297, 357`
  - `frontend/src/lib/availability.ts:124`

- **Root Cause Analysis:**
  When commit `4cdbc67` added `if (opp.verification_status === "pending") return false;` to `isCurrentlyAvailable()`, the test suite in `availability.test.ts` was not updated to reflect the change:
  - Test 7: Open-ended with NULL deadline & recent evidence expected `true` for a record with `verification_status: "pending"`.
  - Test 11: Homepage & search consistency test expected `true` for an industry opportunity with `verification_status: "pending"`.
  - Edge cases: Expected `true` for deadline equal to today with `verification_status: "pending"`.
  All 3 assertions fail because `isCurrentlyAvailable()` now unconditionally excludes `pending`.

- **Impact:**
  Monorepo test suite fails (`1 failed, 24 passed, 202/205 tests passed`).

- **Remediation:**
  Update the mock inputs in `availability.test.ts` to `verification_status: "verified"` where availability is being tested, and add dedicated negative tests verifying that `pending` records are excluded.

---

### [P1 - HIGH] TOOL-01: Frontend Omitted from Monorepo `typecheck` Script

- **Affected Files:**
  - `frontend/package.json`
  - `package.json:16`
  - `README.md:100`

- **Root Cause Analysis:**
  Root `package.json` specifies `"typecheck": "npm run typecheck --workspaces --if-present"`. The backend packages (`api`, `ai-gateway`, `server`, `worker`) have `"typecheck": "tsc --noEmit"`. However, `frontend/package.json` omitted the `"typecheck"` script entirely. As a result, running `npm run typecheck` from root silently bypassed the frontend.

- **Impact:**
  Contradicts the claim in `README.md` ("0 Errors across 5 Workspaces"). Type regressions in the frontend would not be caught by standard root script runs.

- **Remediation:**
  Add `"typecheck": "tsc --noEmit"` to `frontend/package.json`.

---

### [P1 - HIGH] SEC-02: Unbounded In-Memory Rate Limiting & IP Spoofing DoS

- **Affected Files:**
  - `backend/api/src/rate-limit/index.ts:7-20, 43-47`

- **Root Cause Analysis:**
  1. `const memoryStore = new Map<string, { count: number; resetAt: number }>()` is maintained at module level. Expired keys are never evicted; new entries are simply appended or updated.
  2. `getClientKey()` parses the raw `X-Forwarded-For` header: `forwarded?.split(",")[0]?.trim() || "unknown"`.

- **Impact:**
  - An attacker sending random `X-Forwarded-For` headers can bypass rate limiting on `/api/search`, `/api/auth`, and `/api/ai`.
  - On long-running backend processes (`backend/server`), flooding requests with randomized IP headers will bloat `memoryStore` indefinitely, leading to memory leaks and denial-of-service (OOM).

- **Remediation:**
  Implement TTL key eviction / LRU pruning in `memoryStore` or periodically clean expired records. In production environments, leverage Upstash Redis or trusted proxy configurations.

---

### [P1 - HIGH] DATA-01: Post-Query Pagination Drift & Underfilled Pages

- **Affected Files:**
  - `frontend/src/lib/opportunities-query.ts:227-240`

- **Root Cause Analysis:**
  `supabaseQuery.range(start, end)` paginates at the database level using `buildAvailabilityDbFilter(today)`. However, `buildAvailabilityDbFilter` cannot evaluate 90-day recency windows across `posted_at`, `created_at`, and `last_link_checked` in pure SQL without complex RPC. Consequently:
  ```typescript
  supabaseQuery = supabaseQuery.range(start, end);
  const { data, count } = await supabaseQuery;
  const filtered = includeExpired ? data : data.filter(opp => isCurrentlyAvailable(opp, today));
  return { data: filtered, count };
  ```
  If 5 of the 20 fetched records in the range fail `isCurrentlyAvailable()`, the client receives only 15 items on page 1, while `count` still reflects the total unfiltered count.

- **Impact:**
  Pages have unpredictable item counts and pagination numbers drift across page navigation.

- **Remediation:**
  Incorporate a recency filter in the Supabase query for open-ended categories, or over-fetch when post-filtering to guarantee complete page windows.

---

### [P2 - MEDIUM] DEVOPS-01: Broken Dockerfile & Docker Compose Context

- **Affected Files:**
  - `frontend/Dockerfile:11-12, 39`
  - `docker-compose.yml:5`
  - `frontend/next.config.mjs`

- **Root Cause Analysis:**
  1. `frontend/package.json` depends on `"@berojgardegreewala/api": "file:../backend/api"`.
  2. `docker-compose.yml` sets `context: ./frontend`, making `../backend/api` inaccessible during Docker build.
  3. `frontend/Dockerfile` tries to copy `.next/standalone`, but `frontend/next.config.mjs` does not have `output: "standalone"`.
  4. `docker-compose.yml` connects to PostgreSQL with `postgres_pass_2026`, but the postgres service container is initialized with `postgres_dev_secret`.

- **Impact:**
  `docker compose up` and containerized deployments fail.

- **Remediation:**
  Set Docker context to root, add `output: "standalone"` to `next.config.mjs`, and align database credentials in `docker-compose.yml`.

---

### [P2 - MEDIUM] DOC-01: Architectural Reality Drift (Dual DB vs Consolidated DB1)

- **Affected Files:**
  - `project-bible/ARCHITECTURE.md:32-48, 83-87`
  - `frontend/src/lib/db/index.ts:5-6`
  - `README.md:89`

- **Root Cause Analysis:**
  `project-bible/ARCHITECTURE.md` asserts that the platform runs on a dual-Supabase architecture where DB1 holds opportunities and DB2 (`jbqjipwanfsxyqkfrrpx`) holds active user profiles, applications, and social feeds.
  However, `frontend/src/lib/db/index.ts` states:
  *"DB2: Supabase Secondary — legacy social mirror (read-only fallback). Retained for compat; live social tables were consolidated into db1."*
  `README.md` and active API routes corroborate that all live production data resides in DB1.

- **Impact:**
  Documentation contradicts the active codebase, creating confusion for future engineering efforts.

- **Remediation:**
  Update `project-bible/ARCHITECTURE.md` to reflect the consolidated DB1 production topology with DB2 retained as a legacy read-only mirror.

---

### [P2 - MEDIUM] SEC-03: Sensitive Reference Files in Root & Git History

- **Affected Files:**
  - `SECRETS.md` (root)
  - `siliconpath-credentials.txt` (root)
  - Historical Commit: `a4cdf529f4d7def4c1b7acf001f0ee7d84702caa`

- **Root Cause Analysis:**
  While both files are now covered in `.gitignore`, `SECRETS.md` and `siliconpath-credentials.txt` remain in the local root directory, violating the mandate in `AGENTS.md` ("Keep root clean — only README.md, AGENTS.md, LICENSE, code, and config"). Furthermore, `siliconpath-credentials.txt` was tracked in git commit `a4cdf529` before deletion in `bc96d89`.

- **Impact:**
  Any full clone of the git repository could recover historical credentials from git log.

- **Remediation:**
  Confirm that all credentials present in historical commits have been rotated in production dashboards. Move local secret reference files out of the repository root into a secure external keystore or password manager.

---

### [P3 - LOW] CODE-01 & PERF-01: Admin Performance Route Auth Inconsistency & React Hooks

- **Affected Files:**
  - `frontend/src/app/api/admin/performance/route.ts:6-9`
  - `frontend/src/components/profile/PublicProfile.tsx:104`
  - `frontend/src/components/profile/ProfileEditor.tsx:158`

- **Root Cause Analysis:**
  - `performance/route.ts` is the only admin endpoint using `createClient()` with cookie auth rather than `requireAdmin()`.
  - ESLint reports missing dependencies in `useEffect` in `PublicProfile.tsx` and raw `<img>` tags in `ProfileEditor.tsx`.

- **Impact:**
  Minor inconsistency in admin telemetry access; potential image rendering inefficiency.

- **Remediation:**
  Standardize `performance/route.ts` to use `requireAdmin(request)`. Add `next/image` to profile components.

---

## 4. Remediation Plan & Next Steps

```
┌───────────────────────────────────────────────────────────────────────────┐
│                      REMEDIATION ROADMAP & EXECUTION                      │
├───────────────────────────────────────────────────────────────────────────┤
│ STEP 1: FIX CRITICAL SECURITY & IDOR (SEC-01)                             │
│ • Remove user_metadata from all role & admin authorization checks.        │
│ • Strip user_metadata role references from Supabase RLS migrations.       │
├───────────────────────────────────────────────────────────────────────────┤
│ STEP 2: FIX ADMIN CONSOLE LOCKOUT (AUTH-01)                              │
│ • Exempt /api/admin/auth in frontend/src/middleware.ts.                   │
│ • Add HMAC bearer token validation to middleware.                         │
├───────────────────────────────────────────────────────────────────────────┤
│ STEP 3: UNBLOCK OPPORTUNITY PIPELINE & FIX TESTS (PIPE-01 & TEST-01)     │
│ • Update availability.test.ts to match pending exclusion semantics.       │
│ • Establish auto-verification rule for trusted institutional scrapers.    │
├───────────────────────────────────────────────────────────────────────────┤
│ STEP 4: MONOREPO TOOLING & RATE LIMIT HARDENING (TOOL-01 & SEC-02)        │
│ • Add "typecheck": "tsc --noEmit" to frontend/package.json.               │
│ • Add TTL key cleanup to backend/api rate-limiter memoryStore.            │
├───────────────────────────────────────────────────────────────────────────┤
│ STEP 5: DEVOPS, DOCKER & REALITY SYNC (DEVOPS-01 & DOC-01)                │
│ • Update frontend/next.config.mjs with output: "standalone".              │
│ • Reconcile project-bible/ARCHITECTURE.md with consolidated DB1 reality.  │
└───────────────────────────────────────────────────────────────────────────┘
```

---

*Report filed in accordance with `AGENTS.md` mandate.*
