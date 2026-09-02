# Product Documentation

## Overview

BerojgarDegreeWala is a career and knowledge platform for the Electronics, Semiconductor, VLSI, Embedded, Research, and Academia ecosystem — career intelligence infrastructure for that space. It consists of three integrated products inside a single web application.

## The Three Products

### 1. Opportunity Aggregator & Intelligence System (Primary Product — `/opportunities` & `/ask-ai`)
Users should never need to manually visit hundreds of company, university, DRDO, ISRO, BARC, CSIR, IIT, NIT, IIIT, government, or private career pages. BerojgarDegreeWala aggregates live opportunities into one searchable platform and powers a dedicated Opportunity Intelligence Engine (`/ask-ai`) with 4 operating modes (Ask AI, Discover, Saved, Alerts), strict date-aware freshness validation, and institutional source tracking.

- No registration required to search. Registration is optional.
- Applying always redirects users to the original official source.
- Opportunity discovery and real-time research intelligence is a core pillar.

### 2. Resume Studio (`/resume`)
An independent, FlowCV-grade resume engineering workspace tailored for semiconductor, VLSI, embedded, and research professionals. Features 10 tailored templates, 8 rendering primitives, 3 top-level workspace modes (Content, Customize, AI Tools), live A4 print preview, role-targeted ATS scoring, and multi-resume version storage.

### 3. BerojgarDegreeWala Academy (`/academy`)
A completely free VLSI, Electronics, and Semiconductor learning platform with sequential learning tracks, day-wise content, practice quizzes, and gated assessments.

### 4. BerojgarDegreeWala Network (`/network` & `/feed`)
A professional networking platform specialized for Semiconductor, Electronics, Research, and Academia — similar in concept to LinkedIn but domain-focused.

## Key Metrics

- **Next.js 14** (App Router)
- **~140** API routes
- **195** unit tests across **24** test suites + Playwright E2E specs
- **9** AI providers via `backend/ai-gateway`
- **4** databases (2 Supabase + 2 Neon)
- **18** scraper modules in the frontend (8 real + 10 gated)
- **7** VLSI academy tracks (30+ days each)

## Architecture Summary

```
User → Vercel (Next.js 14) → Supabase DB1 (core) + DB2 (social)
                           → Neon (analytics)
Backend → frontend scraper modules (18) → DB1
```

## Related Documents

- [vision.md](./vision.md) — Product vision and mission
- [prd.md](./prd.md) — Product Requirements Document
- [user-stories.md](./user-stories.md) — User stories by persona
- [MASTER_IMPLEMENTATION_PLAN.md](./MASTER_IMPLEMENTATION_PLAN.md) — Master implementation plan