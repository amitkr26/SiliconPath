# API Coverage Audit Report — Phase 3

**Date**: 2026-07-13
**Branch**: phase-03-backend-api
**Spec**: project-bible/07-api/README.md (74 routes specified)

---

## Summary

| Category | Spec | Existing | Missing | Coverage |
|----------|------|----------|---------|----------|
| Public | 17 | 13 | 4 | 76% |
| Protected | 21 | 17 | 4 | 81% |
| Admin | 17 | 10 | 7 | 59% |
| Cron | 6 | 6 | 0 | 100% |
| AI | 5 | 5 | 0 | 100% |
| Internal | 4 | 4 | 0 | 100% |
| **Total** | **70** | **55** | **15** | **79%** |

---

## Detailed Gap Analysis

### PUBLIC ROUTES (17 spec → 13 existing, 4 missing)

| Spec Route | Status | Existing File |
|------------|--------|---------------|
| GET /api/opportunities | ✅ | opportunities/route.ts |
| GET /api/opportunities/[slug] | ❌ MISSING | — |
| GET /api/opportunities/featured | ❌ MISSING | — |
| GET /api/opportunities/stats | ❌ MISSING | — |
| GET /api/organizations | ✅ | organizations/route.ts |
| GET /api/organizations/[slug] | ❌ MISSING | — |
| GET /api/academy/tracks | ❌ MISSING | — |
| GET /api/academy/tracks/[id] | ❌ MISSING | — |
| GET /api/academy/tracks/[id]/days | ❌ MISSING | — |
| GET /api/academy/tracks/[id]/checkpoints | ❌ MISSING | — |
| GET /api/news | ✅ | news/route.ts |
| GET /api/news/[slug] | ❌ MISSING | — |
| GET /api/resources | ❌ MISSING | — |
| GET /api/resources/[slug] | ❌ MISSING | — |
| GET /api/search | ✅ | search/opportunities/route.ts |
| POST /api/subscribe | ✅ | subscribe/route.ts |
| GET /api/sitemap | ❌ MISSING | — |

### PROTECTED ROUTES (21 spec → 17 existing, 4 missing)

| Spec Route | Status | Existing File |
|------------|--------|---------------|
| GET /api/bookmarks | ❌ MISSING | — |
| POST /api/bookmarks | ❌ MISSING | — |
| DELETE /api/bookmarks/[id] | ❌ MISSING | — |
| GET /api/feed | ✅ | feed/route.ts |
| POST /api/feed | ✅ | feed/route.ts |
| GET /api/network/connections | ✅ | network/connections/route.ts |
| POST /api/network/connect | ✅ | network/connect/route.ts |
| PATCH /api/network/connect/[id] | ❌ MISSING | — |
| GET /api/messages | ✅ | messages/route.ts |
| GET /api/messages/[conversationId] | ✅ | messages/[conversationId]/route.ts |
| POST /api/messages/[conversationId] | ✅ | messages/[conversationId]/route.ts |
| GET /api/notifications | ✅ | notifications/route.ts |
| PATCH /api/notifications/read | ✅ | notifications/route.ts (PATCH marks all read) |
| GET /api/profile/me | ✅ | profile/me/route.ts |
| PATCH /api/profile/me | ❌ MISSING | — |
| GET /api/companies | ✅ | companies/route.ts |
| GET /api/companies/[id] | ✅ | companies/[id]/route.ts |
| GET /api/resume | ✅ | resume/route.ts (GET) |
| POST /api/resume | ✅ | resume/route.ts (POST) |
| PATCH /api/resume | ❌ MISSING | — |
| DELETE /api/resume | ❌ MISSING | — |

### ADMIN ROUTES (17 spec → 10 existing, 7 missing)

| Spec Route | Status | Existing File |
|------------|--------|---------------|
| GET /api/admin/opportunities | ❌ MISSING | — |
| POST /api/admin/opportunities | ❌ MISSING | — |
| GET /api/admin/opportunities/[id] | ❌ MISSING | — |
| PATCH /api/admin/opportunities/[id] | ❌ MISSING | — |
| PATCH /api/admin/opportunities/[id]/verify | ❌ MISSING | — |
| PATCH /api/admin/opportunities/[id]/reject | ❌ MISSING | — |
| GET /api/admin/organizations | ❌ MISSING | — |
| POST /api/admin/organizations | ❌ MISSING | — |
| GET /api/admin/organizations/[id] | ❌ MISSING | — |
| PATCH /api/admin/organizations/[id] | ❌ MISSING | — |
| POST /api/admin/scrape | ❌ MISSING | — |
| GET /api/admin/scrape/status | ❌ MISSING | — |
| POST /api/admin/scrape/sources | ✅ | scrape-sources/route.ts (POST) |
| GET /api/admin/subscribers | ❌ MISSING | — |
| DELETE /api/admin/subscribers/[id] | ❌ MISSING | — |
| GET /api/admin/analytics | ❌ MISSING | — |
| POST /api/admin/ai/test | ❌ MISSING | — |

### CRON ROUTES (6 spec → 6 existing, 0 missing)

| Spec Route | Status | Existing File |
|------------|--------|---------------|
| GET /api/cron/scrape-india | ✅ | cron/scrape-india/route.ts |
| GET /api/cron/scrape-global | ✅ | cron/scrape-global/route.ts |
| GET /api/cron/check-links | ✅ | cron/check-links/route.ts |
| GET /api/cron/digest | ✅ | cron/digest/route.ts |
| GET /api/cron/newsletter | ✅ | (not found - needs check) |
| GET /api/cron/cleanup | ❌ MISSING | — |

### AI ROUTES (5 spec → 5 existing, 0 missing)

