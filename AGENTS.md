# BerojgarDegreeWala — AI Agent Instructions & Context

This repository is **BerojgarDegreeWala**, India's premier career intelligence and research opportunity network for Deep-Tech Hardware (Semiconductors, VLSI, Space & Defence Electronics, National Research Labs, and Premier Academia).

For the exhaustive system architecture, data models, scraper pipelines, security protocols, and operational blueprints, consult the master document:
👉 **[AI_AGENT_MASTER_GUIDE.md](./AI_AGENT_MASTER_GUIDE.md)**

---

## Quick Orientation for AI Agents

### 1. Monorepo Structure
- `frontend/`: Next.js 14 App Router, TypeScript, Tailwind CSS.
- `backend/api/`: Shared domain logic (`@berojgardegreewala/api`).
- `backend/ai-gateway/`: Multi-provider resilient LLM router (`@berojgardegreewala/ai-gateway`).
- `backend/worker/`: Automated scrapers (ISRO, DRDO, CSIR, Workday ATS, Greenhouse).
- `project-bible/`: Architectural standards (`ARCHITECTURE.md`, `PRODUCT.md`, `SECURITY.md`, `CHANGELOG.md`).

### 2. Core Architectural Rules
1. **Strict 1 Header / 1 Footer Rule**: Only [frontend/src/components/Navbar.tsx](frontend/src/components/Navbar.tsx) and [frontend/src/components/Footer.tsx](frontend/src/components/Footer.tsx) may render header/footer elements. Never render secondary navbars or footers in page components.
2. **Design Tokens**: Standard background `#F8FAFC`, dark slate text `#0F172A`, emerald badges for verified opportunities, purple pills for featured tags.
3. **No Stock Imagery**: Zero Unsplash / placeholder images. Use local production assets in `frontend/public/images/` or SVG monogram fallbacks via `ImageWithFallback.tsx`.
4. **Evidence-Gated Verification**: Never assign `organization_id` without domain or cryptographic proof via [frontend/src/lib/organizations/resolve.ts](frontend/src/lib/organizations/resolve.ts).
5. **Quality Gates**:
   - Run `npx tsc --noEmit` in `frontend/` before completing any work (0 errors tolerance).
   - Run `npm test` in `frontend/` (all 26 test suites must pass).
   - Document notable changes in `project-bible/CHANGELOG.md`.
