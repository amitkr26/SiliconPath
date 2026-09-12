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
│ Surface                   Key Pages                                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│ 1. VLSI Learning Academy  /academy, /academy/[trackId],                        │
│    (/academy)             /academy/[trackId]/[day]                             │
│                           7 tracks, day-by-day curriculum, quizzes             │
├─────────────────────────────────────────────────────────────────────────────────┤
│ 2. Learning Paths         /learn, /learn/[pathId],                             │
│    (/learn)               /learn/[pathId]/[moduleId]                           │
│                           15 paths (5 Foundation + 6 Backend + 4 Tools)        │
├─────────────────────────────────────────────────────────────────────────────────┤
│ 3. Engineering Lab        /engineering-lab                                      │
│                           4 real violation debugging cases                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│ 4. STA Interview Q&A      /sta-interview-questions                              │
│                           128 questions, 11 topics, difficulty badges           │
├─────────────────────────────────────────────────────────────────────────────────┤
│ 5. Free Resources         /courses                                             │
│                           OpenLane guide, Career Roadmap, Resume Tips          │
├─────────────────────────────────────────────────────────────────────────────────┤
│ 6. Career Resources       /resources                                           │
│                           VLSI career guides, salary info, company directory   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Database Architecture

SiliconPath uses a single optional Supabase database for progress persistence. All learning content is statically generated or served from API routes. localStorage is the primary progress store.

### Supabase (Optional — Progress Persistence)
- **Role**: Optional cloud sync for academy progress and quiz results
- **Key Tables**: `learning_tracks`, `learning_days`, `learning_questions`, `track_assessments`, `user_progress`
- **Fallback**: localStorage when Supabase is unavailable or user is unauthenticated

### Content Delivery
- Learning path modules, engineering lab cases, and STA questions are statically generated
- YouTube video embeds for visual learning
- No database required for content reads

---

## 4. Security

SiliconPath has minimal security surface since all content is freely accessible:

1. **No Authentication Required**: All learning content is public
2. **Optional Progress Sync**: Supabase auth only used if user wants cloud progress persistence
3. **Security Headers**:
   - `X-Frame-Options: DENY`
   - `X-Content-Type-Options: nosniff`
   - `Strict-Transport-Security: max-age=31536000; includeSubDomains`

---

## 5. Verification Baseline

- **TypeScript Type Safety**: `npx tsc --noEmit` (0 errors)
- **Unit & Integration Tests**: `npx jest` (passing)
- **Production Build**: `npm run build` (compiles successfully)
- **Security**: No auth required, public content, security headers enabled
