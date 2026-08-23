# FRONTEND ↔ BACKEND FUNCTIONALITY MAP

> Updated 2026-08-23. Reconciled mapping between Next.js App Router API route handlers and Express REST backend.

---

## 1. Auth & Identity

| Frontend Implementation | Backend Implementation | Parity Status |
| :--- | :--- | :--- |
| `frontend/src/app/api/auth/signup/route.ts` | `backend/server/src/routes/auth.ts` (`POST /api/v1/auth/signup`) | **COMPLETE** |
| `frontend/src/app/api/auth/check-username/route.ts` | `backend/server/src/routes/auth.ts` (`GET /api/v1/auth/check-username`) | **COMPLETE** |
| `frontend/src/middleware.ts` (Bearer/session check) | `backend/server/src/middleware/auth.ts` (`requireAuth`) | **COMPLETE** |
| `frontend/src/app/api/admin/auth/route.ts` | `backend/server/src/routes/admin.ts` (`x-admin-password`) | **COMPLETE** |

---

## 2. Opportunities & Search

| Frontend Implementation | Backend Implementation | Parity Status |
| :--- | :--- | :--- |
| `frontend/src/app/api/opportunities/route.ts` | `backend/server/src/routes/opportunities.ts` (`GET /api/v1/opportunities`) | **COMPLETE** |
| `frontend/src/app/api/opportunities/[id]/route.ts` | `backend/server/src/routes/opportunities.ts` (`GET /api/v1/opportunities/:idOrSlug`) | **COMPLETE** |
| `frontend/src/app/api/opportunities/by-slug/[slug]/route.ts` | `backend/server/src/routes/opportunities.ts` (`GET /api/v1/opportunities/:idOrSlug`) | **COMPLETE** |
| `frontend/src/app/api/search/route.ts` | `backend/server/src/routes/search.ts` (`GET /api/v1/search`) | **COMPLETE** |

---

## 3. News & Content

| Frontend Implementation | Backend Implementation | Parity Status |
| :--- | :--- | :--- |
| `frontend/src/app/api/news/route.ts` | `backend/server/src/routes/content.ts` (`GET /api/v1/news`) | **COMPLETE** |
| `frontend/src/app/api/news/[slug]/route.ts` | `backend/server/src/routes/content.ts` (`GET /api/v1/news/:slug`) | **COMPLETE** |
| `frontend/src/app/api/cron/news-sync/route.ts` | `backend/server/src/routes/cron.ts` (`GET /api/v1/cron/news-sync`) | **COMPLETE** |

---

## 4. Multi-Model AI Gateway

| Frontend Implementation | Backend Implementation | Parity Status |
| :--- | :--- | :--- |
| `frontend/src/app/api/ai/chat/route.ts` | `backend/server/src/routes/ai.ts` (`POST /api/v1/ai/chat`) | **COMPLETE** |
| `frontend/src/app/api/ai/match/route.ts` | `backend/server/src/routes/ai.ts` (`POST /api/v1/ai/match`) | **COMPLETE** |
| `frontend/src/app/api/ai/search/route.ts` | `backend/server/src/routes/ai.ts` (`POST /api/v1/ai/search`) | **COMPLETE** |
| `frontend/src/app/api/ai/summarize/route.ts` | `backend/server/src/routes/ai.ts` (`POST /api/v1/ai/summarize`) | **COMPLETE** |

---

## 5. Candidate Applications & Bookmarks

| Frontend Implementation | Backend Implementation | Parity Status |
| :--- | :--- | :--- |
| `frontend/src/app/api/bookmarks/route.ts` | `backend/server/src/routes/userdata.ts` (`GET/POST /api/v1/saved-opportunities`) | **COMPLETE** |
| `frontend/src/app/api/bookmarks/[id]/route.ts` | `backend/server/src/routes/userdata.ts` (`DELETE /api/v1/saved-opportunities/:id`) | **COMPLETE** |
| `frontend/src/app/api/applications/route.ts` | `backend/server/src/routes/userdata.ts` (`GET/POST /api/v1/applications`) | **COMPLETE** |
| `frontend/src/app/api/applications/[id]/route.ts` | `backend/server/src/routes/userdata.ts` (`PATCH/DELETE /api/v1/applications/:id`) | **COMPLETE** |

---

## 6. Social Networking, Messaging & Notifications

| Frontend Implementation | Backend Implementation | Parity Status |
| :--- | :--- | :--- |
| `frontend/src/app/api/feed/route.ts` | `backend/server/src/routes/social.ts` (`GET/POST /api/v1/feed`) | **COMPLETE** |
| `frontend/src/app/api/feed/posts/[id]/like/route.ts` | `backend/server/src/routes/social.ts` (`POST /api/v1/feed/posts/:id/like`) | **COMPLETE** |
| `frontend/src/app/api/feed/posts/[id]/comment/route.ts` | `backend/server/src/routes/social.ts` (`POST /api/v1/feed/posts/:id/comment`) | **COMPLETE** |
| `frontend/src/app/api/network/connections/route.ts` | `backend/server/src/routes/social.ts` (`GET/POST /api/v1/network/connections`) | **COMPLETE** |
| `frontend/src/app/api/network/suggestions/route.ts` | `backend/server/src/routes/social.ts` (`GET /api/v1/network/suggestions`) | **COMPLETE** |
| `frontend/src/app/api/network/follow/[userId]/route.ts` | `backend/server/src/routes/social.ts` (`GET/POST /api/v1/network/follow/:userId`) | **COMPLETE** |
| `frontend/src/app/api/messages/route.ts` | `backend/server/src/routes/messages.ts` (`GET /api/v1/messages`) | **COMPLETE** |
| `frontend/src/app/api/messages/[id]/route.ts` | `backend/server/src/routes/messages.ts` (`GET/POST /api/v1/messages/:id`) | **COMPLETE** |
| `frontend/src/app/api/notifications/route.ts` | `backend/server/src/routes/social.ts` (`GET /api/v1/notifications`) | **COMPLETE** |
