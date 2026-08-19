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

Phase 4 (parity implementation) + Phase 5 (production readiness) COMPLETE 2026-08-19:
46 server node:test / 15 ai-gateway jest / 97 api jest, Docker hardened, `/health/ready`,
E2E 9/9 regression. Backend is production-ready but NOT deployed — deployment decision
pending (KNOWN_ISSUES #0). Parity docs: `backend/docs/FRONTEND-BACKEND-MAP.md`,
`backend/docs/API-PARITY.md`; details in [05-backend](../05-backend/README.md).

## Related Documents

None.