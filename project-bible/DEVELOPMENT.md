# Development & Operations Guide

## Getting Started

SiliconPath is a single Next.js 14 (App Router) application. The repo root **is** the app — package.json, tsconfig, next.config, tailwind config, `src/`, `public/`, `supabase/` all live at root. Everything that is not the app (the legacy BerojgarDegreeWala-derived backend, infra, archived test suites) lives under `legacy/`.

### Prerequisites
- Node.js >= 20
- npm >= 10
- Docker (optional, for local containers / production image)

### Repo Layout
- Root (`/`): the Next.js 14 application — `src/` (app router, components, lib, styles), `public/`, `supabase/` (migrations + seed), `scripts/` (content maintenance utilities)
- `legacy/backend/*`: `@berojgardegreewala/{api,ai-gateway,server,worker}` — the unmodified legacy job-platform backend, kept as npm workspaces for typing/CI but not part of the product surface
- `legacy/k8s/`, `legacy/neon/`: legacy backend infrastructure manifests and DB schema
- `legacy/scripts/`: legacy production scraper triggers and DB maintenance utilities
- `legacy/e2e-tests/`: archived BerojgarDegreeWala UI tests (they exercise `/login` and BDW flows that no longer exist — preserved for reference, not run)
- `docs/`: audit reports (`docs/audit-reports/`) and session reports (`docs/session-reports/`)
- `project-bible/`: architecture, security, changelog, spec, ADRs (owner mandate: update after every change)

## Essential Commands

### Install Dependencies
```bash
npm install
```

### Development Server (the app)
```bash
npm run dev              # http://localhost:3000
```

### Legacy backend (optional, local only)
```bash
npm run legacy:backend:server   # Express API replica on :8080
npm run legacy:backend:worker   # background worker
```

### Quality & Verification Gates
Run all three gates before submitting changes:

```bash
# 1. Typecheck (app scope; legacy is excluded from the root tsconfig)
npm run typecheck

# 2. Automated test suites (app jest suite: src/**/__tests__)
npm test

# 3. Production build
npm run build
```

Legacy backend gates (CI only, run against the workspaces directly):
```bash
npm run typecheck --workspace=@berojgardegreewala/ai-gateway
npm test --workspace=@berojgardegreewala/api --workspace=@berojgardegreewala/server --workspace=@berojgardegreewala/worker
npm run build --workspace=@berojgardegreewala/server --workspace=@berojgardegreewala/worker
```

## Deployment

- **Production**: Vercel, connected to the repo root (`vercel.json`: `framework: nextjs`). Live at https://siliconpath.vercel.app
- **Docker**: `docker build -t siliconpath .` (multi-stage, Next.js standalone output, port 3000)
- `docker-compose.yml` (root) runs the app container + legacy Express API + Postgres + Redis for local full-stack work
- `render.yaml` (root) documents the optional independent Render replica of the legacy backend

## AI Agent Operating Contract

All AI coding agents and human contributors must follow these tenets:

1. **Understand Before Modifying**: Read the relevant code path and documentation before writing any code. Root causes over symptomatic patches.
2. **Preserve Working Systems**: Do not refactor functional code without explicit justification.
3. **No Secret Leaks**: Never hardcode credentials, API keys, or tokens. Never commit `.env*` or credential dump files. The local `.env.local` and `siliconpath-credentials.txt` are gitignored.
4. **Clean Git Hygiene**: Maintain zero git diff errors (`git diff --check`). Run tests and typecheck before handoff.
5. **Executable Database Integrity**: Never delete, rename, or alter existing historical Supabase migrations (`supabase/migrations`).
6. **Documentation Maintenance**: After any architectural or contract change, update `project-bible/CHANGELOG.md` with exact files, root cause, and changes made.