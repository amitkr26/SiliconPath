# Changelog

All notable changes to SiliconPath will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased] — 2026-09-19

### Changed
- **Repository restructured into a single Next.js application at the repo root** (was: monorepo with `frontend/` + legacy BDW backend at root):
  - Flattened the app: `frontend/{src,public,supabase,scripts,next.config.mjs,tailwind.config.ts,postcss.config.mjs,jest.config.js,tsconfig*.json,next-env.d.ts,Dockerfile,vercel.json}` → repo root; `frontend/package.json` + lock merged into a rewritten root `package.json` (name `siliconpath`, app scripts at root, `workspaces: ["legacy/backend/*"]`).
  - Dropped the dead `file:` deps `@berojgardegreewala/{api,ai-gateway}` from the app manifest (no imports existed in `src/`) and removed their stale `tsconfig` `paths` aliases.
  - Quarantined all non-app code under `legacy/` (nothing deleted, history preserved via `git mv`): `backend/` → `legacy/backend/` (workspaces still `@berojgardegreewala/*`), `k8s/` + `neon/` → `legacy/`, legacy root `scripts/` (scrapers, DB maintenance) → `legacy/scripts/`, `frontend/tests/e2e` + `playwright.config.ts` (BDW UI tests for `/login` flows that no longer exist) → `legacy/e2e-tests/`.
  - `docker-compose.yml` + `render.yaml` kept at root (Vercel/Render/Compose discovery reads root-level configs); embedded paths updated to `./Dockerfile` / `./legacy/backend/server/Dockerfile`.
  - Root `Dockerfile` rewritten for the standalone single-app layout (`npm ci` at root, `npm run build`, `.next/standalone` runner); `.dockerignore` updated (legacy source kept in image so `npm ci` can resolve the workspace glob).
  - `.github/workflows/ci.yml`: app job (lint/test/build) now runs at root (no `--workspace=frontend`); legacy backend jobs unchanged (workspaces resolve via the new glob).
  - `.opencode/mcp-servers/{_creds,supabase-server,vercel-server}.mjs`: env path `frontend/.env.local` → `.env.local` (root), Vercel MCP default dir `frontend` → `.`.
  - `project-bible/DEVELOPMENT.md` rewritten (single-app layout, root commands, `legacy:*` scripts, deployment section); root `README.md` rewritten with the new repo-layout table and root quickstart.
  - Verified end to end: `tsc` 0 errors, jest 6/6, `@berojgardegreewala/server` workspace test pass, `next build` green, dev server serves `/`, `/academy`, `/learn`, `/learn/video-courses`, `/resources`, `/sta-interview-questions`, `/courses`, `/about`, `/engineering-lab` (all 200).
- **Audit & session reports**: added `docs/audit-reports/2026-09-19-repo-restructure-audit.md` and `docs/session-reports/2026-09-19-repo-restructure.md`.

---

## [Unreleased] — 2026-09-16

### Added
- **Free Video Course Library (`/learn/video-courses`)**:
  - New static, searchable library of 74 curated free video courses: 70 NPTEL courses (extracted from the live NPTEL catalog at `nptel.ac.in/courses`, 3,484-course audit, filtered to VLSI-relevant coverage across ECE/EE/CS) plus 4 YouTube playlists (Neso Academy Digital Electronics 202 videos, C Programming 169 videos, VHDL Programming; VLSI Academy VLSI Physical Design Full Course — all requested URLs verified live for title/channel/video count).
  - Data source: `frontend/src/lib/video-references.ts` — single `VideoCourseReference` array with source (`nptel`/`youtube`), group, instructor, institute, and `paths` mapping to learn-path slugs; new sources are one-line additions here.
  - 8 topic groups: Digital Logic & RTL, Verification/DFT/Formal, Synthesis/PD/Timing, Low Power, Analog/Mixed-Signal, Devices & Fabrication, Embedded/Arch/Programming, Core ECE Fundamentals.
  - NPTEL coverage includes the four user-requested courses (VLSI Physical Design 106105161, Advanced VLSI Design 117101004, Linux Programming & Scripting 117106113, VLSI Technology 117106093) plus direct path matches: Low Power VLSI Circuits & Systems, Synthesis of Digital Systems, VLSI Design Flow: RTL to GDS, VLSI Physical Design with Timing Analysis.
