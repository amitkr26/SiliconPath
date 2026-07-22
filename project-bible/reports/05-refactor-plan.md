# Repository Refactor Plan

## 1. Current Structure

```
BerojgarDegreeWala/
├── .github/workflows/
│   ├── ci.yml
│   └── ci-berojgardegreewala.yml
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── scrapers/
│   │   │   ├── adapters/      (7 adapters)
│   │   │   ├── source-config.ts (500+ sources)
│   │   │   └── orchestrator.ts
│   │   ├── cron/
│   │   ├── lib/
│   │   └── __tests__/
│   ├── Dockerfile
│   ├── render.yaml
│   └── package.json
├── berojgardegreewala/
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/           (37 route groups)
│   │   │   └── (pages)        (38 page routes)
│   │   ├── components/        (29 components)
│   │   ├── lib/
│   │   │   ├── ai/            (8 files)
│   │   │   ├── scrapers/      (22 files - frontend scrapers)
│   │   │   ├── supabase/
│   │   │   ├── db/
│   │   │   ├── academy/
│   │   │   ├── resume/
│   │   │   └── storage/
│   │   ├── config/scrapers/   (2 JSON files)
│   │   ├── types/
│   │   ├── data/
│   │   └── __tests__/         (4 test files)
│   ├── supabase/
│   │   ├── migrations/        (21 files)
│   │   └── seed/              (4 files)
│   └── scripts/               (16 utility scripts)
├── neon/
│   └── schema.sql
└── project-bible/             (44 files)
```

## 2. Proposed Structure

```
BerojgarDegreeWala/
├── .github/workflows/
│   ├── ci.yml
│   └── ci-backend.yml         ← NEW: separate backend CI
├── apps/
│   ├── web/                   ← RENAMED from berojgardegreewala/
│   │   ├── src/
│   │   │   ├── app/           (pages + API routes)
│   │   │   ├── components/    (UI components only)
│   │   │   ├── lib/
│   │   │   │   ├── ai/        (AI Gateway - shared source of truth)
│   │   │   │   ├── supabase/
│   │   │   │   ├── db/
│   │   │   │   └── academy/
│   │   │   ├── types/
│   │   │   └── __tests__/
│   │   ├── supabase/
│   │   │   ├── migrations/
│   │   │   └── seed/
│   │   └── package.json
│   │
│   └── api/                   ← RENAMED from backend/
│       ├── src/
│       │   ├── routes/
│       │   ├── scrapers/
│       │   │   ├── adapters/
│       │   │   ├── source-config.ts
│       │   │   └── orchestrator.ts
│       │   ├── cron/
│       │   ├── lib/
│       │   │   ├── ai/        ← Same AI Gateway pattern as web
│       │   │   └── db/
│       │   └── __tests__/
│       ├── Dockerfile
│       ├── render.yaml
│       └── package.json
│
├── packages/                  ← NEW: shared packages
│   ├── ai-gateway/            ← NEW: shared AI Gateway
│   │   ├── src/
│   │   │   ├── providers.ts
│   │   │   ├── gateway.ts
│   │   │   ├── safe-parse.ts
│   │   │   └── types.ts
│   │   └── package.json
│   │
│   ├── config/               ← NEW: shared scraper configs
│   │   ├── source-config.ts   (single source of truth)
│   │   ├── companies.ts
│   │   └── institutions.ts
│   │   └── package.json
│   │
│   ├── database/             ← NEW: shared DB schemas + types
│   │   ├── db1-schema.sql
│   │   ├── db2-schema.sql
│   │   ├── neon1-schema.sql
│   │   ├── neon2-schema.sql
│   │   └── package.json
│   │
│   └── types/               ← NEW: shared TypeScript types
│       ├── opportunity.ts
│       ├── academy.ts
│       ├── user.ts
│       └── package.json
│
├── neon/
│   └── schema.sql
│
├── scripts/                  ← CONSOLIDATED utility scripts
│   ├── db/
│   ├── scrape/
│   └── dev/
│
├── turbo.json                ← NEW: Turborepo config
├── package.json              ← NEW: root package.json with workspaces
│
└── project-bible/            (44 files, unchanged)
```

## 3. Files to Move

| Source | Destination | Reason |
|--------|-------------|--------|
| `berojgardegreewala/src/lib/ai/providers.ts` | `packages/ai-gateway/src/providers.ts` | Shared AI Gateway |
| `berojgardegreewala/src/lib/ai/safe-parse.ts` | `packages/ai-gateway/src/safe-parse.ts` | Shared utility |
| `berojgardegreewala/src/lib/scrapers/` (India scrapers) | `apps/api/src/scrapers/adapters/` | Consolidate all scrapers in backend |
| `berojgardegreewala/src/config/scrapers/` | `packages/config/` | Single source of truth |
| `backend/src/lib/ai-providers.ts` | `apps/api/src/lib/ai/providers.ts` (or import from package) | Use shared AI Gateway |
| `berojgardegreewala/supabase/migrations/` | `packages/database/migrations/` | Centralized migrations |
| `berojgardegreewala/supabase/seed/` | `packages/database/seed/` | Centralized seeds |
| `neon/schema.sql` | `packages/database/neon1-schema.sql` | Database package |

## 4. Files to Delete

