# API PARITY — Frontend (Next.js) ↔ Backend (Express)

> Generated 2026-08-19 from full audit. Every frontend API endpoint is listed with its backend equivalent.
> Status: **[COMPLETE]** = backend performs the required operation · **[PARTIAL]** = exists but missing parts · **[MISSING]** = no backend counterpart · **[N/A]** = stays in frontend (Next.js-specific: edge, ISR, SSR pages) · **[BLOCKED]** = blocked on infra/keys.
> Backend envelope: `{success:true, data, pagination?}` / `{success:false, error:{code,message,details?}}` (differs from Next routes' `{data}` / `{error,code,details}` — documented in §10).

## 1. Auth & Session (backend = verify-only today; identity = Supabase Auth, Phase 8 preserved)

| Endpoint | Auth | Req/Query | Response | DB deps | Backend | Status |
|---|---|---|---|---|---|---|
| `POST /api/auth/signup` | none | `{email,password,username,display_name,accountType}` | 201 `{success,user,autoConfirmed}` | auth.users, user_profiles | — | **MISSING** → `POST /api/v1/auth/signup` |
| `POST /api/auth/signout` | cookie | — | 200 | — | — | **N/A** (client token discard) |
| `GET /api/auth/check-username` | none | `?username=` | `{available, suggestions[]}` | user_profiles | — | **MISSING** → `GET /api/v1/auth/check-username` |
| `POST /api/admin/auth` | none | `{password}` | `{token}` (HMAC `sessionId.expiry.sig`) | — | `x-admin-password` sha256+timingSafeEqual in `routes/admin.ts` | **PARTIAL** — no HMAC session token |
| `POST /api/admin/auth/session` | HMAC token | — | `{valid,user}` | — | — | **MISSING** |

## 2. Opportunities (public reads; server reads = service-role, no RLS reliance)

| Endpoint | Auth | Req/Query | Response | DB deps | Backend | Status |
|---|---|---|---|---|---|---|
| `GET /api/opportunities` | none | page/limit/category/eligibility/location/deadline/search/org | `{opportunities,count,total_count,page,limit,total_pages}` | opportunities, organizations | `GET /api/v1/opportunities` (same filters, `{success,data,pagination}`) | **COMPLETE** |
| `GET /api/opportunities/[id]` | none (anon) | — | `{opportunity}` mapped | opportunities | `GET /api/v1/opportunities/:idOrSlug` (UUID or slug) | **COMPLETE** |
| `PATCH /api/opportunities/[id]` | admin | zod `adminOpportunityUpdateSchema` | `{opportunity}` | opportunities, organizations | — | **MISSING** |
| `DELETE /api/opportunities/[id]` | admin | — | 204 | opportunities | — | **MISSING** |
| `GET /api/opportunities/by-slug/[slug]` | none | — | `{opportunity}` | opportunities | covered by `:idOrSlug` | **COMPLETE** |
| `GET /api/opportunities/featured` | none | limit=10 | `{opportunities}` | opportunities | — | **MISSING** |
| `GET /api/opportunities/stats` | none | — | `{counts,byCategory}` | opportunities | — | **MISSING** |
| `GET /api/opportunities-feed` | none | — | JSON feed, absolute URLs | opportunities | — | **MISSING** |
| `GET /api/opportunities/similar/[id]` | none | — | `{opportunities}` (tags overlap ≤3) | opportunities | — | **MISSING** |
| `GET /api/search` | none | `q` + filters | compat wrapper | opportunities, user_profiles | `search` param on opp list only | **PARTIAL** — no people |
| `GET /api/search/opportunities` | none | q + filters | `{opportunities,count}` org join | opportunities, organizations | — | **PARTIAL** |
| `GET /api/calendar-export/[id]` | none | — | ICS + P7D VALARM | opportunities | — | **MISSING** |
| `GET /api/sitemap` | none | — | XML | both | — | **N/A** |
| `GET /api/og/opportunity/[slug]` | none | — | PNG 1200×630 | — | — | **N/A** (edge) |

## 3. News

| Endpoint | Auth | Req/Query | Response | DB deps | Backend | Status |
|---|---|---|---|---|---|---|
| `GET /api/news` | none | search/tag/limit | `{news}` DB+RSS merged, 30-min cache | news_articles | `GET /api/v1/news` (list only, no RSS merge) | **PARTIAL** |
| `GET /api/news/[slug]` | none | — | `{article}` | news_articles | — | **MISSING** → `GET /api/v1/news/:slug` |
| `GET /api/news/sync` | CRON_SECRET | — | `{inserted,updated}` | news_articles | — | **MISSING** → `GET /api/v1/cron/news-sync` |
| `GET /api/news/archive-news` | CRON_SECRET | — | `{archived}` | db1 news_articles → db2 news_archive | — | **MISSING** |
| `GET/POST /api/news/cleanup-news` | CRON_SECRET | — | `{removed}` | news_articles | — | **MISSING** |

## 4. AI (canonical gateway = `backend/ai-gateway`, shared; server logs NOT wired today)

| Endpoint | Auth | Req/Query | Response | DB deps | Backend | Status |
|---|---|---|---|---|---|---|
| `POST /api/ai/chat` | none | `{messages[],grounding?}` | SSE/`{text}` grounded, sanitized URLs | opportunities | `POST /api/v1/ai/insights` (generic, no grounding) | **PARTIAL** → `POST /api/v1/ai/chat` |
| `POST /api/ai/classify` | none | `{title,description}` | `{category}` (12-value) | — | — | **MISSING** |
| `POST /api/ai/enhance` | auth | resume section | `{enhanced}` | — | — | **MISSING** |
| `GET /api/ai/expire` | CRON_SECRET | — | `{expired[]}` | opportunities | — | **MISSING** |
| `POST /api/ai/match` | none | `{profile}` | `{matches}` top-10 JSON | opportunities | — | **MISSING** → `POST /api/v1/ai/match` |
| `GET /api/ai/opportunity-summary/[slug]` | none | — | `{summary}` JSON | opportunities | — | **MISSING** |
| `POST /api/ai/search` | none | `{query}` | `{filters}` parsed | — | — | **MISSING** |
| `POST /api/ai/summarize` | none | `{text}` | `{summary}` | — | — | **MISSING** |
| usage logging → `ai_usage_log` | — | gateway.setLogger(logAIUsage) | — | ai_usage_log | server never calls setLogger | **PARTIAL** |

## 5. Bookmarks / Applications / Resume / Profile

| Endpoint | Auth | Req/Query | Response | DB deps | Backend | Status |
|---|---|---|---|---|---|---|
| `GET/POST /api/bookmarks` | auth | `{opportunity_id}` | `{bookmarks}` / `{bookmark}` idempotent | saved_opportunities, opportunities, organizations | `GET/POST /api/v1/saved-opportunities` | **COMPLETE** |
| `DELETE /api/bookmarks/[id]` | auth | — | 204 (by id or opportunity_id) | saved_opportunities | `DELETE /api/v1/saved-opportunities/:id` | **COMPLETE** |
| `GET/POST /api/applications` | auth | `{opportunity_id,status,notes?}` | `{applications}` / 201 or 200 dedupe | applications, opportunities, organizations, user_profiles | `GET/POST /api/v1/applications` | **COMPLETE** |
| `PATCH/DELETE /api/applications/[id]` | owner (PATCH also employer/admin) | status whitelist applied\|submitted\|reviewed\|shortlisted\|accepted\|rejected | `{application}` / 204 | applications | `PATCH/DELETE /api/v1/applications/:id` (no status whitelist) | **COMPLETE** (whitelist diff documented) |
| `GET/POST /api/resume`, `DELETE /api/resume` | auth | resume schema, `calculateAtsScore` | `{resume,atsScore}` | resumes, user_profiles | — | **MISSING** |
| `POST /api/resume/ai-suggest` | auth | section | `{suggestions}` | — | — | **MISSING** |
| `GET/PATCH /api/profile/me` | auth | profile fields | `{profile}` | user_profiles | `GET /api/v1/profiles/me` (GET only) | **PARTIAL** |
| `GET /api/profile/[userId]` | none | UUID or username | `{profile}` PUBLIC_PROFILE_FIELDS allowlist; increments views (rpc) | user_profiles | `GET /api/v1/profiles/:username` (no UUID, no view increment) | **PARTIAL** |
| `PATCH /api/profile/[userId]` | self | UPDATABLE_FIELDS allowlist, username uniqueness | `{profile}` | user_profiles | — | **MISSING** |
| `POST /api/profile/[userId]/endorse` | auth | `{skill}` | `{endorsed}` toggle + notification | skill_endorsements, notifications | — | **MISSING** |
| `GET/POST /api/profile/[userId]/recommendations` | auth | `{content}` | `{recommendations}` | recommendations | — | **MISSING** |
| `POST /api/profile/parse-resume` | auth | multipart file | `{profile}` GCP Document AI + AI fallback | — | — | **MISSING** |
| `GET /api/recommendations` | auth | — | `{opportunities}` keyword-scored | opportunities, user_profiles | — | **MISSING** |

## 6. Social (feed / network / messages / notifications / community / companies) — all **MISSING** in server (`supabase2Admin` wired but unused)

| Endpoint | Auth | Req/Query | Response | DB deps |
|---|---|---|---|---|
| `GET/POST /api/feed` | auth | `{content,visibility}` | `{posts}` / `{post}` | feed_posts, user_profiles, notifications |
| `PATCH/DELETE /api/feed/posts/[id]` | owner | — | `{post}` / 204 | feed_posts |
| `POST /api/feed/posts/[id]/like` | auth | — | `{liked}` toggle | feed_post_likes (counts via DB trigger) |
| `POST /api/feed/posts/[id]/comment` | auth | `{content}` | `{comment}` | feed_post_comments, notifications |
| `POST /api/feed/posts/[id]/repost` | auth | — | `{reposted}` toggle | feed_post_reposts |
| `POST /api/network/connect` | auth | `{receiverId\|recipientId\|targetUserId\|addressee_id}` | `{request}` 409 on dup | connections, user_profiles, notifications (+Resend email) |
| `GET /api/network/connect` | auth | — | `{requests}` + direction (incoming/outgoing) | connections, connection_requests legacy |
| `PATCH /api/network/connect/[id]` | role-enforced | `{status: accepted\|rejected\|withdrawn}` | `{request}` | connections (withdraw deletes row) |
| `GET /api/network/connections` | auth | `?myId=&theirId=` status OR accepted list | `{connections}` enriched (id, username, display_name, headline, current_company, avatar_url, user_id, requester_id, addressee_id, status) | connections, user_profiles |
| `GET /api/network/suggestions` | auth | — | `{suggestions}` scored, excludes system bots | user_profiles, connections |
| `GET/POST /api/network/follow/[userId]` | auth | — | `{following}` / `{following:true}` 409 dup | user_follows, notifications (23505→409) |
| `GET /api/network/followers` / `following` | auth | — | `{users}` with is_following_back | user_follows, user_profiles |
| `GET /api/people/search` | none (SSR) | q, city, skill | `{people}` is_profile_public filter, order connection_count | user_profiles |
| `GET /api/messages` | auth | — | `{conversations}` + last message | conversations, messages, user_profiles |
| `GET/POST /api/messages/[conversationId]` | participant | `{content\|body\|message}` | `{messages}` marks read / `{message}` | messages, conversations (participant_a/b) |
| `GET /api/notifications`, `PATCH` mark-all-read, `GET /count`, `PATCH /[id]` | auth | — | `{notifications,unreadCount}` | notifications, user_profiles |
| `GET/POST /api/community/posts`, `GET/DELETE /posts/[id]`, `POST /comments`, `POST /vote` | public read / auth write | category forced general | `{posts}` / `{post,comments}` | community_posts, community_comments, rpc toggle_upvote (manual comment_count) |
| `GET /api/companies` (+ `[id]`, `[id]/follow` POST/DELETE) | gated by FEATURES.LINKEDIN_ENABLED; auth for follow | — | `{companies}` is_following | company_pages, company_followers |

## 7. Organizations / Employer

| Endpoint | Auth | Req/Query | Response | DB deps | Backend | Status |
|---|---|---|---|---|---|---|
| `GET /api/organizations`, `GET /[slug]` | admin | page/per_page ≤100 | `{organizations}` + counts | organizations | `GET /api/v1/organizations` (+ `/:slug`) — **public, no admin gate** | **PARTIAL** (auth diff) |
| `POST /api/employer/claim` | employer role | `{orgName}` | `{claimed}` notification only (no claims table) | notifications | — | **MISSING** |
| `GET /api/employer/jobs` | employer role | — | `{jobs}` active opps | opportunities | — | **MISSING** |
| `POST /api/employer/jobs` | employer role | `postJobSchema` slugify+dedupe, category normalize, org resolve, unverified insert | `{job}` 201 | opportunities, organizations | — | **MISSING** |
| `GET /api/employer/recommendations` | employer role | `?opportunityId=` | `{candidates}` top-10 skill overlap | user_profiles, opportunities | — | **MISSING** |

## 8. Admin (backend = `GET /api/v1/admin/stats` only)

| Endpoint | Auth | Notes | Status |
|---|---|---|---|
| `GET /api/admin/analytics` | admin | counts + week-new + category + Neon click events | **MISSING** |
| `GET /api/admin/applications`, `PATCH /[id]` | admin | joins, limit 100, status enum | **MISSING** |
| `GET/POST /api/admin/companies`, `PATCH/DELETE /[id]` | admin | company_pages CRUD | **MISSING** |
| `GET/POST /api/admin/opportunities`, `GET/PATCH /[id]`, `PATCH /[id]/verify`, `/reject` | admin | zod + org resolve, verification lifecycle | **MISSING** |
| `GET/POST /api/admin/organizations`, `GET/PATCH/DELETE /[id]` | admin | strict `organizationCreateSchema` | **MISSING** |
| `GET/POST/DELETE /api/admin/announcements` | admin | announcements | **MISSING** |
| `GET /api/admin/performance` | admin | scrape_runs + Neon click_events | **MISSING** |
| `POST /api/admin/recheck-link` | admin | HEAD + evidence ledger | **MISSING** |
| `GET/POST /api/admin/scrape`, `GET /api/admin/scrape/status`, `GET /api/admin/scrape-health` | admin | scrape_sources/runs | **MISSING** |
| `GET /api/admin/subscribers`, `DELETE /[id]` | admin | subscribers | **MISSING** |
| `POST /api/admin/ai/test` | admin | proxy to /api/ai/chat | **MISSING** |
| `GET /api/v1/admin/stats` | x-admin-password | 4 row counts — **the only server admin route** | **COMPLETE** (as-is) |

## 9. Cron / Scrapers / Misc / Academy

| Endpoint | Auth | Notes | Status |
|---|---|---|---|
| `GET/POST /api/cron/scrape-opportunities`, `/scrape-news`, `/scrape-india`, `/scrape-global` | CRON_SECRET/Admin | full scrape pipeline, evidence-gated org resolution, unverified inserts | **MISSING** → port to `services/scrapers` + `GET /api/v1/cron/*` |
| `GET /api/cron/digest`, `GET /api/send-digest` | CRON_SECRET | Resend weekly digest | **MISSING** |
| `GET /api/cron/check-links` | CRON_SECRET | HEAD checks → opportunity_verifications evidence | **MISSING** |
| `GET /api/cron/cleanup` | CRON_SECRET | expired deadline → inactive | **MISSING** |
| `GET /api/cron/cleanup` | CRON_SECRET | expired deadline → inactive | **MISSING** |
| `GET /api/sync-replica` | CRON_SECRET | db1 → Neon2 mirrors | **MISSING** |
| `GET /api/scrape`, `GET/POST /api/admin/scrape` | admin | manual scrape | **MISSING** |
| `GET/POST/PUT/DELETE /api/scrape-sources` | admin | SSRF-safe URL guard, allowlist | **MISSING** |
| `GET /api/scrapers/[slug]`, `GET/POST /api/scrapers/run-all` | admin | fabricated-gated | **MISSING** (low priority, disabled in prod) |
| `POST /api/contact` | 10/hr rate limit | → opportunity_reports | **MISSING** |
| `POST /api/subscribe`, `DELETE /api/subscribe`, `GET /api/subscribe` | 5/hr rate limit | subscribers + token | **MISSING** |
| `POST /api/report-issue` | — | opportunity_reports | **MISSING** |
| `POST /api/track-click` | — | Neon1 click_events | **MISSING** |
| `GET /api/resources`, `GET /api/resources/[slug]` | public | resources | **MISSING** |
| `GET /api/academy/*` (12 routes) | public read / progress upsert | dual-table fallbacks | **MISSING** |
| `GET /api/health` | none | db1/db2/neon1/neon2 counts | `GET /health` (no DB check) | **PARTIAL** |
| `GET /api/cron-health` | none | news freshness | — | **MISSING** |
| `POST /api/csp-report` | none | 204 sink | — | **N/A** (browser-only) |

## 10. Cross-cutting contracts

| Concern | Frontend (Next routes) | Backend (Express) | Status |
|---|---|---|---|
| Success envelope | `{data}` / `{opportunity}` / `{list,count,...}` | `{success:true, data, pagination?}` | **PARTIAL** — two shapes; OpenAPI spec documents the frontend shapes |
| Error envelope | `{error, code, details}` | `{success:false, error:{code,message,details?}}` | **PARTIAL** — documented; normalize later |
| Auth | cookie session + Bearer (server.ts binds Bearer to `auth.getUser`) | Bearer only (`requireAuth`) | **PARTIAL** — frontend-to-backend switch will need cookie forwarding or client Bearer |
| Rate limiting | middleware buckets (api lib, in-memory) + Upstash for contact/subscribe | none | **MISSING** → wire `createRateLimiter` (auth 10/min, ai 20/min, search 30/min, scrape 5/min, api 120/min) |
| CORS | same-origin (Vercel) | `ALLOWED_ORIGINS` env allow-list, dev localhost passthrough | **COMPLETE** |
| Validation | zod schemas per route | `opportunityListQuerySchema` + AppError on failure | **PARTIAL** — most new routes need schemas |
| Rate limit headers | `Retry-After`, `X-RateLimit-*` | absent (no limiter) | **MISSING** |

## 11. Status summary

- **COMPLETE**: 7 (opportunities list/detail/slug, bookmarks 3, applications 3, profiles me GET, admin/stats)
- **PARTIAL**: 8 (search, news list, ai/insights+logging, organizations auth, applications status whitelist, profile detail, health, envelopes)
- **MISSING**: ~95 across social (22), admin (13), cron/scrapers (12), AI (8), profile/resume (8), academy (12), misc (10), auth (3)
- **N/A**: 4 (sitemap, og-image, csp-report, signout)

> Priority for the replication effort (in order): social layer (DB2 client already wired), AI endpoint breadth + usage logging, cron/scraper port (news sync first), news `:slug` + search + `auth/signup`, admin breadth. Everything else is a documented gap for follow-up sessions.