- **Companion video courses on `/learn/[path]` pages**: each path renders the NPTEL/YouTube courses mapped to its slug (`videoCoursesForPath`).
- **Integrity test**: `curriculum-integrity.test.ts` now validates all video references (70+ count, NPTEL id/URL format, YouTube playlist URL format, path-slug mappings resolve to real paths) and every academy track slug maps to ≥1 embedded video reference with valid tags.

### Changed
- **VLSI Learning Academy UI redesign (`/academy/[track]`, `/academy/[track]/day/[day]`, `/academy/[track]/assessment`, `YoutubeEmbed`, `PracticeQuiz`, `Input`)**:
  - Replaced all remaining neo-brutalist styling on academy drill-down pages (2px black borders, offset drop shadows, `font-black`) with the central design system from `design-tokens.ts` (1px `slate` borders, `rounded-lg/xl`, subtle shadows, `font-display` headings, restrained blue accents) — consistent with the `/academy` overview.
- **Embedded video lectures on `/academy/[track]`**:
  - New "Embedded Course Videos" section per track: full YouTube playlists embedded inline as click-to-play `videoseries` iframes (`PlaylistEmbed` component — iframe only loads on visitor opt-in) plus NPTEL course cards (instructor, institute, direct course links).
- **Global content reconciliation (repo-wide "update everything" sweep)**:
  - **STA question count**: every surface declaring "128" now states the actual **55** (11 topics × 5, verified by counting question objects): `layout.tsx` metadata, `Navbar`, `Footer`, homepage, `/sta-interview-questions`, `/about`, `/courses`, `/courses/resume-tips`, `/resources`; all 11 per-topic `count` fields corrected `12/11` → `5`.
  - **Module count**: "148 modules" → **150** in `layout.tsx` metadata, `/courses`, `/about` (root README rewrite included).
  - **Broken learn links in `/resources`**: `/learn/systemverilog` → `/learn/design-verification`, `/learn/dft` → `/learn/design-for-test` (both verified against `all-paths.ts`).
  - **Dead config removed**: 8 legacy BDW redirects stripped from `frontend/next.config.mjs` (`/auth/signin`, `/community`, `/chat`, `/post-job`, `/employers` — none exist on SiliconPath); 3 dead crons + dead redirect removed from root `vercel.json` (`/api/cron/scrape-opportunities`, `/api/cron/check-links`, `/api/news/sync` belong to the legacy backend, not the frontend).
  - **Branding to SiliconPath**: `frontend/public/llms.txt` rewritten truthfully (was full BDW aggregator description), `manifest.json` name/short_name, `Footer` "About" column (removed the external BerojgarDegreeWala link), `playwright.config.ts` baseURL `https://berojgardegreewala.vercel.app` → `https://siliconpath.in`, `scripts/category-normalize.js` + `scripts/org-backfill.js` workspace path, `scripts/delete-fake-jobs.js` fake apply-URLs.
  - **Root `README.md` rewritten truthfully** (148→150 modules, 128→55 STA, corrected path lists, added repo layout incl. legacy-backend note); `frontend/README.md` rewritten (dropped BDW branding, live link → siliconpath.in); `project-bible/DEVELOPMENT.md` corrected workspace names (`@siliconpath/*` → actual `@berojgardegreewala/*`) and removed the false "400+ unit tests" claim.
  - **PRODUCT.md**: STA section reconciled (128→55, cleanup note resolved).
- **Audit & session reports**: added `docs/audit-reports/2026-09-16-codebase-consistency-audit.md` and `docs/session-reports/2026-09-16-video-integration-academy-redesign-sweep.md` documenting verified current state; supersede the 2026-09-12 reports whose claims were falsified.

### Changed
- **`/learn`**: corrected false claim "148 self-paced modules" → **150** (verified against `all-paths.ts`: 150 real modules); added NPTEL & YouTube library CTA banner.
- **`/academy` `TRUSTED_SOURCES`**: replaced generic `onlinecourses.nptel.ac.in` landing URLs with real course pages — Digital Circuits → `/courses/108105113`, Hardware Modeling using Verilog → `/courses/106105165`.
- **`sitemap.ts`**: added `/learn/video-courses` to static routes.