| File | Reason |
|------|--------|
| `backend/src/lib/ai-providers.ts` | Superseded by shared AI Gateway package |
| `berojgardegreewala/src/config/scrapers/companies.json` | Superseded by config package |
| `berojgardegreewala/src/config/scrapers/institutions.json` | Superseded by config package |
| `berojgardegreewala/public/next.svg` | Default Next.js logo, unused |
| `berojgardegreewala/public/vercel.svg` | Default Vercel logo, unused |
| `berojgardegreewala/public/auth-sync.html` | Purpose unclear, likely legacy |
| `berojgardegreewala/skills-lock.json` | AI agent config, not needed in repo |
| `berojgardegreewala/supabase/migrations/20260710_000_reset_core.sql` | Destructive reset migration, dangerous |
| `berojgardegreewala/supabase/migrations/20260710_001_reset_social.sql` | Destructive reset migration, dangerous |
| `berojgardegreewala/scripts/wipe_data.js` (or migrate to `scripts/db/`) | Destructive, should not be accidentally run |

## 5. Files to Merge

| Files | Merge Into | Reason |
|-------|-----------|--------|
| `backend/src/scrapers/source-config.ts` + `berojgardegreewala/src/config/scrapers/*.json` | `packages/config/source-config.ts` | Single source of truth for 500+ sources |
| `berojgardegreewala/src/lib/ai/providers.ts` + `backend/src/lib/ai-providers.ts` | `packages/ai-gateway/src/` | Single AI Gateway |
| Frontend scrapers + backend scrapers | `apps/api/src/scrapers/` | Consolidate all scraping in backend |
| Multiple migration naming conventions | Standardized format | Consistent migration ordering |

## 6. Files to Split

| File | Split Into | Reason |
|------|-----------|--------|
| `berojgardegreewala/src/lib/utils.ts` | Multiple domain-specific utils | Monolithic utils file with unrelated functions |
| `berojgardegreewala/src/types/index.ts` | `packages/types/*.ts` | All 28+ interfaces in one file |
| `berojgardegreewala/src/lib/ai/providers.ts` | Gateway + providers + types | Separate concerns |
| `backend/src/scrapers/source-config.ts` | `packages/config/*` | 500+ sources in one file is unwieldy |
| `berojgardegreewala/src/app/api/` | By domain module | Currently flat, should be domain-organized |

## 7. Files to Rewrite

| File | Reason |
|------|--------|
| `backend/src/routes/scrape-trigger.ts` | Auth middleware is inline, should use middleware pattern |
| `backend/src/index.ts` | Rate limiter and error handler inline, should use middleware files |
| `berojgardegreewala/src/lib/scrapers/opportunity-scraper-impl.ts` | Should be migrated to backend |
| Multiple migration files with column drift fixes | Need consistent naming and column documentation |
| `backend/src/lib/ai-providers.ts` | Should use shared AI Gateway package |

## 8. Migration Order

| Phase | Order | Description | Estimated Effort |
|-------|-------|-------------|-----------------|
| P0-P1 | 1 | Create monorepo structure (package.json workspaces, turbo.json) | 2 days |
| P0-P2 | 2 | Extract `packages/types/` from `berojgardegreewala/src/types/index.ts` | 1 day |
| P0-P3 | 3 | Extract `packages/database/` with standardized migrations | 2 days |
| P1-P1 | 4 | Create `packages/ai-gateway/` with unified provider interface | 3 days |
| P1-P2 | 5 | Migrate frontend to use shared AI Gateway package | 2 days |
| P1-P3 | 6 | Migrate backend to use shared AI Gateway package | 1 day |
| P1-P4 | 7 | Delete `backend/src/lib/ai-providers.ts` | 0.5 day |
| P2-P1 | 8 | Create `packages/config/` with consolidated source configs | 2 days |
| P2-P2 | 9 | Migrate India scrapers from frontend to backend | 3 days |
| P2-P3 | 10 | Delete frontend scraper files and config | 0.5 day |
| P3-P1 | 11 | Rename `berojgardegreewala/` to `apps/web/` | 1 day |
| P3-P2 | 12 | Rename `backend/` to `apps/api/` | 0.5 day |
| P3-P3 | 13 | Extract middleware from backend inline code to files | 1 day |
| P3-P4 | 14 | Split `utils.ts` into domain modules | 1 day |
| P4-P1 | 15 | Add ESLint to backend | 0.5 day |
| P4-P2 | 16 | Standardize migration naming conventions | 1 day |
| P4-P3 | 17 | Add comprehensive tests (see roadmap) | 5 days |
| P5-P1 | 18 | Clean up dead files | 0.5 day |
| P5-P2 | 19 | Remove destructive reset migrations | 0.5 day |
| P5-P3 | 20 | Verify all secrets rotated | 1 day |

## 9. Estimated Effort

| Category | Days |
|----------|------|
| Monorepo setup | 2 |
| Package extraction (types, database, config, ai-gateway) | 8 |
| Scraper consolidation | 4 |
| Renaming and restructuring | 3 |
| Middleware extraction | 1 |
| Code quality (lint, migrations, cleanup) | 3 |
| Testing | 5 |
| **Total** | **~26 days** |

## 10. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Breaking changes during monorepo migration | MEDIUM | HIGH | Feature flags to toggle old/new code paths |
| AI Gateway change breaks both frontend and backend | LOW | CRITICAL | Comprehensive type contracts + tests |
| Scraper migration drops India sources | MEDIUM | HIGH | Run both systems in parallel during migration |
| Column drift fix breaks existing queries | LOW | HIGH | Read live DB schema first |
| Migration reordering causes conflicts | MEDIUM | MEDIUM | Timestamp-based naming convention |
| Secrets rotation breaks production | MEDIUM | CRITICAL | Rotate one key at a time, verify each |
| Monorepo tooling adds complexity | LOW | MEDIUM | Keep it simple — workspaces only, no Turborepo initially |
