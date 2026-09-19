# BerojgarDegreeWala — AI Agent Instructions & Context

This repository is **BerojgarDegreeWala**, India's premier career intelligence and research opportunity network for Deep-Tech Hardware (Semiconductors, VLSI, Space & Defence Electronics, National Research Labs, and Premier Academia).

For the exhaustive system architecture, data models, scraper pipelines, security protocols, and operational blueprints, consult the master document:
👉 **[AI_AGENT_MASTER_GUIDE.md](./AI_AGENT_MASTER_GUIDE.md)**

---

## Quick Orientation for AI Agents

### 1. Monorepo Structure
- `frontend/`: Next.js 14 App Router, TypeScript, Tailwind CSS.
- `backend/api/`: Shared domain logic (`@berojgardegreewala/api`).
- `backend/ai-gateway/`: Multi-provider resilient LLM router (`@berojgardegreewala/ai-gateway`) — 10 providers including BDW.
- `backend/server/`: Standalone Express API replica.
- `backend/worker/`: Automated scrapers (ISRO, DRDO, CSIR, Workday ATS, Greenhouse).
- `project-bible/`: Architectural standards (`ARCHITECTURE.md`, `PRODUCT.md`, `SECURITY.md`, `CHANGELOG.md`).

### 2. Core Architectural Rules
1. **Strict 1 Header / 1 Footer Rule**: Only [frontend/src/components/Navbar.tsx](frontend/src/components/Navbar.tsx) and [frontend/src/components/Footer.tsx](frontend/src/components/Footer.tsx) may render header/footer elements. Never render secondary navbars or footers in page components.
2. **Design Tokens**: Standard background `#F8FAFC`, dark slate text `#0F172A`, emerald badges for verified opportunities, purple pills for featured tags.
3. **No Stock Imagery**: Zero Unsplash / placeholder images. Use local production assets in `frontend/public/images/` or SVG monogram fallbacks via `ImageWithFallback.tsx`.
4. **Evidence-Gated Verification**: Never assign `organization_id` without domain or cryptographic proof via [frontend/src/lib/organizations/resolve.ts](frontend/src/lib/organizations/resolve.ts).
5. **BDW AI Tools are server-only**: Tool execution logic lives in `frontend/src/lib/ai/bdw-tools-exec.ts` (server-only). Never import tool execution into client components.
6. **Production DB1 migrations are APPLIED** (ledger = 13 records, incl. `20260918000001` RLS lockdown and `20260918000003` dedup). Do not re-run migrations ad hoc; schema changes go through new sequential migration files applied via the Supabase Management API (`SUPABASE_MGMT_TOKEN` + `SUPABASE_PROJECT_REF`, `POST /v1/projects/{ref}/database/query`). RLS exposure of internal tables is a zero-tolerance regression — verify with anonymous `HEAD` probes + `Prefer: count=exact`.
7. **Quality Gates**:
   - Run `npx tsc --noEmit` in `frontend/` before completing any work (0 errors tolerance).
   - Run `npm test` in `frontend/` (34 suites / 361 tests) **and** `npm test` in `backend/worker` (31/31) **and** `npm test` in `backend/api` (8 suites / 100 tests).
   - Document notable changes in `project-bible/CHANGELOG.md`.

### 3. Security Rules for AI Agents
- **Never hardcode credentials, API keys, or tokens** in source code.
- **Never commit `.env*` files** — they are gitignored.
- **Never store secrets in documentation** — reference environment variable names only.
- **SQL ILIKE queries** must escape `%`, `_`, and `\` via `escapeILIKE()` from `bdw-rag.ts`.
- **User input** must be sanitized via `sanitizeUserMessage()` (4000-char max) before injection into prompts.
- **Tool names** must be validated against `VALID_BDW_TOOLS` whitelist before execution.
