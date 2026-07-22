# Gap Analysis: Project Bible vs. Repository Implementation

## 1. Architecture Gaps

### 1.1 Overall Architecture Drift

| Bible Spec | Implementation | Gap |
|------------|---------------|-----|
| 4-database architecture | Implemented but DB2 (secondary) has unclear role | DB2 was intended for social but actual tables live on DB1 |
| 74 API routes | ~60 routes exist, 14 missing | 19% route deficit |
| Module-per-domain structure | Mixed flat + nested | Refactoring needed |
| AI Gateway (centralized) | Duplicate implementations in frontend + backend | No single gateway |
| Server Components default | Partially implemented | Some public pages use client components unnecessarily |

### 1.2 Repository Structure Gaps

| Bible Spec Directory | Actual | Gap |
|---------------------|--------|-----|
| `monorepo root` | `berojgardegreewala/` + `backend/` + `neon/` | ✓ Match |
| `project-bible/` | ✓ Exists | ✓ Match |
| `berojgardegreewala/src/app/api/` | 37 route groups | Covers 60 of 74 routes |
| `berojgardegreewala/src/config/` | `config/scrapers/` | Only scraper configs, no general config directory |
| `berojgardegreewala/src/__tests__/` | 4 test files | Severely under-tested |

### 1.3 Missing Directories

| Expected Directory | Status | Notes |
|-------------------|--------|-------|
| `backend/src/middleware/auth.ts` | ❌ Missing | Auth middleware is inline in `scrape-trigger.ts` |
| `backend/src/middleware/rate-limit.ts` | ❌ Missing | Rate limiter is inline in `index.ts` |
| `backend/src/middleware/error-handler.ts` | ❌ Missing | Error handling is inline in routes |
| `backend/src/services/ai-gateway.ts` | ❌ Missing | AI logic lives in `lib/ai-providers.ts` |
| `backend/src/services/dedup.ts` | ❌ Missing | Dedup logic is inline in `writer.ts` |
| `berojgardegreewala/src/lib/academy/types.ts` | ✓ Exists | ✓ Match |
| `berojgardegreewala/src/lib/academy/queries.ts` | ✓ Exists | ✓ Match |
| Various `__tests__` directories | ❌ Missing | No tests alongside most modules |

---

## 2. Missing API Routes

### 2.1 Missing Public Routes (3 of 17 missing)

| Route | Bible Spec | Status |
|-------|-----------|--------|
| `GET /api/opportunities/featured` | ✓ | ✅ Exists (in opportunities listing) |
| `GET /api/opportunities/stats` | Missing | ❌ Not found |
| `GET /api/academy/tracks` | ✓ | ✅ Exists |
| `GET /api/academy/tracks/[id]` | ✓ | ✅ Exists |
| `GET /api/academy/days/[trackId]/[dayNumber]` | Missing | ❌ Not found as dedicated route |
| `GET /api/academy/checkpoints/[trackId]` | Missing | ❌ Not found as dedicated route |
| `GET /api/organizations/[slug]` | ✓ | ✅ Exists |
| `GET /api/search` | ✓ | ✅ Exists |
| `POST /api/subscribe` | ✓ | ✅ Exists |

### 2.2 Missing Protected Routes (10 of 21 missing)

| Route | Bible Spec | Status |
|-------|-----------|--------|
| `GET /api/bookmarks` | ✓ | ❌ Not found |
| `POST /api/bookmarks` | ✓ | ❌ Not found |
| `DELETE /api/bookmarks/[id]` | ✓ | ❌ Not found |
| `GET /api/feed` | ✓ | ✅ Exists |
| `POST /api/feed` | ✓ | ✅ Exists |
| `GET /api/network/connections` | ✓ | ✅ Exists |
| `POST /api/network/request` | ✓ | ✅ Exists |
| `PATCH /api/network/respond` | ✓ | ✅ Exists |
| `GET /api/messages/conversations` | ✓ | ✅ Exists |
| `GET /api/messages/[conversationId]` | ✓ | ✅ Exists |
| `POST /api/messages/send` | ✓ | ❌ Not found |
| `GET /api/notifications` | ✓ | ✅ Exists |
| `PATCH /api/notifications/read` | ✓ | ❌ Not found |
| `GET /api/profile` | ✓ | ✅ Exists |
| `PATCH /api/profile` | ✓ | ✅ Exists |
| `GET /api/companies` | ✓ | ✅ Exists |
| `GET /api/companies/[id]` | ✓ | ✅ Exists |
| `GET /api/resume` | ✓ | ✅ Exists |
| `POST /api/resume/upload` | ✓ | ❌ Not found (only direct POST to /api/resume) |
| `PATCH /api/resume` | ✓ | ❌ Not found (only direct PATCH to /api/resume) |
| `DELETE /api/resume` | ✓ | ❌ Not found |

