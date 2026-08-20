# DevOps Architecture

## Deployment

Production is a single deployment: the Next.js frontend on Vercel, driven by git
integration (push to `main` triggers an auto-deploy; ~15 min build). The standalone
backend replica (`backend/server`) is **DEPLOYED 2026-08-20 (Phase 6.5)** on Render
as an independent Docker web service — **free tier only** (Phase 7: `render.yaml`
is a single free web service; the Render cron idea is removed from the architecture,
KNOWN_ISSUES #14 CLOSED). Vercel remains production; the frontend does not call Render.

| Service | Provider | Purpose |
|---------|----------|---------|
| Frontend + API routes | Vercel (Hobby, git integration) | Next.js 14 app; all `/api/*` routes run as serverless functions |
| Backend API (LIVE) | Render web service (Docker, `backend/server/Dockerfile`) | Standalone Express REST API — https://berojgardegreewala-backend.onrender.com; `/health` + `/health/ready` verified 200; graceful SIGTERM shutdown; auto-deploy on push to main |
| Scraper worker (NOT SCHEDULED) | none (image only; `backend/worker`) | News RSS sync (`node --import tsx backend/worker/dist/index.js news`) + ISRO government scraper replica (`… dist/index.js isro`, Phase 8) — Phase 7: NOT scheduled anywhere (Render cron removed from the architecture, #14 CLOSED); Vercel cron owns production news sync. Worker entrypoint verified in production mode (news: exit 0, idempotent — KNOWN_ISSUES #12; isro: × 2 runs exit 0, 18 fetched / 0 inserted / 0 dupes — honest parity, KNOWN_ISSUES #17/#18). |
| DB1 | Supabase | Core platform data |
| DB2 | Supabase | Social + user data |
| Analytics | Neon (2 databases) | Analytics, logs, search cache |
| Email | Resend | Transactional emails |
| AI Providers | Groq, Gemini, NVIDIA, OpenRouter, Bedrock, Cloudflare, HuggingFace, AgentRouter, OmniRouter | LLM inference (`backend/ai-gateway`) |
| Error Tracking | Sentry | Error monitoring (`NEXT_PUBLIC_SENTRY_DSN`) |
| Analytics | Plausible | Privacy-first analytics (CSP allowlist) |

**Deployment notes (2026-08-20, Phase 6.5 + 6.6 + 7):** services were created via the
Render API (`POST /v1/services`; the blueprint API has no create endpoint — 405).
The web service runs on `plan: free`; the committed `render.yaml` now also says
`plan: free` (Phase 7) — the earlier `starter` attempt was rejected 402 because the
workspace had no billing card, and it is moot: **no paid Render infrastructure is
required or wanted** (owner mandate: Render Free only). Env vars were provisioned
via the API with `secret: true` for the sensitive values (service-role keys,
admin/cron secrets, AI keys). Verified: `/health` and `/health/ready` 200; CORS
(Vercel origin allowed, foreign blocked); admin `X-Admin-Password` guard 403/200;
user JWT auth 200/401; `/api/v1/cron/news-sync` production run inserted 58
`news_articles` rows, subsequent runs insert 0 (duplicate safety); production E2E
9/9. **Phase 6.6 (2026-08-20):** AI unblocked — `PROVIDER_CONFIG.groq.model`
`llama-3.1-8b-instant` (retired by Groq) → `qwen/qwen3.6-27b` (verified in the live
/v1/models list; commit b32f3d7); backend `/api/v1/ai/summarize` 200
(provider=groq, model=qwen/qwen3.6-27b), telemetry row in db1 `ai_usage_log`
(success, no credentials), frontend `/api/ai/summarize` 200. Worker entrypoint
hang root-caused (keep-alive TLSSockets from aborted feed bodies) + fixed
(force-exit after flush, commit c7928ed); production-mode runs: Run A +5 rows
(280 → 285), Run B exit 0 / 0 inserts / 0 duplicates. Opportunity embed
slug/website mapping fixed (commit 3edceff). **Phase 7 (2026-08-20):** Render cron
is NOT REQUIRED / OUT OF SCOPE (#14 CLOSED) — `render.yaml` is a free web service
only; the worker stays in the image, independently runnable on demand.

**Worker architecture (Phase 6, Phase 7, Phase 8):** `backend/worker` (workspace
`@berojgardegreewala/worker`) is an independently runnable process; all news
ingestion logic lives in the shared library `backend/api/src/content/news-sync.ts`
(also used by the server cron route). Phase 8 adds a second, independent command —
`isro` — the ISRO government scraper replica (`src/scrapers/isro.ts` + utils +
`run-isro-scrape.ts`; production normalization/dedup contract ported verbatim;
inserts `verification_status:"pending"` — the only live-CHECK-valid status,
KNOWN_ISSUES #16). Vercel stays the production cron owner for the frontend
routes; the backend cron route (`/api/v1/cron/news-sync`, CRON_SECRET-guarded) is a
manual/parity trigger — idempotent (upsert `news_articles` onConflict `url`). No
queue/Redis/microservices and no Render cron — nothing proven necessary for one
daily job.

## CI/CD

- **Vercel** (`vercel.json`): buildCommand `cd frontend && npm run build`, output
  `frontend/.next`, framework nextjs. Three cron routes (UTC): `/api/cron/scrape-opportunities`
  (00:00), `/api/cron/check-links` (08:00), `/api/news/sync` (06:00).
- **GitHub Actions** (`.github/workflows/`): `ci.yml` (ai-gateway + backend
  api/server/worker + frontend typecheck/test/build on push/PR to main — paths
  FIXED 2026-08-19) and `security-scan.yml` (gitleaks).
- **Docker** (2026-08-19): `.dockerignore` added (the build was copying the host's
  node_modules — Windows junctions/win32 binaries broke the linux image);
  base image `node:22-alpine` (supabase-js ≥2.110 needs native WebSocket; node:20
  crashed at boot); `npm ci` must name the worker workspace explicitly (only
  dependee workspaces get linked otherwise).
- `[vercel skip]` in a commit message does NOT skip deploys (no Ignored Build Step
  configured on the Vercel project).
- CLI `vercel deploy --prod` races the git-integration deploy and must not be used.
  Deploys are push-triggered only.

## Environment Variables

- `frontend/.env.example` is the canonical env reference (DB1/DB2 Supabase, Neon,
  AI provider keys, admin/cron secrets). Copy to `.env.local` with real values;
  never commit `.env.local`.

## Local / Self-Host Stack (docker-compose.yml)

- `frontend`: builds `frontend/Dockerfile`, port 3000.
- `api`: builds `backend/server/Dockerfile` from repo root, port 8080. Boots with
  empty env; `/health` works and DB routes return 503 until Supabase keys are set.
- `postgres`: `postgres:16-alpine`, hardcoded local creds — UNUSED by
  `backend/server` (which reads Supabase).
- `redis`: `redis:7-alpine` — UNUSED.

## Kubernetes (k8s/)

- Frontend-only manifests: `configmap.yaml`, `deployment.yaml`, `ingress.yaml`,
  `service.yaml`. No backend manifests.

## Local Scripts (scripts/)

- `auto-daily-scraper.js`: node-cron driver that calls the FRONTEND
  `/api/cron/scrape-*` endpoints on `localhost:3000` with a `CRON_SECRET` bearer
  header. Not part of the production cron (Vercel crons are).
- `omnirouter-gateway.js`: local HTTP server on `:20128` backing the omnirouter
  AI provider.

## Related Documents

- [deploy-stack.txt](./deploy-stack.txt) — DEPRECATED Render-era backend deployment doc