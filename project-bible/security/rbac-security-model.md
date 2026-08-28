# RBAC Security Model & Threat Mitigation Matrix

**Platform**: BerojgarDegreeWala  
**Document Version**: 1.0 (Phase 30B Security Architecture)  

---

## 1. Threat Mitigation Matrix (12 Explicit Scenarios)

| # | Threat Vector | Target Asset / Endpoint | Mitigation Strategy | Enforcement Mechanism |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | Candidate attempts admin API access | `/api/admin/*` | Fail-closed HMAC & timing-safe password guard | `requireAdmin()` in `@berojgardegreewala/api` |
| **SEC-02** | Candidate attempts employer mutation | `/api/employer/*` | Role and organization capability verification | `isEmployerOnly` middleware + `requirePermission()` |
| **SEC-03** | Employer modifies another employer's org | `/api/employer/company` | Org ownership check (`org.created_by == user.id`) | Server-side WHERE filter on `user.id` |
| **SEC-04** | Manager attempts owner-only operation | `/api/admin/settings` | `system.settings` permission restricted to Sovereign Owner | `hasPermission(role, 'system.settings')` |
| **SEC-05** | User attempts self-assigning permissions | `/api/profile/me` | Role field sanitization in profile update endpoint | Block `"admin"`, `"owner"`, `"manager"` mutations |
| **SEC-06** | User modifies another user's role | `/api/users/[id]` | Only Owner/Admin can mutate `user_roles` | Admin authentication + audit logging |
| **SEC-07** | Attacker manipulates `redirectTo` | `/login?redirectTo=...` | Open redirect sanitizer `getSafeRedirectUrl()` | Rejects protocol (`://`), `//`, `/\`, or non-relative paths |
| **SEC-08** | User accesses protected route after logout | `/dashboard`, `/messages` | Invalidation of Supabase session cookie | Middleware `supabase.auth.getUser()` check |
| **SEC-09** | Direct API calls bypassing UI | `POST /api/feed` | Unauthenticated token check in Route Handler | Returns 401 Unauthorized immediately |
| **SEC-10** | Cross-user resume access | `/api/resume` | Scoped strictly to authenticated `user.id` | WHERE `user_id = user.id` in query |
| **SEC-11** | Cross-user application access | `/api/applications` | Scoped to `candidate_id = user.id` or employer job owner | Dual-sided ownership verification in SQL |
| **SEC-12** | Cross-organization ATS modification | `/api/employer/applicants` | Application's `opportunity_id` must belong to employer | Verification of `opportunity.created_by = user.id` |

---

## 2. Sovereign Owner Security

1. **Non-Demotable Anchor**: The Owner identity is hard-anchored in environment configuration. It cannot be altered by database triggers or admin API calls.
2. **Audit Logging**: Any grant or revocation of staff capabilities writes a tamper-evident entry to `audit_logs`.
