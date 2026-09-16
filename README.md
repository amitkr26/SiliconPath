# SiliconPath — Free VLSI Learning Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

SiliconPath is a 100% free learning platform for VLSI and semiconductor engineers. No paywalls, no premium tiers, no course selling, no login required. Live at [siliconpath.in](https://siliconpath.in).

## Features

### VLSI Learning Academy (`/academy`)
- 7 structured learning tracks (Digital Logic, Verilog, SystemVerilog, UVM, RTL Design, Physical Design, Interview Prep)
- **Embedded video lectures per track**: full YouTube playlists play inline (click-to-play `videoseries` embeds) + NPTEL course cards, mapped in `frontend/src/lib/video-references.ts`
- Day-by-day curricula with practice quizzes, gated assessments, and localStorage progress tracking

### 15 Learning Paths (`/learn`)
- **Foundation (5):** Digital Electronics, Verilog HDL, Hardware Protocols, Design Verification, Clock Domain Crossing
- **Backend & Signoff (6):** Synthesis, ASIC Physical Design, Static Timing Analysis, Physical Verification, Low Power & UPF, Design For Test
- **Tools & Career (4):** TCL for EDA, Linux for VLSI, Interview Q&A, Career Roadmap
- **150 modules** with theory, examples, and practice

### Free Video Course Library (`/learn/video-courses`)
- 74 curated free courses: 70 NPTEL courses + 4 YouTube playlists (Neso Academy, VLSI Academy)
- Searchable, filterable by 8 topic groups; also surfaced as companion cards per learning path

### Engineering Lab (`/engineering-lab`)
- Real-world signoff violation debugging cases (timing, congestion, DRC) with report analysis

### STA Interview Questions (`/sta-interview-questions`)
- 55 questions across 11 topics with expandable engineering answers

### Guides & Resources (`/courses`, `/resources`)
- OpenLane RTL-to-GDS tapeout guide, resume tips, career roadmap, VLSI role profiles and EDA toolchains

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **UI:** React 18 + TypeScript + Tailwind CSS (central design tokens in `frontend/src/styles/design-tokens.ts`)
- **Database:** Supabase (optional, with client-side fallbacks)
- **Hosting:** Vercel

## Repo Layout

| Path | What it is |
|---|---|
| `frontend/` | SiliconPath web app (Academy, Learning Paths, Video Library, guides) |
| `backend/` | **Legacy BerojgarDegreeWala-derived job-platform code** (`@berojgardegreewala/*`): job opportunities API, AI gateway, scrapers, worker. Kept for reference/compatibility; not part of the SiliconPath product surface. |
| `k8s/`, `neon/` | Legacy backend infrastructure (BDW deployment manifests, BDW analytics schema) |
| `project-bible/` | Architecture, security, changelog, product docs |
| `docs/` | Audit reports (`audit-reports/`) and session reports (`session-reports/`) |

> Note: backend workspaces are intentionally still named `@berojgardegreewala/*`. They are the unmodified legacy application; renaming them is purely cosmetic and out of scope.

## Getting Started

```bash
# Install dependencies
npm install

# Run frontend development server
npm run dev --workspace=frontend

# Open
http://localhost:3000
```

## Verification Gates

```bash
npm run typecheck   # tsc across all workspaces
npm test            # frontend jest + backend server test suites
npm run build       # production build
# frontend-specific: cd frontend && npx tsc --noEmit && npm test && npm run build
```

## License

MIT