# SiliconPath — Product Definition

## Vision
SiliconPath is a 100% free VLSI learning platform for semiconductor engineers. No paywalls, no premium tiers, no fake social proof, no course selling.

## Core Products & Learning Surfaces

### 1. VLSI Learning Academy (`/academy`)
- 7 structured learning tracks (Digital Logic, Verilog, SystemVerilog, UVM, RTL Design, Physical Design, Interview Prep)
- Day-by-day curriculum with hands-on labs and NPTEL / Siemens EDA lecture references
- Practice quizzes and assessments
- Progress tracking with local storage fallback and optional cloud sync
- Clean technical dashboard with zero artificial locks

### 2. Learning Paths (`/learn`)
- 15 career-focused learning paths organized into 3 tiers:
  - **Foundations (5):** Digital Electronics, Verilog HDL, Hardware Protocols, Design Verification, Clock Domain Crossing
  - **Backend & Signoff (6):** Synthesis, ASIC Physical Design, Static Timing Analysis, Physical Verification, Low Power & UPF, Design For Test
  - **Tools & Career (4):** TCL for EDA, Linux for VLSI, Interview Q&A, Career Roadmap
- 148 total modules across all paths
- Each module provides: concept overview, exact EDA tool commands (TCL/SDC), signoff verification checklist, interview focus points, and completion toggle

### 3. Engineering Lab (`/engineering-lab`)
- Real-world diagnostic case studies modeled on authentic EDA timing and signoff reports:
  - Setup Time Violation on High-Fanout Reset Tree (PrimeTime report analysis, WNS -420ps closure)
  - Hold Time Race on Shift Register Datapath (Tempus min-delay violation, buffer insertion)
  - Routing Congestion Hotspot on Dense ALU Macro (Innovus global route overflow, cell density tuning)
  - Clock Skew Imbalance in Mesochronous Clock Mesh (ICC2 CTS report, balanced H-tree insertion)
- Raw tool terminal excerpts (`#0B1120`), root cause analysis, and signoff takeaways

### 4. STA Interview Questions (`/sta-interview-questions`)
- 128 curated interview questions across 11 static timing analysis topics
- Setup/Hold slack derivations, clock skew, jitter, OCV/AOCV, crosstalk noise, and SDC constraints
- Instant search filter and topic selection chips
- Expandable detailed engineering proofs and mathematical derivations

### 5. Free Resources & Tapeout Guides (`/courses`)
- OpenLane RTL-to-GDSII Complete Flow Guide (`/courses/openlane-rtl-to-gds`): Full open-source tapeout walkthrough on SkyWater Sky130 PDK
- Semiconductor Technical Resume & Portfolio Guide (`/courses/resume-tips`): Actionable bullet point formulas, EDA tool matrices, and ATS optimization
- 8-Week VLSI Fresher Study Plan (`/learn/career-roadmap`)
- 100% free and open access

### 6. Career Resources & Roles (`/resources`)
- Semiconductor Engineering Career Profiles: Physical Design, Design Verification (DV/UVM), RTL Design, and DFT Engineer
- Required industry EDA toolchains (ICC2, Innovus, PrimeTime, Calibre, VCS, Tessent)
- High-credibility portfolio project ideas (Sky130 macro tapeout, UVM AXI4 testbench, TCL STA automation)

## Design System & UX Principles
- **Engineering Tooling Aesthetic:** Inspired by modern developer tools (Linear, Stripe Docs, GitHub, EDA software).
- **Restrained Color Hierarchy:** Clean neutral backgrounds (`#F8FAFC`), crisp near-black typography (`#0F172A`), blue reserved strictly for primary actions and active links (`#2563EB`), green for verified/success states, amber for warnings, red for errors.
- **Zero AI Website Patterns:** Eliminates 2px/3px black borders, offset drop shadows, pill buttons, repeated 3-column card grids, and generic emojis.
- **Accessible & Responsive:** Fluid responsive behavior from 360px mobile to 1440px+ ultra-wide screens.

## Tech Stack
- Next.js 14 (App Router)
- React 18 + TypeScript (0 compile errors)
- Tailwind CSS with semantic design tokens
- Supabase (optional, for progress persistence)
- Vercel (hosting)

## Partner Platforms
- [BerojgarDegreeWala](https://berojgardegreewala.vercel.app) — Opportunity aggregator for semiconductor careers
- [ElectroBridge](https://electrobridge.vercel.app) — AI resume builder for engineers
