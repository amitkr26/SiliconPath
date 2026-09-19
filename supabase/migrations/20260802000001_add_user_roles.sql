-- Migration: Ensure role distinction & company profiles table
-- Target: Supabase DB1

-- 1. Ensure user_profiles has role column with check constraint
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'candidate';
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_role_check CHECK (role IN ('candidate', 'employer', 'admin'));

-- 2. Ensure company_profiles table exists for employer metadata
CREATE TABLE IF NOT EXISTS company_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  website_url text,
  logo_url text,
  industry text DEFAULT 'Semiconductor & Microelectronics',
  company_size text,
  description text,
  headquarters text,
  is_verified boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on company_profiles
ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public view company profiles" ON company_profiles;
CREATE POLICY "Public view company profiles" ON company_profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Employer manage own company profile" ON company_profiles;
CREATE POLICY "Employer manage own company profile" ON company_profiles FOR ALL USING (auth.uid() = user_id);
