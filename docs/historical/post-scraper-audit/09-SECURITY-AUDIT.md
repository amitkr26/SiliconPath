# 09 — Security, Authentication & RBAC Regression Audit

**Audit Date**: 2026-08-26  
**Auditor**: Application Security Engineering

---

## 1. Credential & Secret Audit

- **Hardcoded Admin Password Fallbacks**: **REMOVED (0)**. Route `POST /api/admin/auth` fails closed (503) if environment variables are missing.
- **Timing-Attack Vulnerabilities**: **REMEDIATED (0)**. All secret comparisons (`verifyAdminToken`, `verifyAdmin`, `verifyCron`, `middleware.ts`) use constant-time comparisons (`crypto.timingSafeEqual` and Edge XOR accumulator).
- **Git-Tracked Secrets Scan**:
  - `git ls-files -- SECRETS.md github-recovery-codes.txt siliconpath-credentials.txt` $\rightarrow$ **Clean (Untracked, Gitignored)**.
  - No service role keys exposed in client bundles (`process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY` only).

---

## 2. Role-Based Access Control (RBAC) Matrix

| User Role | Route / Resource | Access Result |
| :--- | :--- | :--- |
| **Anonymous** | `/admin` | Gated by Server Auth Form |
| **Anonymous** | `/api/admin/*` | **HTTP 401 Unauthorized** |
| **Anonymous** | `/employer/*` | Redirected to `/login` |
| **Anonymous** | `/api/employer/*` | **HTTP 401 Unauthorized** |
| **Candidate** | `/employer/*` | Redirected to `/` (Forbidden) |
| **Candidate** | `/api/employer/*` | **HTTP 403 Forbidden** |
| **Candidate** | `/api/admin/*` | **HTTP 401 Unauthorized** |
| **Candidate** | `/api/messages` (Other user thread) | Blocked by Supabase RLS |
| **Employer** | `/employer/dashboard` | **Allowed (200)** |
| **Employer** | `/api/admin/*` | **HTTP 401 Unauthorized** |
| **Admin** | `/api/admin/*` | **Allowed with HMAC Session Token** |

---

## 3. IDOR Protections

- All direct database queries on messages, saved opportunities, profile edits, and application submissions check `auth.uid() = user_id` through server Supabase client and PostgreSQL Row-Level Security policies.
