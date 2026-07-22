# Code Quality Analysis: Dead Code, Duplicates, Technical Debt, Anti-Patterns, Security Risks

## 1. Dead Code

### 1.1 Orphaned Configuration Files

| File | Reason | Action |
|------|--------|--------|
| `berojgardegreewala/skills-lock.json` | AI agent skill lock file, not referenced in build | Delete or archive |
| `berojgardegreewala/src/config/scrapers/companies.json` | Duplicated by `backend/src/scrapers/source-config.ts` (backend is primary scraper) | Archive or delete |
| `berojgardegreewala/src/config/scrapers/institutions.json` | Same duplication issue | Archive or delete |
| `berojgardegreewala/public/auth-sync.html` | Static HTML page, purpose unclear | Verify and delete if unused |
| `berojgardegreewala/public/next.svg` | Default Next.js logo, not used in branding | Delete |
| `berojgardegreewala/public/vercel.svg` | Default Vercel logo, not used in branding | Delete |

### 1.2 Orphaned Migration Files

Migrations `20260710_000_reset_core.sql` and `20260710_001_reset_social.sql` are reset migrations that DROP and recreate tables. These should NOT be run in production — they are destructive. They exist alongside regular migration files, creating confusion about the migration order.

### 1.3 Orphaned Test Artifacts

The `.gitignore` blocks `*_test_results.*`, `*_results.json`, `audit_report.*`, `live_test_results.*`, `batch*_results.*` — these patterns exist because such files were previously committed and later removed. The gitignore rules are appropriate but suggest a history of committing test artifacts that should have been excluded.

---

## 2. Duplicate Code

### 2.1 Duplicate Scraper Systems (CRITICAL)

| Aspect | Frontend (`berojgardegreewala/src/lib/scrapers/`) | Backend (`backend/src/scrapers/`) |
|--------|----------------------------------------------|-----------------------------------|
| Adapters | greenhouse, lever, workday, smartrecruiters, rss, html, schema(partial) | greenhouse, lever, workday, smartrecruiters, rss, html, schema |
| Source configs | 70+ companies + 30+ institutions in JSON | 500+ sources in TypeScript |
| Orchestrator | `opportunity-scraper-impl.ts` | `orchestrator.ts` |
| AI providers | `src/lib/ai/providers.ts` | `lib/ai-providers.ts` |

The two scraper systems are largely independent implementations with overlapping functionality. The backend has 500+ sources while the frontend has ~100. The frontend has India-specific scrapers (DRDO, ISRO, CSIR, govt, PSU, Indian academic) that the backend lacks.

**Root cause**: The architecture evolved from a frontend-only monolith to a frontend+backend split, but the scraper code was not fully migrated to the backend.

### 2.2 Duplicate AI Provider Chains (HIGH)

Both `berojgardegreewala/src/lib/ai/providers.ts` and `backend/src/lib/ai-providers.ts` implement the same 7-provider fallback chain with nearly identical logic. This violates the AI Gateway principle and creates maintenance burden.

### 2.3 Duplicate Source Configurations

| Config Source | Format | Count | Overlap |
|--------------|--------|-------|---------|
| `berojgardegreewala/src/config/scrapers/companies.json` | JSON | 70+ | High overlap with backend |
| `berojgardegreewala/src/config/scrapers/institutions.json` | JSON | 30+ | High overlap with backend |
| `backend/src/scrapers/source-config.ts` | TypeScript | 500+ | Master source |

### 2.4 Duplicate Wipe Scripts

`berojgardegreewala/scripts/wipe_data.js` exists alongside `berojgardegreewala/scripts/wipe_data_cjs.js` (which was deleted in cleanup). One should be sufficient.

### 2.5 Duplicate Lock Files

`berojgardegreewala/pnpm-lock.yaml` was present alongside `package-lock.json` (pnpm-lock.yaml was deleted in cleanup). Dual lock files indicate package manager switching.

---

## 3. Technical Debt

### 3.1 Column Drift Between Code and Database (HIGH)

| Issue | Location | Impact |
|-------|----------|--------|
| `apply_link` vs `apply_url` | Multiple opportunity queries | Requires bridge function; confusion about which is canonical |
| `stipend` vs `salary_range` | Multiple opportunity queries | Same issue |
| `generate_opp_slug()` empty body | Supabase DB function | Slugs must be generated in app code |
| `academy_tracks` vs `learning_tracks` | Academy queries | Dual table name fallback adds complexity |

### 3.2 Magic Numbers and Hardcoded Values

| Value | Location | Issue |
|-------|----------|-------|
| `isDisplayableOpportunity()` garbage filter | `src/lib/utils.ts` | Hardcoded regex patterns, not configurable |
| 80% passing score for academy | `src/lib/academy/queries.ts` | Should be configurable per track |
| `day_number = 999` for assessment completion | Academy progress | Magic number, should use a flag |
| 5-minute ISR revalidation | Multiple pages | Hardcoded, should be configurable |
| 120 req/min rate limit | Backend | Could be environment-based |
| 8-second academy timeout | Academy queries | Hardcoded timeout |

### 3.3 Inline Middleware in Backend

The backend's rate limiter, auth middleware, and error handler are all inline in `index.ts` and `scrape-trigger.ts` rather than extracted into `middleware/` directory as specified in the architecture docs. This makes them harder to test and maintain.

