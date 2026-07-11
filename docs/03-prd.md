# 03 - Product Requirements Document (PRD)

Status tags: **(CURRENT)** live today · **(PARTIAL)** exists but broken/incomplete · **(TARGET)** planned.

## 1. Product surfaces

SiliconPath has three surfaces:

1. **Aggregator** (public) — opportunities, organizations, news, resources.
2. **Academy** (public) — 7-track VLSI curriculum + resume builder.
3. **Network** (auth) — LinkedIn-style feed, profiles, connections, messaging, notifications, applications, provider portal.

## 2. Pages & requirements

### 2.1 Home `/` (CURRENT)
- Hero, search box, trending tags.
- Stat counters (active opportunities, verified, JRF, PhD).
- Browse-by-specialization grid (VLSI & ASIC, Semiconductor Process, Embedded, RF, Research/PhD, Signal Processing, AI Hardware, Fellowships/JRF).
- Featured opportunities (verified, expiring soon).
- Latest news.
- Newsletter subscribe.
- Must render server-side; no login.

### 2.2 Opportunities `/opportunities` (PARTIAL — data quality broken)
- Filterable, paginated list of verified opportunities.
- Filters: category (JRF/SRF, PhD, industry, govt, fellowship, internship), location (India/International), specialization, deadline.
- Search by title, org, keyword (input sanitized).
- Each card: title, organization name, category tag, location, posted date, deadline.
- Detail page `/opportunities/[slug]`: full description, eligibility, apply button (redirects to source), JobPosting JSON-LD.
- **Requirement:** only `verification_status = 'verified'` rows appear. No nav-heading titles, no person-name orgs, correct category.

### 2.3 Organizations `/organizations`, `/organizations/[slug]` (CURRENT)
- Directory of orgs with active opportunity counts. Detail page lists that org's opportunities.

### 2.4 News `/news`, `/news/[slug]` (CURRENT)
- Aggregated semiconductor news via RSS. Read-only.

### 2.5 Resources `/resources/*` (CURRENT)
- Static guides (JRF vs SRF, funded PhDs abroad, DRDO recruitment, etc.).

### 2.6 Academy `/academy`, `/academy/[track]`, `/academy/[track]/day/[day]`, `/academy/[track]/assessment` (PARTIAL — landing hangs)
- 7 sequential tracks, gated by >=70% assessment.
- Day view: curated free video, objectives, practice link, checkpoint quiz.
- Progress in LocalStorage for guests, synced to DB for logged-in users.
- **Requirement:** landing must render tracks within a bounded time; on failure show error+retry, never infinite spinner. Fallback tracks exist in code and must be used if DB is unavailable.

### 2.7 Resume builder `/resume` (PARTIAL)
- 5-step form (personal, education, experience, skills, projects). Save to profile. Optional ATS score via AI chain.

### 2.8 Auth `/login`, `/signup`, `/onboarding` (CURRENT)
- Two-sided signup: seeker vs provider. Role stored in auth metadata.
- Onboarding: seeker builds profile; provider creates a company profile. Redirect provider->/dashboard, seeker->/feed.

### 2.9 Network surfaces (auth) (PARTIAL)
- `/feed` — posts from connections/followed, composer, reactions, comments.
- `/network` — connections, requests, suggestions, people search.
- `/messages` — direct messaging between connected users.
- `/profile` — own profile edit; `/people/[username]` — public profile.
- `/notifications` — activity notifications.
- `/companies`, `/companies/[slug]` — company pages + follow.
- `/dashboard` — provider dashboard.

### 2.10 Admin `/admin/*` (CURRENT)
- Add/edit opportunity, add news, talent pool, scrape health monitor. Password-gated (server-only `ADMIN_PASSWORD`).

## 3. Consolidation rule

Legacy `/chat`, `/community`, `/match`, `/people` (list) are consolidated: chat->messages, community->feed, match/people->network. No dead routes.

## 4. Non-functional requirements

- Public pages server-rendered, LCP-friendly.
- Responsive: mobile / tablet / laptop / desktop, all mandatory.
- CI (GitHub Actions) AND Vercel build must both be green to ship.
- Rate limiting must be durable (Upstash/Redis), not in-memory (serverless).
