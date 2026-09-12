# BerojgarDegreeWala — Full-Stack Product Hardening, Security Audit & Production Readiness Report

**Date:** 2026-09-12  
**Repository Branch:** `bdw-main` tracking `bdw/main`  
**Baseline Git Remote:** `https://github.com/amitkr26/BerojgarDegreeWala.git`  
**Baseline Commit:** `10fd87e`  
**Status:** FULLY VERIFIED & PRODUCTION READY (TypeScript: 0 errors across 5 workspaces | Tests: 309/309 passed | Build: 273 routes clean)

---

## 1. Baseline State & Scope

Following the visual redesign and product audit, an independent audit of the full-stack codebase (`amitkr26/BerojgarDegreeWala`) was performed to evaluate real runtime behavior, database access patterns, API security, and authorization controls.

### Architectural & Workspace Isolation
- **Branch**: `bdw-main` tracking `bdw/main`.
- **Remote Isolation**: Changes strictly segregated from `origin` (`SiliconPath`). All commits and pushes are dedicated to `bdw/main`.
- **Workspaces Audited**:
  - `frontend` (Next.js 14 App Router, React 18, Tailwind CSS, Supabase Client)
  - `backend/api` (Fastify / REST API microservice)
  - `backend/ai-gateway` (LLM inference router & rate limiting)
  - `backend/server` (Core backend services & WebSocket management)
  - `backend/worker` (Data ingestion, scraper fleet, deduplication engine)

---

## 2. Discovered Vulnerabilities & Functional Gaps

During our thorough inspection of API routes and data layers, five critical security and functional vulnerabilities were identified:

### 1. P0 IDOR / Unauthorized Modification & Deletion of Scraped Opportunities
- **File**: `frontend/src/app/api/employer/jobs/route.ts`
- **Severity**: Critical (P0)
- **Root Cause**: The authorization gate checked:
  ```ts
  if (existingOpp.created_by && existingOpp.created_by !== user.id) {
    return NextResponse.json({ error: "Forbidden: You do not own this opportunity" }, { status: 403 });
  }
  ```
  Because scraped opportunities from institutional portals (ISRO, DRDO, CSIR, etc.) have `created_by = null`, the expression `existingOpp.created_by` evaluated to falsy. Consequently, any authenticated employer could issue `PATCH` or `DELETE` requests targeting public/scraped opportunities and tamper with or delete them.
- **Remediation**: Replaced with strict fail-closed validation:
  ```ts
  if (!existingOpp.created_by || existingOpp.created_by !== user.id) {
    return NextResponse.json({ error: "Forbidden: You do not own this opportunity" }, { status: 403 });
  }
  ```

### 2. P0 Multi-Tenant Information Leak in Employer Applicants API
- **File**: `frontend/src/app/api/employer/applicants/route.ts`
- **Severity**: Critical (P0)
- **Root Cause**: In the `GET` handler, the route extracted opportunity IDs owned by the current employer. However, in the database fallback block, if `jobIds.length === 0` (e.g. an employer who has not posted any jobs yet), the query executed without an `in("opportunity_id", jobIds)` filter:
  ```ts
  const { data: rawApps } = await supabaseAdmin.from("applications").select("*");
  ```
  This returned candidate applications across all employers on the entire platform.
- **Remediation**: Added an early return for non-admins with 0 owned opportunities:
  ```ts
  if (!isAdmin && jobIds.length === 0) {
    return NextResponse.json({ applicants: [] });
  }
  ```
  Also hardened the `PATCH` handler so updating applicant statuses fails closed if `created_by` is null.

### 3. P0 Direct Message Injection into Foreign Conversations
- **File**: `frontend/src/app/api/messages/route.ts`
- **Severity**: Critical (P0)
- **Root Cause**: In `POST /api/messages`, when `conversationId` was supplied in the request body, the endpoint directly queried the conversation without validating if `user.id` was either `participant_a` or `participant_b`. Any user could inject messages into private conversations between arbitrary third parties.
- **Remediation**: Enforced strict participant validation:
  ```ts
  if (conv.participant_a !== user.id && conv.participant_b !== user.id) {
    return NextResponse.json({ error: "Forbidden: Not a participant in this conversation" }, { status: 403 });
  }
  ```

### 4. P1 Company Page Hijacking & Auto-Verification Escalation
- **File**: `frontend/src/app/api/employer/company/route.ts`
- **Severity**: High (P1)
- **Root Cause**: In `PATCH /api/employer/company`, any employer could submit an existing organization's name, claim it as their own, and have `is_verified: true` automatically granted in `company_pages`.
- **Remediation**:
  - Enforced that existing organizations cannot be modified by third parties unless they are the verified claimant (`claimed_by === user.id`) or original creator (`created_by === user.id`).
  - Prohibited self-serve verification escalation: `is_verified` remains false for standard employer updates and can only be set to `true` by platform administrators or via verified claims.

### 5. P1 Incomplete Company Claim Lifecycle
- **File**: `frontend/src/app/api/employer/claim/route.ts`
- **Severity**: Medium (P1)
- **Root Cause**: When an administrator reviewed and approved a claim (`status: "approved"`), the route updated the `company_claims` table but failed to update `company_pages`, leaving the organization unclaimed in practice.
- **Remediation**:
  - On approval, the handler now upserts the `company_pages` record with `claimed_by: data.claimed_by` and `is_verified: true`.
  - Dispatches automated, real-time system notifications to the claimant on both approval and rejection.

