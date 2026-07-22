# Epic 10: Security Hardening

**Priority**: P0 | **Estimated effort**: 8 days | **Dependencies**: Epic 07 (stable schema for RLS)

## Description

Harden the security posture of the BerojgarDegreeWala platform. Rotate exposed credentials. Add CSRF protection. Verify and document RLS policies. Add rate limiting to admin routes. Audit input validation coverage. This epic addresses all CRITICAL and HIGH security findings from the architecture validation.

## Feature 10.1: Credential Rotation

### User Story 10.1.1
As a platform owner, I want all exposed credentials rotated.

#### Task 10.1.1.1: Rotate Supabase service role keys
- **Description**: Generate new service role keys for both Supabase projects (DB1 and DB2) via Supabase dashboard. Update `.env.local` and SECRETS.md. Re-deploy Render backend and Vercel frontend with new keys. Verify all services work
- **Dependencies**: Access to Supabase dashboards
- **Acceptance Criteria**: New keys generated. Old keys revoked after verification. All services operational
- **Database changes**: None
- **API changes**: None
- **UI changes**: None
- **Testing requirements**: Verify health endpoint returns 'ok' after rotation
- **Documentation updates**: Update SECRETS.md

#### Task 10.1.1.2: Rotate AI provider keys
- **Description**: Rotate all 7+ AI provider API keys (Groq, OpenRouter, Cloudflare, Gemini, NVIDIA, Bedrock, HuggingFace). Update .env.local and SECRETS.md. Verify each provider works through the fallback chain
- **Dependencies**: Access to each AI provider dashboard
- **Acceptance Criteria**: All provider keys rotated. AI Gateway fallback chain works with new keys
- **Database changes**: None
- **API changes**: None
- **UI changes**: None
- **Testing requirements**: Test each provider individually via AI admin test endpoint
- **Documentation updates**: Update SECRETS.md, remove old keys

#### Task 10.1.1.3: Rotate deployment tokens
- **Description**: Rotate Vercel token, Render API key, and Resend API key. Generate new tokens via each service's dashboard. Update .env.local and SECRETS.md. Verify CI/CD and deployments work
- **Dependencies**: Access to Vercel, Render, Resend dashboards
- **Acceptance Criteria**: All deployment tokens rotated. CI/CD works. Email sending works
- **Database changes**: None
- **API changes**: None
- **UI changes**: None
- **Testing requirements**: Trigger CI run, send test email
- **Documentation updates**: Update SECRETS.md

#### Task 10.1.1.4: Remove deprecated keys from SECRETS.md
- **Description**: Audit SECRETS.md for deprecated/old keys (OPENROUTER_API_KEY has 3 versions, GROQ_API_KEY has 2, NVIDIA has 2, RENDER_API_KEY has 2). Remove all but the active version for each. Add note: "If a key is compromised, rotate immediately and update this file"
- **Dependencies**: 10.1.1.1-3
- **Acceptance Criteria**: Only active keys documented. Clean, unambiguous secrets file
- **Database changes**: None
- **API changes**: None
- **UI changes**: None
- **Testing requirements**: None
- **Documentation updates**: Clean up SECRETS.md

## Feature 10.2: CSRF Protection

### User Story 10.2.1
As a platform owner, I want protection against CSRF attacks.

#### Task 10.2.2.1: Implement CSRF token validation
- **Description**: Add CSRF token generation and validation. On login/authenticated page load, generate CSRF token stored in cookie (httpOnly, sameSite=strict). All state-changing requests (POST, PATCH, DELETE) must include the token in header. Middleware validates
- **Dependencies**: None
- **Acceptance Criteria**: State-changing requests without CSRF token return 403. Tokens expire after session. Works with all auth methods
- **Database changes**: None
- **API changes**: CSRF validation middleware in all POST/PATCH/DELETE routes
- **UI changes**: CSRF token included in all fetch requests
- **Testing requirements**: Test without token, expired token, valid token
- **Documentation updates**: Add CSRF section to project-bible/13-security/

## Feature 10.3: RLS Policies

