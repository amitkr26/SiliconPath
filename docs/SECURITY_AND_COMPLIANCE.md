# Security & Compliance

## 1. Authentication Model

### Provider: Supabase Auth

SiliconPath uses **Supabase Auth** as the sole authentication provider. Two methods are supported:

| Method | Implementation | Status |
|--------|---------------|--------|
| Email/password | Supabase built-in `signUp` / `signIn` | ✅ Active |
| Google OAuth | Supabase OAuth provider — code exchange at `/auth/callback` | ✅ Configured (pending Google client ID/secret in Vercel) |
| Passwordless (magic link) | Available via Supabase but not implemented in UI | ❌ Not enabled |

### Auth Flow

1. User visits `/login` or `/signup`
2. Email/password sign-in/sign-up OR Google OAuth redirect
3. OAuth callback at `/auth/callback` exchanges authorization code for session
4. Error handling in callback covers:
   - `error` / `error_description` URL params → redirect with error toast
   - No code in URL → redirect with "No authorization code" message
   - Code exchange failure → redirect with error message
5. On success → redirect to dashboard
6. Sign out → `POST /api/auth/signout` → session cookies cleared

---

## 2. Session Management

### HTTP-Only Cookies via @supabase/ssr

Sessions are stored in **HTTP-only cookies** managed by `@supabase/ssr`'s `createServerClient`:

```typescript
// src/lib/supabase/server.ts
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}
```

### Middleware Session Refresh

`middleware.ts` runs on **every route request** (excluding static assets):

```typescript
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) { /* refresh cookies */ },
      },
    }
  );
  await supabase.auth.getUser();  // Refreshes session if needed
  return supabaseResponse;
}
```

The middleware does **not** enforce route protection — that is handled client-side in protected pages. The middleware solely ensures the session token is refreshed on every request to prevent expiration.

---

## 3. Authorization

### User Types

| User Type | Identifier | Capabilities |
|-----------|-----------|-------------|
| **Visitor** | No auth | Browse opportunities, news, community; use AI tools; subscribe |
| **Authenticated user** | `auth.uid()` | Save opportunities, track applications, manage profile, build resume, create community posts |
| **Admin** | Password match (plain-text) | CRUD opportunities/news, view AI analytics, recheck links |

### Admin Authorization

Admin access is verified server-side via `verifyAdmin()`:

```typescript
// src/lib/admin-auth.ts
export function verifyAdmin(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.slice(7);
  return token === process.env.ADMIN_PASSWORD;
}
```

The admin password (`ADMIN_PASSWORD`) is **server-only** — never exposed to client bundles. Authentication flows through `/api/admin/auth` which returns a Bearer token for use in subsequent admin API calls.

**✅ RESOLVED (Phase 1):**
- Removed `NEXT_PUBLIC_ADMIN_PASSWORD` entirely — no client exposure
- Removed weak CI fallback (`electrobridge2026`)
- All admin pages use server-side password verification returning a token

### ✅ Authentication on Admin API Endpoints (Fixed)

The following routes now require `verifyAdmin()` via the shared `requireAdmin()` pattern:

| Route | Method | Fix |
|-------|--------|-----|
| `/api/scrape-sources` | GET/POST/PUT/DELETE | Added `requireAdmin()` with verifyAdmin check |
| `/api/opportunities` | POST | Admin check via `verifyAdmin(request)` |
| Backend `/scrape/test/:sourceId` | POST | Now calls `auth(req, res)` same as other routes |

### ✅ Field Whitelist (Fixed)

- `PATCH /api/profile/[userId]` — Body spread replaced with **13-field allowlist** (`ALLOWED_PROFILE_FIELDS`), further validated via Zod `profileUpdateSchema`
- `PATCH /api/feed/posts/[id]` — Same allowlist pattern applied

### 🟠 In-Memory Rate Limiter Ineffective in Serverless

The rate limiter (`src/lib/rate-limiter.ts`) uses an in-memory Map. On Vercel (serverless), each invocation runs in an isolated container, so rate limit state is never shared. The subscribe endpoint's 3 req/hr limit is a no-op.

### Service Role

The `SUPABASE_SERVICE_ROLE_KEY` is used in API routes for admin operations (opportunity CRUD, news management, analytics). This key bypasses all Row-Level Security policies and must be kept strictly server-side. It is never exposed to client code.

---

## 4. Row-Level Security (RLS)

Supabase Primary has **30 RLS policies** across 11 tables. Policies are grouped into these patterns:

### Policy Patterns

