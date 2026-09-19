# Development & Operations Guide

## Getting Started

SiliconPath is a single Next.js 14 (App Router) application. The repo root **is** the app — package.json, tsconfig, next.config, tailwind config, `src/`, `public/`, `supabase/` all live at root.

### Prerequisites
- Node.js >= 20
- npm >= 10
- Docker (optional, for local containers / production image)

### Repo Layout
- Root (`/`): the Next.js 14 application — `src/` (app router, components, lib, styles), `public/`, `supabase/` (migrations + seed), `scripts/` (content maintenance utilities)
- `docs/`: audit reports (`docs/audit-reports/`) and session reports (`docs/session-reports/`)
- `project-bible/`: architecture, security, changelog, spec, ADRs (owner mandate: update after every change)

## Essential Commands

### Install Dependencies
```bash
npm install
```

### Development Server
```bash
npm run dev              # http://localhost:3000
```

### Quality & Verification Gates
Run all three gates before submitting changes:

```bash
# 1. Typecheck
npm run typecheck

# 2. Automated tests (jest suite: src/**/__tests__)
npm test

# 3. Production build
npm run build
```

## Deployment

- **Production**: Vercel, connected to the repo root (`vercel.json`: `framework: nextjs`). Live at https://siliconpath.vercel.app
- **Docker**: `docker build -t siliconpath .` (multi-stage, Next.js standalone output, port 3000)
- `docker-compose.yml` (root): `docker compose up --build` runs the production-mode app container on :3000

## AI Agent Operating Contract

All AI coding agents and human contributors must follow these tenets:

1. **Understand Before Modifying**: Read the relevant code path and documentation before writing any code. Root causes over symptomatic patches.
2. **Preserve Working Systems**: Do not refactor functional code without explicit justification.
3. **No Secret Leaks**: Never hardcode credentials, API keys, or tokens. Never commit `.env*` or credential dump files. The local `.env.local` and `siliconpath-credentials.txt` are gitignored.
4. **Clean Git Hygiene**: Maintain zero git diff errors (`git diff --check`). Run tests and typecheck before handoff.
5. **Executable Database Integrity**: Never delete, rename, or alter existing historical Supabase migrations (`supabase/migrations`).
6. **Documentation Maintenance**: After any architectural or contract change, update `project-bible/CHANGELOG.md` with exact files, root cause, and changes made.