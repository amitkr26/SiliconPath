# User Dashboard & Auth — Summary

## Files Created

| File | Purpose |
|------|---------|
| `supabase/migrations/20260630000001_user_profiles.sql` | Migration: user_profiles, saved_opportunities, applications, user_alerts tables + RLS + auto-profile trigger |
| `src/lib/supabase/client.ts` | Browser-side Supabase client (using @supabase/ssr) |
| `src/lib/supabase/server.ts` | Server-side Supabase client (using @supabase/ssr + cookies) |
| `src/middleware.ts` | Session refresh middleware (runs on all routes except static assets) |
| `src/app/login/page.tsx` | Login page — email/password form + Google OAuth button |
| `src/app/signup/page.tsx` | Signup page — full name, email, password + Google OAuth; shows confirmation screen after signup |
| `src/app/auth/callback/route.ts` | OAuth callback handler — exchanges code for session, redirects to /dashboard |
| `src/app/api/auth/signout/route.ts` | POST signout — calls supabase.auth.signOut(), redirects to / |
| `src/app/dashboard/page.tsx` | Protected dashboard — 4 stat cards, application tracker, resume score (circular), upcoming deadlines |
| `src/app/profile/page.tsx` | Profile form — full name, qualification, specialization, NET/GATE, preferred location |
| `src/app/api/applications/route.ts` | REST API for applications — GET (list), PATCH (status), DELETE |
| `AUTH_SETUP.md` | Manual setup guide for Supabase Email + Google OAuth |

## Files Modified

| File | Change |
|------|--------|
| `src/components/Navbar.tsx` | Auth-aware nav: Login/Signup buttons when logged out; user avatar dropdown (Dashboard, Profile, Sign Out) when logged in; Admin button preserved |
| `src/components/OpportunityCard.tsx` | Bookmark uses `saved_opportunities` table when logged in, falls back to localStorage when anonymous; shows toast for anonymous users |
| `src/components/ApplyButton.tsx` | After tracking click, inserts row into `applications` table if logged in (deduped — won't insert duplicate) |
| `src/app/match/page.tsx` | On load, fetches `user_profiles` and pre-fills qualification, specialization, NET/GATE, location if user is logged in |

## Auth Flow

```
Signup → email confirmation → Login → /dashboard
                                    → Browse opportunities
                                    → Bookmark → saved_opportunities table
                                    → Apply Now → applications table
                                    → Profile → user_profiles upsert
                                    → Sign Out → session cleared
```

## Key Design Decisions

- **Admin stays separate** — Admin auth uses `NEXT_PUBLIC_ADMIN_PASSWORD` env var, not Supabase Auth.
- **Bookmarks dual-path** — Anonymous users continue using localStorage. Logged-in users use `saved_opportunities` table.
- **ApplyNow dedup** — Checks for existing user+opportunity pair before inserting.
- **Auto-profile creation** — `handle_new_user()` trigger runs on `auth.users` INSERT.
- **RLS on all tables** — Row Level Security ensures users can only see/edit their own data.

## Build Status

`npm run build` passes clean — 0 TypeScript errors, 223 static pages, 94+ routes.
`npm test` — 31/31 tests passing.

## Next Steps

1. Enable Google OAuth in Supabase dashboard following `AUTH_SETUP.md`
2. Set remaining Vercel env vars (Neon DB URLs, Cloudflare Account ID, Sentry DSN)
