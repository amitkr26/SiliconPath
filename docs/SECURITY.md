# Security & Compliance

## Reporting a Vulnerability

If you discover a security vulnerability within SiliconPath, please do NOT submit an issue on GitHub. Instead, send an email directly to the project maintainers. We will acknowledge your report within 48 hours and provide a timeline for remediation.

## Current Security Posture & Known Vulnerabilities

SiliconPath is primarily an open aggregator (read-only for users). However, a July 2026 security audit identified **9 critical and 7 high-severity issues**. Key findings:

### 🔴 CRITICAL: Missing Authentication on Admin API Endpoints

The following endpoints use `supabaseAdmin` (service_role key) with **zero authentication** — anyone who discovers these routes has full database CRUD access:
- `POST /api/opportunities` — create opportunities
- `PATCH /api/opportunities/[id]` — update opportunities
- `DELETE /api/opportunities/[id]` — delete opportunities
- `POST /api/admin/recheck-link` — trigger SSRF via arbitrary URL fetching
- `POST/PUT/DELETE /api/scrape-sources` — add/modify/delete scrape sources

**Impact:** An attacker can add malicious scrape sources pointing to internal services (e.g., `http://169.254.169.254/`), trigger SSRF, or arbitrarily modify the database.

### 🔴 CRITICAL: Admin Credential Exposed in Client-Side JS

`NEXT_PUBLIC_ADMIN_PASSWORD` is prefixed with `NEXT_PUBLIC_`, meaning it is **baked into client-side JavaScript bundles** at build time. Anyone can extract it from browser DevTools. This password is used as a Bearer token for admin analytics and scrape endpoints.

### 🔴 CRITICAL: Cross-Database Foreign Keys

`feed_posts.opportunity_id` and `saved_opportunities.opportunity_id` reference `opportunities(id)` across separate Supabase projects. Supabase does not support cross-project foreign key constraints.

### 🔴 CRITICAL: Profile/Feed Update Without Field Whitelist

`PATCH /api/profile/[userId]` and feed update endpoints spread the entire request body into DB updates with no field whitelist. Attackers can set arbitrary columns including `is_profile_public`, `role`, or `email`.

### 🟠 HIGH: In-Memory Rate Limiter Ineffective in Serverless

The rate limiter (`src/lib/rate-limiter.ts`) uses an in-memory `Map`. On Vercel (serverless), each invocation runs in an isolated container, so rate limit state is never shared. The subscribe endpoint's 3 req/hr limit is effectively a no-op.

### 🟠 HIGH: PostgREST Filter Injection

User input is interpolated directly into `.or()` filter strings without escaping (e.g., `tags.cs.{${search}}`). Special characters like `,`, `{`, `}` can break queries or bypass filters.

### 🟠 HIGH: Unsafe JSON.parse on AI Output

AI model output is parsed with `JSON.parse()` without try/catch. If an LLM returns malformed JSON (common), the endpoint returns a 500 error. Affected files: `matcher.ts`, `summarizer.ts`, `search-parser.ts`.

### Mitigations Applied

1. **Authentication:** Currently disabled for end-users on the primary UI. Admin routes should be protected via `CRON_SECRET` or service role key.
2. **Admin Operations:** Admin operations bypass Row-Level Security (RLS) policies by design.
3. **Data Encryption:** All data in transit is encrypted via HTTPS/TLS (enforced by Vercel and Supabase/Neon).
4. **Secrets Management:** Secrets are stored exclusively in Vercel Environment Variables. `.env.local` is gitignored.
5. **AI Fallback:** The multi-provider chain is designed to gracefully fallback if keys are rotated.

## API Key Rotation

The multi-provider AI fallback chain relies on several API keys (AWS, Nvidia, Cloudflare, Groq, Gemini, OpenRouter, HuggingFace). If any key is compromised:
1. Revoke it immediately at the provider level
2. Update the new key in Vercel Dashboard
3. The system is designed to gracefully fallback to the next provider

**Note:** OpenRouter model `meta-llama/llama-3.1-8b-instruct:free` has been deprecated and returns 404. Groq and Gemini API keys may also be expired/invalid.