### 3.4 Missing Migration Naming Convention

Migration files use inconsistent naming:
- `20260501000001_*.sql` (date-based, 14 digits)
- `20260710_000_reset_*.sql` (date-based, underscore separated)
- `20260704000001_*.sql` (date-based, 14 digits)
- `01_organizations.sql` (seed file, numbered)

This makes it difficult to determine the correct migration order.

### 3.5 Frontend Scrapers Without Backend Migration

The India-specific scrapers (DRDO, ISRO, CSIR, govt, PSU, Indian academic) live in the frontend but should be migrated to the backend where the scraper orchestration lives. This creates an inconsistent architecture where some scraping happens in the frontend API and some in the backend.

### 3.6 AI Provider Key Overload in SECRETS.md

Multiple deprecated/rotated API keys are documented (`OPENROUTER_API_KEY` has 3 versions, `GROQ_API_KEY` has 2, `NVIDIA_NIM_API_KEY` has 2, `RENDER_API_KEY` has 2). Old keys should be removed to reduce confusion.

---

## 4. Anti-Patterns

### 4.1 Supabase Client Singleton Pattern (MEDIUM)

The `src/lib/supabase.ts` creates Supabase client as a module-level singleton:
```typescript
export const supabaseAdmin = createClient(...)
```
This is acceptable for serverless but creates issues in long-running processes (backend). Module-level initialization means any import triggers DB connection.

### 4.2 Feature Flags Module as Switch Statements

`src/lib/feature-flags.ts` uses boolean constants:
```typescript
export const AI_CHAT = process.env.NEXT_PUBLIC_FEATURE_AI_CHAT === "true";
```
These are evaluated at module load time and cannot be changed without restart. Environment-based feature flags are reasonable but the pattern prevents dynamic toggling.

### 4.3 Direct Process.env Access in Route Handlers

Many API routes access `process.env` directly rather than through a centralized configuration module. This makes testing harder (env must be mocked per-test) and creates implicit dependencies.

### 4.4 Missing Error Handling in Some Routes

While many routes use try/catch with `apiError()`, some routes may not handle errors consistently. The lack of a centralized error boundary pattern in API routes means each route implements its own error handling.

### 4.5 Placeholder Values in CI

GitHub Actions workflows use placeholder Supabase values:
```yaml
NEXT_PUBLIC_SUPABASE_URL: "https://placeholder-url.supabase.co"
```
This passes CI but masks configuration errors that would only surface in production.

### 4.6 No ESLint in Backend

The backend has no ESLint configuration. Only the frontend has linting. This means TypeScript errors and style violations in the backend go unchecked.

---

## 5. Scalability Issues

| Issue | Severity | Description |
|-------|----------|-------------|
| Frontend-side scrapers for India sources | MEDIUM | Blocking API routes for scraping; should be delegated to backend |
| In-memory rate limiter (backend) | MEDIUM | Lost on restart; single-instance only |
| No connection pooling config | LOW | Supabase client defaults may not be optimal |
| No pagination on admin lists | LOW | Large datasets may timeout |
| Backend single-instance (Render free) | LOW | Cannot scale horizontally on free plan |

---

## 6. Performance Issues

| Issue | Severity | Description |
|-------|----------|-------------|
| Module-level Supabase client init | LOW | Import triggers DB connection attempt |
| No response compression | LOW | No gzip/brotli for API responses |
| No CDN for static assets | LOW | Vercel provides basic CDN |
| Backend cold starts (~30s) | MEDIUM | Render free tier spins down after inactivity |

---

## 7. Security Risks

### 7.1 CRITICAL: SECRETS.md Exposed

`SECRETS.md` contains 30+ live production credentials including:
- Supabase service role keys (full DB access)
- Neon database URLs (direct DB access)
- AI provider API keys (7+ providers, multiple keys each)
- Vercel deployment token
- Render API keys
- Netlify access token
- Telegram bot token
- Resend email API key
- AWS Bedrock bearer token

This file is now in `.gitignore` but was previously exposed in git history. All credentials should be considered compromised and rotated.

### 7.2 HIGH: No CSRF Protection

The API routes use cookie-based auth (Supabase SSR) but there is no CSRF token validation. While same-origin checks in middleware provide some protection, this is not a complete CSRF mitigation.

### 7.3 MEDIUM: Input Validation Scope

While Zod schemas exist for some write operations, the scope of validation coverage is unclear. Without a comprehensive audit, some endpoints may accept unvalidated input.

### 7.4 MEDIUM: RLS Policy Verification

The project bible states RLS is enabled on all tables, but there are no RLS policy files in the migrations. The actual RLS state on the live database is unknown.

### 7.5 LOW: No Rate Limiting on Admin Routes

The admin authentication uses `ADMIN_PASSWORD` but admin routes may not have rate limiting, making them vulnerable to brute-force attacks.

---

## 8. Summary Table

| Category | Count | Highest Severity |
|----------|-------|-----------------|
| Dead code files | 6 | LOW |
| Duplicate systems | 4 | CRITICAL (scrapers) |
| Technical debt items | 12 | HIGH (column drift) |
| Anti-patterns | 6 | MEDIUM |
| Scalability issues | 5 | MEDIUM |
| Performance issues | 4 | MEDIUM |
| Security risks | 5 | CRITICAL (secrets) |
