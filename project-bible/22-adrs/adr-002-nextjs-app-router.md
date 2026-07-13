# ADR-002: Next.js App Router for Frontend

**Status**: Accepted
**Date**: 2024-01-15
**Author**: Architecture Board

## Context

The frontend needs to serve both public content (opportunities, academy) and interactive social features (feed, messages, networking). SEO is critical for the public pages. The team needed to choose between Next.js Pages Router, Next.js App Router, or a different framework entirely (Remix, SvelteKit, etc.).

## Decision

Use Next.js 14 App Router with:

- **Server Components** for all public pages (opportunities, academy, news, organizations, resources)
- **Client Components** scoped to interactive islands (filters, search, forms)
- **API Routes** co-located with the frontend (monolith deployment on Vercel)
- **ISR** with 5-minute revalidation for public pages

## Alternatives Considered

1. **Next.js Pages Router**: More mature but RSC + streaming are future-proof
2. **Remix**: Better data loading but smaller ecosystem
3. **SvelteKit**: Better performance but smaller community and library support
4. **Vite + React Router**: More flexible but no built-in SSR/SEO

## Consequences

**Positive:**
- Excellent SEO (Server Components render full HTML)
- Co-located API routes (single Vercel deployment)
- ISR provides good performance without full SSG rebuild
- Future-proof (RSC is the direction of React)

**Negative:**
- App Router is relatively new (API stability concerns)
- Server Components limit state management options
- Some patterns are not well-documented yet

**Reversal cost**: Moderate (migrating to Pages Router or another framework would require significant refactoring)
