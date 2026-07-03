# Repository Cleanup Report

Generated: 2026-07-03
Backup tag: `pre-cleanup-backup` (pushed to origin)

## Summary

| Metric | Value |
|--------|-------|
| Total tracked files (pre-cleanup) | 413 |
| Files in legacy codebase | 152 (37%) |
| Files in `docs/legacy/` | 16 |
| Other legacy artifacts | ~3 |
| **Legacy footprint** | **~171 files (41%)** |

---

## A. Definitely Safe to Remove

### 1. `ElectroBridge Web App Design/` — Full Legacy Codebase (152 files)

- **What it is:** Old Next.js 15 frontend + Express 5 backend (the pre-migration codebase).
- **Why safe:** Zero code-level cross-references exist between this and `electrobridge/`. All detected references are:
  - Documentation `.md` files describing the migration history
  - URL references to legacy deployed services (`electrobridge.netlify.app`, `electrobridge-api.onrender.com`)
  - Package names in `package.json` (`"electrobridge-backend"`, `"electrobridge-frontend"`)
  - `deploy.yml` (CI) — but that also references this path and is itself slated for review
- **Verdict: SAFE TO DELETE.** The active `electrobridge/` codebase fully supersedes this.

### 2. `docs/legacy/` — Legacy Build Prompts (16 files)

- **What it is:** 16 AI/OpenCode prompt files, setup guides, and feature summaries from the legacy era.
- **Contents:** `00_START_HERE.md`, `01_MASTER_PROMPT.md`, `02_BUILD_PROMPT.md`, `FEATURE_SUMMARY_V3.md`, `PROJECT_AUDIT.md` (old version), etc.
- **Why safe:** These were build scaffolding for recreating the legacy codebase. The current `electrobridge/` has its own docs and a comprehensive root `PROJECT_AUDIT.md`.
- **Verdict: SAFE TO DELETE.**

### 3. `REFACTOR_SUMMARY.md` (root) — Legacy Refactoring Notes

- **What it is:** Documents Figma design refactoring done on the legacy codebase (`ElectroBridge Web App Design/`).
- **Why safe:** The design system it describes is now baked into `electrobridge/`'s Tailwind config and CSS. All color tokens and component changes are already applied.
- **Verdict: SAFE TO DELETE.**

### 4. `.vercel/` (root) — Vercel Project Link Metadata

- **What it is:** Auto-generated file from `vercel link` containing `REPO.json` and a `README.txt`.
- **Why safe:** Already in `.gitignore` (not tracked). It exists only on disk locally. No action needed.
- **Verdict: SKIP (already ignored, not tracked).**

### 5. `electrobridge_logo.png` (root) — 1.2 MB Logo Image

- **What it is:** Large binary PNG logo file sitting in the repository root.
- **Why safe:** Logo should live in `electrobridge/public/` if needed, or can just be deleted (already referenced from within the design system).
- **Verdict: SAFE TO DELETE OR MOVE.** Recommend moving into `electrobridge/public/` if actively used, otherwise delete.

### 6. `.next/`, `node_modules/` — Build Artifacts

- **What it is:** Next.js build output and npm dependencies.
- **Why safe:** Already covered by `.gitignore` pattern (`.env*` catches `.next` indirectly? Actually no — let me verify). Checked: `.next/` and `node_modules/` are **NOT** in `.gitignore` but are **NOT tracked** in git either (they were never committed). They exist on disk as local build artifacts.
- **Verdict: NO ACTION NEEDED.** Not tracked in git. `.gitignore` could be updated for safety.

### 7. `.github/workflows/keep-alive.yml`

- **What it is:** Cron job that pings `https://electrobridge-api.onrender.com/health` every 10 minutes to prevent Render cold starts.
- **Why ambiguous:** The legacy `ElectroBridge Web App Design/backend/` was deployed on Render. This deploy may be decommissioned. However, the health endpoint still exists at that URL and the legacy backend may still serve some purpose.
- **Verdict: NEEDS CONFIRMATION.** Only safe to delete if the Render backend is confirmed decommissioned.

### 8. `.github/workflows/deploy.yml`

