# Security Architecture

## Overview

BerojgarDegreeWala follows a defense-in-depth approach with multiple layers of security controls: network-level (TLS, CORS), application-level (auth, validation, sanitization), and database-level (RLS, service roles).

## Authentication

- **Provider**: Supabase Auth on DB1
- **Methods**: Email/password and Google OAuth only (no GitHub OAuth)
- **Session management**: SSR cookies via `@supabase/ssr` in middleware
- **Admin auth**: `POST /api/admin/auth` exchanges `x-admin-password` for an HMAC
  session token (`sessionId.expiry.sig`, signed with `ADMIN_HMAC_SECRET`, fallback
  `ADMIN_PASSWORD`); `GET /api/admin/auth/session` verifies it. Every
  `/api/admin/*` route enforces auth fail-closed via `requireAdmin` (header or
  Bearer HMAC token)
- **Cron auth**: `CRON_SECRET` Bearer token for Vercel cron endpoints
- **Employer gating**: server-side role check in middleware via
  `EMPLOYER_ONLY_PATHS` (`user_metadata.role` = candidate|employer|admin, with
  `account_type` fallback); admin routes are not session-gated

## Authorization

- **Public**: Unauthenticated access to opportunities, academy, news, organizations, resources
- **User**: Supabase session required for feed, network, messages, notifications, profile, resume
- **Admin**: `verifyAdmin()` required for write operations, scraper management, analytics
- **Service role**: `supabaseAdmin` client bypasses RLS for server-side operations

## Row-Level Security

RLS is enabled on all tables via migrations (`frontend/supabase/migrations`),
verified live 2026-08-18 — do not re-apply blindly. Policies enforce:
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

- **Default**: in-memory token buckets from `@berojgardegreewala/api`
  (`createRateLimiter`), applied per path in `frontend/src/middleware.ts`:
  api 120/min, auth 10/min, search 30/min, scrape 5/min, ai 20/min
- **Upstash**: optional; `frontend/src/lib/rate-limiter.ts` uses Upstash Redis
  only when its env vars are set, otherwise falls back to in-memory buckets
- **CSRF**: middleware guards mutations (origin/referer check), exempting
  `/api/auth*`, `/api/subscribe`, `/api/report-issue`
- **CSP + security headers**: set in middleware (CSP, HSTS in production,
  X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy)

## Secrets Management

- All secrets in `.env.local` (gitignored); `frontend/.env.example` is the
  canonical reference
- Service-role keys are server-side only (never `NEXT_PUBLIC_`)
- Rotation required on exposure: `ADMIN_PASSWORD`, `SUPABASE_SERVICE_ROLE_KEY`,
  all AI provider keys, `CRON_SECRET`
- No secret carries a `NEXT_PUBLIC_` prefix

## Known Issues

1. Local `siliconpath-credentials.txt` holds a stale Project 1
   `SUPABASE_SERVICE_ROLE_KEY` (401s locally; production keys are valid).
   Rotate when the owner regains access.

## Threat Model (STRIDE)

| Threat | Mitigation |
|--------|-----------|
| **S**poofing | Supabase Auth, session cookies, admin password |
| **T**ampering | Zod validation, field allowlists, RLS |
| **R**epudiation | Structured audit logging |
| **I**nformation Disclosure | RLS, server-only secrets, no error.message in prod |
| **D**enial of Service | Rate limiting (in-memory buckets in middleware), CORS, input capping |
| **E**levation of Privilege | verifyAdmin(), RLS policies, scoped API keys |

## Related Documents

- [SECURITY.md](./SECURITY.md) — full security policy and audit trail