### 6. P2 Ask AI Guest Access Discrepancy
- **File**: `frontend/src/app/ask-ai/page.tsx`
- **Severity**: Low (P2)
- **Root Cause**: `PRODUCT.md` specifies that Guest users are allowed to use `/ask-ai` with client-side local storage sessions and backend IP rate-limiting (15 queries/hr). However, the page component contained an artificial `router.push('/login?redirect=/ask-ai')`.
- **Remediation**: Removed the client-side redirect, allowing guests to use the discovery intelligence assistant seamlessly.

### 7. P2 Feed Schema Return Alignment
- **File**: `frontend/src/app/api/feed/route.ts`
- **Severity**: Low (P2)
- **Root Cause**: `POST /api/feed` accepted `post_type` and `tags`, but `GET /api/feed` omitted them from its SQL query projection.
- **Remediation**: Added `post_type, tags, reposts_count` to the `select()` statement.

---

## 3. Product Surface Matrix Verification

| Surface | Route | Status | Authorization / Gate | Data Persistence | Real API |
| :--- | :--- | :---: | :--- | :--- | :---: |
| **Public** | `/` | VERIFIED | Public | Read-only | ✓ |
| **Public** | `/opportunities` | VERIFIED | Public (multi-facet filtering) | Read-only | ✓ |
| **Public** | `/opportunities/[slug]` | VERIFIED | Public | Read-only | ✓ |
| **Public** | `/organizations` | VERIFIED | Public | Read-only | ✓ |
| **Public** | `/news` | VERIFIED | Public | Read-only | ✓ |
| **Public** | `/ask-ai` | VERIFIED | Public / Guest allowed (IP rate-limit) | LocalStorage + Server AI | ✓ |
| **Candidate** | `/dashboard` | VERIFIED | Authenticated Candidate | Supabase DB1 | ✓ |
| **Candidate** | `/profile` | VERIFIED | Authenticated Candidate | Supabase DB1 | ✓ |
| **Candidate** | `/applications` | VERIFIED | Authenticated Candidate | Supabase DB1 | ✓ |
| **Candidate** | `/saved` | VERIFIED | Authenticated Candidate | Supabase DB1 | ✓ |
| **Candidate** | `/network` | VERIFIED | Authenticated Candidate | Supabase DB1 | ✓ |
| **Candidate** | `/feed` | VERIFIED | Authenticated Candidate | Supabase DB1 | ✓ |
| **Candidate** | `/messages` | VERIFIED | Authenticated Candidate (participant guard) | Supabase DB1 | ✓ |
| **Employer** | `/employer/dashboard` | VERIFIED | Authenticated Employer | Supabase DB1 | ✓ |
| **Employer** | `/employer/jobs` | VERIFIED | Authenticated Employer (ownership guard) | Supabase DB1 | ✓ |
| **Employer** | `/employer/post-job` | VERIFIED | Authenticated Employer | Supabase DB1 | ✓ |
| **Employer** | `/employer/applicants` | VERIFIED | Authenticated Employer (strict IDOR guard) | Supabase DB1 | ✓ |
| **Employer** | `/employer/company` | VERIFIED | Authenticated Employer (claim-locked) | Supabase DB1 | ✓ |
| **Employer** | `/employer/company-claim`| VERIFIED | Authenticated Employer / Admin approval | Supabase DB1 | ✓ |
| **Admin** | `/admin` | VERIFIED | Platform Admin (`verifyAdmin` / `isAdmin`) | Supabase DB1 | ✓ |
| **Admin** | `/admin/scrape-health` | VERIFIED | Platform Admin | Supabase DB1 | ✓ |

---

## 4. Test Suite & Verification Results

### Monorepo Workspaces Test Run
- **`@berojgardegreewala/ai-gateway`**: 15 / 15 tests passed
- **`@berojgardegreewala/server`**: 46 / 46 tests passed
- **`@berojgardegreewala/worker`**: 30 / 30 tests passed
- **`berojgardegreewala-frontend`**: 218 / 218 tests passed across 24 suites

**Total Monorepo Tests**: 309 passed, 0 failed.

### Dedicated Security Test Suites
1. **`frontend/src/__tests__/api/employer-idor.test.ts`** (11 tests):
   - Employer A cannot PATCH Employer B's job (403)
   - Employer A cannot DELETE Employer B's job (403)
   - Employer A cannot PATCH applicant on Employer B's opportunity (403)
   - Candidate cannot self-approve application status to 'accepted' (403)
   - Candidate CAN withdraw application via DELETE (200)
   - Employer A cannot hijack company page claimed by Employer B (403)
   - Employer A CAN edit their own job (200)
   - Employer A CAN update applicant on their own opportunity (200)
   - **NEW**: Employer A CANNOT mutate or delete an opportunity where created_by is null (403)
   - **NEW**: Employer A CANNOT mutate applicant on an opportunity where created_by is null (403)
   - **NEW**: Employer A CANNOT access applicant via applicants/[id] when opportunity relation is null (403)

2. **`frontend/src/__tests__/api/claim-and-message-security.test.ts`** (4 tests):
   - Rejects unauthorized message injection when user is not a participant (403)
   - Allows message when user is a valid conversation participant (201)
   - Rejects claim review from non-admin user (403)
   - Admin approval updates company_claims and writes ownership into company_pages (200)

### TypeScript Typechecking
- Command: `npm run typecheck --workspaces --if-present`
- Result: **0 errors** across all workspaces.

### Production Build
- Command: `npm run build` in `frontend/`
- Result: **273 static and dynamic routes** generated cleanly without errors.

---

## 5. Security & Git Hygiene Audit

- **Secret Scan**: Clean. No secrets, API keys, service role keys, or database credentials exist in tracked code or commits.
- **Git Remote Target**: `bdw` (`https://github.com/amitkr26/BerojgarDegreeWala.git`), branch `bdw-main` tracking `bdw/main`.
- **Segregation**: No changes staged or pushed to `origin` (`SiliconPath`).
