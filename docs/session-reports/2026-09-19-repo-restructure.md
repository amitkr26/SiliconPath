# Session Report — 2026-09-19: Repo Restructure into a Single Next.js App

**Date:** 2026-09-19
**Agent:** opencode (ponytail / big-pickle)
**Request:** "Restructure the complete repo into a complete Next.js web app — don't remove everything, restructure professionally."

## What Changed

### App flattened to repo root (history preserved via `git mv`)
`frontend/{src,public,supabase,scripts,next.config.mjs,tailwind.config.ts,postcss.config.mjs,jest.config.js,tsconfig.json,tsconfig.test.json,next-env.d.ts,Dockerfile}` → root. The root `package.json` was rewritten as the app manifest (name `siliconpath`, root scripts, `workspaces: ["legacy/backend/*"]`); `frontend/package.json` + lock shell were removed; lock regenerated from the merged manifest.

### Dead coupling removed
The app manifest previously declared `@berojgardegreewala/api` and `@berojgardegreewala/ai-gateway` as `file:` deps with tsconfig `paths` aliases — grep showed **zero imports** in `src/`. Dropped both (legacy packages still exist under `legacy/backend/`).

### Legacy quarantined under `legacy/`
`backend/` → `legacy/backend/` (workspaces `@berojgardegreewala/{api,ai-gateway,server,worker}` — CI still typechecks/tests/builds them), `k8s/` + `neon/` → `legacy/`, legacy scrapers/DB-maintenance scripts → `legacy/scripts/`, archived BDW e2e suite (`/login`, messaging, connections) + playwright config → `legacy/e2e-tests/`.

### Root configs rewired
- `vercel.json`: `{ "framework": "nextjs" }` (root build; previously `cd frontend && npm run build`)
- `Dockerfile`: rewritten single-app multi-stage (npm ci → build → `.next/standalone` runner); `.dockerignore` updated
- `ci.yml`: app job at root (`npm run lint/test/build`), legacy backend jobs unchanged
- `.opencode/mcp-servers/*`: env path `frontend/.env.local` → `.env.local`; Vercel MCP default dir `frontend` → `.`
- `docker-compose.yml` / `render.yaml` kept at root (blueprint discovery), paths → `./Dockerfile` / `./legacy/backend/server/Dockerfile`
- `tsconfig.json` excludes `legacy`; `jest.config.js` scoped to `src/**/__tests__` with legacy ignored
- `scripts/{category-normalize,org-backfill,delete-fake-jobs}.js` env path updated

### Docs
`README.md` + `project-bible/DEVELOPMENT.md` rewritten for the new layout; CHANGELOG entry; audit + session reports.

## Follow-up (same day, owner: "remove everything that is not relevant to SiliconPath")

Deleted all remaining BDW artifacts after classifying by actual app usage:

| Deleted | What it was | Why |
|---|---|---|
| `legacy/` (110 files) | BDW backend, k8s/neon infra, scrapers, archived e2e | owner-directed; nothing in `src/` referenced it (grep-verified) |
| 36 supabase migrations + `rollback/` + 3 seeds | opportunities, profiles, messages, social, employers, resumes, news, scrapers, RBAC/security, audit tables | app queries only the `learning_*` set that the 2 kept academy migrations create |
| `scripts/` (4 files) + `clean:test-data` | BDW data maintenance (org backfill, category normalize, fake-job cleanup) | operate on tables that no longer exist in this repo |
| `.env.example` (rewritten 90 lines → 3 vars) | BDW env template (AI providers, Telegram, Upstash, GCP, admin HMAC) | app reads exactly 3 vars (grep-verified) |
| `render.yaml` | Render blueprint for the deleted backend | deploys nothing now |

Repository now contains only SiliconPath: the Next.js app (`src/`, `public/`, `supabase/` x2 academy migrations), deploy config (Dockerfile, compose, vercel.json, ci.yml), and docs (`project-bible/`, `docs/`).

## Verification
tsc 0 · jest 6/6 · `next build` green · dev server key routes 200 · lock regenerated without BDW refs (grep 0) · `git diff --check` clean.

## Open Items for the User
1. Move any local `frontend/.env.local` to `.env.local` at repo root after pulling (gitignored on both sides; this clone never had one — builds used CI placeholders).
2. Vercel deploys from the repo root without dashboard changes (build command now default root build per `vercel.json`).