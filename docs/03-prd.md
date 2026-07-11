# 03 — Product Requirements (PRD)

## Roles
Guest, Seeker (registered), Provider (registered), Admin. See [23-feature-matrix.md](23-feature-matrix.md).

## Public pages (no login)

### `/` Home
- Hero + search box, trending tags, live stats (active opportunities, orgs, tracks, learners).
- "Browse by specialization" grid. Featured/latest verified opportunities (6). Latest news (3-5).
- Newsletter subscribe. CTA to academy.

### `/opportunities` List
- Filters sidebar (sticky, top on mobile): category, location (India/International), specialization, deadline.
- Search bar (title/org/keyword, sanitized input). Result rows: org logo/initials, title, org, location, tag, posted time, deadline.
- Pagination (cursor or page). Only `verification_status='verified'` shown; "Show unverified" is admin-only.
- Empty state teaches, never blank.

### `/opportunities/[slug]` Detail
- Title, org, category, location, salary_range, deadline, eligibility, description.
- "Apply" button → `apply_url` (external, source). Save (if logged in). Share (WhatsApp/X). JobPosting JSON-LD.
- Must null-guard every field (location, org) — scraped rows may be partial.

### `/academy` + `/academy/[track]` + `/academy/[track]/day/[day]` + `/academy/[track]/assessment`
- 7 sequential tracks, gated by >=70% assessment. Progress in LocalStorage (guest) or DB (user).
- Timeout-guarded load + error/empty states. Never infinite spinner.

### `/news`, `/organizations`, `/organizations/[slug]`, `/resources`, `/resume`
- News list/detail. Org directory + detail (counts via organization_id). Curated resources.
- Resume builder: 5-step form (personal, education, experience, skills, projects) + ATS score.

## Auth pages
- `/signup` — two-step: choose role (seeker/provider) → form. Stores `account_type` in auth metadata.
- `/login`, `/onboarding` — role-aware; provider creates company_profile then → `/dashboard`; seeker → `/feed`.

## Authenticated pages (login required)
- `/feed` — posts from connections/follows + composer + reactions/comments.
- `/network` — tabs: connections, requests, suggestions; people search.
- `/messages` — conversation list + thread; realtime.
- `/notifications` — typed notifications.
- `/profile` — edit (whitelisted fields only), skills, open-to-work.
- `/dashboard` — provider: post opportunities (source_type=employer_posted), view applicants.

## Admin
- `/admin` — dashboard. `/admin/add-opportunity`, `/admin/add-news`, `/admin/edit-opportunity/[id]`.
- `/admin/scrape-health` — sources, recent runs, last-N inserted opportunities (org/title/category)
  for data-quality eyeballing. `/admin/talent-pool`.

## Cross-cutting requirements
- Every data page: loading, error, empty states.
- Every write endpoint: auth + Zod validation + field allowlist.
- Every public page: SSR + metadata + responsive.
