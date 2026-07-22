# API Architecture

## Overview

BerojgarDegreeWala provides 74 API routes organized into public, protected, admin, and cron categories. All routes live in the Next.js app at `berojgardegreewala/src/app/api/`.

## Route Categories

### Public Routes (No Auth Required)

| Category | Routes | Count |
|----------|--------|-------|
| Opportunities | GET list, GET by slug, GET featured, GET stats | 4 |
| Organizations | GET list, GET by slug | 2 |
| Academy | GET tracks, GET track by id, GET day content, GET checkpoints | 4 |
| News | GET list, GET by slug | 2 |
| Resources | GET list, GET by slug | 2 |
| Search | GET search | 1 |
| Subscribe | POST subscribe | 1 |
| Sitemap | GET sitemap | 1 |
| **Total** | | **17** |

### Protected Routes (Auth Required)

| Category | Routes | Count |
|----------|--------|-------|
| Bookmarks | GET list, POST add, DELETE remove | 3 |
| Feed | GET feed, POST create | 2 |
| Network | GET connections, POST request, PATCH respond | 3 |
| Messages | GET conversations, GET messages, POST send | 3 |
| Notifications | GET list, PATCH read | 2 |
| Profile | GET profile, PATCH update | 2 |
| Companies | GET list, GET by id | 2 |
| Resume | GET resume, POST upload, PATCH update, DELETE | 4 |
| **Total** | | **21** |

### Admin Routes (Admin Auth Required)

| Category | Routes | Count |
|----------|--------|-------|
| Opportunities | CRUD + verify/reject | 6 |
| Organizations | CRUD | 4 |
| Scrapers | POST trigger, GET status, POST update sources | 3 |
| Subscribers | GET list, DELETE remove | 2 |
| Analytics | GET dashboard | 1 |
| AI | POST test prompt | 1 |
| **Total** | | **17** |

### Cron Routes (CRON_SECRET Auth)

| Route | Schedule | Purpose |
|-------|----------|---------|
| POST /api/cron/scrape-india | Daily 6:00 AM IST | Scrape India sources |
| POST /api/cron/scrape-global | Daily 8:00 AM IST | Scrape global sources |
| POST /api/cron/check-links | Daily 9:00 AM IST | Link health verification |
| POST /api/cron/digest | Weekly Sunday 12:00 PM | Weekly email digest |
| POST /api/cron/newsletter | Monthly | Monthly newsletter |
| POST /api/cron/cleanup | Daily 3:00 AM IST | Archive expired opportunities |
| **Total** | | **6** |

### AI Routes

| Route | Purpose |
|-------|---------|
| POST /api/ai/chat | Chat completion via AI Gateway |
| POST /api/ai/enhance | Content enhancement |
| POST /api/ai/classify | Opportunity classification |
| POST /api/ai/summarize | Text summarization |
| POST /api/ai/match | Opportunity matching |
| **Total** | | **5** |

### Other Internal Routes

| Route | Purpose |
|-------|---------|
| GET /api/auth/callback | Supabase auth callback |
| GET /api/og | Open Graph image generation |
| GET /api/revalidate | On-demand ISR revalidation |
| GET /api/health | Health check |
| **Total** | | **4** |

## Response Patterns

### Success
```typescript
{ data: T }
```

### List with Pagination
```typescript
{ data: T[], count: number, page: number, pageSize: number }
```

### Error
```typescript
{ error: string, code?: string, details?: unknown }
```

### HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | GET success |
| 201 | POST create success |
| 204 | DELETE success, PATCH no-content update |
| 400 | Validation error (Zod) |
| 401 | Missing or invalid auth |
| 403 | Valid auth but insufficient permissions |
| 404 | Resource not found |
| 409 | Duplicate (e.g., duplicate bookmark) |
| 429 | Rate limited |
| 500 | Internal server error |

## Route Pattern

All routes follow the same structure:
```typescript
export async function GET(request: NextRequest) {
  try {
    // 1. Parse and validate params
    // 2. Check auth (if needed)
    // 3. Query database
    // 4. Transform response
    // 5. Return NextResponse.json(...)
  } catch (error) {
    // 6. Log error
    // 7. Return appropriate error response
  }
}
```

## Related Documents

- [openapi-spec.json](./openapi-spec.json) — Complete OpenAPI 3.1 specification
- [routes-catalog.md](./routes-catalog.md) — Detailed route documentation
- [response-standards.md](./response-standards.md) — Response format conventions
