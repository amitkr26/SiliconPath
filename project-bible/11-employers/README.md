# Employer Features

## Overview

Partial employer portal for posting opportunities, viewing own postings, and claiming organizations. Running against the production site (`https://berojgardegreewala.vercel.app`).

## Implemented

- Employer role via signup `accountType` (`user_metadata.role = employer | candidate`)
- `EMPLOYER_ONLY_PATHS` gate in `frontend/src/middleware.ts` (`/post-job`, `/employers`, `/employer`, `/api/employer`) — enforced server-side
- `POST /api/employer/jobs` — `postJobSchema` validation, slugify + dedupe, `normalizeCategory` to CHECK values, `resolveOrganizationId`, inserted unverified with `source_type: "employer_posted"`
- `GET /api/employer/jobs` — list employer's own postings
- `POST /api/employer/claim` — notification only; no claims table exists
- `GET /api/employer/recommendations` — skill-overlap top 10 candidate recommendations

## Not Implemented

- ATS applicant review UI/board
- Recruiter messaging
- Company claim workflow backed by a real table
- Applicant status pipeline visible to the employer

## Database

Employer/company data lives in the `company_pages` table (not `company_profiles`).

## Related Documents

None.