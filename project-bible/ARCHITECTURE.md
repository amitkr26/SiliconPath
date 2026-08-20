# SiliconPath (BerojgarDegreeWala) — Technical Architecture

**Version:** 2026-08-19 (reconciled) · **Pattern:** Modular Monolith on Next.js & Supabase + independent backend replication

---

## 0. How to read this document

Three states are described explicitly:

- **CURRENT** — what runs in production today (verified 2026-08-19).
- **TRANSITION** — what is being replicated/duplicated right now (`backend/` parity work).
- **TARGET** — the intended end state. Nothing in TARGET is claimed to exist yet.

Source of truth priority: code > this document > audit/session reports > PRD/vision > older docs.

---

## 1. Architectural Pattern

A **modular monolith**: one Next.js 14 (App Router) application on Vercel serves all four surfaces (public, candidate, employer, admin) from a single deploy, sharing one typed data layer and one auth model (Supabase Auth).

**[TARGET]** The independent backend (`backend/`) becomes an independently deployable API layer (`backend/server`, Express) backed by the shared workspace libraries (`backend/api`, `backend/ai-gateway`), and eventually absorbs workloads that should not be coupled to the Next.js deploy (scrapers, cron, digest email, heavy AI). It is not a second system of record — Supabase remains the source of truth.

**[TRANSITION — active]** Backend logic currently inside `frontend/` is being *replicated* (copy/reimplement, never move/delete) into `backend/`. The frontend continues to work exactly as-is and production traffic is NOT switched. Status is tracked in `backend/docs/` (see §10).

This is deliberate: at this scale, microservices would add operational cost and zero user value. When a component genuinely needs isolation (the scrape/verify worker outgrows serverless), it extracts to a worker — not before.

---

## 2. Four-Portal Structure (logical, flat routes)

Portals exist as logical surfaces with **flat routes today** (no route groups). [TARGET] Route groups `(candidate)`, `(employer)`, `(admin)` would be a refactor that keeps URLs unchanged — not yet done, do not claim otherwise.

| Surface | Routes (current, real paths) |
|---|---|
| **Public / free** | `/` landing, `/opportunities` + `/opportunities/[slug]`, `/news` + `/news/[slug]`, `/academy`, `/organizations`, `/resources`, `/ask-ai`, `/match`, `/search`, `/community` |
| **Candidate** | `/profile/[username]` + edit, `/resume`, `/saved`, `/applications`, `/network`, `/messages`, `/feed`, `/notifications`, `/applications` |
| **Employer** (partial) | `/employers`, `/post-job`, `/employer/dashboard`, `/employer/company-claim` — role-gated by middleware |
| **Super admin** | `/admin/*` (opportunity verification, scrapers, analytics, announcements) — HMAC/password gated |

Middleware (`frontend/src/middleware.ts`) is the enforcement boundary: `GATED_PATHS` (login) = feed, network, companies, messages, notifications, people, resume, applications + pages `/applications`, `/resume`, `/saved`; `EMPLOYER_ONLY_PATHS` (role) = `/post-job`, `/employers`, `/employer`, `/api/employer` — role from `user_metadata.role` (`employer|admin`) or `account_type === provider`.

---

## 3. Data Layer — CURRENT (4 databases)

`frontend/src/lib/db/index.ts` routes by purpose: `db1`, `db2`, `neon1`, `neon2` (+ `neonPrimary`/`neonSecondary` aliases).

| DB | Role | Key tables | Access |
| :--- | :--- | :--- | :--- |
| **Supabase Project 1 — db1** (`aqauempuwmbizqoaolop`) | Core transactional + social + logs | `opportunities`, `organizations`, `news_articles`, `user_profiles`, `connections`, `user_follows`, `feed_posts` (+ likes/comments/reposts), `conversations`, `messages`, `notifications`, `saved_opportunities`, `applications`, `resumes`, `community_*`, `company_pages`, `subscribers`, `scrape_sources`, `scrape_runs`, `ai_usage_log`, `opportunity_verifications`, `academy_*`, `learning_*` (legacy) | RLS (migrations, verified live 2026-08-18) + service role server-side |
| **Supabase Project 2 — db2** (`jbqjipwanfsxyqkfrrpx`) | Legacy social mirror | `news_archive`, `user_profiles` (via `syncProfile`) | service role |
| **Neon 1** | Analytics + mirrors | `click_events`, `page_views`, `search_queries`, `trending_cache`, `keyword_stats`, `opportunities_mirror`, `news_mirror` | `NEON_1_DATABASE_URL` |
| **Neon 2** | Cache mirror | `page_views`, `search_queries`, `click_events` | `NEON_2_DATABASE_URL` (written by `/api/sync-replica`) |

### Live column facts (historical docs got these wrong)

