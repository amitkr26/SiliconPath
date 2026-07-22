# Dependency Injection Pattern

## Context

BerojgarDegreeWala does not use a DI framework (no NestJS, no tsyringe, no Inversify). All dependency injection is manual through a simple factory pattern.

## Pattern

### Service Modules
Services that depend on Supabase clients follow this pattern:
```typescript
// src/lib/academy/queries.ts
export function createAcademyQueries(supabase: SupabaseClient) {
  return {
    async getTracks() {
      // use supabase here
    },
    async getDays() {
      // use supabase here
    },
  };
}

// Usage:
import { createClient } from '@/lib/supabase/client';
const academyQueries = createAcademyQueries(createClient());
```

### Client Modules
Supabase client creation follows this pattern:
```typescript
// src/lib/supabase/client.ts
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

## Why Not a DI Framework?

1. **Simplicity**: Manual DI is sufficient for this codebase size
2. **Bundle size**: No additional dependencies
3. **Clarity**: Dependencies are explicit in function signatures
4. **Testability**: Easy to mock by passing mock clients

## When to Add a DI Framework

If the codebase grows significantly (100+ service modules, cross-cutting concerns), consider introducing a lightweight DI container. Until then, manual DI is the convention.
