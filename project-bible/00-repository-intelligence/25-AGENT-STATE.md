# 25-AGENT-STATE — Authoritative Real-Time Machine State

```text
CURRENT PROJECT STATE
---------------------
Current branch: main
Current phase: PHASE 16 — PRODUCT REDRESS COMPLETED
Current objective: Opportunity Quality + Auth UX + Employer Profile Redesign

Operational Status:
- Public Portal: OPERATIONAL
- Candidate Portal & Networking: OPERATIONAL
- Employer & Recruiter Suite: OPERATIONAL
- Admin Control Center: OPERATIONAL
- Automated Test Suite: 120/120 PASS (100%)
- TypeScript: 0 errors
- Next.js Production Build: 244/244 routes compiled

OPPORTUNITY AVAILABILITY RULE (CANONICAL):
- opportunities.is_active = true
- verification_status NOT IN ('rejected', 'expired')
- deadline >= IST today OR deadline IS NULL
- Applied consistently across: /api/opportunities, /api/search, /api/search/opportunities,
  /api/opportunities/featured, /api/opportunities/stats, /api/similar, /sitemap,
  homepage, opportunity detail generateStaticParams, location pages

VERIFICATION STATUS FIX:
- Removed 'unverified' from all DB write paths (violated live CHECK constraint)
- All new records now use 'pending' as default verification_status
- CHECK constraint valid values: pending, verified, rejected, expired, link_unavailable

BUGS FIXED THIS SESSION:
1. Homepage employer query used employer_id (nonexistent column) → fixed to created_by
2. /api/search/opportunities had no expiry filtering → now uses canonical rule
3. /api/opportunities/featured showed expired opportunities → now filters
4. /api/opportunities/stats included expired in active counts → now filters
5. Sitemap included expired opportunities → now filters
6. generateStaticParams included expired → now filters
7. 'unverified' written to DB violating CHECK constraint → all paths use 'pending'
8. Types had 'unverified' in verification_status union → removed
9. Validation schema had 'unverified' in enum → replaced with full valid set
10. Test expected 'pending' to be rejected → updated to reflect correct schema

DO NOT TOUCH:
- Do not destructively move frontend logic to backend.
- Do not remove created_by from opportunities.
- Do not rename workspace_members or employer_settings tables.
- Do not write 'unverified' to verification_status (violates DB CHECK constraint).

NEXT RECOMMENDED ACTION:
- Deploy to Vercel and verify on live.
- Run Playwright E2E tests for role-specific homepage rendering.
- Verify employer profile editing/username change flow end-to-end.

LAST UPDATED: 2026-08-23
LAST AGENT: Continuation Agent (took over from Antigravity)
```
