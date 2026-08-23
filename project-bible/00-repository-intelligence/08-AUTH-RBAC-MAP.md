# 08-AUTH-RBAC-MAP — Authentication, RBAC & IDOR Protections

## 1. Dual Authentication Strategy
- **Browser Client**: Supabase Auth session cookies (`sb-...-auth-token`).
- **Programmatic / API Client**: Authorization Bearer JWT (`Authorization: Bearer <jwt>`).
- Evaluated via `getAuthenticatedEmployerUser` in `frontend/src/lib/employer-auth.ts`.

## 2. Role-Based Access Control (RBAC)
- **Candidate**: Access to `/dashboard`, `/profile`, `/network`, `/applications`, `/saved`.
- **Employer / Recruiter**: Access to `/employer/*` routes; validated against role metadata (`employer`, `provider`, `admin`).
- **Admin**: Full moderation rights, claims approval, scrape monitoring (`role === 'admin'`).
- **Anonymous**: Public access to job streams, news, academy, search.

## 3. IDOR Defense Matrix
- All employer endpoints enforce ownership invariant: `created_by === user.id || employer_id === user.id || role === 'admin'`.
- Cross-employer access returns **HTTP 403 Forbidden**.
- Cross-candidate sub-resource deletion returns **HTTP 403 Forbidden**.
