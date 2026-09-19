# Development & Operations Guide

## Getting Started

SiliconPath / BerojgarDegreeWala is a monorepo containing the Next.js 14 frontend application, backend microservices, scrapers, and shared libraries.

### Prerequisites
- Node.js >= 20
- npm >= 10

### Workspace Layout
- `frontend/`: Next.js 14 App Router application (web app, UI, API routes, Supabase migrations)
- `backend/api/`: Reusable backend domain logic and client libraries (`@berojgardegreewala/api`)
- `backend/ai-gateway/`: Multi-provider resilient LLM router (`@berojgardegreewala/ai-gateway`) — 10 providers
- `backend/server/`: Standalone Express API replica (`@berojgardegreewala/server`)
- `backend/worker/`: Background scraper worker service (`@berojgardegreewala/worker`)
- `project-bible/`: Engineering documentation (architecture, product, security, changelog)
- `scripts/`: Production scraper triggers and maintenance utilities

## Essential Commands

### Install Dependencies
```bash
npm install
```

### Development Servers
```bash
# Frontend (primary)
npm run dev --workspace=frontend

# Standalone backend server
npm run dev --workspace=@berojgardegreewala/server

# AI Gateway
npm run dev --workspace=@berojgardegreewala/ai-gateway
```

### Quality & Verification Gates
Run all three gates before submitting changes:

```bash
# 1. Typecheck all workspaces
npm run typecheck

# 2. Run automated test suites (400+ unit tests)
npm test

# 3. Production build
npm run build
```

Frontend specific checks:
```bash
cd frontend
npx tsc --noEmit
npm test
npm run build
```

### AI Gateway Tests
```bash
cd backend/ai-gateway
npm test
```

### Worker & Backend API Tests
```bash
cd backend/worker
npm test        # 31/31 (incl. news deactivated-source preservation + counter assertions)
npm run typecheck

cd backend/api
npm test        # 8 suites / 100 tests
npm run typecheck
```

## Applying Database Migrations (Production DB1)

**Status: all migrations are APPLIED** (ledger = 13 records in `supabase_migrations.schema_migrations`). Do **not** re-run or edit applied migrations; new schema changes require new sequential migration files.

Execution path (full DDL support — the same endpoint `supabase db push` uses):

```bash
# Reads secret from frontend/.env.local — never print values
$token  = (Select-String -Path frontend/.env.local -Pattern '^SUPABASE_MGMT_TOKEN=').Line.Split('=')[1]
$ref    = (Select-String -Path frontend/.env.local -Pattern '^SUPABASE_PROJECT_REF=').Line.Split('=')[1]
$sql    = Get-Content -Raw -Encoding UTF8 -LiteralPath "frontend/supabase/migrations/<file>.sql"
$body   = @{ query = $sql } | ConvertTo-Json -Compress
Invoke-RestMethod -Method Post -Uri "https://api.supabase.com/v1/projects/$ref/database/query" `
  -Headers @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" } -Body $body
```

Operating notes (learned in the 2026-09-18 execution round):
- **UTF-8 boxing hazard**: PowerShell 5.1 mangles non-ASCII characters — if the SQL file contains box-drawing glyphs (`═══`), the API returns `400 "Expected ',' or '}' after property value in JSON"`. Sanitize first: `[regex]::Replace($raw, '[^\x00-\x7F]', '-')`.
- Multi-statement query strings run atomically (single implicit transaction).
- Inspect server SQL errors via `$_.ErrorDetails.Message`, not `Exception.Message`.
- RLS exposure checks must use anonymous `HEAD` probes + `Prefer: count=exact` and read the `Content-Range` header (`*/0` = locked/0 rows). Do not rely on `select=id` (400s on non-`id` PKs) or on `@($null).Count` edge cases.
- Toxics policies are often declared `TO PUBLIC` — always `DROP POLICY IF EXISTS` by name.

## AI Agent Operating Contract

All AI coding agents and human contributors must follow these tenets:

1. **Understand Before Modifying**: Read the relevant code path and documentation before writing any code. Root causes over symptomatic patches.
2. **Preserve Working Systems**: Do not refactor functional code without explicit justification.
3. **No Secret Leaks**: Never hardcode credentials, API keys, or tokens. Never commit `.env*` or credential dump files.
4. **Clean Git Hygiene**: Maintain zero git diff errors (`git diff --check`). Run tests and typecheck before handoff.
5. **Executable Database Integrity**: Never delete, rename, or alter existing historical Supabase migrations.
6. **Documentation Maintenance**: After any architectural or contract change, update `project-bible/CHANGELOG.md` with exact files, root cause, and changes made.

## Environment Variables

See `frontend/.env.example` and `backend/server/.env.example` for the full list. Key variables:

| Variable | Purpose |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role (server-only) |
| `SUPABASE_MGMT_TOKEN` | Supabase **Management API** token — DDL-capable `POST /v1/projects/{ref}/database/query` (migration execution; shell-only, never print) |
| `SUPABASE_PROJECT_REF` | Production project ref (`aqauempuwmbizqoaolop`) |
| `BDW_AI_ENABLED` | Enable BDW AI Career Intelligence Engine |
| `BDW_AI_BASE_URL` | BDW AI endpoint URL |
| `BDW_AI_API_KEY` | BDW AI API key |
| `ADMIN_PASSWORD` | Admin portal authentication |
| `CRON_SECRET` | Cron job authentication |
