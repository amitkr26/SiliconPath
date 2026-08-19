# Project Management

## Overview

Roadmap status, phases, and opportunity scraping / backend replication status. Verified 2026-08-19.

## Development Phases

### Phase 1: Social & Engagement — Implemented

Feed, connections, messaging, notifications, bookmarks, resume — all done and E2E-verified (9/9 on production, 2026-08-18).

### Phase 2: Employer Tools — Partial

- Done: job posting, employer dashboard, claim (notification only), recommendations
- Not done: ATS board, recruiter messaging, real company claims (no claims table)

## Opportunity Scraping

18 scraper modules in the frontend: 8 real + 10 fabricated, gated behind `SCRAPER_ALLOW_FABRICATED` and disabled in production.

## Backend Replication

In progress: parity docs complete (`backend/docs/FRONTEND-BACKEND-MAP.md`, `backend/docs/API-PARITY.md`); implementation partial — see [05-backend](../05-backend/README.md).

## Related Documents

None.