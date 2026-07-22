# Architecture Validation

## 1. Two-Database Supabase Architecture

### Specification
- DB1: Core platform data + Social data
- DB2: Archive/overflow (news_archive, subscribers_overflow)
- No cross-database joins (application-level joining)

### Validation Result: ⚠️ PARTIALLY VALID

**Observations:**
- DB1 operates correctly with the `@supabase/supabase-js` client in both frontend and backend
- DB2 exists as a Supabase project but its role has shifted from original spec
- The architecture doc says social data is on DB2, but the actual route handlers point to DB1
- DB2 is effectively used only for `news_archive` and `subscribers_overflow`

**Issues:**
1. The role of DB2 is unclear — originally intended for social, now effectively an archive
2. No active queries from the application use DB2 for reads (only archive writes from cron)
3. The dual Supabase setup adds complexity without proportional benefit

**Recommendation:**
- Consolidate DB2's archive tables into DB1 (Supabase free tier has 500MB, current usage is ~150MB)
- Remove DB2 dependency unless there's a proven need for the overflow capacity
- Update documentation to reflect actual DB2 usage

---

## 2. Two-Database Neon Architecture

### Specification
- Neon 1: Analytics (page_views, search_queries, click_events)
- Neon 2: Cache/background processing (schema not fully defined)

### Validation Result: ⚠️ PARTIALLY VALID

**Observations:**
- Neon 1 is configured with `schema.sql` defining the three analytics tables
- Neon 2 connection is configured but its schema is not defined in the repo
- Both Neon instances are accessible from the backend (`neon` npm package)
- Health checks confirm both Neon databases are connected

**Issues:**
1. Neon 2 has no schema definition in the repository
2. The purpose of Neon 2 is unclear (cache? background queue? search?)
3. No active queries against Neon 2 were found in the codebase

**Recommendation:**
- Define Neon 2 schema explicitly or remove it if unused
- If used for caching, document the cache eviction strategy
- Consider whether Neon's free tier (0.5GB compute) can handle both analytics workloads

---

## 3. AI Gateway Architecture

### Specification
- Centralized AI Gateway through which ALL AI requests pass
- 7-provider fallback chain: Groq → OpenRouter → Cloudflare → Gemini → Bedrock → HuggingFace → NVIDIA
- Unified `AIProvider` interface with `call()`, `isAvailable()`, `getQuota()`
- Response caching, usage logging, streaming support, prompt versioning
- Tolerant JSON parser (never bare `JSON.parse()`)

### Validation Result: ❌ NOT VALID

**Issues:**

| Requirement | Current State | Gap |
|------------|---------------|-----|
| Centralized single service | Two implementations (frontend + backend) | ❌ Duplicate |
| Unified provider interface | No shared interface | ❌ Missing |
| Response caching | Not implemented | ❌ Missing |
| Streaming support | Not implemented | ❌ Missing |
| Prompt versioning | Not implemented | ❌ Missing |
| Tolerant parser | ✅ `safe-parse.ts` exists | ✓ |
| Usage logging | ✅ `log_ai_usage()` exists | ✓ |
| Cooldown system | ✅ Implemented | ✓ |

**Frontend Implementation** (`src/lib/ai/providers.ts`):
- 7 providers with fallback chain
- Provider-specific env var checks
- Cooldown system (60s default, 300s for errors)
- Usage logging to `log_ai_usage()`
- Tolerant parsing via `safe-parse.ts`

**Backend Implementation** (`backend/src/lib/ai-providers.ts`):
- Similar 7-provider chain
- Different cooldown implementation (per-provider timestamps)
- Missing detailed usage logging
- Missing tolerant parser integration

**Recommendation:**
- Extract a shared AI Gateway package (could live in `berojgardegreewala/src/lib/ai/gateway.ts`)
- Backend should import from the shared gateway rather than reimplementing
- Implement true provider interface with TypeScript types
- Add response caching layer
- Store provider contracts in `20-machine-specs/ai-provider-contracts.json`

---

## 4. Queue Architecture

### Specification
- The Project Bible does not explicitly define a queue architecture
- Implicit queue: Vercel Cron → Backend scraper (synchronous HTTP call)
- No message queue (Redis, RabbitMQ, SQS) is specified

### Validation Result: ⚠️ IMPLICIT ONLY

**Current Implementation:**
- Vercel Cron triggers POST to backend `/scrape/run`
- Backend orchestrator runs with concurrency limit (5 simultaneous)
- No explicit queue — jobs are executed inline within the HTTP request
- Backpressure: when queue exceeds 20 sources, new jobs are queued (in-memory)

