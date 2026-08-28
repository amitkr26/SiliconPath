-- Migration: Fix RLS policies on user_roles, user_permissions, audit_logs
-- Drops dangerous FOR ALL USING (true) policies; service role (supabaseAdmin) bypasses RLS anyway.

-- ── user_roles ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin and Owner manage roles" ON user_roles;
-- Keep the existing SELECT policy ("Users can read own roles") as-is — it's already correct.
-- All INSERT/UPDATE/DELETE go through supabaseAdmin which bypasses RLS.

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);

-- ── user_permissions ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin manage permissions" ON user_permissions;
-- Keep the existing SELECT policy ("Users can read own permissions") as-is.

CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);

-- ── audit_logs ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin view audit logs" ON audit_logs;
-- No SELECT for regular users — audit reads go through supabaseAdmin.
-- No INSERT policy for regular users — inserts go through supabaseAdmin.
