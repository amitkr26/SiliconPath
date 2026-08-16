# SILICONPATH (BEROJGARDEGREEWALA) — IMPLEMENTATION MAP

**Date:** 2026-08-16
**Method:** 4 parallel code audits (frontend, API, database, feature systems) + live MCP verification (Supabase REST, Neon SQL). Every defect below is code-verified or live-verified. No code was modified during this audit.

---

## 1. VERDICT

**This is NOT a rebuild.** Roughly 60–70% of the requested functionality already exists and works. The blocker is the **foundation (Phase 1 P0s)**, not feature quantity. Fix the foundation first (mandate §54).

### What works today (live-verified)
- **Opportunity engine**: real scraper engine (`frontend/src/lib/scrapers/opportunity-scraper-impl.ts`, 8 built-in + ATS adapters), search with category/eligibility/location/deadline filters (`lib/opportunities-query.ts`), detail + save (`saved_opportunities`) + apply flow + `applications` (with unique constraint migration).
- **Profiles**: server-rendered public profiles, `ProfileEditor` + `EditProfileModal` (v2 schema), connect/endorse UI.
- **Network**: connection requests (accept/ignore), follows, suggestions (`api/network/*`, `hooks/useNetwork.ts`).
- **Feed**: posts, like (`post_reactions`), comment, repost, delete (`api/feed/*`, `hooks/useFeed.ts`).
- **Messaging**: conversations + threads with realtime (`api/messages/*`, `MessageThread.tsx`).
- **Notifications**: 12 types, unread count, mark-read (`api/notifications/*`).
- **AI**: DB-grounded chat (`lib/ai/grounding.ts`, NO_MATCH_FALLBACK), match scoring (`lib/ai/matcher.ts`), 9-provider gateway (`backend/ai-gateway`) — the only AI entry point, reused, not duplicated.
- **Academy**: tracks/days/assessments/progress (`learning_*` tables + `data/academyResources.ts`).
- **Resume**: builder page (ATS score, AI suggest, export), `api/resume/*` on `resumes` table.
- **Admin**: HMAC console (scrapers/sources/ai/opportunities/subscribers + 11 sub-pages).
- **News**: DB + live RSS merge, slug migration applied.
- **Shared guard package**: `backend/api/src/auth` — `requireAuth/requireAdmin/requireCron` are **fail-closed** and reusable.

### Topology (live-verified this audit)
- **Supabase db1** (`aqauempuwmbizqoaolop`): holds opportunities (3,272), news_articles, conversations, post_reactions, scrape_sources. Social tables ALSO live here — the documented DB1/DB2 split is code-level config (`frontend/src/lib/db/index.ts`), with live consolidation; `syncProfile()` mirrors `user_profiles` db1↔db2.
- **Supabase db2** (`jbqjipwanfsxyqkfrrpx`): not reachable via MCP — **must be enumerated live at Phase 1**.
- **Neon1**: `opportunities_mirror`, `news_mirror`, `page_views`, `search_queries`, `click_events`, `trending_cache`, `keyword_stats`. The documented DB3 log tables (`ai_usage_log`, `scrape_logs`, `platform_events`, `link_check_logs`) exist **nowhere live**.
- **Neon2**: only `page_views`, `search_queries`, `click_events`.
- Neon is correctly **not** a dependency for core transactions (only analytics/mirror routes touch it).

---

## 2. P0 DEFECT REGISTER (Phase 1 scope)

