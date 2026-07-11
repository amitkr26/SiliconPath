# 12 - Security

## Principles
- Least privilege. Public read only for verified/active content. All writes via service role or user-scoped RLS.
- Server-only secrets. No secret carries a `NEXT_PUBLIC_` prefix.

## Controls (must stay in place)
1. **Admin auth** on every write endpoint (`verifyAdmin`): `/api/scrape-sources` POST/PUT/DELETE, `/api/opportunities` POST, admin analytics. Backend `/scrape/*` requires `SCRAPER_SECRET`.
2. **Field whitelisting** on `PATCH /api/profile/[userId]` (13-field allowlist). Never spread request body into an update.
3. **Input sanitization** on search: strip PostgREST metacharacters `{}(),."\[]`, cap length 100. Prevents `.or()`/`.ilike()` filter injection.
4. **SSRF guard** on new scrape source URLs: reject localhost, 127.0.0.1, 0.0.0.0, 169.254.169.254, metadata.google.internal, and private ranges (10./192.168./172.16-31.).
5. **Safe AI parsing**: never bare `JSON.parse()` on model output; use tolerant parser with fallback (`lib/ai/safe-parse.ts`).
6. **Durable rate limiting**: Upstash Redis in production (in-memory is a no-op on serverless).
7. **RLS** enabled on all tables.
8. **TLS** everywhere (Vercel, Supabase, Neon).
9. **Analytics privacy**: store `ip_hash`, never raw IPs.

## Threats covered
- XSS: React escaping; avoid `dangerouslySetInnerHTML` except vetted JSON-LD.
- CSRF: same-site cookies; state-changing routes require auth + method checks.
- SQL/filter injection: parameterized Supabase queries + search sanitization.
- Mass assignment: field allowlists.
- SSRF: URL validation on scrape sources.

## Secret rotation
Rotate on any exposure: `ADMIN_PASSWORD`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_2_SERVICE_ROLE_KEY`, `NEON_DATABASE_URL`, all AI provider keys, `CRON_SECRET`, `SCRAPER_SECRET`, `VERCEL_TOKEN`. Never paste live secrets into chats, issues, or logs.

## Disclosure
Security issues by email to maintainers, not public GitHub issues.