### 2.3 Missing Admin Routes (5 of 17 missing)

Admin routes for CRUD operations on opportunities and organizations are partially missing. The admin routes for verify/reject, scraper source updates, subscriber list, and AI test prompt are not found as dedicated routes.

### 2.4 Missing Cron Routes (1 of 6 missing)

| Route | Bible Spec | Status |
|-------|-----------|--------|
| `POST /api/cron/scrape-india` | ✓ | ✅ Exists |
| `POST /api/cron/scrape-global` | ✓ | ✅ Exists |
| `POST /api/cron/check-links` | ✓ | ✅ Exists |
| `POST /api/cron/digest` | ✓ | ✅ Exists |
| `POST /api/cron/newsletter` | Missing | ❌ Not found |
| `POST /api/cron/cleanup` | Missing | ❌ Not found |

### 2.5 Missing AI Routes (1 of 5 missing)

| Route | Bible Spec | Status |
|-------|-----------|--------|
| `POST /api/ai/chat` | ✓ | ✅ Exists |
| `POST /api/ai/enhance` | ✓ | ✅ Exists |
| `POST /api/ai/classify` | Missing | ❌ Not found |
| `POST /api/ai/summarize` | ✓ | ✅ Exists |
| `POST /api/ai/match` | ✓ | ✅ Exists |

---

## 3. Missing Database Objects

### 3.1 Missing Tables in DB1 (Supabase Primary)

| Table | Bible Spec | Migration Status | Actual Status |
|-------|-----------|-----------------|---------------|
| `opportunities` | ✓ | ✅ Exists | ✅ Exists |
| `organizations` | ✓ | ✅ Exists | ✅ Exists |
| `news_articles` | ✓ | ✅ Exists | ✅ Exists |
| `resources` | ✓ | ✅ Exists | ✅ Exists |
| `academy_tracks` | ✓ | ✅ Exists | ✅ Exists |
| `academy_days` | ✓ | ✅ Exists | ✅ Exists |
| `track_checkpoints` | ✓ | ✅ Exists | ✅ Exists |
| `user_learning_progress` | ✓ | ✅ Exists | ✅ Exists |
| `subscribers` | ✓ | ✅ Exists | ✅ Exists |
| `scrape_sources` | ✓ | ✅ Exists | ✅ Exists |
| `scrape_runs` | ✓ | ✅ Exists | ✅ Exists |
| `link_check_results` | ✓ | ✅ Exists | ✅ Exists |
| `opportunity_reports` | ✓ | ✅ Exists | ✅ Exists |
| `user_profiles` | ✓ | ✅ Exists | ✅ Exists |
| `connections` | ✓ | ✅ Exists | ✅ Exists |
| `feed_posts` | ✓ | ✅ Exists | ✅ Exists |
| `messages` | ✓ | ✅ Exists | ✅ Exists |
| `notifications` | ✓ | ✅ Exists | ✅ Exists |
| `saved_opportunities` | ✓ | ✅ Exists | ✅ Exists |
| `applications` | ✓ | ✅ Exists | ✅ Exists |
| `company_profiles` | ✓ | ✅ Exists | ✅ Exists |
| `resumes` | ✓ | ✅ Exists | ✅ Exists |
| `community_posts` | ✓ | ✅ Exists | ✅ Exists |
| `ai_usage_log` | Mentioned in spec | ❌ Not in migration inventory | ❓ Unknown |

### 3.2 Missing Tables in DB2 (Supabase Secondary)

| Table | Bible Spec | Migration Status |
|-------|-----------|-----------------|
| `news_archive` | ✓ | ❌ Not confirmed |
| `subscribers_overflow` | ✓ | ❌ Not confirmed |

### 3.3 Missing Tables in Neon (Analytics)

