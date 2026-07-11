# 11 — Authentication

## Provider
Supabase Auth on **DB1** (`NEXT_PUBLIC_SUPABASE_URL`). Email/password + Google OAuth.
SSR via `@supabase/ssr` in `middleware.ts` and `lib/supabase/server.ts`.

## Roles
- **Guest** — no session. Full aggregator + academy.
- **Seeker** — `user_profiles.account_type='seeker'`.
- **Provider** — `account_type='provider'` + a `company_profiles` row.
- **Admin** — not a Supabase role; gated by server-only `ADMIN_PASSWORD` via `verifyAdmin()`.

## Sign-up flow
1. `/signup` step 1: choose seeker/provider (stored in `auth.signUp` metadata `account_type`).
2. Email confirm → `/auth/callback?next=/onboarding`.
3. `/onboarding` upserts `user_profiles`; provider also inserts `company_profiles`.
4. Redirect: provider → `/dashboard`, seeker → `/feed`.

## Trigger
`handle_new_user()` on `auth.users` inserts a `user_profiles` row (id, display_name, email,
username). Keep it in sync with the v2 column set when altering the table.

## Gated paths
`middleware.ts` redirects unauthenticated users away from: `/api/feed`, `/api/network`,
`/api/companies`, `/api/messages`, `/api/notifications`, `/api/people`, and the matching pages.

## Rules
- Never expose secrets with `NEXT_PUBLIC_`. `ADMIN_PASSWORD`, `CRON_SECRET`, service keys are
  server-only.
- Never gate the aggregator or academy behind auth.
