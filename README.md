# SiliconPath — Free VLSI Learning Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

SiliconPath is a 100% free learning platform for VLSI and semiconductor engineers. No paywalls, no premium tiers, no course selling, no login required. Live at [siliconpath.in](https://siliconpath.in) · hosted on Vercel ([siliconpath.vercel.app](https://siliconpath.vercel.app)).

This repository **is** the Next.js web application — the app lives at the repo root (`src/`, `public/`, `package.json`), with support dirs (`project-bible/`, `docs/`) alongside.

## Features

### VLSI Learning Academy (`/academy`)
- 7 structured learning tracks (Digital Logic, Verilog, SystemVerilog, UVM, RTL Design, Physical Design, Interview Prep)
- **Embedded video lectures per track**: full YouTube playlists play inline (click-to-play `videoseries` embeds) + NPTEL course cards, mapped in `src/lib/video-references.ts`
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

- **Framework:** Next.js 14 (App Router) — root of this repo
- **UI:** React 18 + TypeScript + Tailwind CSS (central design tokens in `src/styles/design-tokens.ts`)
- **Database:** Supabase (optional, with client-side fallbacks)
- **Hosting:** Vercel (root deployment, `vercel.json`), Docker image for self-hosting
- **CI:** GitHub Actions (gitleaks security scan + typecheck/test/build)

## Repo Layout

| Path | What it is |
|---|---|
| `src/` | The app: App Router pages, components, lib, styles |
| `public/` | Static assets (`llms.txt`, `manifest.json`, icons) |
| `supabase/` | 2 academy migrations (learning tracks/days/questions/results) |
| `project-bible/` | Architecture, security, changelog, product docs (owner mandate) |
| `docs/` | Audit reports (`audit-reports/`) and session reports (`session-reports/`) |

## Getting Started
| `docs/` | Audit reports (`audit-reports/`) and session reports (`session-reports/`) |

## Getting Started

```bash
# Install dependencies
npm install

# Run the development server
npm run dev

# Open
http://localhost:3000
```

## Verification Gates

```bash
npm run typecheck   # tsc (app scope)
npm test            # jest suite (src/**/__tests__)
npm run build       # production build
```

## License

MIT