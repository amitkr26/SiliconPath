# IMPLEMENTATION STATUS — 2026-08-19 (reconciled)

Feature matrix across the whole platform. Status vocabulary: **IMPLEMENTED** (in code, live) · **PARTIAL** (works but incomplete) · **BROKEN** (known defect) · **PLANNED** (not built) · **BLOCKED**. Evidence = code path / test / run. Anything marked verified lists the evidence; nothing here claims more than the evidence shows.

## Frontend product surface

| Feature | Status | Evidence | Remaining work |
|---|---|---|---|
| Opportunity search + filters (category/eligibility/location/deadline/keyword, pagination) | IMPLEMENTED | `/api/opportunities` + `lib/opportunities-query.ts`; E2E + audit 27/27 | — |
| Opportunity detail, by-slug, featured, stats, feed, similar | IMPLEMENTED | `/api/opportunities/*` (14 route files) | — |
| Opportunity verification lifecycle | IMPLEMENTED | `verification_status` CHECK `verified\|unverified\|link_unavailable\|expired`; admin verify/reject routes; link-check evidence ledger | `opportunity_verifications` insert guarded — table DDL may still be pending (see `frontend/src/lib/db/index.ts`) |
| Calendar export (ICS), sitemap, OG images | IMPLEMENTED | `/api/calendar-export/[id]`, `/api/sitemap`, `/api/og/opportunity/[slug]` | — |
| News (DB + live RSS merge), article detail, sync/archive/cleanup | IMPLEMENTED | `/api/news/*` (5 routes); RSS via `lib/scrapers/rss-parser.ts` | — |
| News filtering (blocklist/whitelist/tags) | IMPLEMENTED | `lib/scrapers/news-filter.ts` (48 blocklist regexes, 338 whitelist keywords, ≤6 tags) | — |
| AI chat (grounded), classify, enhance, expire, match, opportunity-summary, search, summarize | IMPLEMENTED | `/api/ai/*` (8 routes); gateway 9 providers; grounding in `lib/ai/grounding.ts` | — |
| Academy: 7 tracks, days, checkpoints, progress (guest local + DB) | IMPLEMENTED | `/api/academy/*`; `lib/academy/`; dual-table fallback (`academy_*` → `learning_*`) | No certificates, no labs (documented in 10-academy) |
| Profile: view (public allowlist), edit, username uniqueness, view counter | IMPLEMENTED | `/api/profile/[userId]` GET/PATCH; `PUBLIC_PROFILE_FIELDS`; rpc `increment_profile_views` | — |
| Profile extras: endorsements, recommendations | IMPLEMENTED | `/api/profile/[userId]/endorse`, `/recommendations` | — |
| Resume: CRUD + ATS score + ai-suggest + parse-resume (GCP Document AI) | IMPLEMENTED | `/api/resume`, `/api/resume/ai-suggest`, `/api/profile/parse-resume` | GCP keys gated; AI fallback path |
| Saved opportunities / bookmarks | IMPLEMENTED | `/api/bookmarks` + `[id]` | — |
| Applications (idempotent, status whitelist) | IMPLEMENTED | `/api/applications` + `[id]` | — |
| Recommendations (keyword-scored opps) | IMPLEMENTED | `/api/recommendations` | — |
| Feed (posts, like/comment/repost; counts trigger-maintained) | IMPLEMENTED | `/api/feed/*` (5 routes); triggers SECURITY DEFINER (migrations `20260818000002/03`); E2E 9/9 | No comment UI on feed posts (KNOWN_ISSUES #7) |
| Network: suggestions, connect pending/accept/reject/withdraw, connections, follow/unfollow, followers/following | IMPLEMENTED | `/api/network/*` (8 routes); E2E 9/9; production verified | Feed ignores connection graph (KNOWN_ISSUES #5) |
| Network page 4 tabs (suggestions/received/sent/connections) + clickable cards → profile | IMPLEMENTED | `frontend/src/app/network/page.tsx` (commit `683404c`, deploy READY); PublicProfile live columns (`a79773a`) | — |
| Messaging (conversations participant_a/b, read receipts, pooler-lag polling) | IMPLEMENTED | `/api/messages` + `[conversationId]`; `useConversations` polls 5s; E2E 9/9 | — |
| Notifications (list/count/mark-read) | IMPLEMENTED | `/api/notifications/*` (4 routes) | — |
| Community posts/comments/vote | IMPLEMENTED | `/api/community/*` (4 routes); rpc `toggle_upvote` | — |
| Companies (list/detail/follow) | IMPLEMENTED (gated) | `/api/companies/*`; behind `FEATURES.LINKEDIN_ENABLED` | Feature flag default state unverified in prod |
| Organizations (list/slug, admin CRUD) | IMPLEMENTED | `/api/organizations` + `/admin/organizations` | — |
| Employer: signup role, job posting, dashboard, claim (notification), recommendations | PARTIAL | `/api/employer/*`; middleware `EMPLOYER_ONLY_PATHS` role gate (server-side); E2E audit row claims ATS — see KNOWN_ISSUES #8 | No ATS applicant review UI, no recruiter messaging, no real company-claims table |
| Admin console (opportunities CRUD+verify, analytics, announcements, scrape health, subscribers, performance) | IMPLEMENTED | `/api/admin/*` (22 routes); HMAC/password auth | — |
| Subscriptions + weekly digest (Resend), contact/report-issue, track-click, sync-replica | IMPLEMENTED | `/api/subscribe`, `/api/cron/digest`, `/api/track-click`, `/api/sync-replica` | — |
| Scrapers: 8 real + ATS adapters (4) + RSS (13) | IMPLEMENTED | `frontend/src/lib/scrapers/*` (18 modules); cron: 3 scheduled in `vercel.json` | Recent successful production run NOT verified in 2026-08-19 audit (no evidence found) |
| Fabricated scrapers (10 postings) | PARTIAL | gated by `SCRAPER_ALLOW_FABRICATED=true`, disabled in prod (by design) | Keep gated |
| Search (opportunities + people) | IMPLEMENTED | `/api/search`, `/api/search/opportunities`, `/api/people/search` | — |
| Resources, academy content | IMPLEMENTED | `/api/resources` + `[slug]` | — |
| PWA | PLANNED | only stray `frontend/public/manifest.json`; no service worker | backlog epic-11 task 11.3.3.1 |

## Backend replication (`backend/`)

| Item | Status | Evidence |
|---|---|---|
| `backend/api` shared library (response/error/auth/validation/rate-limit/cache/openapi/content) | IMPLEMENTED | consumed by frontend + server; 97 jest tests |
| `backend/ai-gateway` (9-provider chain) | IMPLEMENTED | zero runtime deps; 15 jest tests; groq model `qwen/qwen3.6-27b` since 2026-08-20 (retired `llama-3.1-8b-instant`); live backend + frontend AI 200 |
| `backend/server` Express API on :8080 | IMPLEMENTED (DEPLOYED 2026-08-20, Render `free` plan; no Render cron — Phase 7: NOT REQUIRED, Vercel owns production cron) | 46 node:test (30 parity + 16 hardening); full route surface incl. social/AI/auth/search/news-cron; 502 `AI_UNAVAILABLE`, `/health/ready`, admin rate-limit, timing-safe admin+cron guards; graceful SIGTERM shutdown (verified in Docker); live: /health + /health/ready 200, auth 200/401, AI summarize 200 (groq/qwen3.6-27b), cron news-sync inserted 58 + worker prod runs +5 / 0 duplicates (285 stable) |
| `backend/worker` (Phase 6 → Phase 8) | IMPLEMENTED | `@berojgardegreewala/worker`: `node --import tsx dist/index.js news|isro` — news RSS sync via shared `content/news-sync` + ISRO government scraper replica (`scrapers/isro.ts`); 30 node:test (17 news + 13 ISRO); run health → `scrape_runs`/`scrape_sources`; structured JSON output; fail-closed env; exit codes 0/1/2; force-exit after summary (2026-08-20 hang fix); production-mode run evidence: news exit 0 fetched 92 / inserted 0 / duplicates 0; isro 2 live runs 18 fetched / 0 inserted / 0 dupes (honest parity — KNOWN_ISSUES #17/#18) |
| Shared news ingestion (`backend/api/src/content/news-sync.ts`) | IMPLEMENTED | 12 feeds, bounded concurrency 4, retry 1+2 (network/5xx/429), run-level URL dedup, `news_articles` upsert onConflict `url` ignoreDuplicates + `is_active: true`; used by server cron route AND worker (single implementation) |
| ISRO scraper replica (Phase 8) | IMPLEMENTED | `backend/worker/src/scrapers/isro.ts` + `run-isro-scrape.ts` + `org-resolve.ts` + `opportunity-utils.ts`; pure parser + deps-injected runner; production dedup contract (source_url orig+normalized OR title ilike); insert `verification_status:"pending"` (the only CHECK-valid status — KNOWN_ISSUES #16); org via host-label rule → db1 ISRO org `2b23230a-…`; idempotent live-verified; docs: `backend/docs/BACKEND-PARITY-MATRIX.md` |
| Parity docs (BACKEND-PARITY-MATRIX, API-PARITY) | IMPLEMENTED | `backend/docs/` — `BACKEND-PARITY-MATRIX.md` (2026-08-20, Phase 7) is authoritative: 136 production routes inventoried, 48 REPLICATED, 5 PARTIALLY REPLICATED, ~28 CRON/WORKER on Vercel, ~55 frontend-internal; `FRONTEND-BACKEND-MAP.md` superseded |
| Parity: social layer (feed/network/messages/notifications) | IMPLEMENTED | `routes/social.ts` + `routes/messages.ts` + notifications; `supabase2Admin` still unused |
| Parity: AI breadth (chat/match/search/summarize) + usage logging | IMPLEMENTED | `routes/ai.ts` (grounded chat, top-10 match, LLM filters, summarize) + `services/ai-usage.ts` `setLogger` → `ai_usage_log` |
| Parity: cron/scrapers port | PARTIAL (PROGRESSING) | news RSS sync done (`/api/v1/cron/news-sync` via shared module + `backend/worker` process); ISRO government scraper REPLICATED into the worker (Phase 8 — pattern proven; DRDO/CSIR next candidates); remaining opportunity scrapers/ATS/RSS-opportunity feeds DEFERRED by owner mandate (Phase 7 §16 — inventory in `project-bible/09-scrapers/REPLICA-MIGRATION-MATRIX.md`); production execution stays on the Vercel cron |
| Parity: search, news `:slug`, auth signup, admin breadth, academy, misc | PARTIAL | search + /people, news `:slug`, auth signup/check-username done; admin breadth + academy pending |
| Independence (no frontend imports) | IMPLEMENTED | workspace deps only (`@berojgardegreewala/*`); verified in audit |
| Rate limiting on server | IMPLEMENTED | Web-Request shim over shared api-lib presets (api 120/min, auth 10/min, search 30/min, ai 20/min, admin 20/min); XFF-aware buckets |

## Quality & security

| Item | Status | Evidence |
|---|---|---|
| Frontend build | PASSES | `npm run build` exit 0 (2026-08-19, `a79773a`) |
| Frontend jest | 104/104 | `frontend/src/__tests__/` (14 files) |
| Playwright E2E (production) | 9/9 | `frontend/tests/e2e/` 6 specs; runs vs https://berojgardegreewala.vercel.app; clean-DB contract |
| backend/api jest | 97 | `backend/api/__tests__` |
| backend/ai-gateway jest | 15 | `backend/ai-gateway/__tests__` |
| backend/server node:test | 46 | `backend/server/tests` (parity 30 + hardening 16) |
| backend/worker node:test | 17 | `backend/worker/tests/news-sync.test.ts` (Phase 6: retry/timeout/5xx/dedup/invalid-url/filter/slug-collision/DB-failure/partial-failure/idempotency/fabricated-guard) |
| Docker build + runtime | VERIFIED | `docker build` PASS; `/health` ok; `/health/ready` 500 with unreachable DB (correct error path); SIGTERM → drain → exit; worker entrypoint fail-closed (exit 1 no env) — node:22-alpine, `.dockerignore`, worker workspace in `npm ci` (2026-08-19) |
| Deployment | IMPLEMENTED (2026-08-20) | Render web service deployed (`plan: free` per render.yaml Phase 7 — `starter` never accepted: no billing card, and none is needed) at https://berojgardegreewala-backend.onrender.com; health/readiness green; auto-deploy verified; NO Render cron (Phase 7 decision: NOT REQUIRED — KNOWN_ISSUES #14 CLOSED); Vercel remains production cron owner |
| RLS (DB1 social tables) | VERIFIED LIVE | v2 policies; do NOT re-apply `20260817000001_fix_social_rls_v2.sql` |
| Secrets | PARTIAL | stale Project 1 service-role key in local credentials (KNOWN_ISSUES #1); production keys fine |
| Rate limiting | IMPLEMENTED (frontend) | middleware buckets (api 120/min, auth 10/min, search 30/min, scrape 5/min, ai 20/min); Upstash optional for contact/subscribe |

## Known limitations (see KNOWN_ISSUES.md for details)
#1 stale local service-role key · #5 feed ignores connection graph · #7 no feed comment UI · #8 employer ATS claim over-documented (doc issue, fixed in E2E_TEST_STATUS reconciliation).