| ID | Defect | Evidence | Fix |
|---|---|---|---|
| P0.1 | **Cron scrapes fabricated/no-op path** | `vercel.json` → `/api/scrapers/run-all` → `national-scrapers.ts` (gated `SCRAPER_ALLOW_FABRICATED`, returns `[]` in prod). Last real inserts 2026-08-02. Real engine admin-only via `/api/scrape` | New `/api/cron/scrape-opportunities` (`requireCron`, fail-closed) → `scrapeAllOpportunities()` + RSS; update `vercel.json`; `run-all` removed from cron (kept for admin). Fabricated scrapers stay dev-only |
| P0.2 | **Verification is fake** | 3,269/3,272 rows `verification_status='verified'`, 0 `unverified`; static insert default; no pipeline. `check-links` auto-verifies reachable links without evidence model | `opportunity_verifications` table (db1) + writer; new inserts default `unverified`; `check-links` records verification rows; admin queue UI. Never invent evidence |
| P0.3 | **Organization resolution broken** | 3,115/3,272 `organization_id IS NULL`; Neon mirror shows person-name orgs ("Sadia Munir" ×18, "Muhammad Faizan" ×2 — spec §12 bug still live) | Extend existing `inferAuthenticOrganization`/`mapDbOpportunityToClient` (lib/utils.ts) into a real resolver; evidence-based idempotent backfill script; fix ATS byline stripping. No blind assignment |
| P0.4 | **Schema drift (legacy columns in live code paths)** | `apply_link`: admin/recheck-link, check-links, calendar-export, cron/scrape-*, scrape-jobs, scrape-opportunities, employer/jobs. `stipend`: cron/scrape-*, employer/jobs, calendar-export, opportunities-feed, ai/chat prompt, lib/ai/newsletter. `organization` text: applications GET, admin/applications, admin/scrape-health, recommendations, search/opportunities, ai/search, sync-replica, opportunities-feed. `apply_clicks`/`posted_at`: track-click, sync-replica. Migration `20260704000001_db1_core_schema.sql` stale; live schema is truth | One consolidated current-state migration (db1+db2+neon) matching live; fix all listed routes; delete dead `scrape-jobs`; `scraper_sources` → `scrape_sources` everywhere (live has only `scrape_sources`); create missing log tables OR point code at existing ones; fix `db/index.ts` comments (3 DBs, not 4) |
| P0.5 | **RBAC not enforced** | `middleware.ts` `EMPLOYER_ONLY_PATHS` = login-only, no role check; employer pages redirect client-side only (cosmetic). `profile/me` allows role→"admin" escalation; `applications/[id]` DELETE is IDOR + PATCH unscoped; signup lets client choose employer role; `opportunities/[id]` PATCH + admin/organizations POST accept raw bodies (mass assignment) | Server-side role enforcement: middleware checks `app_metadata.role` via `getUser()`; reuse `requireAuth/requireAdmin/requireCron` (already fail-closed); fix escalation, IDOR, signup role, add zod to raw-body routes |
| P0.6 | **Security gaps** | Fail-open: `ai/expire` (guard inverted), `send-digest`. `revalidate` secret in query string. Individual scrapers unauthenticated + rate-limit-exempt with service-role writes. `employer/recommendations` ignores `is_profile_public`. `report-issue` no auth/rate-limit. Feed comment route reads `feed_posts.user_id` (v2 uses `author_id`). `platform_analytics` + `ai_usage_log` queried but don't exist live → broken analytics routes, silent AI log failures | Fix all guards; scrapers require `requireCronOrAdmin` + rate limits; RLS audit (see 2.1) |

### 2.1 RLS — needs live enumeration
Migrations contain mixed policy coverage (`company_profiles`: public SELECT + owner ALL; several social tables have policies). **No live RLS inventory exists** — run one in Phase 1 (SQL via psql/supabase CLI, not MCP) and close: unauthenticated mutations, missing UPDATE/DELETE policies, `USING (true)` where row-level scoping is required.

---

## 3. SCHEMA DRIFT REGISTER (migration files ≠ live)