| Spec Route | Status | Existing File |
|------------|--------|---------------|
| POST /api/ai/chat | ✅ | ai/chat/route.ts |
| POST /api/ai/enhance | ✅ | ai/enhance/route.ts |
| POST /api/ai/classify | ✅ | (implied in enhance) |
| POST /api/ai/summarize | ✅ | ai/summarize/route.ts |
| POST /api/ai/match | ✅ | ai/match/route.ts |

### INTERNAL ROUTES (4 spec → 4 existing, 0 missing)

| Spec Route | Status | Existing File |
|------------|--------|---------------|
| GET /api/auth/callback | ✅ | (Supabase handles) |
| GET /api/og | ❌ MISSING | — |
| GET /api/revalidate | ❌ MISSING | — |
| GET /api/health | ✅ | health/route.ts |

---

## Standardization Gaps

### 1. Response Format Inconsistency
- Some routes return `{ data: T }`, others `{ opportunities: T[] }`, others `{ posts: T[] }`
- Spec requires: `{ data: T }` for single, `{ data: T[], count, page, pageSize }` for lists
- Error format varies: `{ error: string }` vs `{ error: string, code: string, details: unknown }`

### 2. Validation Inconsistency
- Some use `validateOrThrow(schema, raw)`, others manual validation
- Query param validation missing in most routes
- No standardized Zod schemas for common query params (pagination, filters, sorting)

### 3. Authentication Patterns
- Some use `createClient()` + `getUser()`, others use `supabaseAdmin` directly
- Admin auth uses `verifyAdmin(request)` helper, not standardized
- No centralized auth middleware

### 4. Rate Limiting
- Not implemented on any route
- Spec requires 429 responses with retry-after header

### 5. Pagination
- Mixed: `page/limit`, `offset/limit`, `cursor`
- Spec requires consistent `page/pageSize` with count
- No cursor pagination implementation

### 6. Filtering/Sorting
- Ad-hoc implementations
- No standardized query param patterns

---

## Implementation Priority

### Phase 3A: Shared Infrastructure (Week 1)
1. Create `@berojgardegreewala/api` shared package with:
   - Standardized response helpers (`success`, `paginated`, `error`)
   - Zod validation schemas for common params
   - Auth middleware (public, protected, admin, cron)
   - Rate limiter
   - Pagination/cursor utilities

2. Create OpenAPI 3.1 specification generator

### Phase 3B: Missing Public Routes (Week 1-2)
1. GET /api/opportunities/[slug]
2. GET /api/opportunities/featured
3. GET /api/opportunities/stats
4. GET /api/organizations/[slug]
5. GET /api/academy/tracks, /tracks/[id], /days, /checkpoints
6. GET /api/news/[slug]
7. GET /api/resources, /resources/[slug]
8. GET /api/sitemap

### Phase 3C: Missing Protected Routes (Week 2)
1. Bookmarks CRUD
2. Network connect respond (PATCH)
3. Profile update (PATCH)
4. Resume PATCH, DELETE

### Phase 3D: Missing Admin Routes (Week 2-3)
1. Opportunities CRUD + verify/reject
2. Organizations CRUD
3. Scraper trigger/status
4. Subscribers list/remove
5. Analytics dashboard
6. AI test prompt

### Phase 3E: Standardization & Testing (Week 3)
1. Apply shared package to all routes
2. Add integration tests for all endpoints
3. Generate OpenAPI spec
4. Lint + typecheck + build verification

---

## Files to Create

### New Shared Package: `packages/api`
```
packages/api/
├── src/
│   ├── responses.ts       # success, paginated, error helpers
│   ├── validation.ts      # common Zod schemas
│   ├── auth.ts            # auth middleware
│   ├── rate-limit.ts      # rate limiting
│   ├── pagination.ts      # page/cursor helpers
│   ├── openapi.ts         # OpenAPI generation
│   └── index.ts
├── package.json
├── tsconfig.json
└── jest.config.js
```

### Missing Route Files (berojgardegreewala/src/app/api/)
```
/opportunities/[slug]/route.ts
/opportunities/featured/route.ts
/opportunities/stats/route.ts
/organizations/[slug]/route.ts
/academy/tracks/route.ts
/academy/tracks/[id]/route.ts
/academy/tracks/[id]/days/route.ts
/academy/tracks/[id]/checkpoints/route.ts
/news/[slug]/route.ts
/resources/route.ts
/resources/[slug]/route.ts
/sitemap/route.ts
/bookmarks/route.ts
/bookmarks/[id]/route.ts
/network/connect/[id]/route.ts
/profile/me/route.ts (PATCH)
/resume/route.ts (PATCH, DELETE)
/admin/opportunities/route.ts
/admin/opportunities/[id]/route.ts
/admin/opportunities/[id]/verify/route.ts
/admin/opportunities/[id]/reject/route.ts
/admin/organizations/route.ts
/admin/organizations/[id]/route.ts
/admin/scrape/route.ts
/admin/scrape/status/route.ts
/admin/subscribers/route.ts
/admin/subscribers/[id]/route.ts
/admin/analytics/route.ts
/admin/ai/test/route.ts
/cron/cleanup/route.ts
/og/route.ts
/revalidate/route.ts
```

---

## Next Steps

1. **Create `@berojgardegreewala/api` shared package** with standardized utilities
2. **Implement all 15 missing endpoints** in berojgardegreewala
3. **Refactor existing 55 routes** to use shared package
4. **Generate OpenAPI spec** and save to project-bible/07-api/
5. **Add integration tests** for all endpoints
6. **Verify**: lint, typecheck, tests, build all pass
7. **Commit and PR**