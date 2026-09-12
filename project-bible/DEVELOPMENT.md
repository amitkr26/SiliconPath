# Development & Operations Guide

## Getting Started

SiliconPath is a monorepo containing the Next.js 14 frontend application, backend microservices, scrapers, and shared libraries.

### Prerequisites
- Node.js >= 20
- npm >= 10
- Docker (optional, for local microservices)

### Workspace Layout
- `frontend/`: Next.js 14 App Router application (web app, UI, API routes, Supabase migrations)
- `backend/api/`: Reusable backend domain logic and client libraries
- `backend/ai-gateway/`: Multi-provider resilient LLM router (Groq, Gemini, NVIDIA, Cloudflare, etc.)
- `backend/server/`: Standalone Express API replica
- `backend/worker/`: Background worker service
- `scripts/`: Production scraper triggers and maintenance utilities

## Essential Commands

### Install Dependencies
```bash
npm install
```

### Development Servers
```bash
# Frontend
npm run dev --workspace=frontend

# Standalone backend server
npm run dev --workspace=@siliconpath/server

# AI Gateway
npm run dev --workspace=@siliconpath/ai-gateway
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

## AI Agent Operating Contract

All AI coding agents and human contributors must follow these tenets:

1. **Understand Before Modifying**: Read the relevant code path and documentation before writing any code. Root causes over symptomatic patches.
2. **Preserve Working Systems**: Do not refactor functional code without explicit justification.
3. **No Secret Leaks**: Never hardcode credentials, API keys, or tokens. Never commit `.env*` or credential dump files.
4. **Clean Git Hygiene**: Maintain zero git diff errors (`git diff --check`). Run tests and typecheck before handoff.
5. **Executable Database Integrity**: Never delete, rename, or alter existing historical Supabase migrations.
6. **Documentation Maintenance**: After any architectural or contract change, update `project-bible/CHANGELOG.md` with exact files, root cause, and changes made.