| Entity | Repo migration defines | Live/code uses | Action |
|---|---|---|---|
| `opportunities` | `organization` text, `stipend`, `apply_link`, `apply_clicks`, `posted_at` (20260704000001) | `organization_id`, `salary_range`, `apply_url`, `source_type`, `verification_status` (5-value) | Migration already applied live (20260812000002 rename); **redefine 20260704000001 as stale** in consolidated migration |
| `user_profiles` | `full_name/headline/about/city/country` (20260630000001) | `display_name/bio/current_company/skills/account_type` | Consolidate on live shape |
| `connections` | `user_id_1/user_id_2` (20260703000003:82) | `requester_id/addressee_id/status` | Consolidate on live shape |
| `conversations`/`messages` | `participant_1/participant_2` + `content` | `participant_a/participant_b` + `body` | Consolidate on live shape |
| `post_reactions` | **not in any migration** | live (empty) | Add to consolidated migration |
| `scraper_sources` vs `scrape_sources` | both in different migrations | live has only `scrape_sources` | Delete `scraper_sources` references |
| `ai_usage_log`/`scrape_logs`/`platform_events`/`link_check_logs` | documented DB3 tables | **don't exist live** (MCP error) | Create on Neon1 OR repoint code to `page_views`-style tables |
| `platform_analytics` | — | **doesn't exist live**; queried by api/analytics/platform + admin/analytics | Create or repoint to `page_views`/`click_events` |
| `trending_cache`/`keyword_stats` | in no repo schema file | **live on Neon1** | Add to neon/schema.sql |
| `company_profiles` | 3 conflicting shapes (20260704000001, 20260703000003, 20260802000001 — last is `IF NOT EXISTS` silent no-op trap) | unused by routes (companies → `company_pages`) | Delete dead variants; keep `company_pages` |
| `user_alerts` | orphaned table | no API; dashboard calls nonexistent `/api/alerts` | Wire up (Phase 6) or delete |
| `resumes` (db1, 20260710_002) + dead `user_resumes` (20260704000002) | both | code uses `resumes` | Drop `user_resumes` |

---

## 4. FEATURE MATRIX (21 systems → status)

| # | Feature | Status | Reuse/notes |
|---|---|---|---|
| 1 | Profile | WORKING (drift) | Extend, don't rebuild (Phase 2) |
| 2 | Network | WORKING | + follows separation, mutual, discovery (Phase 3) |
| 3 | Feed | WORKING | + media/polls/cursor pagination (Phase 4) |
| 4 | Messaging | WORKING | + requests/groups (Phase 5) |
| 5 | Opportunities | WORKING | core moat; search filters extend (Phase 6) |
| 6 | Job alerts | **BROKEN** (`/api/alerts` missing, `user_alerts` orphaned) | Phase 6 |
| 7 | AI matching | WORKING (UI thin — `/match` redirects to /network) | Phase 10 |
| 8 | AI chat | WORKING (grounded) | Phase 10 |
| 9 | Resume | WORKING | Phase 2/10 |
| 10 | Academy | WORKING | + certificates/badges (Phase 8) |
| 11 | Applications | WORKING | + timeline/notes (Phase 6) |
| 12 | Saved | WORKING | — |
| 13 | Employer portal | WORKING (flag-gated + client-side role only) | Phase 7 |
| 14 | Admin console | WORKING (HMAC) | + verification queue/scraper health (Phase 1) |
| 15 | Search | PARTIAL (opps strong; people basic) | Phase 6/20 |
| 16 | Analytics | **BROKEN** (nonexistent tables) | Phase 1 (fix) + 12 |
| 17 | News | WORKING | — |
| 18 | Community Q&A | API works, **page hidden** (redirects to /news) | Phase 11 |
| 19 | Reputation | PARTIAL (endorsements yes; recommendations table unused) | Phase 12 |
| 20 | Companies/orgs | PARTIAL (flag-gated; orgless data) | Phase 7 |
| 21 | Privacy/safety | PARTIAL (CSRF/rate-limit/CSP yes; no block/mute/export/deletion/moderation) | Phase 12 |

**Missing entirely**: events, groups, research network (publications/labs/ORCID), university pages, creator system, skill-gap engine UI, profile analytics, data export/account deletion.

---

## 5. PHASE PLAN (concrete, file-level)

### PHASE 1 — FOUNDATION (P0s; ~1–2 weeks)
Order matters; each step is independently verifiable.