---

## [Unreleased] — 2026-09-12

### Added
- **Complete Product UI/UX & Information Architecture Overhaul**:
  - Restructured SiliconPath from historic neo-brutalist patterns into a disciplined, high-density semiconductor engineering education platform.
  - Centralized design system in `frontend/src/styles/design-tokens.ts` with clean neutrals (`#F8FAFC`), crisp slate typography (`#0F172A`), restrained blue accents (`#2563EB`), geometric radii, and subtle elevations.
  - New Tapeout Guide: `/courses/openlane-rtl-to-gds` covering complete 7-stage RTL-to-GDSII flow on SkyWater Sky130 PDK with Yosys, OpenROAD, and Magic.
  - New Career Guide: `/courses/resume-tips` detailing semiconductor engineering resume structures, ATS keywords, tool matrices, and quantified QoR bullets.
  - New Career Resources Hub: `/resources` covering semiconductor engineering role profiles (PD, DV, RTL, DFT) and required EDA toolchains.
  - Unit Test Suite: `frontend/src/__tests__/curriculum-integrity.test.ts` testing curriculum paths, slug uniqueness, sitemap completeness, and token integrity.

### Changed
- **Homepage (`/`)**: Completely redesigned around an authentic semiconductor engineering journey:
  - Concise technical hero with immediate learning entry points.
  - Interactive 9-stage RTL-to-GDSII flow diagram.
  - 15-Path 3-tier curriculum directory matrix.
  - EDA signoff spotlight with authentic dark terminal styling (`#0B1120`).
  - Interactive STA interview scenario disclosure.
  - Honest platform philosophy and zero marketing fluff.
- **Navigation (`Navbar.tsx`)**:
  - Reorganized around user mental models: **Learn** (Learning Paths, VLSI Academy, Engineering Lab), **Practice** (128 STA Q&A, Interview Path), **Guides & Resources** (OpenLane Tapeout, Career Roadmap, Resume Tips), **About**, and prominent **Start Learning Free** primary CTA.
  - Resolved all broken links (`/learn/interview` → `/learn/interview-qa`).
- **Footer (`Footer.tsx`)**:
  - Replaced heavy multi-column SaaS footer with a restrained, compact engineering product footer.
- **Learning Surfaces (`/learn`, `/learn/[path]`, `/learn/[path]/[module]`)**:
  - Searchable directory of 15 paths with category tabs (Foundations, Backend, Tools & Career).
  - Unlocked sequential module gates — users can jump directly to any topic.
  - Rich syllabus detail pages with concept overviews, EDA TCL commands, signoff checklists, and localStorage progress tracking.
- **Academy (`/academy`)**:
  - Cleaned up curriculum overview, removing artificial paywall boxes while retaining verified NPTEL and Siemens lecture references.
- **Engineering Lab (`/engineering-lab`)**:
  - Replaced generic educational cards with authentic EDA diagnostic interfaces (PrimeTime, Tempus, Innovus, ICC2 report analysis, root cause breakdown, and signoff takeaways).
- **STA Interview Questions (`/sta-interview-questions`)**:
  - Integrated real-time search across 128 questions with category filter chips and expandable mathematical derivations.
- **Free Resources (`/courses`)**:
  - Redesigned into an editorial directory linking to tapeout guides, resume templates, and study roadmaps.
- **About (`/about`)**:
  - Redesigned with a clear engineering mission statement and open-access commitments.
- **Sitemap (`sitemap.ts`)**:
  - Updated to include all 16 static routes and dynamic learning paths with exact slug alignment.

### Removed
- Removed all neo-brutalist artifacts (2px/3px black borders, offset drop shadows, pill buttons, and identical repeated 3-column card grids).
- Removed all broken and dead routes (`/vlsi`, `/jobs`, `/courses/openlane-rtl-to-gds` 404, `/courses/resume-tips` 404).
- Removed all fake social proof, fabricated metrics, and artificial progression locks.
