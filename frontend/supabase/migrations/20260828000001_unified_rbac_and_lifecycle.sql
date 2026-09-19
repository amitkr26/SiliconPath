-- Migration: Phase 30 Unified RBAC, Permission Scopes & Opportunity Lifecycle
-- Target: Supabase DB1 (aqauempuwmbizqoaolop)
-- Safe, additive migration with backwards compatibility.

-- 1. Create user_roles table for global platform roles
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('owner', 'platform_admin', 'manager', 'moderator', 'support', 'user')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own roles" ON user_roles;
CREATE POLICY "Users can read own roles" ON user_roles FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admin and Owner manage roles" ON user_roles;
CREATE POLICY "Admin and Owner manage roles" ON user_roles FOR ALL USING (true);

-- 2. Create user_permissions table for explicit capability assignments
CREATE TABLE IF NOT EXISTS user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission text NOT NULL,
  granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, permission)
);
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own permissions" ON user_permissions;
CREATE POLICY "Users can read own permissions" ON user_permissions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admin manage permissions" ON user_permissions;
CREATE POLICY "Admin manage permissions" ON user_permissions FOR ALL USING (true);

-- 3. Create audit_logs table for administrative compliance
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin view audit logs" ON audit_logs;
CREATE POLICY "Admin view audit logs" ON audit_logs FOR SELECT USING (true);

-- 4. Extend opportunities with quality score & verification metadata
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS quality_score integer DEFAULT 50;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS last_verified_at timestamptz;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS verification_source text;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS audit_notes text;

CREATE INDEX IF NOT EXISTS idx_opportunities_quality_score ON opportunities(quality_score);
CREATE INDEX IF NOT EXISTS idx_opportunities_verification_status ON opportunities(verification_status);

-- NOTE (2026-09-18): the three permissive policies created above (no TO
-- clause = TO PUBLIC) are dropped at the end of this file (section 6). These
-- tables are admin-only and are written/read exclusively through the
-- service-role API routes (which bypass RLS), so the broad policies add
-- attack surface without serving anyone. Kept in-file for history/portability;
-- the drops make the applied state match the lockdown elsewhere in the schema.

-- 5. Seed default user role for existing user profiles if missing
INSERT INTO user_roles (user_id, role)
SELECT id, CASE 
  WHEN account_type = 'employer' THEN 'user' 
  WHEN account_type = 'admin' THEN 'platform_admin'
  ELSE 'user' 
END
FROM user_profiles
ON CONFLICT (user_id, role) DO NOTHING;

-- 6. Drop the three permissive policies created above (APPLIED 2026-09-18 on
-- prod DB1 via Management API). These tables are admin-only and are only
-- ever touched through the service-role routes (which bypass RLS), so the
-- broad public policies created above add attack surface without serving
-- anyone. Self-read policies ("Users can read own roles/permissions") stay.
DROP POLICY IF EXISTS "Admin and Owner manage roles" ON user_roles;
DROP POLICY IF EXISTS "Admin manage permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admin view audit logs" ON audit_logs;