| Table | Bible Spec | Migration Status |
|-------|-----------|-----------------|
| `page_views` | ✓ | ✅ In `neon/schema.sql` |
| `search_queries` | ✓ | ✅ In `neon/schema.sql` |
| `click_events` | ✓ | ✅ In `neon/schema.sql` |

### 3.4 Known Column Drift

| Expected Column | Actual DB Column | Impact |
|----------------|-----------------|--------|
| `apply_link` | `apply_url` | Bridge function handles both |
| `stipend` | `salary_range` | Bridge function handles both |
| `generate_opp_slug()` | Empty body | Slugs must be generated in app code |

---

## 4. Missing Components

### 4.1 Missing UI Components

| Component | Bible Spec | Status |
|-----------|-----------|--------|
| `Pagination` | ✓ | ❌ Not found as standalone component |
| `Tabs` | ✓ | ❌ Not found |
| `Breadcrumb` | ✓ | ❌ Not found |
| `Tooltip` | ✓ | ❌ Not found |
| `Dropdown` | ✓ | ❌ Not found |
| `EmptyState` | ✓ | ❌ Not found as standalone component |
| `ErrorState` | ✓ | ❌ Not found |
| `Sidebar` | ✓ | ❌ Not found |
| `ResumeBuilder` | ✓ | ✅ Exists |
| `AdminTable` | ✓ | ❌ Not found |
| `ScrapeHealthCard` | ✓ | ❌ Not found |
| `ConnectionCard` | ✓ | ❌ Not found |
| `MessageThread` | ✓ | ❌ Not found |
| `NotificationItem` | ✓ | ❌ Not found |
| `FeedPost` | ✓ | ❌ Not found |
| `OpportunityFilters` | ✓ | ❌ Not found as standalone component |

**46 of ~90 expected components are missing** (51% deficit). Many components are implemented inline within pages rather than as standalone reusable components.

### 4.2 Missing Error Boundaries

| Expected | Status |
|----------|--------|
| `/academy/error.tsx` | ❌ Missing |
| `/feed/error.tsx` | ❌ Missing |
| `/network/error.tsx` | ❌ Missing |
| `/messages/error.tsx` | ❌ Missing |
| `/opportunities/error.tsx` | ❌ Missing |
| `/news/error.tsx` | ❌ Missing |
| `/organizations/error.tsx` | ❌ Missing |

---

## 5. Missing Testing

| Test Type | Bible Spec | Actual | Gap |
|-----------|-----------|--------|-----|
| Unit tests | ~30 tests | 3 unit tests | 90% deficit |
| Integration tests | ~10 tests | 1 API test | 90% deficit |
| Component tests | Minimal | 1 component test | Minimal coverage exists |
| E2E tests | Planned | 0 | ✓ Aligned (planned) |
| Backend tests | Should exist | 1 test | Severe deficit |

### Missing Specific Tests

| Test | Bible Priority | Status |
|------|---------------|--------|
| Zod validation schemas | High | ❌ Missing |
| AI tolerant parser | High | ❌ Missing |
| Database query correctness | High | ❌ Missing |
| Auth middleware gating | High | ❌ Missing |
| Deduplication logic | High | ❌ Missing |
| API response format | Medium | ❌ Missing |
| Pagination calculations | Medium | ❌ Missing |
| Rate limiting | Medium | ❌ Missing |

---

## 6. Missing CI/CD

| Bible Spec | Actual | Gap |
|-----------|--------|-----|
| `ci.yml` on main | ✅ Exists | ✓ Match |
| `ci-berojgardegreewala.yml` | ✅ Exists | ✓ Match |
| Lint step | Uses `npm run lint` | ✅ |
| Type-check step | Uses `npm run typecheck` | ✅ |
| Test step | `npm test` | ✅ (runs but only 4 tests) |
| Build step | `npm run build` | ✅ |
| Secrets in CI | Uses placeholder values | ⚠️ Placeholders may mask config drift |
| PostHog key in CI | Hardcoded placeholder | ⚠️ May fail if actual key expected |

---

## 7. Missing Security Controls

