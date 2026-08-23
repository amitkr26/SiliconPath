# 16-SECURITY-MAP — Security Architecture & Hardening

1. **Row-Level Security (RLS)**: Active on 100% of production tables. Policies verified for user-scoped access, admin read, and public insert validation.
2. **SECURITY DEFINER Hardening**: Immutable `SET search_path = public` across all 14 database functions.
3. **Trigger Execution Revocation**: `REVOKE EXECUTE FROM anon, authenticated, public` applied to all trigger functions.
4. **Security Response Headers**: CSP, HSTS, X-Frame-Options (DENY), X-Content-Type-Options (nosniff), Referrer-Policy.
