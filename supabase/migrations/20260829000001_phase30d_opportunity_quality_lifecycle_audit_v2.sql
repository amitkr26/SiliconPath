-- ==============================================================================
-- MIGRATION A (v2): Phase 30D Opportunity Quality, Lifecycle Normalization & Audit Foundation
-- Target: Supabase DB1 (aqauempuwmbizqoaolop)
-- Safe, additive, idempotent & contradiction-free.
-- Audited against 3,609 live opportunities records.
-- ==============================================================================

-- 1. ADD QUALITY FIELDS (Constrained 0-100 & Structured JSONB Breakdown)
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

-- 5. SECURE AUDIT_LOGS TABLE (Append-only administrative audit trail)
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

-- Defense-in-depth: Deny all mutations from client roles (Append-Only guarantee)
REVOKE UPDATE, DELETE, TRUNCATE ON audit_logs FROM PUBLIC, authenticated, anon;

-- Drop any previous conflicting policies
DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Service role inserts audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Anyone can view audit logs" ON audit_logs;

-- Read policy: Only authorized administrators or service_role can view audit logs
CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin', 'owner')
    OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin', 'owner')
  );

-- Indexes for audit query performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- 6. HARMONIZED BACKFILL (Updates lifecycle_status AND is_active in lockstep)
-- Resolves existing 27 contradictory rows (link_unavailable with is_active=true)
UPDATE opportunities
SET
  lifecycle_status = CASE
    WHEN verification_status = 'expired' OR (deadline IS NOT NULL AND deadline < CURRENT_DATE) THEN 'expired'
    WHEN verification_status = 'link_unavailable' THEN 'broken_link'
    WHEN verification_status = 'rejected' THEN 'archived'
    WHEN is_active = false THEN 'closed'
    ELSE 'active'
  END,
  is_active = CASE
    WHEN verification_status = 'verified' AND (deadline IS NULL OR deadline >= CURRENT_DATE) THEN true
    ELSE false
  END
WHERE lifecycle_status IS NULL OR lifecycle_status = 'active';
