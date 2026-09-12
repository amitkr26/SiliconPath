# SiliconPath — Technical Architecture

**Version:** 2026-09-12 · **Pattern:** Modular Monolith on Next.js & Supabase — Free VLSI Learning Platform

---

## 1. Architectural Overview

SiliconPath operates as a **modular monolith** on Next.js 14 (App Router) deployed to Vercel, backed by Supabase PostgreSQL for optional progress persistence.

The application serves a single focused purpose: **free VLSI learning for semiconductor engineers**. No authentication is required for any learning content. All content is freely accessible.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                   Next.js 14 Modular Monolith (Vercel)                   │
├──────────────────────────────────────────────────────────────────────────┤
│                        PUBLIC LEARNING PLATFORM                          │
│         No auth gates, no premium tiers, no course selling               │
├──────────────────────────────────────────────────────────────────────────┤
│                  API Route Handlers (frontend/src/app/api/*)             │
│            • Academy  • Learning Paths  • Resources  • Progress          │
└─────────────────────────────────────┬────────────────────────────────────┘
                                      │
                                      ▼
                              Supabase (Optional)
                              • learning_tracks
                              • learning_days
                              • learning_questions
                              • track_assessments
                              • user_progress (localStorage fallback)
```

---

## 2. Six Learning Surfaces

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Surface                   Key Pages                                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│ 1. VLSI Learning Academy  /academy, /academy/[trackId],                         │
│    (/academy)             /academy/[trackId]/[day]                              │
│                           7 tracks, day-by-day curriculum, quizzes              │
├─────────────────────────────────────────────────────────────────────────────────┤
│ 2. Learning Paths         /learn, /learn/[pathId],                              │
│    (/learn)               /learn/[pathId]/[moduleId]                            │
│                           15 paths (5 Foundations + 6 Backend + 4 Tools/Career) │
├─────────────────────────────────────────────────────────────────────────────────┤
│ 3. Engineering Lab        /engineering-lab                                      │
│                           4 real EDA diagnostic report cases                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│ 4. STA Interview Q&A      /sta-interview-questions                              │
│                           128 questions, 11 topics, search & math derivations   │
├─────────────────────────────────────────────────────────────────────────────────┤
│ 5. Free Resources         /courses, /courses/openlane-rtl-to-gds,               │
│                           /courses/resume-tips                                  │
│                           OpenLane Sky130 tapeout guide, resume guidelines      │
├─────────────────────────────────────────────────────────────────────────────────┤
│ 6. Career Resources       /resources                                            │
│                           Roles breakdown (PD, DV, RTL, DFT), EDA toolchains    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Design System Architecture

Defined centrally in `frontend/src/styles/design-tokens.ts`:
- **Colors:**
  - Background: `#F8FAFC`
  - Text Primary: `#0F172A`
  - Text Secondary: `#475569`
  - Text Muted: `#94A3B8`
  - Brand Primary: `#2563EB` (reserved for primary CTAs and active states)
  - Terminal/Log Viewport: `#0B1120`
  - Status: `#059669` (success), `#D97706` (warning), `#DC2626` (danger)
- **Radii:** Geometric hierarchy (`sm: 4px`, `md: 6px`, `lg: 8px`, `xl: 12px`). No oversized bubble shapes.
- **Shadows:** Standard subtle CSS box-shadows (`card: 0 1px 2px rgba(0,0,0,0.05)`). Removed all hard neo-brutalist offset borders and drop shadows.
- **Typography:** Inter (body text) and Space Grotesk (technical headings & labels).

---

## 4. Content Delivery & State Management

- **Zero Auth Gating:** All learning paths, modules, academy days, engineering labs, and interview Q&As are immediately accessible.
- **Client-side Progress Tracking:** `localStorage` provides instant, unauthenticated progress persistence for completed modules and track days (`learn-${pathSlug}-completed`).
- **Optional Cloud Sync:** Optional Supabase API synchronization if an authenticated session exists, with immediate fallback to local storage.
- **Static Generation:** Next.js prerenders all 16 static routes during build time for instant page loads.

---

## 5. Security & Verification Baseline

1. **Security Controls:**
   - No sensitive credentials exposed in client bundles.
   - All secret variables isolated to server-side environments.
   - Security headers enabled in `next.config.js` (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`).
2. **Verification Suite:**
   - **TypeScript:** `npx tsc --noEmit` passing with 0 errors.
   - **Unit Tests:** `jest` testing curriculum integrity, slug uniqueness, and sitemap synchronization.
   - **Build:** `npm run build` generates all static and dynamic routes successfully.
