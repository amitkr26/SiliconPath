-- Add account_status to user_profiles for admin user management (ban/suspend)
-- target: supabase_db1

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS account_status text DEFAULT 'active'
  CHECK (account_status IN ('active', 'suspended', 'banned'));
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS banned_at timestamptz;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS banned_reason text;

-- Index for admin queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_account_status ON user_profiles(account_status);
