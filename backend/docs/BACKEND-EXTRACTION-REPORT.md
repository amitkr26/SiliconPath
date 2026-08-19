# BACKEND EXTRACTION REPORT

**Date:** 2026-08-19
**Scope:** Standalone `backend/` (api / ai-gateway / server) built in parallel to the Next.js frontend, with **no frontend changes and no DB schema changes**.
**Companion docs:** `FRONTEND-BACKEND-MAP.md`, `API-PARITY.md`, `DATABASE-MAP.md` (same directory).

---

## 1. What exists today

| Package | Role | Tests |
|---|---|---|
| `backend/api` | Framework-less TS lib: response/error/auth/validation/rate-limit/cache/openapi/content helpers | 97 jest (7 suites) |
| `backend/ai-gateway` | 9-provider fallback LLM gateway (groq→gemini→openrouter→nvidia→agentrouter→omnirouter→cloudflare→bedrock→huggingface, 10-min cooldown, usage logging hook) | 0 (known gap) |
| `backend/server` | Express 4 REST API on :8080, envelope `{success, data\|error}`, Supabase DB1 via service role, Dockerfile (node:20-alpine), `dist/` build | 30 node:test (16 pre-existing + 14 parity) |

## 2. Server endpoints (complete)

| Method | Path | Auth | Mirrors (frontend route) |
|---|---|---|---|
| GET | /health | – | – |
| GET | /api/v1/opportunities | – | /api/opportunities |
| GET | /api/v1/opportunities/:idOrSlug | – | /api/opportunities/[id] |
| GET | /api/v1/profiles/:username | – | /api/profiles/[username] |
| GET | /api/v1/profiles/me | Bearer | /api/profiles/me |
| GET | /api/v1/organizations, /:slug | – | /api/organizations, [slug] |
| GET | /api/v1/news, /:slug | – | /api/news, [slug] |
| GET/POST | /api/v1/applications, /:id | Bearer | /api/applications |
| GET/POST/DELETE | /api/v1/saved-opportunities | Bearer | /api/saved-opportunities |
| POST | /api/v1/ai/insights | Bearer | /api/ai/insights |
| POST | /api/v1/ai/chat | Bearer, ai-limit | /api/ai/chat (grounded) |
| POST | /api/v1/ai/match | Bearer, ai-limit | /api/ai/match |
| POST | /api/v1/ai/search | Bearer, ai-limit | /api/ai/search |
| POST | /api/v1/ai/summarize | Bearer, ai-limit | /api/ai/summarize |
| GET | /api/v1/admin/stats | X-Admin-Password | /api/admin/stats |
| POST | /api/v1/auth/signup | auth-limit | /api/auth/signup |
| GET | /api/v1/auth/check-username | auth-limit | /api/auth/check-username |
| GET | /api/v1/search, /people | search-limit | /api/search, /api/people/search |
| GET/POST | /api/v1/feed, /posts/:id PATCH/DELETE | Bearer | /api/feed/* |
| POST | /api/v1/feed/posts/:id/{like,comment,repost} | Bearer | /api/feed/posts/[id]/* |
| POST/GET | /api/v1/network/connect, PATCH :id | Bearer | /api/network/connect* |
| GET | /api/v1/network/connections (+?myId=&theirId=) | Bearer | /api/network/connections |
| GET | /api/v1/network/suggestions | Bearer | /api/network/suggestions |
| GET/POST | /api/v1/network/follow/:userId | Bearer | /api/network/follow/[userId] |
| GET | /api/v1/network/followers, /following | Bearer | /api/network/followers, following |
| GET/PATCH | /api/v1/notifications, /count, /:id | Bearer | /api/notifications* |
| GET | /api/v1/messages | Bearer | /api/messages |
| GET | /api/v1/messages/with/:userId | Bearer | /api/messages/with/[userId] |
| GET/POST | /api/v1/messages/:conversationId | Bearer | /api/messages/[conversationId] |
| GET | /api/v1/cron/news-sync | Bearer CRON_SECRET | /api/news/sync (cron 06:00) |

Rate limits (shared `rateLimiters` presets from the api lib, same as Next middleware): api 120/min, auth 10/min, search 30/min, scrape 5/min (reserved), ai 20/min. **In-memory per process** (`ponytail:` note — upgrade path: Redis-backed limiter for multi-instance).

## 3. Feature parity — status

| Frontend capability | Server status | Notes |
|---|---|---|
| Opportunities browse/search/filter/detail | ✅ COMPLETE | repository + idOrSlug |
| Organization directory + detail | ✅ COMPLETE | |
| News list + article by slug | ✅ COMPLETE | slug route added this session |
| Applications + saved-opportunities | ✅ COMPLETE | |
| AI insights / chat / match / search / summarize | ✅ COMPLETE | grounding + URL-host allowlist + no-match fallback; usage rows → `ai_usage_log` via `setLogger` |
| Auth: signup + username check | ✅ COMPLETE | server-side role derivation, reserved usernames, conflict 409 |
| Global + people search | ✅ COMPLETE | opportunities reuse repository filters |
| Social: feed CRUD, likes, comments, reposts, notifications | ✅ COMPLETE | counts trigger-maintained (routes never increment manually); cross-user notification inserts via service role (same `ponytail:` rationale as frontend) |
| Network: connect request/accept/withdraw, connections list + status check, suggestions, follow/unfollow, followers/following | ✅ COMPLETE | role-enforced accept/withdraw |
| Messaging: conversation discovery, list, send, mark-read | ✅ COMPLETE | `is_read` marking matches frontend semantics |
| News RSS sync (cron) | ✅ COMPLETE (news only) | 12 feeds, relevance filter, slug upsert; cron guarded by `CRON_SECRET` |
| Scraper fleet (ISRO/DRDO/CSIR/… 18 modules) | ⚠️ NOT PORTED | deliberate scope cut — see §5 |
| Auth: login/session/refresh | ⏸️ OUT OF SCOPE | identity stays in Supabase (Phase 8 of extraction spec); signup + Bearer verification done |
| Auth: OAuth providers (Google/GitHub) | ⏸️ OUT OF SCOPE | frontend-only convenience, Supabase-configured |
| File uploads (resume) | ⏸️ OUT OF SCOPE | frontend Supabase storage |
| Profile edit (PATCH /me) | ⏸️ PARTIAL | GET done; PATCH deferred (needs storage + RLS review) |

## 4. Verification run (2026-08-19)

- `backend/api`: 97/97 jest ✅
- `backend/server`: 30/30 node:test ✅ (typecheck + `tsc` build clean)
- `backend/ai-gateway`: no tests (KNOWN_ISSUES #11)
- Backend independence: api + ai-gateway + server compile and test with **no frontend code imported**; server tests run with fake Supabase clients (no credentials, no network).
- Frontend regression: **untouched this session** — network username fix deployed as `a79773a`; E2E production suite 9/9 PASSED against it; probe verified `href=/profile/amittest2` + card click navigation (probe spec removed after use).

## 5. Honest gaps / deferred work

1. **Scraper fleet not ported** (18 frontend modules; 8 real + 10 fabricated-gated). News RSS sync ported as the first real ingestion path. Deferred: opportunity scrapers + `SCRAPER_ALLOW_FABRICATED` gating + dedup against `opportunities` — tracked in backlog (PER-EPIC: backend replication).
2. **`supabase2Admin` (DB2 legacy mirror)** not exercised by new social routes — DB1 is the live social layer per DATABASE-MAP; DB2 client kept for parity of the old mirror.
3. **ai-gateway has zero tests** — KNOWN_ISSUES #11; routing/cooldown logic is production-proven via frontend but the extracted package ships untested.
4. **PATCH /profiles/me** (profile edit) not ported — requires storage presigned URLs + RLS review; deferred.
5. **Messages mark-read + notification inserts** are best-effort fire-and-forget (same as frontend); no retry semantics.
6. **`requireAuth` role source**: server reads `app_metadata.role`, frontend middleware reads `user_metadata.role` — inconsistency documented in API-PARITY, deliberately not "fixed" (auth server is the trusted source; changing either side is a production-behavior change).
7. **Rate limiter is per-process in-memory** — fine for a single Express instance; multi-instance needs Redis.

## 6. How to run

```bash
cd backend/server
cp .env.example .env   # fill SUPABASE_* / ADMIN_* / CRON_SECRET / AI keys
npm install            # workspace: api + ai-gateway linked from root node_modules
npm test               # 30 tests, fakes only
npm run typecheck && npm run build
npm run dev            # :8080
# cron (Vercel Cron or any scheduler):
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:8080/api/v1/cron/news-sync
```