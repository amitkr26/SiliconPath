# File Conventions

## Naming

| Entity | Convention | Example |
|--------|-----------|---------|
| React components | PascalCase | `OpportunityCard.tsx` |
| Pages | kebab-case | `opportunities/[slug]/page.tsx` |
| API routes | kebab-case | `scrape-sources/route.ts` |
| Utility functions | camelCase | `mapDbOpportunityToClient` |
| Types/Interfaces | PascalCase | `ScrapedOpportunity` |
| Database tables | snake_case | `user_profiles` |
| Migration files | timestamp_description | `20260704000001_db1_core_schema.sql` |
| Documentation | kebab-case | `ai-gateway.md` |
| Configuration | kebab-case | `tailwind.config.ts` |

## Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (route-group)/      # Route groups for layout separation
│   ├── api/                # API route handlers
│   │   └── resource/
│   │       └── route.ts    # Single route handler file
│   ├── page.tsx            # Page component
│   ├── layout.tsx          # Layout wrapper
│   ├── loading.tsx         # Loading state
│   └── error.tsx           # Error boundary
├── components/             # Shared React components
│   ├── domain/             # Domain-specific (e.g. academy/, profile/)
│   └── shared/             # Generic components (e.g. ComingSoon.tsx)
├── lib/                    # Utility libraries
│   ├── domain/             # Domain-specific lib (e.g. academy/, ai/, scrapers/)
│   └── *.ts                # Top-level utilities
└── types/
    └── index.ts            # All shared TypeScript types
```

## File Size

- Components: prefer single file, max ~400 lines
- Pages: keep thin, delegate logic to components and lib
- Lib modules: max ~300 lines per file; split by concern
- Migration files: one logical change per migration
- Documentation: one concept per document

## Imports

Use `@/` path alias for all internal imports within `berojgardegreewala/`:
```typescript
import { supabaseAdmin } from "@/lib/supabase";
import type { Opportunity } from "@/types";
```

Group imports in order:
1. External packages (react, next, etc.)
2. Internal lib modules
3. Components
4. Types
5. CSS/styles
