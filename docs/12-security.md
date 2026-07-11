# 12 — Security

## Model
- **RLS everywhere.** Public content read-only for anon; writes via service role or user-scoped.
- **Admin auth server-only** (`verifyAdmin()`), on every write/admin endpoint.
- **Field allowlists** on profile + source updates (no mass assignment).
- **Input sanitization** on search (strip PostgREST metachars `{}()".,\`, cap length).
- **SSRF prevention** on new scrape-source URLs (reject localhost, 169.254.169.254, private ranges).
- **Durable rate limiting** (Upstash) — in-memory Maps are a no-op on serverless.
- **Safe AI JSON parsing** — tolerant parser with fallback, never bare JSON.parse.
- **TLS** everywhere (Vercel/Supabase/Neon).

## Checklist (apply to every change)
- [ ] Write endpoints call auth + validation + allowlist.
- [ ] No secret carries `NEXT_PUBLIC_`.
- [ ] User input never interpolated raw into `.or()/.ilike()`.
- [ ] External URL fetches are SSRF-checked.
- [ ] RLS policy exists for any new table.

## Rotate immediately if exposed
`ADMIN_PASSWORD`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_2_SERVICE_ROLE_KEY`,
`NEON_DATABASE_URL`, `SCRAPER_SECRET`, `CRON_SECRET`, all AI provider keys, Vercel token.

## Audit history
July 2026 audit found 9 critical + high issues (unauthed admin endpoints, client-exposed admin
password, mass assignment, SSRF, ineffective rate limiter, filter injection, unsafe JSON.parse).
Most are resolved (see [28-changelog.md](28-changelog.md)); verify before assuming.