### User Story 10.3.1
As a platform owner, I want correct Row-Level Security on all tables.

#### Task 10.3.3.1: Audit and document RLS policies
- **Description**: Query `pg_policies` on Supabase DB1 and DB2. Document all existing RLS policies. Compare against the spec (public tables: SELECT on active/verified; user tables: auth.uid() scoped; admin tables: admin-only)
- **Dependencies**: Access to Supabase SQL editor
- **Acceptance Criteria**: Complete RLS policy document produced. Gaps identified
- **Database changes**: None (read-only audit)
- **API changes**: None
- **UI changes**: None
- **Testing requirements**: None
- **Documentation updates**: Create project-bible/06-database/rls-policies.md

#### Task 10.3.3.2: Create missing RLS policies
- **Description**: Write SQL migration to add any missing RLS policies identified in audit. Enable RLS on tables that lack it. Add policies for: opportunities (SELECT only verified), user_profiles (SELECT public, UPDATE own), feed_posts (SELECT all, INSERT own), messages (SELECT conversation participants)
- **Dependencies**: 10.3.3.1
- **Acceptance Criteria**: All tables have RLS. Policies match spec. Migration is idempotent
- **Database changes**: New migration file
- **API changes**: None
- **UI changes**: None
- **Testing requirements**: Verify RLS with different user contexts
- **Documentation updates**: Update rls-policies.md

## Feature 10.4: Input Validation

### User Story 10.4.1
As a platform owner, I want all user input validated.

#### Task 10.4.4.1: Audit input validation coverage
- **Description**: Review every POST/PATCH/PUT route handler. Check if it uses Zod validation from validation.ts. Document any routes that lack validation. Check: search input sanitization, URL validation for SSRF, file upload validation
- **Dependencies**: None
- **Acceptance Criteria**: Complete validation coverage audit produced. Gaps documented
- **Database changes**: None
- **API changes**: None
- **UI changes**: None
- **Testing requirements**: None
- **Documentation updates**: Add validation coverage matrix to project-bible/13-security/

#### Task 10.4.4.2: Add missing validation to routes
- **Description**: For each route lacking validation, add appropriate Zod schema from validation.ts. Where no schema exists, create one. Ensure all write routes validate input before processing
- **Dependencies**: 10.4.4.1
- **Acceptance Criteria**: Every POST/PATCH/PUT route validates input. Invalid input returns 400 with specific error
- **Database changes**: None
- **API changes**: Add Zod validation to uncovered routes
- **UI changes**: None
- **Testing requirements**: Test each newly-validated route with invalid input
- **Documentation updates**: Update validation coverage matrix

## Feature 10.5: Admin Rate Limiting

### User Story 10.5.1
As a platform owner, I want admin routes rate-limited.

#### Task 10.5.5.1: Add rate limiting to admin routes
- **Description**: Apply stricter rate limiting to admin routes: 20 req/min per IP (vs 120 for regular routes). Implement in admin middleware. Use same Upstash/in-memory backing
- **Dependencies**: None
- **Acceptance Criteria**: Admin routes enforce 20 req/min limit. Regular routes unaffected
- **Database changes**: None
- **API changes**: Rate limit middleware on admin routes
- **UI changes**: None
- **Testing requirements**: Test admin route rate limit
- **Documentation updates**: Update project-bible/13-security/

## Master Execution Checklist — Epic 10

- [ ] 10.1.1.1 Rotate Supabase service role keys
- [ ] 10.1.1.2 Rotate AI provider keys
- [ ] 10.1.1.3 Rotate deployment tokens
- [ ] 10.1.1.4 Remove deprecated keys from SECRETS.md
- [ ] 10.2.2.1 Implement CSRF token validation
- [ ] 10.3.3.1 Audit and document RLS policies
- [ ] 10.3.3.2 Create missing RLS policies
- [ ] 10.4.4.1 Audit input validation coverage
- [ ] 10.4.4.2 Add missing validation to routes
- [ ] 10.5.5.1 Add rate limiting to admin routes