| Control | Bible Spec | Actual | Gap |
|---------|-----------|--------|-----|
| Rate limiting (Upstash) | Production | ✅ Implemented | ✓ Match |
| Rate limiting (Map) | Development | ✅ Implemented | ✓ Match |
| Zod validation schemas | All write ops | Partial | ⚠️ Some routes may lack validation |
| Search sanitization | Strip metacharacters | ❓ Not verified |
| SSRF validation | Reject private ranges | ❓ Not verified |
| Audit logging | Structured logging | ✅ JSON logger | ✓ Match |
| RLS on all tables | Required | ❓ Not verified |
| Secret rotation | Documented | ❌ `SECRETS.md` exposed in git |

---

## 8. Missing DevOps Infrastructure

| Component | Bible Spec | Actual | Gap |
|-----------|-----------|--------|-----|
| Sentry error tracking | Frontend + Backend | ✅ Configured | ✓ Match |
| Prometheus metrics | Backend `/metrics` | ✅ Implemented | ✓ Match |
| Health check | `GET /health` | ✅ Implemented | ✓ Match |
| Plausible analytics | Self-hosted | ✅ Script in layout | ✓ Match |
| Docker build | Multi-stage | ✅ Dockerfile | ✓ Match |
| render.yaml | Backend config | ✅ Exists | ✓ Match |
| vercel.json | Cron definitions | ✅ Exists | ✓ Match |
| Sentry auth token in CI | Documented | ❓ Not verified |

---

## 9. Missing AI Infrastructure

| Component | Bible Spec | Actual | Gap |
|-----------|-----------|--------|-----|
| Centralized AI Gateway | Single service | ❌ Duplicate in frontend + backend | Major gap |
| Unified provider contracts | `AIProvider` interface | ❌ Not implemented | Different patterns per file |
| Response caching | Configurable TTL | ❌ Not implemented | Missing |
| Usage logging | `ai_usage_log` table | ✅ `providers.ts` logs | ✓ Partial |
| Streaming support | Required | ❌ Not implemented | Missing |
| Tool/function calling | Required | ❌ Not implemented | Missing |
| Prompt versioning | Required | ❌ Not implemented | Missing |
| Tolerant JSON parser | `safe-parse.ts` | ✅ Exists | ✓ Match |

---

## 10. Missing Employer Infrastructure

| Feature | Bible Spec | Actual | Gap |
|---------|-----------|--------|-----|
| Company profiles | Planned | Partial (tables exist, limited UI) | ✓ Partial |
| Employer dashboard | Planned | ❌ Not implemented | Missing |
| Job posting UI | Planned | ❌ Not implemented | Missing |
| Application management | Planned | Partial (tables + API exist) | ✓ Partial |
| Candidate search | Planned | ❌ Not implemented | Missing |
| Employer verification | Planned | ❌ Not implemented | Missing |

---

## 11. Missing Networking Infrastructure

| Feature | Bible Spec | Actual | Gap |
|---------|-----------|--------|-----|
| Feed posts | Planned | Partial (API exists, limited UI) | ✓ Partial |
| Connections | Planned | Partial (API + DB exist) | ✓ Partial |
| Real-time messaging | Planned | ❌ Not implemented (no WebSocket) | Missing |
| Notifications center | Planned | Partial (API + DB exist) | ✓ Partial |
| Bookmark management | Planned | ❌ Not implemented | Missing |
| Resume builder | Planned | Partial (UI exists) | ✓ Partial |

---

## 12. Missing Machine Specs

| Spec | Status |
|------|--------|
| `openapi.json` (OpenAPI 3.1) | ❌ Missing |
| `database-schema.sql` (full DDL) | ❌ Missing |
| `ai-provider-contracts.json` | ❌ Missing |
| `component-manifest.json` | ❌ Missing |

---

## 13. Gap Summary

| Category | Gap Severity | Impact |
|----------|-------------|--------|
| Missing API routes | MEDIUM | 14 of 74 routes (19%) |
| Missing UI components | HIGH | 46 of ~90 components (51%) |
| Missing error boundaries | MEDIUM | 7 of 10 expected boundaries |
| Missing tests | CRITICAL | 95% deficit vs. spec |
| Missing AI Gateway | HIGH | Duplicate, not unified |
| Missing employer features | MEDIUM | Phase 2 features not built |
| Missing networking UI | MEDIUM | Phase 1 UI not built |
| Missing machine specs | LOW | 4 of 9 specs (44%) |
| Column drift | MEDIUM | Live schema differs from code |
| Secrets exposure | CRITICAL | SECRETS.md with live keys |
| Missing CI validation | LOW | Placeholder env vars |