**Issues:**
1. No persistent queue (lost on backend restart)
2. HTTP request timeout could kill in-progress scrape jobs
3. No job retry mechanism beyond in-memory retry
4. No job prioritization (all sources treated equally)

**Recommendation:**
- If queue is needed, use Neon 2 as a job queue with PostgreSQL SKIP LOCKED
- Alternatively, implement in-memory queue with database persistence
- For Phase 0/1, the current implicit queue may be sufficient

---

## 5. Worker Architecture

### Specification
- Not explicitly defined as separate worker processes
- Backend serves as both API server and scrape worker
- Cron tasks run in-process within the backend

### Validation Result: ⚠️ BASIC

**Current Implementation:**
- Single Express.js process handles both API and scraping
- `node-cron` runs scheduled tasks in-process
- No separate worker pool
- No worker-specific monitoring

**Issues:**
1. No separation between API serving and compute-heavy scraping
2. A large scrape job could block API responses
3. No graceful shutdown handling for in-progress jobs
4. No worker health monitoring beyond process-level

**Recommendation:**
- Monitor whether the single-process architecture causes performance issues
- If needed, extract scraping into a separate worker process
- For Phase 0, the current architecture is acceptable given free tier constraints

---

## 6. Scraper Architecture

### Specification
- Two-tier: Frontend scrapers (India sources) + Backend scrapers (global sources)
- 7 adapter types: Greenhouse, Lever, Workday, SmartRecruiters, HTML, RSS, Schema.org
- 332+ sources across 17 batches (backend); additional ~100 in frontend
- Data quality pipeline: clean → normalize → deduplicate → infer → filter → insert as pending → verify
- Scheduling: Vercel Cron → Backend, plus node-cron inside backend

### Validation Result: ✅ LARGELY VALID

**Observations:**
- Backend has 500+ sources (exceeds the spec's 332+)
- All 7 adapter types are implemented in the backend
- Data quality pipeline is implemented
- Scheduling is implemented both via Vercel Cron and node-cron
- Orchestrator with concurrency limiting exists

**Issues:**
1. Frontend scrapers duplicate backend adapter logic
2. India-specific scrapers (DRDO, ISRO, CSIR, etc.) should migrate from frontend to backend
3. Frontend source configs (`companies.json`, `institutions.json`) duplicate backend `source-config.ts`
4. No scraper health monitoring beyond the admin dashboard

**Recommendation:**
- Migrate all frontend scrapers to backend
- Consolidate source configurations into backend only
- Add scraper telemetry (success/failure rates per source)
- Verify the `GARBAGE_TITLE_PATTERNS` regex is consistent between frontend and backend

---

## 7. Authentication Architecture

### Specification
- **Provider**: Supabase Auth on DB1
- **Methods**: Email/password, Google OAuth, GitHub OAuth
- **Session**: SSR cookies via `@supabase/ssr` in middleware
- **Admin**: `verifyAdmin()` via header or Bearer token
- **Cron**: `CRON_SECRET` Bearer token
- **Service role**: `supabaseAdmin` bypasses RLS

### Validation Result: ✅ LARGELY VALID

**Observations:**
- `middleware.ts` correctly gates protected routes using Supabase SSR session check
- `admin-auth.ts` implements `verifyAdmin()` with both header and Bearer token support
- `src/lib/supabase/server.ts` implements `createServerClient()` with cookie handling
- `src/lib/supabase/client.ts` implements `createBrowserClient()` for client-side
- API routes use `createRouteHandlerClient()` for serverless API auth

**Issues:**
1. Only 2 OAuth providers supported (Supabase free tier limit)
2. Magic link auth is specified but not implemented
3. No token refresh handling visible in client code
4. `cron-health` route auth mechanism unclear
5. No MFA or additional auth factors

**Recommendation:**
- Add magic link auth (Supabase supports this)
- Verify token refresh is handled (Supabase SSR library should handle this)
- Add rate limiting to admin auth endpoint
- Document the auth flow in a sequence diagram

---

## 8. Validation Summary

| Architecture | Status | Score | Critical Issues |
|-------------|--------|-------|-----------------|
| 2 Supabase DB | ⚠️ Partial | 6/10 | DB2 underutilized, role confusion |
| 2 Neon DB | ⚠️ Partial | 5/10 | DB2 undefined purpose, no schema |
| AI Gateway | ❌ Not valid | 3/10 | Duplicate implementations, no unified interface |
| Queue | ⚠️ Implicit | 4/10 | No persistence, in-memory only |
| Worker | ⚠️ Basic | 5/10 | Single-process, no separation |
| Scraper | ✅ Valid | 8/10 | Duplicate frontend/backend systems |
| Auth | ✅ Valid | 7/10 | Missing magic link, refresh verification |

**Overall Architecture Health: 5.4/10**
