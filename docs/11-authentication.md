# 11 - Authentication

## Provider
Supabase Auth (on DB1). Email/password + Google OAuth. Sessions via SSR cookies handled by `@supabase/ssr` in `src/lib/supabase/server.ts` and `middleware.ts`.

## Roles
- **Guest** — no session. Full access to aggregator + academy.
- **Seeker** — `user_profiles.account_type = 'seeker'`. Networking, saves, applications, progress sync.
- **Provider** — `account_type = 'provider'`. Post opportunities, company page, talent pool.
- **Admin** — not a Supabase role; gated by server-only `ADMIN_PASSWORD` via `verifyAdmin()`. Admin ops use the service-role client and bypass RLS by design.

## Signup / onboarding flow
1. `/signup` — choose role (seeker/provider). Role + name (+ org name for provider) stored in auth metadata.
2. Email confirm -> `/auth/callback?next=/onboarding`.
3. `/onboarding` — seeker builds `user_profiles`; provider also creates a `company_profiles` row.
4. Redirect: provider -> `/dashboard`, seeker -> `/feed`.

## Middleware gating
`middleware.ts` redirects unauthenticated users away from gated paths (feed, network, messages, notifications, profile, dashboard, companies management) to `/login?redirectTo=...`. Public paths (opportunities, academy, news, organizations, resources, home) are never gated.

## Rules
- Never gate the aggregator or academy behind login.
- Admin secrets are server-only. Never `NEXT_PUBLIC_`.
- Always resolve the current user server-side for write operations; never trust a client-supplied user id.
