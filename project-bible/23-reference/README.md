# Reference Documentation

## Overview

Reference documents for the BerojgarDegreeWala platform. Files describing
superseded or aspirational state are annotated inline as historical/aspirational.
The canonical environment variable reference is `frontend/.env.example`.

## Document Index

| Document | Status | Purpose |
|----------|--------|---------|
| `berojgardegreewala-master-specification.md` | HISTORICAL (pre-2026-08-16) | Original full spec — superseded by `docs/audit-reports/2026-08-16-implementation-map.md` and `project-bible/CHANGELOG.md` |
| `CONTENT_UPGRADE_PLAN.md` | MOSTLY RESOLVED (2026-08-16 Phase 1.x) | Content/opportunity-data upgrade plan — see CHANGELOG 2026-08-16/17 entries |
| `berojgardegreewala-expanded-global-source-list-v3.md` | ASPIRATIONAL | 400+ source registry, not wired to the scraper; verify each URL before use |
| `berojgardegreewala-expanded-global-source-list-v4.md` | ASPIRATIONAL | 460+ source registry, not wired to the scraper; verify each URL before use |
| `trusted_sources_v2.json` | ASPIRATIONAL | Source registry (data reference) |
| `trusted_sources_v3.json` | ASPIRATIONAL | Source registry (data reference) |

## Key Facts

- **Monorepo**: https://github.com/amitkr26/BerojgarDegreeWala
- **Frontend URL**: `https://berojgardegreewala.vercel.app` (production, Vercel git integration)
- **Backend**: `backend/server` is not deployed; self-host via Docker if needed
- **Primary Database**: Supabase DB1
- **Secondary Database**: Supabase DB2 (social layer)
- **Analytics Databases**: Neon (2 databases)
- **Email Provider**: Resend

## Quick Commands

```bash
# Development (npm workspaces: frontend, backend/api, backend/ai-gateway, backend/server)
npm run dev              # all workspaces
npm run dev --workspace=frontend   # Next.js dev server (localhost:3000)
npm run typecheck        # TypeScript type checking
npm run lint             # ESLint
npm test                 # Jest tests
npm run build            # Production build

# Backend API image (build from repo root)
docker build -f backend/server/Dockerfile -t bdw-api .
```

## Related Documents

- [DevOps](../14-devops/README.md) — deployment architecture
- [Operations](../16-operations/README.md) — monitoring and runbooks
- [Security](../13-security/README.md) — security architecture