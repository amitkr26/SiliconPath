# Changelog

All notable changes to SiliconPath will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
