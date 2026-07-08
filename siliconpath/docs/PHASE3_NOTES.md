# Phase 3 — Accounts, Profile, Resume (notes)

## What this phase implements
- **Auth**: Supabase email/password + Google OAuth. Session refreshed in middleware.
- **Progressive disclosure**: middleware does NOT gate routes. Anonymous users keep
  full aggregator access; signed-in users get the dashboard + profile + resume.
  No owner-only restriction, no waiting period (per spec §2 / guardrail #10).
- **Single source of truth**: `user_profiles` holds canonical structured fields
  (education/experience/skills/projects/publications as jsonb). The profile editor
  and the resume builder are two SURFACES over these same columns — there is no
  separate resume table and no sync job. The PDF is a generated output (print-to-PDF
  now; a server-rendered template can replace it later without changing the model).
- **RLS**: users can read/write only their own profile row; a signup trigger seeds it.

## Deliberately deferred (not faked)
- Feed, connections, messaging, endorsements (Tier 2 social) — next PR.
- Company "claim this page" + employer job posting — next PR.
- PDF-upload resume parsing (OCR) — writes into the same canonical fields when added.
- Full education/experience array editors — this PR ships the scalar + skills editor;
  the array editors are additive over the same fields.

## NOT VERIFIED (guardrail #1)
No build, no DB apply, no real auth round-trip has been run. In particular verify:
1. `db/schema_users.sql` applies cleanly and the signup trigger fires.
2. Google OAuth redirect URIs are configured in Supabase + Google Cloud console.
3. RLS actually blocks cross-user reads (test with two accounts).
4. `@supabase/ssr` cookie handling works in Next 14 server components + middleware.
Do not mark Phase 3 done until all four are checked live.
