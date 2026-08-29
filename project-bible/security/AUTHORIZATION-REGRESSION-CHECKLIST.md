# Authorization & IDOR Regression Verification Protocol

This document establishes the mandatory protocol for verifying, testing, and documenting authorization security and IDOR prevention across SiliconPath (BerojgarDegreeWala).

---

## 1. Ground Rules for Security Claims

To eliminate false "FIXED" claims, all future security reports and changelogs MUST adhere strictly to the following 4-tier verification taxonomy:

| Verification Classification | Definition & Evidentiary Standard |
|---|---|
| **`LOCAL VERIFIED`** | The security scenario was executed against a local development runtime (`http://localhost:3000`) with mock or sandbox authentication tokens. |
| **`REPOSITORY VERIFIED`** | Code inspections, static analysis, and Git history confirm that server-side authorization guards exist in the repository source files. |
| **`DEPLOYED — NOT PRODUCTION TESTED`** | The authorization fix has been committed and deployed to the production environment (e.g. Vercel), but the specific attack scenario has not yet been executed against the live production URL. |
| **`PRODUCTION VERIFIED`** | The security scenario was executed directly against the live, deployed production URL (`https://berojgardegreewala.vercel.app`), and expected access control rejection (e.g. HTTP 401/403) was empirically observed. |

> [!CAUTION]
> **Forbidden Terms**: Never use "live verified", "fully secure", or "verified" without specifying whether the target environment was `LOCAL` or `PRODUCTION`. Localhost tests must NEVER be described as production verification.

---

## 2. Mandatory Authorization Checklist for API Mutations

Before any mutation endpoint (`POST`, `PATCH`, `PUT`, `DELETE`) is approved for release, all of the following checks must be verified:

### A. Resource Ownership Boundaries
1. **Owner Access**: The authenticated creator/owner can view, update, or delete the resource.
2. **Cross-Tenant / Non-Owner Access (Negative Test)**: An authenticated attacker possessing a valid session for User/Employer B attempting to access or modify a resource owned by User/Employer A MUST receive `HTTP 403 Forbidden`.
3. **Unauthenticated Access**: A client without credentials attempting mutation MUST receive `HTTP 401 Unauthorized`.

### B. HTTP Method Segregation
Never assume that securing `GET` (read isolation) secures `PATCH` or `DELETE` (mutation isolation).
Every HTTP verb must be tested independently:
- [ ] `GET` (Listing & detail read scoping)
- [ ] `POST` (Resource creation & association with `user.id`)
- [ ] `PATCH` (Partial update with explicit ownership verification)
- [ ] `PUT` (Full update with explicit ownership verification)
- [ ] `DELETE` (Deletion with explicit ownership verification)

### C. Explicit Negative Test Matrix Template

| Endpoint & Method | Principal | Expected Status | Actual Result | Verification Level |
|---|---|---|---|---|
| `PATCH /api/employer/jobs` | Resource Owner (Emp A) | `200 OK` | `200 OK` | `LOCAL VERIFIED` |
| `PATCH /api/employer/jobs` | Attacker (Emp B) | `403 Forbidden` | `403 Forbidden` | `LOCAL VERIFIED` |
| `DELETE /api/employer/jobs` | Attacker (Emp B) | `403 Forbidden` | `403 Forbidden` | `LOCAL VERIFIED` |
| `PATCH /api/employer/applicants` | Attacker (Emp B) | `403 Forbidden` | `403 Forbidden` | `LOCAL VERIFIED` |
| `PATCH /api/applications` | Candidate Self-Approve | `403 Forbidden` | `403 Forbidden` | `LOCAL VERIFIED` |
| `PATCH /api/employer/company` | Hijacking Attacker | `403 Forbidden` | `403 Forbidden` | `LOCAL VERIFIED` |

---

## 3. Automated Guardrails (CI & Test Suite)

1. Every authorization guard in application code MUST be backed by a deterministic test in `frontend/src/__tests__/api/employer-idor.test.ts`.
2. Tests must assert both:
   - Happy path (Owner $\to$ 200)
   - Hostile path (Attacker $\to$ 403)
3. Running `npm test` must fail immediately if any ownership check is removed or bypassed during refactoring.
