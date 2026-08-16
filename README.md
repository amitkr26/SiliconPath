# SiliconPath

### Consumer Brand: BerojgarDegreeWala
### Career Intelligence Infrastructure for India's Electronics Ecosystem

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Primary%20DB-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Neon](https://img.shields.io/badge/Neon-Analytics%20DB-00E599?style=for-the-badge&logo=postgresql)](https://neon.tech/)
[![Deployment](https://img.shields.io/badge/Vercel-Live-000000?style=for-the-badge&logo=vercel)](https://berojgardegreewala.vercel.app)

[**Live Platform**](https://berojgardegreewala.vercel.app) • [**Opportunities**](https://berojgardegreewala.vercel.app/opportunities) • [**Academy**](https://berojgardegreewala.vercel.app/academy) • [**Admin**](https://berojgardegreewala.vercel.app/admin)

---

## Vision

**SiliconPath** is career intelligence infrastructure for India's electronics ecosystem — semiconductor, VLSI, embedded systems, and materials science. It exists to answer one question for every student and engineer: *"What can I apply to next, is it real, and am I eligible?"*

This is not "LinkedIn for semiconductors." The moat is **technical depth + verified aggregation**: understanding what a 28nm tapeout, a JJAP publication, or a DRDO security clearance means — then pairing candidates with opportunities that actually fit.

## The Core Loop

```
Discover → Match → Verify → Apply
```

1. **Discover** — multi-source aggregation: national labs (ISRO, DRDO, CSIR), academic institutes (IITs, IISc, IISERs), and global semiconductor/EDA players via ATS feeds (Greenhouse, Lever, Workday, SmartRecruiters), RSS, and HTML parsing.
2. **Match** — structured eligibility, skills, category, stipend, and deadline data power search, filters, and the AI matcher.
3. **Verify** — every opportunity passes a verification pipeline: link check → deep scrape → AI summary → expiry check. *"Verified" is a claim the pipeline must earn, not a default flag.*
4. **Apply** — one click to the official source URL. No forced signup in the browse → apply flow.

## Architecture: Modular Monolith on Next.js & Supabase

A single Next.js 14 (App Router) deploy serving the candidate, employer, and admin surfaces, backed by a shared typed data layer. No microservices sprawl; the optional Express API (`backend/server`) mirrors routes for future worker separation.

```
┌─────────────────────────── Next.js 14 (Vercel) ───────────────────────────┐
│  (candidate) portal   (employer) portal   (admin) portal   ┌────────────┐ │
│  opportunities / match / academy / news      admin/*       │ AI Gateway │ │
│  ───────────────────────────────────────────────────────   │ 9 providers│ │
│  API routes (route.ts)  +  Middleware (auth, RBAC, CSRF)   └────────────┘ │
└──────────────────────────────┬────────────────────────────────────────────┘
                               │
        ┌──────────────────────┼───────────────────────────┐
        ▼                      ▼                           ▼
  Supabase DB1 (core)    Supabase DB2 (user/social)   Neon DB (analytics)
  opportunities, news,   profiles, saved, community,  page_views, click_events,
  organizations, scrape  applications, academy        search_queries, mirror
  sources                                           (opportunities/news mirror)
```

> **Status:** DB2 stores user/social data; Neon holds analytics + the `opportunities_mirror`/`news_mirror` replicas. The original "4-database" design was consolidated to 3 (see `neon/schema.sql` header). The mirror sync (`sync-replica`) and archive (`archive-news`) crons are known-broken against the live schema — see [Current State](#current-state).

## Three Portals

| Portal | Route group | Pages | Auth |
| :--- | :--- | :--- | :--- |
| **Candidate** | `(candidate)` | `/` `/opportunities` `/news` `/academy` `/match` `/ask-ai` `/saved` `/applications` `/profile` `/resume` | Public read; login for saved/applications/resume |
| **Employer** | `(employer)` | `/post-job` `/employers` `/employer/dashboard` `/employer/company-claim` | Login + **employer role (TODO: middleware RBAC)** |
| **Admin** | `(admin)` | `/admin` (opportunities, companies, analytics, scrape control, AI test) | HMAC session via `ADMIN_PASSWORD` |

**Current reality:** routes are flat (`/admin`, `/employer/*`, everything else at root) — the `(candidate)`, `(employer)`, `(admin)` route groups are the **target structure**, not the current one. Migration is planned in `ARCHITECTURE.md`.

## Current State (Honest, 2026-08-16)

Audit-backed reality, not marketing:

- **Data quality is the #1 problem.** Live DB: 3,272 opportunities, **3,115 (95%) with no organization linkage**, 100% `verification_status = "verified"` (a static insert default — no verification pipeline has run), and ATS listings miscategorized (e.g. "Software Engineering" tagged `jrf`). The person-name org misattribution flagged in the spec ("Sadia Munir" as an organization) is **still live** in the Neon mirror.
- **The daily scrape cron is a no-op.** `vercel.json` fires `/api/scrapers/run-all` at 00:00 UTC, which runs *hand-written* sample scrapers gated behind `SCRAPER_ALLOW_FABRICATED=true` — they return `[]` in production. The real engine (`opportunity-scraper-impl.ts` + ATS adapters) exists and works but is only admin-triggered via `/api/scrape`. Last real inserts: 2026-08-02.
- **AI is genuinely grounded.** The chat assistant retrieves live records from the `opportunities`/`news_articles` tables before answering and refuses to invent URLs or deadlines. This is the strongest part of the stack.
- **RBAC is UI-hiding, not enforcement.** Middleware gates employer paths on *login only*, never on role; admin is a separate HMAC console.
- **Schema drift.** Repo migrations don't match the live schema; several routes (`scrape-opportunities`, `check-links`, `sync-replica`) still reference legacy columns (`apply_link`, `stipend`, `organization`) that no longer exist.
- The social layer (feed, network, messages, notifications) exists and is functional but is **de-prioritized** — it is not the moat.

See `docs/audit-reports/` for the full audit history (including the 2026-08-16 State of the Union) and the 7-day remediation plan.

## Feature Inventory

**Core (Tier 1, public, no login):** opportunities (search/filter/categories), news, organizations, AI assistant (`/ask-ai`), AI matcher (`/match`), resources/guides, VLSI Academy (browse).

**Account features (Tier 2):** saved opportunities, applications tracking, profile `@username`, resume builder (GCP Document AI + Gemini fallback), Academy progress, employer job posting + company claim.

**De-emphasized:** feed, network/connections, direct messages, notifications, community Q&A.

## Tech Stack

| Layer | Choice |
| :--- | :--- |
| Frontend & API | Next.js 14 (App Router), React 18, Tailwind + neobrutalist design system |
| Databases | Supabase DB1 (core) + DB2 (user/social) + Neon (analytics/mirrors) |
| AI | `@berojgardegreewala/ai-gateway` — Groq (primary), Gemini, OpenRouter, NVIDIA NIM, Cloudflare, HuggingFace, Bedrock; DB-grounded RAG |
| Auth | Supabase Auth (email + Google OAuth) |
| Email | Resend |
| Optional API | Express 4 (`backend/server`) mirroring routes under `/api/v1/*` |
| Infra | Vercel (cron 2× daily), Docker compose, k8s manifests (frontend) |

## Development

```bash
npm install                                   # all workspaces
cd frontend && npm run dev                    # Next.js on :3000
npm run dev --workspace @berojgardegreewala/server   # Express on :8080
npm run build / npm run typecheck / npm test  # full workspace checks
```

`frontend/.env.local` is required (see `frontend/.env.example` for the variable list). Never commit real secrets — see `project-bible/13-security/SECURITY.md` and the repository secret-handling rules in `project-bible/23-reference/berojgardegreewala-master-specification.md`.

## Documentation

- `project-bible/` — single source of truth for all documentation: architecture (`ARCHITECTURE.md`), security (`13-security/SECURITY.md`), changelog (`CHANGELOG.md`), master specification, ADRs, backlog, section guides
- `docs/audit-reports/` — all audit & validation reports (gap analysis, schema audits, production readiness, State of the Union)
- `docs/session-reports/` — per-session work reports

## License

© 2026 SiliconPath / BerojgarDegreeWala. Built for India's semiconductor and VLSI engineering revolution.