- **What it is:** Deploys the legacy frontend (`ElectroBridge Web App Design/frontend`) to Netlify on every push to main.
- **Why ambiguous:** This workflow targets the **legacy** codebase. If the active `electrobridge/` is now deployed manually via Vercel (or via its own separate workflow), this legacy deploy workflow is dead code. But it may still be running and deploying a stale site.
- **Verdict: NEEDS CONFIRMATION.** Should be deleted or updated once legacy decommission is confirmed.

---

## B. Needs Confirmation Before Deleting

| # | Item | Reason | Suggested Action |
|---|------|--------|-----------------|
| 1 | `supabase/` (root) — 5 migrations + `config.toml` | Local dev/staging setup. Contains 5 migration files (Jun 30-Jul 2) that are a **parallel, diverging schema** from the active 9 migrations in `electrobridge/supabase/migrations/`. The root set has richer `user_profiles` columns (no migration drift yet with the SQL from linkedin_features). The root `config.toml` references `project_id = "JobsAI"` for local `supabase start`. Removing this means losing the ability to run Supabase locally for development/testing. However, it's never actually used — the running app uses the linked project (`aqauempuwmbizqoaolop`). | **Option A (keep):** Keep as a local dev reference. Migration files could be synced with `electrobridge/supabase/migrations/` to avoid drift. **Option B (delete):** Delete if no one runs `supabase start` locally. The `config.toml` can always be regenerated. |
| 2 | `opencode.json` (root) | OpenCode config with OpenAI provider. Looks functional but lives at root while the codebase is in `electrobridge/`. OpenCode is typically run from the root of a project, so this placement makes sense. But it's a minimal config (3 lines, API key from env). | **Keep.** It's small and serves its purpose at root. May want to move to `electrobridge/` if OpenCode is always run from there. |
| 3 | Keep-alive workflow (see A7 above) | Pings Render-hosted legacy backend. Only safe to delete if Render backend is confirmed decommissioned. | **Confirm with user** whether Render was turned off. |
| 4 | Deploy workflow (see A8 above) | Deploys legacy frontend to Netlify. If `electrobridge/` is deployed via Vercel now, this is dead. | **Confirm with user** whether Netlify deploy is still active/desired. |

---

## C. Must Keep

| Item | Reason |
|------|--------|
| `electrobridge/` | **Active codebase.** Next.js 14.2 project with all APIs, pages, components, types, libs, migrations. This is the entire running application. |
| `.github/workflows/ci.yml` | **Active CI.** Runs lint, test, build for the `electrobridge/` codebase on every push/PR. |
| `supabase/` (root) — `config.toml` only (see B1 above) | Local Supabase development config. The 5 migration files in it are a judgment call (see B1). |
| `README.md` | Project readme — documents what the project is, key features, and tech stack. |
| `PROJECT_AUDIT.md` | Comprehensive 1077-line audit documenting sessions, architecture, migration status, deployment, and known issues. This is actively maintained and referenced. |
| `.gitignore` | Gitignore rules. Currently minimal — should be updated to cover `node_modules/`, `.next/`, `dist/`, etc. as a safety measure alongside this cleanup. |
| `.gitattributes` | Git attributes for line endings, diff settings. |
| `docs/` (post-cleanup) | Intended to hold `CLEANUP_REPORT.md` and any future documentation. The `docs/legacy/` subdirectory should be removed (see A2). |

---

## Summary of Recommended Actions (in order)

1. **Delete** `ElectroBridge Web App Design/` — 152 files, 37% of repo
2. **Delete** `docs/legacy/` — 16 legacy prompt/setup files
3. **Delete** `REFACTOR_SUMMARY.md` — legacy refactoring notes
4. **Move or delete** `electrobridge_logo.png` — 1.2 MB logo in root
5. **Update** `.gitignore` to cover `node_modules/`, `.next/`, `dist/`, `.DS_Store`
6. **Confirm:** `keep-alive.yml` — is Render backend decommissioned?
7. **Confirm:** `deploy.yml` — is legacy Netlify deploy still needed?
8. **Confirm:** Root `supabase/migrations/` — keep or delete?

After cleanup: ~242 files (from 413), ~41% reduction. Repo becomes primarily `electrobridge/` plus CI, docs, and minimal root config.