- `feed_posts.like_count` / `comment_count` — trigger-maintained (SECURITY DEFINER, migration `20260818000002`). `likes_count`/`comments_count` do not exist (that mismatch was a production bug, fixed 2026-08-18).
- `conversations.participant_a/participant_b`; `messages.body`.
- `connections.requester_id/addressee_id/status` (`pending|accepted|rejected`); triggers maintain `user_profiles` counts only.
- `opportunities.verification_status` CHECK: `verified|unverified|link_unavailable|expired` (no `pending`, no `rejected`). Every insert defaults `unverified`; only admin verify/reject endpoints promote; link-checker sets `link_unavailable`; cleanup cron sets `expired`.
- Legacy names to NOT use: `apply_link`, `stipend`, `organization` (text), `participant_1/2`, `content` (messages).

---

## 4. Data Flow — CURRENT (scraping)

```
                    ┌────────────────────────────────────────────────┐
                    │            VERCEL CRON (3 scheduled)           │
                    │  /api/cron/scrape-opportunities  00:00         │
                    │  /api/cron/check-links           08:00         │
                    │  /api/news/sync                  06:00         │
                    └──────────────────────┬─────────────────────────┘
                                           ▼
        ISRO/DRDO/CSIR/PSU/academic ──┐  frontend/src/lib/scrapers/
        Greenhouse/Lever/Workday ──────┼──► opportunity-scraper-impl.ts
        RSS feeds (13) ───────────────┘      │  normalize + dedupe (source_url)
                                             ▼
                                  organizations (resolve-or-create)
                                             ▼
                                   opportunities (db1, unverified)
                                             │   verification pipeline:
                                             ├─► link check (check-links cron → evidence ledger)
                                             ├─► deep scrape enrichment (first 5 rows)
                                             ├─► AI summary / expiry (ai/expire)
                                             ▼
                                  sync-replica (db1 → Neon mirrors)
                                             ▼
                               public browse (db1, server-rendered)
```

**[TRANSITION]** The entire scraping pipeline lives in `frontend/src/lib/scrapers/*` today; porting it into `backend/server` is an open replication task (see §10).

---

## 5. AuthN / AuthZ — CURRENT

- **Authentication:** Supabase Auth (email/password + Google OAuth only — no GitHub OAuth). Session validated in `frontend/src/middleware.ts` via `supabase.auth.getUser()`; `lib/supabase/server.ts` also binds Bearer tokens to `getUser` for API/mobile clients.
- **RBAC:** role from `user_metadata.role` (`candidate | employer | admin`). Employer paths enforced in middleware (`EMPLOYER_ONLY_PATHS` — server-side role check, verified 2026-08-16). Signup derives role from whitelisted `accountType`.
- **Admin:** `x-admin-password` header or HMAC session (`POST /api/admin/auth` → signed `sessionId.expiry.sig` token, constant-time compare; `/api/admin/auth/session` verifies). All `/api/admin/*` routes call `requireAdmin`/`verifyAdmin` (fail-closed).
- **Cron:** `requireCronOrAdmin` (Bearer `CRON_SECRET`), fail-closed.
- Cross-cutting: CSRF guard for mutations (origin allow-list: localhost:3000, *.berojgardegreewala.vercel.app, ponytail.dev, omniroute.online; exemptions `/api/auth*`, `/api/subscribe`, `/api/report-issue`), per-path rate limiting (`@berojgardegreewala/api` in-memory buckets: api 120/min, auth 10/min, search 30/min, scrape 5/min, ai 20/min), CSP + security headers.

---

## 6. AI Layer — CURRENT

- **Canonical gateway:** `backend/ai-gateway` workspace package — 9 providers: groq → gemini → openrouter → nvidia → agentrouter → omnirouter → cloudflare → bedrock → huggingface (fallback order), 10-min cooldown per provider after failure, `max_tokens 1024`, `temperature 0.3`, 4–5s timeouts. Zero runtime deps (global fetch).
- Frontend consumes the same package via `frontend/src/lib/ai/providers.ts` (thin re-export + `setLogger(logAIUsage)` → `ai_usage_log` on **db1**).
- **Grounding (non-negotiable):** `/api/ai/chat` retrieves matching records from live `opportunities` + `news_articles` (`retrieveGrounding`), builds a grounded system prompt, sanitizes URLs, and deterministically falls back to "no match" when the DB has no candidates. Helpers: `grounding.ts`, `matcher.ts`, `summarizer.ts`, `search-parser.ts`, `expiry-checker.ts`, `newsletter.ts`.
- `/api/ai/*` surface: chat, classify, enhance, expire (cron), match, opportunity-summary/[slug], search, summarize.
- **[TRANSITION]** The Express server currently exposes only `POST /api/v1/ai/insights` (generic, no grounding, no usage logging). Replicating the AI endpoint breadth + wiring `setLogger` in the server is an open task.

---

## 7. AuthN/AuthZ, Errors, Validation, Rate Limiting — shared library

