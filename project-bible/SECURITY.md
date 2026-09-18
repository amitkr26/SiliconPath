# Security Policy & Credential Management

## Credential Rotation History

| Date | Action | Systems Affected |
| :--- | :--- | :--- |
| **2026-09-18** | BDW AI security hardening — 16 findings fixed (prompt injection, SQL ILIKE, auth, rate limiting) | BDW AI Chat/Tools routes |
| **2026-08-17** | Two credentials leaked in `change-fk.js` — deleted, rotated | Supabase DB2 |
| **2026-08-14** | Full rotation of all 4 database credentials | Supabase DB1/DB2, Neon DB1/DB2 |
| **2026-08-14** | Vercel access token rotated | Vercel deployment |
| **2026-08-07** | Git history force-rewritten to purge 20+ hardcoded secrets | All historic commits |
| **2026-08-07** | Supabase/Neon/Vercel credentials rotated | All services |

**Next scheduled rotation**: 2026-11-14 (quarterly) or immediately upon exposure.

---

## Secret Management Policy

### NEVER DO
- Hardcode secrets in source code
- Commit `.env`, `.env.local`, `.env.production`, or any `*.local` files
- Store secrets in `siliconpath-credentials.txt` or similar reference files
- Share secrets via chat, email, or AI agent conversations

### ALWAYS DO
- Read secrets from `process.env.VAR_NAME`
- Use platform secret stores (Vercel, Supabase, Neon dashboards)
- Rotate credentials quarterly
- Use least-privilege keys (anon for client, service role for server only)
- Audit `.gitignore` — ensure `.env*` are listed

---

## BDW AI Security (Implemented 2026-09-18)

### Tool Execution
- Tool execution lives in `frontend/src/lib/ai/bdw-tools-exec.ts` (server-only)
- Chat route calls `executeBDWTool()` directly — no HTTP self-fetch
- Tool names validated against `VALID_BDW_TOOLS` whitelist (7 tools only)

### Authentication & Authorization
- `/api/ai/bdw-tools` requires Supabase JWT (401 for anonymous)
- `isAuthenticated` passed from actual auth state, never hardcoded
- userId derived from authenticated session, not request body

### Input Validation
- User messages capped at 4000 chars via `sanitizeUserMessage()`
- SQL ILIKE wildcards (`%`, `_`, `\`) escaped via `escapeILIKE()`
- Total tool result context capped at 4000 chars per round

### Prompt Injection Defense
- User query wrapped in `<user_query>` delimiters
- Anti-injection rules: UNTRUSTED input, never change identity, data ≠ instructions
- Balanced-brace JSON parser replaces fragile regex for tool call extraction

---

## Security Checklist for Contributors

- [ ] No secrets in committed files
- [ ] `.env.local` not committed
- [ ] API routes use `createClient()` from `@/lib/supabase/server`
- [ ] Service role keys only in server-side code
- [ ] Admin routes protected by `ADMIN_PASSWORD` / `ADMIN_HMAC_SECRET`
- [ ] Cron endpoints protected by `CRON_SECRET`
- [ ] Rate limiting on auth/AI/public-write endpoints
- [ ] CSP headers set in `middleware.ts`
- [ ] Fail-closed authorization on every mutation
- [ ] ILIKE queries escape `%`, `_`, `\`
- [ ] User input sanitized before AI prompts

---

## Incident Response

If a secret is exposed:
1. **Rotate immediately** in the platform dashboard
2. **Update** environment variables in Vercel/Supabase
3. **Redeploy** affected services
4. **Audit access logs** for anomalous usage
5. **Document** in this file under "Credential Rotation History"

---

## Reporting Security Issues

**Do not file public GitHub issues for security vulnerabilities.**

Use GitHub Security Advisories private reporting.

Include: description, steps to reproduce, potential impact, suggested fix.

We aim to acknowledge within 24 hours and patch within 72 hours for critical issues.
