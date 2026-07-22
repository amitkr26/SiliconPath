# Product Documentation

## Overview

BerojgarDegreeWala is a global career and knowledge platform for the Electronics, Semiconductor, Embedded Systems, Research, and Academia ecosystem. It consists of three integrated products inside a single web application.

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

- **332+** configured scrape sources across 17 batches
- **74** API routes
- **4** databases (2 Supabase + 1 Neon consolidated)
- **7** AI providers in fallback chain
- **7** VLSI academy tracks (30+ days each)

## Architecture Summary

```
User → Vercel (Next.js 14) → Supabase DB1 (core) + DB2 (social)
                           → Neon (analytics)
                           → Render (Express backend scraper)
Backend → 7 adapter types → 332+ sources → DB1
```

## Related Documents

- [vision.md](./vision.md) — Product vision and mission
- [prd.md](./prd.md) — Product Requirements Document
- [user-stories.md](./user-stories.md) — User stories by persona
- [personas.md](./personas.md) — User personas
- [feature-matrix.md](./feature-matrix.md) — Features by tier