| Pattern | Count | Tables | Rule |
|---------|-------|--------|------|
| **Public read** | 4 | `opportunities`, `news_articles`, `community_posts`, `organizations` | `USING (true)` or `USING (is_active = true)` |
| **Auth own manage** | 6 | `user_profiles`, `saved_opportunities`, `applications`, `user_alerts`, `user_resumes` | `USING (auth.uid() = user_id)` for SELECT/UPDATE/DELETE |
| **Auth create** | 3 | `community_posts`, `community_comments`, `community_votes` | `WITH CHECK (auth.uid() = user_id)` for INSERT |
| **Auth delete own** | 3 | `community_posts`, `community_comments`, `community_votes` | `FOR DELETE USING (auth.uid() = user_id)` |
| **Anyone insert** | 3 | `subscribers`, `opportunity_reports`, `suggestions` | `WITH CHECK (true)` — no auth required |
| **Admin all** | 8 | `opportunities`, `news_articles`, `community_posts`, `link_check_logs`, `opportunity_reports`, `calendar_exports`, `community_comments`, `community_votes` | `USING (true) WITH CHECK (true)` — bypassed by service role |
| **Admin read** | 3 | `subscribers`, `suggestions`, `ai_usage_log` | `FOR SELECT USING (true)` |

### Key Stored Procedures

- **`generate_opp_slug()`**: ⚠️ **BROKEN** — declares variables but has no body and no RETURN statement. The trigger `auto_opp_slug()` that calls this function will fail on every INSERT into `opportunities`.
- **`toggle_upvote(p_post_id, p_user_id)`**: Toggles community post upvote. Uses `SECURITY DEFINER` to bypass RLS.
- **`sync_ats_score()`**: Trigger function that copies `user_resumes.ats_score` → `user_profiles.resume_ats_score`.
- **`handle_follow()`**: Updates follower/following counts on INSERT/DELETE to `user_follows`. Uses `RETURN COALESCE(NEW, OLD)` pattern (valid in PG 15+).
- **`handle_connection_accepted()`**: On status update to 'accepted', inserts into `connections` and increments connection counts.

---

## 5. Rate Limiting

### Current Implementation

In-memory `Map<string, { count, resetAt }>`:

```typescript
const rateMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  ip: string,
  maxRequests: number = 3,
  windowMs: number = 60 * 60 * 1000
): { allowed: boolean; remaining: number } {
  // ... checks and increments count
}
```

| Property | Value |
|----------|-------|
| **Limit** | 3 requests per IP per hour |
| **Scope** | `/api/subscribe` only |
| **Window** | 1 hour sliding window |
| **Storage** | In-memory Vercel instance |
| **Reset** | On cold start (Vercel inactivity) |

### Limitations

- **Not shared across instances**: Vercel may run multiple serverless instances; each has its own in-memory map
- **Resets on cold start**: After periods of inactivity, the rate map is empty
- **Single-endpoint scope**: Only `/api/subscribe` is rate-limited; other endpoints have no protection

### Future Improvement

Consider migrating to Redis (Upstash or Vercel KV) for distributed, persistent rate limiting.

---

## 6. Input Validation

### Current Implementation (Phase 5)

**Zod** schemas validate request bodies on 9 POST/PATCH routes:

| Route | Schema | Fields Validated |
|-------|--------|-----------------|
| `POST /api/opportunities` | `opportunitySchema` | title (3-300), organization, category, location, deadline, eligibility, description, tags (max 20) |
| `PATCH /api/profile/[userId]` | `profileUpdateSchema` | 13 fields: display_name, bio, headline, skills, location, links, experience_years, current_role/company |
| `POST /api/community/posts` | `communityPostSchema` | title (1-300), content (1-10000), tags (max 10) |
| `POST /api/community/comments` | `communityCommentSchema` | post_id (uuid), content (1-5000) |
| `POST /api/messages` | `messageSchema` | participantId (uuid), content (1-5000) |
| `POST /api/feed/posts` | `feedPostSchema` | content (1-10000), type (post/article/announcement), tags |
| `POST /api/subscribe` | `subscribeSchema` | email (valid email), keywords, categories |
| `POST /api/report-issue` | `reportOpportunitySchema` | opportunity_id (uuid), report_type, description |

All schemas use `safeParse` with a `validateOrThrow()` helper that surfaces the first validation error.

---

## 6. Data Verification Promise

### Verification Pipeline

```
Scrape/Acquire → Pending (unverified) → Link Check → Verified
                                                  ↘ Link unavailable → Flagged
                                                  ↘ Expired → Marked expired
```

| Stage | Description | Responsibility |
|-------|-------------|---------------|
| **1. Scrape** | Content acquired from RSS feeds or HTML scrapers | `opportunity-scraper.ts` |
| **2. Pending** | All new items start with `verification_status = 'unverified'` | Database default |
| **3. Link check** | Cron job (`/api/check-links`) verifies apply links are valid | Server-side cron |
| **4. Verified** | Links confirmed working → status changed to `verified` | Auto or admin |
| **5. Flagged** | Links broken/moved → marked `link_unavailable` | Auto |
| **6. Expired** | Deadline passed OR AI detection → `is_active = false` | Cron + AI expiry checker |

