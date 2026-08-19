# DevOps Architecture

## Deployment

Production is a single deployment: the Next.js frontend on Vercel, driven by git
integration (push to `main` triggers an auto-deploy; ~15 min build). There is no
Render deployment and the standalone backend (`backend/server`) is not deployed
anywhere.

| Service | Provider | Purpose |
|---------|----------|---------|
| Frontend + API routes | Vercel (Hobby, git integration) | Next.js 14 app; all `/api/*` routes run as serverless functions |
| DB1 | Supabase | Core platform data |
| DB2 | Supabase | Social + user data |
| Analytics | Neon (2 databases) | Analytics, logs, search cache |
| Email | Resend | Transactional emails |
| AI Providers | Groq, Gemini, NVIDIA, OpenRouter, Bedrock, Cloudflare, HuggingFace, AgentRouter, OmniRouter | LLM inference (`backend/ai-gateway`) |
| Error Tracking | Sentry | Error monitoring (`NEXT_PUBLIC_SENTRY_DSN`) |
| Analytics | Plausible | Privacy-first analytics (CSP allowlist) |

## CI/CD

- **Vercel** (`vercel.json`): buildCommand `cd frontend && npm run build`, output
  `frontend/.next`, framework nextjs. Three cron routes (UTC): `/api/cron/scrape-opportunities`
  (00:00), `/api/cron/check-links` (08:00), `/api/news/sync` (06:00).
- **GitHub Actions** (`.github/workflows/`): `ci.yml` (typecheck + tests on push/PR to
  main) and `security-scan.yml` (gitleaks). Note: `ci.yml` references legacy paths
  (`packages/ai-gateway`, `berojgardegreewala/`) that no longer exist in this repo.
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