1. **Cron → real engine.** New `frontend/src/app/api/cron/scrape-opportunities/route.ts` (guard `requireCron`, zod-validated config, reuse `scrapeAllOpportunities` from `opportunity-scraper-impl.ts` + RSS path). `vercel.json`: replace `run-all` cron entry. Delete fabricated-scraper path from cron scope. *Verify: new `scrape_runs` success rows + fresh `created_at` after next cron; admin scrape-health shows it.*
2. **Fail-closed guards.** Fix inverted checks in `api/ai/expire/route.ts` and `api/send-digest/route.ts` (no secret → 500). *Verify: curl without secret → 500; with secret → works.*
3. **Verification v1.** db1 migration: `opportunity_verifications` (id, opportunity_id, check_type, status, checked_at, source_url, http_status, deadline_found, content_hash, error, metadata). Insert path: default `unverified`. `check-links` cron writes verification rows; reachable = `link_checked`, never auto-`verified` without evidence. Admin: verification queue tab (list unverified, review, verify/reject with evidence fields). *Verify: new insert → `unverified`; cron creates rows; 0 fabricated badges.*
4. **Org resolution + backfill.** Extend `inferAuthenticOrganization` → resolver module `frontend/src/lib/organizations/resolve.ts` (domain-based org mapping + name heuristics, evidence-gated). Idempotent backfill script (scripts/, reads db1, updates only rows with reliable evidence; dry-run first). Fix ATS adapter byline stripping. *Verify: `organization_id IS NULL` < 10%; zero person-name orgs; backfill re-runnable.*
5. **Schema reconciliation.** Consolidated current-state migration file for db1 (matches live: v2 `opportunities`, `scrape_sources`, `post_reactions`, `opportunity_verifications`) + db2 + Neon1 (add missing log tables or repoint code). Fix every legacy-column route from P0.4 table. Delete `scrape-jobs`. Unify `scraper_sources`→`scrape_sources`. Fix `db/index.ts` comments + `neon/schema.sql` (add `trending_cache`, `keyword_stats`). *Verify: every touched route queries live schema without error; `npm run build`.*
6. **RBAC server-side.** Middleware: for `EMPLOYER_ONLY_PATHS` + `/admin/*`, check role from `app_metadata.role` (server-side, via `getUser()`); non-employer → 403/redirect. Reuse `backend/api/src/auth` helpers — no new duplicated guards. Fix `profile/me` role escalation, `applications/[id]` ownership, signup role selection, raw-body mass assignment (`opportunities/[id]`, admin/organizations). *Verify: non-employer 403 on `/post-job` API; IDOR attempt returns 404.*
7. **RLS audit + fixes.** Live policy enumeration; close holes; verify with RLS tests (unauthorized user fails per table). *Verify: `anon` and cross-user tests fail correctly.*
8. **Security sweep.** Scrapers behind `requireCronOrAdmin` + rate limits (remove middleware exemption); `revalidate` secret out of query string; `report-issue` auth + rate limit; feed comment `user_id`→`author_id`; fix `platform_analytics`/`ai_usage_log` (create live tables or repoint). *Verify: each fix has a test.*
9. **Topology reconcile + docs.** Enumerate db2 + Neon2 live schemas; decide the two-Supabase question (below); update ARCHITECTURE.md Known Drift register.

**Phase 1 exit test**: cron inserts real rows; new rows unverified; verification rows appear; orgless <10%; zero legacy-column queries in `frontend/src/app/api`; non-employer blocked server-side; no secret → no scrape.

### PHASE 2 — PROFESSIONAL PROFILE
DB: `education`, `experience`, `profile_skills` (proficiency, endorsement count), `projects`, `certifications` (user_id FK, modular — no giant table). API: `api/profile/[userId]/{education,experience,skills,projects,certifications}` CRUD (reuse zod + requireAuth + ownership). UI: extend `ProfileEditor`/`EditProfileModal` with section editors; profile completeness meter; public render in `PublicProfile`. Security: ownership on every mutation. Tests: section CRUD + ownership.

### PHASE 3 — NETWORK
DB: `follows` (followers/following, distinct from `connections`; unique constraint `(follower_id, following_id)`); reconcile `user_follows` variants. API: `api/network/follows` list; mutual connections endpoint; people discovery filters (alumni: education.institution; recruiters: account_type; mentors: research interests). UI: network tabs + people directory (replace `/people` redirect). Tests: no duplicate relationships (constraint-level), connection≠follow.