### Transparency to Users

- **Unverified items** show a yellow warning banner: _"This opportunity was auto-scraped and is pending manual verification. Always confirm details on the official website before applying."_
- **Expired items** show a red banner with the deadline date
- **Link unavailable items** show a red banner: _"The apply link appears to be temporarily unavailable."_
- All detail pages include a **"Report Issue"** button for user-submitted corrections

### "How We Verify Data" (Trust Page Content)

The platform follows these verification principles (communicated throughout the UI):
- All opportunities start as unverified and must pass link checks
- Verification badges (verified/unverified/expired/flagged) are shown on every card and detail page
- Users can report issues with any opportunity
- Admin manually reviews flagged content

---

## 7. Legal Scraping Stance

### Formal Policy

1. **Prefer ATS APIs**: Where Application Tracking Systems (ATS) provide APIs, those are used instead of scraping
2. **Respect robots.txt**: All scrapers check and obey `robots.txt` directives
3. **Respect Terms of Service**: Scraping is limited to sources that permit it (government job portals, RSS feeds with public content)
4. **Never scrape prohibited platforms**: The following platforms are explicitly excluded:
   - LinkedIn (violates ToS)
   - Indeed (prohibited by ToS)
   - Glassdoor (prohibited by ToS)
   - Naukri.com (prohibited by ToS)
   - Any platform whose `robots.txt` disallows scraping
5. **Government sources**: ISRO (`isro.gov.in`), DRDO (`drdo.gov.in`), CSIR (`csir.res.in`) — scraped for publicly listed vacancies, which are government public records
6. **RSS feeds**: 16 RSS feeds from news sources are consumed in compliance with each feed's terms

### Scraping Sources

| Source | Type | Legal Basis |
|--------|------|-------------|
| ISRO Careers | HTML scrape | Government public records |
| DRDO Vacancies | HTML scrape | Government public records |
| CSIR Recruitment | HTML scrape | Government public records |
| Academic Positions | RSS feed | Public RSS with attribution |
| Scholarship Roof | RSS feed | Public RSS |
| Jobs.ac.uk | RSS feed | Public RSS |
| IEEE Spectrum | RSS feed | Public RSS |
| 13 other news sources | RSS feed | Public RSS |

---

## 8. Environment Variable Security

### Public vs Private Vars

| Prefix | Visibility | Examples |
|--------|-----------|---------|
| `NEXT_PUBLIC_*` | Exposed to client-side JavaScript | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_ADMIN_PASSWORD`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SENTRY_DSN` |
| No prefix | Server-only via `process.env` | `SUPABASE_SERVICE_ROLE_KEY`, all AI API keys, `CRON_SECRET`, `RESEND_API_KEY` |

### Client-Side Exposure Rules

- `NEXT_PUBLIC_` vars are inlined at build time and visible in browser JavaScript bundles
- Never expose secrets (service role keys, AI API keys, database connection strings) with the `NEXT_PUBLIC_` prefix
- The admin password (`NEXT_PUBLIC_ADMIN_PASSWORD`) is intentionally public — this is a **known design limitation** (see section 3)

### Current Env Var Status

24 of 26 env vars are set in Vercel (Production + Development). Missing: `NEXT_PUBLIC_SENTRY_DSN`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`. Preview environments inherit from Production.

---

## 9. API Security

### CRON Endpoint Protection

Cron jobs (`/api/scrape`, `/api/send-digest`, `/api/archive-news`, `/api/sync-replica`) are protected via `CRON_SECRET`:

```typescript
// Pattern used in cron routes:
if (request.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
  return new Response("Unauthorized", { status: 401 });
}
```

The `CRON_SECRET` environment variable is set in Vercel and used by Vercel Cron Jobs.

### No API Keys in Client Code

- All AI API keys (Bedrock, Groq, NVIDIA, Gemini, OpenRouter, Cloudflare, HuggingFace) are server-only
- Supabase anon key is public by design (Supabase RLS enforces security)
- Database connection strings are never exposed to the client
- Service role keys are server-only

### API Route Security Summary

| Endpoint Type | Auth Method | Notes |
|--------------|-------------|-------|
| Public data (opps, news) | None | RLS on Supabase limits to active/verified |
| User data (saved, apps) | Supabase JWT | `auth.uid()` via server client |
| Admin CRUD | Service role key | Server-side only, bypasses RLS |
| Cron jobs | `CRON_SECRET` bearer token | Matched in request header |
| AI endpoints | None (public) | Rate limiting TBD |

### Monitoring & Compliance Gaps

- No audit log for admin actions (who created/edited what)
- No IP-based access controls for admin routes
- No database backup verification process
- No automated security scanning in CI/CD pipeline
- `NEXT_PUBLIC_ADMIN_PASSWORD` is a known weakness — should be replaced with role-based access
