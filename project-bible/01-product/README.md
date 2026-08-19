# Product Documentation

## Overview

BerojgarDegreeWala is a career and knowledge platform for the Electronics, Semiconductor, VLSI, Embedded, Research, and Academia ecosystem — career intelligence infrastructure for that space. It consists of three integrated products inside a single web application.

## The Three Products

### 1. Opportunity Aggregator (Primary Product)
Users should never need to manually visit hundreds of company, university, DRDO, ISRO, BARC, CSIR, IIT, NIT, IIIT, government, or private career pages. BerojgarDegreeWala aggregates opportunities into one searchable platform.

- No registration required to search. Registration is optional.
- Applying always redirects users to the original official source.
- Opportunity discovery is the primary purpose of BerojgarDegreeWala.

### 2. BerojgarDegreeWala Academy
A completely free VLSI, Electronics, and Semiconductor learning platform with sequential learning tracks, day-wise content, practice quizzes, and gated assessments.

### 3. BerojgarDegreeWala Network
A professional networking platform specialized for Semiconductor, Electronics, Research, and Academia — similar in concept to LinkedIn but domain-focused.

## Key Metrics

- **Next.js 14** (App Router)
- **~139** API routes
- **104** unit tests + **6** Playwright E2E specs (9/9 passing on production)
- **9** AI providers via `backend/ai-gateway`
- **4** databases (2 Supabase + 2 Neon)
- **18** scraper modules in the frontend (8 real + 10 fabricated, gated, disabled in prod)
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