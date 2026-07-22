# Code Quality Standards

## TypeScript

- Strict mode enabled in `tsconfig.json`
- Prefer explicit return types on all exported functions
- Use `interface` for object shapes, `type` for unions/intersections
- Avoid `any` — prefer `unknown` with type guards
- Use `as const` for literal types
- Brand types for discriminated unions where appropriate

## React

- Use Server Components by default; convert to Client Components only when interactivity is needed
- All data-fetching components must handle: loading, error, empty, populated states
- Use `useCallback` and `useMemo` judiciously — measure before optimizing
- Prefer composition over prop drilling
- Use React's built-in state before reaching for external state management

## Error Handling

- All API routes wrap logic in try/catch
- Use the centralized `apiError()` helper for consistent error responses
- Never expose `error.message` to users in production
- Client-side: use error boundaries at route group boundaries
- Network requests: handle network failures gracefully with retry/fallback

## Security

- All user input must be validated with Zod schemas before use
- Search input must be sanitized (strip PostgREST metacharacters)
- API routes must use `verifyAdmin()` for admin operations
- Profile updates must use field allowlists (never spread request body)
- Scrape source URLs must be validated against SSRF attacks
- AI model output must use tolerant JSON parser, never bare `JSON.parse`

## Testing

- Unit tests for utility functions and pure logic
- Component tests for interactive components
- API route tests for non-trivial routes
- Tests must be deterministic (no network calls in unit tests)
- Run `npm test` before committing

## Accessibility

- Semantic HTML elements (`<nav>`, `<main>`, `<article>`, etc.)
- All images must have `alt` text
- Color contrast must meet WCAG AA (4.5:1 for normal text, 3:1 for large)
- All interactive elements must be keyboard-navigable
- Focus-visible rings on all interactive elements
- Touch targets must be at least 44×44px on coarse pointers

## Performance

- Use Next.js Image component for optimized images
- Implement ISR (Incremental Static Regeneration) for public pages
- Use streaming server components for data-heavy pages
- Batch database queries where possible
- Avoid large client-side bundles — use dynamic imports for heavy components
