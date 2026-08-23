# API PARITY — Frontend (Next.js) ↔ Backend (Express)

> Updated 2026-08-23. Every frontend API endpoint is listed with its backend equivalent.
> Status: **[COMPLETE]** = backend performs the required operation · **[PARTIAL]** = exists but missing parts · **[MISSING]** = no backend counterpart · **[N/A]** = stays in frontend (Next.js-specific: edge, ISR, SSR pages).
> Backend envelope: `{success:true, data, pagination?}` / `{success:false, error:{code,message,details?}}`.

---

## 1. Auth & Session

| Endpoint | Auth | Req/Query | Response | DB deps | Backend Equivalent | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST /api/auth/signup` | none | `{email,password,username,display_name,accountType}` | 201 `{success,user}` | auth.users, user_profiles | `POST /api/v1/auth/signup` | **COMPLETE** |
| `POST /api/auth/signout` | cookie | — | 200 | — | — | **N/A** (client token discard) |
| `GET /api/auth/check-username` | none | `?username=` | `{available, suggestions[]}` | user_profiles | `GET /api/v1/auth/check-username` | **COMPLETE** |
| `POST /api/admin/auth` | none | `{password}` | `{token}` | — | `POST /api/v1/admin/stats` with `x-admin-password` | **COMPLETE** |

---

## 2. Opportunities

| Endpoint | Auth | Req/Query | Response | DB deps | Backend Equivalent | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET /api/opportunities` | none | page/limit/category/eligibility/location/deadline/search | `{opportunities,count,page,limit}` | opportunities, organizations | `GET /api/v1/opportunities` | **COMPLETE** |
| `GET /api/opportunities/[id]` | none | — | `{opportunity}` | opportunities | `GET /api/v1/opportunities/:idOrSlug` | **COMPLETE** |
| `GET /api/opportunities/by-slug/[slug]` | none | — | `{opportunity}` | opportunities | `GET /api/v1/opportunities/:idOrSlug` | **COMPLETE** |
| `GET /api/search` | none | `q` | `{opportunities, people}` | opportunities, user_profiles | `GET /api/v1/search` | **COMPLETE** |

---

## 3. News & Content

| Endpoint | Auth | Req/Query | Response | DB deps | Backend Equivalent | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET /api/news` | none | search/tag/limit | `{news}` | news_articles | `GET /api/v1/news` | **COMPLETE** |
| `GET /api/news/[slug]` | none | — | `{article}` | news_articles | `GET /api/v1/news/:slug` | **COMPLETE** |
| `GET /api/cron/news-sync` | CRON_SECRET | — | `{inserted,updated}` | news_articles | `GET /api/v1/cron/news-sync` | **COMPLETE** |

---

## 4. Multi-Model AI Gateway

| Endpoint | Auth | Req/Query | Response | DB deps | Backend Equivalent | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST /api/ai/chat` | none | `{messages[],grounding?}` | `{text}` grounded | opportunities | `POST /api/v1/ai/chat` | **COMPLETE** |
| `POST /api/ai/match` | none | `{profile}` | `{matches}` top-10 | opportunities | `POST /api/v1/ai/match` | **COMPLETE** |
| `POST /api/ai/search` | none | `{query}` | `{filters}` parsed | — | `POST /api/v1/ai/search` | **COMPLETE** |
| `POST /api/ai/summarize` | none | `{text}` | `{summary}` | — | `POST /api/v1/ai/summarize` | **COMPLETE** |
| `POST /api/ai/insights` | none | `{prompt}` | `{text}` | — | `POST /api/v1/ai/insights` | **COMPLETE** |

---

## 5. User Applications & Bookmarks

| Endpoint | Auth | Req/Query | Response | DB deps | Backend Equivalent | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET/POST /api/bookmarks` | auth | `{opportunity_id}` | `{bookmarks}` / `{bookmark}` | saved_opportunities | `GET/POST /api/v1/saved-opportunities` | **COMPLETE** |
| `DELETE /api/bookmarks/[id]` | auth | — | 204 | saved_opportunities | `DELETE /api/v1/saved-opportunities/:id` | **COMPLETE** |
| `GET/POST /api/applications` | auth | `{opportunity_id,status,notes?}` | `{applications}` / 201 | applications | `GET/POST /api/v1/applications` | **COMPLETE** |
| `PATCH/DELETE /api/applications/[id]` | owner | `{status,notes}` | 200 / 204 | applications | `PATCH/DELETE /api/v1/applications/:id` | **COMPLETE** |

---

## 6. Social Networking & Messaging

| Endpoint | Auth | Req/Query | Response | DB deps | Backend Equivalent | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET/POST /api/feed` | auth | `{content}` | `{posts}` / `{post}` | feed_posts | `GET/POST /api/v1/feed` | **COMPLETE** |
| `POST /api/feed/posts/[id]/like` | auth | — | `{liked}` | feed_post_likes | `POST /api/v1/feed/posts/:id/like` | **COMPLETE** |
| `POST /api/feed/posts/[id]/comment` | auth | `{content}` | `{comment}` | feed_post_comments | `POST /api/v1/feed/posts/:id/comment` | **COMPLETE** |
| `GET/POST /api/network/connections`| auth | — | `{connections}` | connections | `GET/POST /api/v1/network/connections` | **COMPLETE** |
| `GET /api/network/suggestions` | auth | — | `{suggestions}` | user_profiles | `GET /api/v1/network/suggestions` | **COMPLETE** |
| `GET/POST /api/network/follow/[id]`| auth | — | `{following}` | user_follows | `GET/POST /api/v1/network/follow/:id` | **COMPLETE** |
| `GET /api/messages` | auth | — | `{conversations}` | conversations | `GET /api/v1/messages` | **COMPLETE** |
| `GET/POST /api/messages/[convId]` | auth | `{body}` | `{messages}` / `{message}` | messages | `GET/POST /api/v1/messages/:convId` | **COMPLETE** |
| `GET /api/notifications` | auth | — | `{notifications, unreadCount}` | notifications | `GET /api/v1/notifications` | **COMPLETE** |
