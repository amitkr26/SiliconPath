# Repository Restructure Audit

**Date:** 2026-09-19
**Auditor:** Agent (opencode) with ponytail standards
**Repository:** `/workspaces/SiliconPath`
**Status:** Verified — supersedes the monorepo layout documented in the 2026-09-16 reports

---

## Executive Summary

The repository was restructured from a nested monorepo (`frontend/` + legacy BDW backend + infra at root) into **a single Next.js 14 application living at the repo root**, with every non-app artifact quarantined under `legacy/`. Nothing was deleted: all moves used `git mv` (history preserved), and the legacy workspaces still build/test via npm workspaces (`legacy/backend/*`).

## Verified Outcomes

| Check | Result |
|---|---|
| `npm install` at root regenerates lock with `legacy/backend/*` workspaces | pass |
| `npm run typecheck` (tsc, app scope incl. `legacy` exclusion via tsconfig) | 0 errors |
| `npm test` (jest, app suite scoped to `src/**/__tests__`, `legacy` ignored) | 6/6 |
| Legacy workspace integrity: `npm test --workspace=@berojgardegreewala/server` | pass (workspaces resolve at new path) |
| `npm run build` | green |
| Dev server from root | `/`, `/academy`, `/learn`, `/learn/video-courses`, `/resources`, `/sta-interview-questions`, `/courses`, `/about`, `/engineering-lab` all 200 |
| `git diff --check` | clean |

## Config Deliberately Kept at Root (platform discovery requires it)

- `vercel.json` — simplified to `{ "framework": "nextjs" }`; Vercel project root = repo root (was `cd frontend && npm run build`; now default root build).
- `docker-compose.yml`, `render.yaml` — Render/Docker compose read root-level blueprints; embedded paths updated (`./Dockerfile`, `./legacy/backend/server/Dockerfile`).
- `.github/workflows/ci.yml` — app job at root; legacy jobs point at `@berojgardegreewala/*` workspaces (unchanged names).

## Notes / Residual

- **Local env file relocated**: the gitignored app env file moved from `frontend/.env.local` to `.env.local` at root (read by the app, `scripts/*`, and `.opencode/mcp-servers/*`). On machines that had `frontend/.env.local` (it was never in this clone), recreate it at root; DB-touching MCP operations need `siliconpath-credentials.txt` (root) as before.
- `legacy/` source is excluded from the app tsconfig/jest, but the Docker image keeps it (npm `ci` resolves the workspace glob from the lock) — build artifacts (`dist`, `.tsbuildinfo`) are docker-ignored.
- The 2026-09-12 and 2026-09-16 audit reports remain on disk for history; this file supersedes their repo-layout statements.

## Files Changed

`package.json` · `package-lock.json` (regen) · `README.md` · `vercel.json` · `Dockerfile` (new) · `.dockerignore` · `tsconfig.json` · `jest.config.js` · `.github/workflows/ci.yml` · `.opencode/mcp-servers/{_creds,supabase-server,vercel-server}.mjs` · `docker-compose.yml` · `render.yaml` · `scripts/category-normalize.js` · `scripts/org-backfill.js` · `scripts/delete-fake-jobs.js` · `project-bible/DEVELOPMENT.md` · `project-bible/CHANGELOG.md` · `docs/session-reports/2026-09-19-repo-restructure.md` · this report; plus ~200 path moves (frontend/* → root, root legacy files → legacy/).