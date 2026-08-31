# Session Report — 2026-08-20 — Phase 6.5: Render deployment + production verification (PARTIAL)

## Scope
Deploy the standalone backend (`backend/server`) to Render per the committed
`render.yaml` (Docker web service + cron job `news-sync`), set env vars, verify
production health/readiness, smoke tests, auth, AI (one call or BLOCKED BY
CONFIGURATION), first RSS run with DB evidence + duplicate safety, Vercel cron
confirmation, production E2E, security checks, docs update.

Out of scope (respected): Phase 7, opportunity scraper migration, Vercel cron
ownership change, frontend code changes, schema changes.

## What happened

### Deployment (Render API)
- Blueprint apply is not supported by the Render API (POST /v1/blueprints -> 405;
  only validate/list/retrieve endpoints exist). Services created via
  POST /v1/services with the render.yaml config (repo amitkr26/BerojgarDegreeWala,
  dockerfilePath ./backend/server/Dockerfile, dockerContext ., healthCheckPath
  /health, PORT 8080, autoDeploy yes).
- Workspace: tea-d91n0jeq1p3s73c8k1vg (Amitkr26).
- `plan: starter` rejected: HTTP 402 Payment Required — the workspace has NO
  billing card. **Deviation (documented):** web service created on `plan: free`.
  Cron jobs require paid plans -> Render cron NOT created (KNOWN_ISSUES #14).
- Web service: `srv-da38i6ojo6nc73e02v20` ->
  https://berojgardegreewala-backend.onrender.com
  Deploy 1 (commit 45ed89f) live; deploy 2 (commit 37ce7cc, fix) live after push
  (auto-deploy verified).
- Env vars provisioned in the create body: PORT, NODE_ENV, ALLOWED_ORIGINS
  (Vercel + localhost + electrobridge-api), SUPABASE_URL/ANON/SERVICE_ROLE (db1),
  SUPABASE_2_URL/SERVICE_ROLE (db2), ADMIN_PASSWORD, ADMIN_HMAC_SECRET,
  CRON_SECRET, GROQ_API_KEY — sensitive ones with secret:true (masked). Values
  read from %TEMP%\opencode\render-env.txt; never printed.

### Credentials (Supabase, Management API)
- File's Project 1 sb_secret_... key is STALE (GoTrue 401 "Unregistered API key").
- New-style secret keys created via POST /v1/projects/{ref}/api-keys fail at the
  gateway (Kong "Invalid API key ... owned by another Supabase project").
- **Current legacy service_role + anon JWTs** (fetched from the Management API
  GET /v1/projects/{ref}/api-keys list; `api_key` present for legacy keys) are
  VALID — used for the deployment. DB2 legacy service_role JWT also valid.
- Temp copies: %TEMP%\opencode\{render-env.txt, p1-service-role-key.txt,
  p1-anon-key.txt, p2-service-role-key.txt, p2-anon-key.txt}.

### Production verification
- /health 200 {status:ok}; /health/ready 200 {status:ok, ready:true}.
- Smoke suite (after fix): opportunities list (3269 rows), opportunity by slug,
  news list (222 -> 280 after ingestion), news by slug, organizations, search
  (opps+people), check-username, profile by username, 404 envelope, CORS (Vercel
  origin allowed + credentials, foreign origin blocked), admin 403 (no password)
  / 200 with counts, AI 401 unauthenticated.
- **Bugs found + fixed (commit 37ce7cc)** — production smoke exposed db1 schema
  drift in the committed queries (all 500 INTERNAL_ERROR):
  1. opportunities embed `organizations(name, slug, website_url)` — db1 column is
     `website` (42703).
  2. organizations list/slug selected `website_url` — same fix.
  3. news list selected `source, source_url` — db1 has `source_name, url`; rows
     mapped to the client shape (source/source_url) like the frontend.
  4. news/:slug queried `news_archive` (db2-only table) — now `news_articles`
     (frontend parity).
  Test mock updated (parity.test.ts news-slug -> news_articles). Server 46/46.
- **RSS production evidence:** /api/v1/cron/news-sync (CRON_SECRET bearer, same
  shared module as the worker): run A inserted 58 rows (12 feeds attempted, 8 OK;
  Chip Design Magazine / The Electronics Media / The Register - Hardware /
  Science Daily - Electronics fail at feed level); runs B and C scraped 92 items,
  inserted 0 — count stable at 280, duplicate safety proven in production.
- **Auth:** user JWT (amittest1 via GoTrue password grant) accepted by backend
  (/api/v1/profiles/me 200). AI call with JWT -> 502 AI_UNAVAILABLE (clean
  envelope, no stack/secret leak).
- **AI = BLOCKED BY CONFIGURATION:** root cause isolated — GROQ key VALID
  (GET /v1/models 200) but `llama-3.1-8b-instant` was retired by Groq in 2026
  (current: qwen/qwen3.6-27b, openai/gpt-oss-120b, groq/compound). Shared gateway
  (backend/ai-gateway) => frontend AI affected too. Fix = one-line model id,
  pending owner approval (out of deployment scope) — KNOWN_ISSUES #15.
- **Vercel cron:** /api/news/sync 0 6 * * * intact, unchanged (production owner).
  DB fingerprints: 08-14 (43), 08-15 (31), 08-16 (1) at 06:00 UTC; none 08-17/18/19
  (all-duplicate or missed — unverified). Vercel auto-deployed the frontend on the
  main push (no frontend code change).
- **Production E2E 9/9** (Playwright, workers 1, against the live frontend;
  residue cleaned before and after via db1-sql.mjs with the actual column names:
  user_follows.following_id, conversations.participant_a/b, feed_posts.content).
- **Security:** credential scan clean (only the documented test-account password
  in test scripts); error envelopes leak no internals; x-powered-by disabled;
  secrets provisioned as masked; nothing secret committed; working tree clean.

### Git
- 45ed89f (Phase 6 merge) pushed; 37ce7cc fix(server): align content queries with
  db1 schema (deploy 500s) pushed — auto-deploy verified.
- CHANGELOG Add-Content backtick corruption discovered + repaired (control chars
  removed; some code spans lost formatting only).

## Issues
- KNOWN_ISSUES #0 CLOSED (deploy + health evidence).
- #14 NEW: Render cron blocked — no billing card (owner action).
- #15 NEW: Groq retired llama-3.1-8b-instant -> AI 502 (backend + frontend).
- #1, #9, #12 annotated (partial evidence for #12; #9 green-run confirmation
  pending — private repo, no gh CLI).

## Next action (exactly one)
Owner adds a billing card at https://dashboard.render.com/billing, then creates
the Render cron `news-sync` from render.yaml and confirms the first worker run
(KNOWN_ISSUES #12/#14); then approve the one-line Groq model fix (#15).