### PHASE 4 — SOCIAL FEED
DB: `post_media` (or storage refs on `feed_posts`), `feed_post_polls`+votes, mention/hashtag parse on write. API: extend posts CRUD (media upload via existing storage pattern, drafts, pin), cursor-based pagination (`cursor` param, `created_at < cursor` — no OFFSET). UI: `PostComposer` media/poll controls, cursor infinite scroll in `feed/page.tsx`. Security: upload validation (type/size), sanitize. Tests: cursor pagination ordering, media upload constraints.

### PHASE 5 — MESSAGING
DB: `conversations.type` (direct|group), `conversation_members` (group), `message_reads` (per-recipient read status), `message_requests` (first-contact approval). API: group CRUD (admin/member mgmt), request accept/deny, unread counts (exists — extend for groups). UI: group header/member list in `messages/page.tsx`. Security: membership check on every read/write (no private message exposure via public APIs). Tests: group permissions, request flow.

### PHASE 6 — JOBS + ALERTS + AI MATCHING
- Search: extend `lib/opportunities-query.ts` filters (experience, salary/stipend range, skills, verified-only, date-posted). 
- Alerts: wire `user_alerts` table + `api/alerts` (the dashboard already calls it); criteria (keywords/skills/location/category/remote); daily cron digest via existing Resend path (`lib/email-digest.ts`); dedupe notifications.
- Applications: timeline events table (`application_events`), candidate notes.
- AI matching UI: build `/match` (currently redirect) — match-score cards using `api/ai/match` + `lib/ai/matcher.ts`; explainable breakdown (skills/education/experience/eligibility/location). DB stays authoritative — LLM never invents requirements.
Tests: alert dedupe, filter correctness, match score shape.

### PHASE 7 — EMPLOYER PORTAL + ATS
DB: `application_stage_changes`, `candidate_notes`/tags, org→employer binding (`company_pages.admin_user_id` claim flow exists — enforce). API: scoped applicant listing per posting (fix the `ponytail:` all-applications flag in `employer/dashboard`), stage transitions, candidate search (people search + filters), saved candidates/talent pools. UI: ATS board (pipeline columns Applied→Screening→Shortlisted→Interview→Technical→Offer→Hired) reusing `admin/applications` patterns; un-gate `/companies` (product call — see Decisions). Security: employer can only touch own postings' applications; `is_profile_public` respected in candidate search. Tests: cross-org isolation.

### PHASE 8 — LEARNING
DB: `certificates` (user_id, track_id, issued_at, credential hash), `skill_badges`. API: certificate issuance on assessment pass (reuse `user_track_assessment_results`), course recommendations (skills-based). UI: certificate page + badge display on profile. Tests: issuance only on pass.

### PHASE 9 — RESEARCH NETWORK
DB: extend profile with `research_interests`, `publications`/`patents`/`projects` (JSONB or modular tables), `orcid`/`google_scholar` fields, `labs`/`research_groups` as organizations (type column). API: profile research sections CRUD; lab pages via existing org detail. UI: research tab in `PublicProfile`; JRF/SRF/PhD category filters already exist (categories: jrf, fellowship...). Tests: schema + CRUD.

### PHASE 10 — AI INTELLIGENCE (all through `backend/ai-gateway` only)
- Skill-gap engine: `lib/ai/skill-gap.ts` — target role → required skills (curated map in repo, not LLM-fabricated) → missing vs profile skills → learning plan from `academyResources` tracks + assessment link. API `api/ai/skill-gap`, UI in `/match` or profile.
- Profile AI: analyze profile completeness + suggestions (`api/ai/profile-analyze`, reuse providers.ts).
- Resume AI exists (parse-resume, ai-suggest) — extend cover-letter generation.
- Career assistant: extend grounded chat with structured actions (explain requirements against live records only).
Tests: skill-gap output correctness; grounding preserved (no invented records).

