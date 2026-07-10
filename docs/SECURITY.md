# Security & Compliance

## Reporting a vulnerability

If you discover a security vulnerability in SiliconPath, please do **not** open a public GitHub issue. Email the maintainers directly. We aim to acknowledge within 48 hours.

---

## Current posture (v2)

The July 2026 audit identified 9 critical and 7 high-severity issues. The v2 rebuild (`rebuild/v2-platform-overhaul`) resolves the exploitable ones. Status below.

### Resolved

| Severity | Issue | Fix |
|---|---|---|
| 🔴 Critical | Admin API endpoints had zero auth (`/api/scrape-sources`, `/api/opportunities` writes) | All write handlers now call `verifyAdmin()` and return 401 without credentials |
| 🔴 Critical | `NEXT_PUBLIC_ADMIN_PASSWORD` baked into client bundle | Removed. Admin auth uses server-only `ADMIN_PASSWORD` / `CRON_SECRET`. Rotate the old value. |
| 🔴 Critical | Profile/feed update without field whitelist (mass assignment) | `PATCH /api/profile/[userId]` accepts only an explicit allowlist of columns |
| 🔴 Critical | SSRF via arbitrary URL scrape sources | New source URLs are validated; localhost, link-local (`169.254.169.254`), and private ranges are rejected |
| 🟠 High | In-memory rate limiter ineffective on serverless | Replaced with Upstash Redis-backed limiter (in-memory kept only for local dev) |
| 🟠 High | PostgREST filter injection via search | Search input is stripped of `,{}()."\[]` before interpolation |
| 🟠 High | Unsafe `JSON.parse` on AI output caused 500s | `lib/ai/safe-parse.ts` parses tolerantly (fences, partial JSON) with fallback |
| 🟠 High | Backend `/scrape/test/:sourceId` unauthenticated | Now requires `SCRAPER_SECRET` |

### Ongoing / by design

- **Cross-database references** between Project 1 (core) and Project 2 (user) are validated at the application layer, since Supabase cannot enforce cross-project foreign keys.
- **Admin operations** intentionally use the service role and bypass RLS. They are gated behind `verifyAdmin()`.
- **Data in transit** is TLS-encrypted (Vercel, Supabase, Neon).
- **Secrets** live only in platform env vars. `.env.local` is gitignored; only `*.example` files are committed.

---

## RLS summary

- **Project 1 (core):** public read for `verified`/active content; all writes via service role.
- **Project 2 (user):** every table is user-scoped (`auth.uid()`), except public profile reads (`is_profile_public = true`) and public feed/company reads.

---

## Key rotation

The AI fallback chain uses several provider keys. If any is compromised: revoke at the provider, add the new key in Vercel, and the chain falls back automatically. Remove deprecated models promptly (e.g. the old OpenRouter free Llama model that now 404s).
