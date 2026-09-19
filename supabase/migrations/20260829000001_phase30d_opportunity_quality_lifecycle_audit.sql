-- ==============================================================================
-- MIGRATION A: Phase 30D Opportunity Quality, Lifecycle Normalization & Audit Foundation
-- Target: Supabase DB1 (aqauempuwmbizqoaolop)
-- Safe, additive & idempotent.
-- Verified against 3,609 live opportunity rows.
-- ==============================================================================

-- 1. ADD QUALITY FIELDS (Constrained 0-100 & Structured JSONB Reason)
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS quality_score INTEGER
  CHECK (quality_score IS NULL OR (quality_score >= 0 AND quality_score <= 100));

ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS quality_reason JSONB DEFAULT '{}'::jsonb;

-- 2. ADD LIFECYCLE STATUS
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS lifecycle_status TEXT DEFAULT 'active'
  CHECK (lifecycle_status IN ('draft', 'active', 'expired', 'closed', 'archived', 'broken_link'));

-- 3. ADD VERIFICATION & AUDIT METADATA
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS verification_source TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS audit_notes TEXT;

-- 4. PERFORMANCE & FILTERING INDEXES
CREATE INDEX IF NOT EXISTS idx_opportunities_quality_score ON opportunities(quality_score);
CREATE INDEX IF NOT EXISTS idx_opportunities_lifecycle_status ON opportunities(lifecycle_status);
CREATE INDEX IF NOT EXISTS idx_opportunities_active_lifecycle ON opportunities(is_active, lifecycle_status, verification_status);
CREATE INDEX IF NOT EXISTS idx_opportunities_deadline_active ON opportunities(deadline) WHERE is_active = true;

-- 5. SECURE AUDIT_LOGS TABLE (Append-only administrative trail)
CREATE TABLE IF NOT EXISTS audit_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action         TEXT NOT NULL,
  resource_type  TEXT NOT NULL,
  resource_id    TEXT,
  previous_state JSONB,
  new_state      JSONB,
  metadata       JSONB DEFAULT '{}'::jsonb,
  admin_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address     TEXT,
  user_agent     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Deny all modifications (Append-Only guarantee)
REVOKE UPDATE, DELETE, TRUNCATE ON audit_logs FROM PUBLIC, authenticated, anon;

-- Drop legacy/insecure policies if any existed
DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Service role inserts audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Anyone can view audit logs" ON audit_logs;

-- Read policy: Only service role or verified admin roles can read audit logs
CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT TO authenticated
  USING (
    auth.jwt() ->> 'email' IN ('amitkr26@gmail.com', 'admin@berojgardegreewala.com')
    OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin')
  );

-- Insert policy: Strictly service_role backend operations
CREATE POLICY "Service role inserts audit logs" ON audit_logs
  FOR INSERT TO service_role
  WITH CHECK (true);

-- Query indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- 6. POPULATE INITIAL LIFECYCLE_STATUS FROM EXISTING LIVE REALITY (Safe backfill)
UPDATE opportunities
SET lifecycle_status = CASE
  WHEN verification_status = 'expired' OR (deadline IS NOT NULL AND deadline < CURRENT_DATE) THEN 'expired'
  WHEN verification_status = 'link_unavailable' THEN 'broken_link'
  WHEN verification_status = 'rejected' THEN 'archived'
  WHEN is_active = false THEN 'closed'
  ELSE 'active'
END
WHERE lifecycle_status IS NULL OR lifecycle_status = 'active';
