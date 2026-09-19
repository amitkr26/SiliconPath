# SiliconPath

### Consumer Brand: BerojgarDegreeWala
### Career Intelligence & Recruitment Infrastructure for India's Deep-Tech & Electronics Ecosystem

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Primary%20DB-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Neon](https://img.shields.io/badge/Neon-Analytics%20DB-00E599?style=for-the-badge&logo=postgresql)](https://neon.tech/)
[![Deployment](https://img.shields.io/badge/Vercel-Live-000000?style=for-the-badge&logo=vercel)](https://berojgardegreewala.vercel.app)
[![Tests](https://img.shields.io/badge/Tests-361%2F361%20PASS-brightgreen?style=for-the-badge)](https://github.com/amitkr26/BerojgarDegreeWala)
[![Typecheck](https://img.shields.io/badge/Typecheck-0%20Errors-brightgreen?style=for-the-badge)](https://github.com/amitkr26/BerojgarDegreeWala)

[**Live Platform**](https://berojgardegreewala.vercel.app) | [**Opportunities**](https://berojgardegreewala.vercel.app/opportunities) | [**Ask AI**](https://berojgardegreewala.vercel.app/ask-ai) | [**Academy**](https://berojgardegreewala.vercel.app/academy) | [**Admin**](https://berojgardegreewala.vercel.app/admin)

---

## Vision

**SiliconPath (BerojgarDegreeWala)** is career intelligence and recruitment infrastructure for India's electronics ecosystem — semiconductor, VLSI, embedded systems, and materials science. It answers two critical questions:
1. **Candidates & researchers**: *"What can I apply to next, is it real, and am I eligible?"*
2. **Employers & research labs**: *"How do we find, screen, invite, and hire specialized engineering talent?"*

The moat is **technical depth + verified aggregation + dedicated hiring infrastructure**.

---

## Four Platform Surfaces

```
┌──────────────────────────────────────────────────────────────────────────┐
│                   BerojgarDegreeWala / SiliconPath                       │
├───────────────────┬────────────────────┬────────────────┬────────────────┤
│   PUBLIC PORTAL   │  CANDIDATE PORTAL  │ EMPLOYER SUITE │  ADMIN CONSOLE │
│  (Browse & Intel) │ (Career & Network) │ (ATS & Hiring) │  (Ops & Fleet) │
└───────────────────┴────────────────────┴────────────────┴────────────────┘
```

| Surface | Routes | Auth |
| :--- | :--- | :--- |
| **Public** | `/`, `/opportunities`, `/news`, `/academy`, `/organizations`, `/resources`, `/ask-ai` | Public read |
| **Candidate** | `/dashboard`, `/applications`, `/saved`, `/network`, `/messages`, `/profile`, `/resume` | Scoped to user |
| **Employer** | `/employer/dashboard`, `/employer/jobs`, `/employer/post-job`, `/employer/talent`, `/employer/analytics` | Strict `employer_id` |
| **Admin** | `/admin`, `/admin/applications`, `/admin/companies`, `/admin/scrape-health`, `/admin/analytics` | Admin only |

---

## BDW AI — Career Intelligence Engine

The platform includes an integrated AI career intelligence system:

- **RAG Pipeline**: 7-domain intent detection, multi-entity retrieval from opportunities, organizations, news, and resources
- **7 AI Tools**: `search_opportunities`, `search_organizations`, `check_eligibility`, `get_required_skills`, `find_related_opportunities`, `get_career_roadmap`, `search_news`
- **Multi-Provider Gateway**: BDW, Groq, Gemini, NVIDIA, OpenRouter, Cloudflare, HuggingFace, AWS Bedrock, AgentRouter, OmniRouter
- **Grounded Responses**: Every answer backed by verified database records with source citations

---

## Tech Stack

| Layer | Choice |
| :--- | :--- |
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript 5 |
| **Styling** | Tailwind CSS |
| **Databases** | Supabase PostgreSQL (Core) + Neon (Analytics) |
| **AI Gateway** | `@berojgardegreewala/ai-gateway` — 10 providers |
| **Auth** | Supabase Auth (Email + Google OAuth) |
| **Deployment** | Vercel |

---

## Development

```bash
git clone https://github.com/amitkr26/BerojgarDegreeWala.git
cd SiliconPath
npm install
npm run dev          # Start dev server
npm test             # Run all tests
npm run typecheck    # TypeScript check
npm run build        # Production build
```

---

## Quality Gates

| Gate | Command | Status |
| :--- | :--- | :--- |
| TypeScript | `npx tsc --noEmit` | 0 errors (all workspaces) |
| Frontend Tests | `npm test` | 34 suites / 361 pass |
| Worker Tests | `npm test` (backend/worker) | 31/31 pass |
| Backend API Tests | `npm test` (backend/api) | 8 suites / 100 pass |
| Gateway Tests | `npm test` (ai-gateway) | 19/19 pass |
| Production Build | `npm run build` | 338+ routes compiled |
| DB1 RLS Exposure | anon probes (`Prefer: count=exact`) | 0 exposed internal tables |

---

## Security

See [project-bible/SECURITY.md](project-bible/SECURITY.md) for credential management, RBAC, IDOR protection, and incident response.

---

*Last Updated: September 19, 2026 — BDW AI Career Intelligence Engine + Production Security Hardening + DB1 Migration Execution & RLS Lockdown*
