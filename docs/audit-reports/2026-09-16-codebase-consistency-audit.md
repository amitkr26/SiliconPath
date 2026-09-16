# SiliconPath Codebase Consistency Audit

**Date:** 2026-09-16
**Auditor:** Agent (opencode) with ponytail standards
**Repository:** `/workspaces/SiliconPath`
**Status:** Verified — supersedes the 2026-09-12 reports (several claims in those were falsified by this audit)

---

## Executive Summary

A full-repository consistency sweep was run against every claim, link, config, and branding artifact in the monorepo. All frontend-facing surfaces, configs, and documentation now describe the true state of the product. The backend (`backend/*`, `k8s/`, `neon/`) is documented — not renamed — as the legacy BerojgarDegreeWala-derived job-platform code it actually is.

The previous 2026-09-12 audit reports claimed a complete refactor into SiliconPath ("148 modules", "128 questions", "zero broken links", "verified & remediated"). On 2026-09-16 each of those claims was disproven or corrected: the backend, k8s, neon, llms.txt and READMEs were still BerojgarDegreeWala-branded; the STA page holds 55 questions (not 128); module count is 150 (not 148); and `/resources` contained two broken learn links. This report documents the reconciled state.

---

## 1. Claim Reconciliation (disproven → verified)

| Claim (pre-2026-09-16) | Verified reality | Resolution |
|---|---|---|
| "128 STA interview questions" (Navbar, Footer, homepage, /about, /courses, /resources, metadata) | 55 question objects (11 topics × 5) | All surfaces updated to 55; per-topic `count` fields fixed `12/11` → `5` |
| "148 modules" (README, /courses, /about, layout metadata) | 150 modules (all-paths.ts, validated by test) | Updated to 150 |
| `/resources` links valid | `/learn/systemverilog` and `/learn/dft` → 404 (no such paths) | Repointed to `/learn/design-verification` and `/learn/design-for-test` (both exist) |
| Dead-free config | 8 dead redirects in `next.config.mjs`; 3 dead crons + 1 dead redirect in `vercel.json` | Removed (legacy BDW routes/crons) |
| Frontend fully SiliconPath-branded | `llms.txt`, `manifest.json`, `frontend/README.md`, `Footer` BDW link, `playwright.config.ts` baseURL, scripts BDW paths/URLs | Rebranded to SiliconPath / siliconpath.in |
| Root README accurate | Claimed non-existent paths (CMOS VLSI Design, FPGA Design, Embedded Systems) | Rewritten with verified 15-path/150-module lists |

## 2. Verified Current State (gates, 2026-09-16)

- Frontend `tsc --noEmit`: 0 errors
- Frontend jest: 6/6 passing (curriculum integrity, sitemap, video references, academy track mapping, design tokens)
- Backend server test suites: 46/46 (legacy BDW backend, untouched)
- `next build`: succeeds (16 static + dynamic routes)
- `git diff --check`: clean
- No hardcoded secrets; `_creds.mjs` reads only from gitignored `siliconpath-credentials.txt` + `frontend/.env.local`; gitleaks workflow in place

## 3. Deliberately Out of Scope (documented, not renamed)

- `backend/*` packages stay `@berojgardegreewala/*` — the code is the unmodified legacy job-platform app (opportunities/profiles/messages/AI/scrapers). Cosmetic renaming was declined (deployment risk, no product value).
- `k8s/` + `neon/schema.sql` belong to that legacy backend; documented in root README repo-layout table.
- `frontend/supabase/migrations` + `seed` files contain historical BDW-era data seeds — preserved per the "never alter migrations" contract in DEVELOPMENT.md.

## 4. Residual Known Issues (not part of this sweep)

- Academy `progress` API routes remain unauthenticated stubs (client uses localStorage); backend parity not yet wired.
- 2026-09-12 audit reports remain on disk for historical reference but are superseded by this file.

---

## Files Changed in the Sweep

`README.md` · `frontend/README.md` · `frontend/public/llms.txt` · `frontend/public/manifest.json` · `frontend/next.config.mjs` · `vercel.json` · `frontend/playwright.config.ts` · `frontend/src/components/Footer.tsx` · `frontend/src/components/Navbar.tsx` · `frontend/src/app/{layout,courses,about,resources,courses/resume-tips,sta-interview-questions,page}.tsx` · `frontend/scripts/{category-normalize,org-backfill,delete-fake-jobs}.js` · `project-bible/{CHANGELOG,DEVELOPMENT,PRODUCT}.md` · `docs/session-reports/2026-09-16-video-integration-academy-redesign-sweep.md` · this report