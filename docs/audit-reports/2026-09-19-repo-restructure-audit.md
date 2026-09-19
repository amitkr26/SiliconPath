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

## Follow-up (same day, after owner request "remove everything not relevant to SiliconPath")

- `legacy/` (backend, k8s/neon, scrapers, e2e) deleted — everything staged in the restructure commit was re-verified: no app code referenced it.
- `supabase/` reduced from 38 migrations + rollback/ + 3 seeds to **2 academy migrations**. Classification was driven by `src`'s actual query layer: `src/lib/academy/queries.ts` + the `/api/academy/*` routes touch only `academy_tracks`/`academy_days`/`learning_tracks`/`learning_days`/`learning_questions`/`learning_resources`/`track_assessments`/`track_checkpoints`/`user_learning_progress`/`user_track_assessment_results` — the two kept migrations create/seed the `learning_*` set, and the app falls back to static content when the DB is absent. All job-platform tables (opportunities, profiles, messages, social, employers, resumes, announcements, news, scrapers, RBAC/security, audit) were BDW-only.
- `scripts/` (4 BDW maintenance utilities) removed; `clean:test-data` npm script dropped.
- `.env.example` rewritten to the 3 env vars `src` reads (grep-verified): the old file was a 90-line BDW template.
- Live database tables are **not** affected by repo changes; the site is fully self-contained (static content + fallbacks) regardless.

## Files Changed (full purge, consolidated)

`package.json` · `package-lock.json` (regen) · `.env.example` · `.github/workflows/ci.yml` · `docker-compose.yml` · `render.yaml` (deleted) · `.gitignore` · `.dockerignore` · `tsconfig.json` · `README.md` · `project-bible/DEVELOPMENT.md` · `project-bible/CHANGELOG.md` · `docs/session-reports/2026-09-19-repo-restructure.md` · this report; ~470 path deletions (legacy/ + BDW migrations/seeds/scripts).