# Security Architecture

## Overview

BerojgarDegreeWala follows a defense-in-depth approach with multiple layers of security controls: network-level (TLS, CORS), application-level (auth, validation, sanitization), and database-level (RLS, service roles).

## Authentication

- **Provider**: Supabase Auth on DB1
- **Methods**: Email/password, Google OAuth, GitHub OAuth
- **Session management**: SSR cookies via `@supabase/ssr` in middleware
- **Admin auth**: Server-only `ADMIN_PASSWORD` via `verifyAdmin()` — uses header or Bearer token
- **Cron auth**: `CRON_SECRET` Bearer token for Vercel cron endpoints

## Authorization

- **Public**: Unauthenticated access to opportunities, academy, news, organizations, resources
- **User**: Supabase session required for feed, network, messages, notifications, profile, resume
- **Admin**: `verifyAdmin()` required for write operations, scraper management, analytics
- **Service role**: `supabaseAdmin` client bypasses RLS for server-side operations

## Row-Level Security

RLS is enabled on all tables. Policies enforce:
- **Public tables** (opportunities, organizations, news): Public SELECT on active/verified rows only; writes via service role
- **User tables** (profiles, connections, messages): `auth.uid()` scoped
- **Admin tables** (scrape_sources, ai_usage_log): Admin-only access

## Input Validation

All write operations validate input with Zod schemas in `src/lib/validation.ts`:
- `opportunitySchema`: 12 fields with types, lengths, URLs
- `profileUpdateSchema`: 13-field allowlist
- `messageSchema`, `feedPostSchema`, `subscribeSchema`, etc.

## Sanitization

- **Search input**: Strip `{}(),."\[]` metacharacters, cap at 100 characters
- **URLs**: Validate for SSRF (reject localhost, private ranges, metadata endpoints)
- **AI output**: Use tolerant JSON parser, never bare `JSON.parse()`

## Rate Limiting

- **Production**: Upstash Redis-based sliding window rate limiter
- **Development**: In-memory Map fallback
- **Backend**: Token-bucket limiter (120 req/min per IP)
- **Key endpoints**: Subscribe, scrape triggers, AI endpoints are rate-limited

## Secrets Management

- All secrets in `.env.local` (gitignored)
- Centralized in `SECRETS.md` (gitignored master document)
- Rotation required on exposure: `ADMIN_PASSWORD`, `SUPABASE_SERVICE_ROLE_KEY`, all AI provider keys, `CRON_SECRET`, `SCRAPER_SECRET`, `VERCEL_TOKEN`
- No secret carries a `NEXT_PUBLIC_` prefix

## Threat Model (STRIDE)

| Threat | Mitigation |
|--------|-----------|
| **S**poofing | Supabase Auth, session cookies, admin password |
| **T**ampering | Zod validation, field allowlists, RLS |
| **R**epudiation | Structured audit logging |
| **I**nformation Disclosure | RLS, server-only secrets, no error.message in prod |
| **D**enial of Service | Rate limiting (Upstash), CORS, input capping |
| **E**levation of Privilege | verifyAdmin(), RLS policies, scoped API keys |

## Related Documents

- [threat-model.md](./threat-model.md) — Detailed threat analysis
- [owasp-controls.md](./owasp-controls.md) — OWASP Top 10 controls
- [secrets-management.md](./secrets-management.md) — Secrets rotation
- [audit-logging.md](./audit-logging.md) — Audit trail
