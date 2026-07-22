# Frontend Architecture

## Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v3
- **UI Library**: Lucide React (icons), Sonner (toasts)
- **State**: React built-in (useState, useEffect, useCallback)
- **Auth**: @supabase/ssr (cookie-based SSR auth)
- **Data Fetching**: Server Components + client fetch
- **Testing**: Jest + @testing-library/react

## Architecture

### Server Components (Default)
Public pages (opportunities, academy, news, organizations, resources) use Server Components with ISR (Incremental Static Regeneration). Data is fetched server-side and passed to client components for interactivity.

### Client Components (When Needed)
Pages that require interactivity (filters, search, bookmarks, networking) use Client Components. The strategy is: keep the server component shell, delegate interactivity to isolated client sub-components.

### Route Structure
- Public routes: `/opportunities`, `/academy`, `/news`, `/organizations`, `/resources`
- Auth routes: `/login`, `/signup`, `/auth/callback`, `/onboarding`
- Protected routes: `/feed`, `/network`, `/messages`, `/notifications`, `/profile`, `/dashboard`
- Admin routes: `/admin/*`
- API routes: `/api/*` (74 handlers)

### Data Flow
1. Server Component fetches initial data from Supabase
2. Client Component hydrates with initial data
3. Filter/search changes trigger client-side API calls to `/api/*`
4. API routes use `supabaseAdmin` (service role) for DB queries
5. Auth state is managed via Supabase SSR cookies

### Middleware
`middleware.ts` gates Tier 2 paths (feed, network, messages, companies, people) behind authentication. Unauthenticated users are redirected to `/login?redirectTo=...`.

## Key Patterns

### Error Boundaries
Route groups have error boundaries at the boundary level:
- `/academy/error.tsx`
- `/admin/error.tsx`
- `/profile/error.tsx`
- Root `/error.tsx`

### Loading States
Skeleton loaders for list pages, spinners with timeouts for individual operations.

### SEO
- Dynamic sitemap generation at `/sitemap.ts`
- `robots.ts` disallows `/admin` and `/api/`
- JSON-LD structured data on opportunity pages
- Canonical URLs on list pages

## Performance Considerations

- ISR with 5-minute revalidation on public list pages
- Streaming for data-heavy pages
- Optimized images via `next/image`
- Code splitting via dynamic imports for heavy components (AI panels, resume builder)

## Related Documents

- [component-architecture.md](./component-architecture.md)
- [middleware-auth.md](./middleware-auth.md)
- [data-fetching.md](./data-fetching.md)
- [routing.md](./routing.md)