`backend/api` (workspace) is the framework-less TypeScript library consumed by BOTH the Next.js app and the Express server: `response/`, `error/` (AppError hierarchy), `auth/` (getUser/requireAuth/requireAdmin/requireCron), `validation/` (zod + Supabase query builders), `rate-limit/` (in-memory buckets), `cache/`, `openapi/` (spec of the backend `/api/v1` surface — `backend/api/openapi.json`, 51 paths, regenerated via `npm run openapi`; servers: Render backend, Vercel frontend, local), `content/` (taxonomy/dates/status/sources/dedup/seo/quality/news-sync — used by scrapers/ingest). Note: the Express server uses its own `{success,error}` envelope middleware and AppError classes from this package; the Next routes use the package's Response helpers. Both are documented in `backend/docs/API-PARITY.md`.

---

## 8. Independent Backend (`backend/`) — TRANSITION state

| Component | What it is | Port | Status |
|---|---|---|---|
| `backend/api` | Framework-less shared library (response/error/auth/validation/rate-limit/cache/openapi/content + `content/news-sync`) | — (library) | IMPLEMENTED, jest tests (97) |
| `backend/ai-gateway` | 9-provider AI fallback chain | — (library) | IMPLEMENTED, jest tests (15) |
| `backend/server` | Express 4 REST API — the only runnable component | 8080 (`PORT` env) | IMPLEMENTED (46 node:test), production-ready, graceful SIGTERM shutdown, NOT deployed |
| `backend/worker` | Scheduled process workloads (`node --import tsx dist/index.js news`) — Phase 6: news RSS sync | — | IMPLEMENTED (17 node:test), runs the shared `content/news-sync` module |

**`backend/server` route inventory (CURRENT):** `GET /health` (liveness) + `GET /health/ready` (readiness probe, 503 `DB_UNAVAILABLE` without a DB); `GET /api/v1/opportunities` (+ `/:idOrSlug`); `GET /api/v1/profiles/me` (Bearer) + `/:username`; `GET /api/v1/organizations` (+ `/:slug`); `GET /api/v1/news` (+ `/:slug`); `GET/POST /api/v1/applications` + `PATCH/DELETE /:id`; `GET/POST /api/v1/saved-opportunities` + `DELETE /:id`; `POST /api/v1/ai/{chat,match,search,summarize,insights}` (Bearer + ai rate limit; gateway exhaustion → 502 `AI_UNAVAILABLE`); `GET /api/v1/admin/stats` (timing-safe `X-Admin-Password`, admin rate limit 20/min); `POST /api/v1/auth/signup` + `GET /check-username`; `GET /api/v1/search` + `/people`; `GET /api/v1/feed` + `POST/GET/PATCH/DELETE /posts[/:id]` + `like/comment/repost`; `GET /api/v1/network/{connections,status/:userId,connect,suggestions,follow/:userId,followers,following}`; `GET /api/v1/notifications` + mark paths; `GET /api/v1/messages` + `/:conversationId` + `with/:userId`; `GET /api/v1/cron/news-sync` (timing-safe Bearer `CRON_SECRET`; upserts `news_articles` onConflict `url` via the shared module). Envelope `{success,data,pagination}` / `{success:false,error:{code,message,details?}}`. Express rate limiting via the shared api-lib presets (api 120/min, auth 10/min, search 30/min, ai 20/min, admin 20/min) through a Web-Request header shim. Dockerfile: node:22-alpine (supabase-js ≥2.110 needs native WebSocket), non-root `USER node`, HEALTHCHECK, EXPOSE 8080, `.dockerignore` excludes the host node_modules. `dist/` is generated + gitignored. Deployment decision: Render Docker web service + cron job (`render.yaml`, Phase 6) — NOT yet deployed (KNOWN_ISSUES #0).

**[TRANSITION — open parity gaps]** (tracked in `backend/docs/API-PARITY.md`): scraper fleet not ported beyond news RSS (Phase 6 scope: news worker only; opportunity scrapers/ATS stay in the frontend), PATCH `/api/v1/profiles/me` deferred, DB2 (`supabase2Admin`) client wired but unused, admin breadth beyond `/stats`, academy/misc.

---

## 9. Quality Gates

- Every non-trivial change: one runnable check; live re-verification before claiming "done".
- No fabricated/demo data in production; `SCRAPER_ALLOW_FABRICATED` is dev-only.
- Secret hygiene: credential scan before any push; rotate anything that touched chat/docs/history.
- Backend replication rule: frontend is the baseline — replicate, never destructively move; no production traffic switch without explicit instruction.

---

## 10. Documentation pointers

- `backend/docs/FRONTEND-BACKEND-MAP.md` — capability map (2026-08-19)
- `backend/docs/API-PARITY.md` — full endpoint inventory with statuses (2026-08-19)
- `project-bible/MASTER_INDEX.md` — navigation map for the whole bible
- `docs/audit-reports/2026-08-16-implementation-map.md` — the master audit
- `docs/session-reports/` — dated session reports (latest first)