### PHASE 11 — COMMUNITY
- Community Q&A: restore `/community` page (API exists), tabs + feed integration.
- Groups: `groups`, `group_members`, `group_posts` (public/private, admins/moderators) + join/leave + initial categories (VLSI, Embedded, JRF/SRF, PhD, Research, DRDO, ISRO...).
- Events: `events`, `event_registrations` (online/offline, webinar/workshop/seminar, reminders via notifications).
- Creator/newsletters: article table + creator profile + publish/draft/schedule + subscription (reuse `subscribers` + send-digest).
Tests: group privacy, event registration idempotency, newsletter dedupe.

### PHASE 12 — ANALYTICS + REPUTATION + PRIVACY
- Fix + extend analytics: `page_views` (exists on Neon2 — wire profile views), post impressions (`post_reactions`/comment counts), recruiter analytics (views/contacts per posting); `ai_usage_log` live (Phase 1).
- Reputation: wire `recommendations` table (request/write/accept; no self-recommendation), verification badges on profiles (education/employment evidence-based only).
- Privacy: block/mute, report moderation queue (admin), data export, account deletion, notification preferences, login history.
Tests: viewer privacy (no identity leak), badge only-with-evidence.

### ROUTE STRUCTURE MIGRATION (alongside phases, incremental)
Move pages into route groups **without changing URLs** (groups don't affect URLs):
- `(candidate)/`: root, opportunities/*, news/*, academy/*, match, ask-ai, saved, applications, profile, resume, people, network, feed, messages, notifications, resources, organizations, search, dashboard.
- `(employer)/`: employer/*, post-job, employers shims.
- `(admin)/`: admin/*.
Verify each move (build + smoke test of the moved routes). Middleware matcher unchanged (URLs identical).

---

## 6. DECISION POINTS FOR THE OWNER (blocking Phase 1/7 choices)
1. **Two Supabase projects**: live consolidation observed (social tables in db1). Keep the two-project split (re-create/migrate social tables into db2, delete from db1) or **consolidate on one project** (simpler, one RLS surface)? Recommendation: consolidate on db1 — the split buys nothing today and `syncProfile` is a drift source.
2. **`NEXT_PUBLIC_LINKEDIN_ENABLED` flag**: un-gate `/companies` + notifications, or keep social behind the flag and focus on the career moat? Recommendation: un-gate companies (org pages are core to the moat), keep the flag for social extras only.
3. **`backend/server` (Express mirror)**: keep in sync, or archive as deprecated? Recommendation: archive (mark deprecated in README) unless it has a live deployment.
4. **Social layer depth**: build phases 3–5 fully, or cap at current working level and invest in jobs/employer/learning (the differentiation)? Recommendation per mandate §50: cap social at what works, prioritize 6–8.

---

## 7. VERIFICATION PROTOCOL (every phase)
1. Unit tests (node:test — existing pattern: `grounding.test.ts`, `news-slug.test.ts`, backend/server 16 tests).
2. Integration tests (API + DB, select-aware fake client pattern exists).
3. RLS tests (unauthorized must fail).
4. `npm run build` + lint + type checks.
5. Browser verification of the affected flow (real browser).
6. Production verification (deploy + live API/db checks) for production-facing changes.
7. Document: dated CHANGELOG entry + affected section guides (AGENTS.md standing rule).
Never claim "fixed/working" without steps 5–6.

## 8. EXPLICITLY DEFERRED (not in scope)
- Enterprise recruiter features (LinkedIn-Recruiter parity) — build "minimum useful ATS" only (§20).
- WhatsApp/Telegram alerts (no existing infra; email+notification only).
- Real-time presence/typing indicators (no infra; skip unless trivial).
- Premium/paid tiers, 2FA beyond Supabase native, native mobile apps.

## 9. DELIVERABLE CADENCE
Per phase, report per §51: what existed → reused → changed → created; DB/API/UI/security changes; tests added + run; known limitations; production verification result. Commit per phase (foundation/security first, logically separated commits per §52).

*Companion report: `docs/audit-reports/2026-08-16-state-of-the-union.md` (strategy + data-quality audit, live numbers).*
