const SUPABASE_MGMT_TOKEN = process.env.SUPABASE_MGMT_TOKEN || "";
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || "aqauempuwmbizqoaolop";

async function runSQL(query) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${SUPABASE_MGMT_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`SQL Error [${res.status}]: ${JSON.stringify(data)}`);
  }
  return data;
}

async function applyMigration() {
  console.log("Applying additive employer portal schema extensions...");

  // 1. Opportunities columns
  await runSQL(`
    ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL;
    ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS employer_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL;
    ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS job_status text DEFAULT 'active' CHECK (job_status IN ('draft','active','paused','closed'));
    ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS screening_questions jsonb DEFAULT '[]';
    CREATE INDEX IF NOT EXISTS idx_opportunities_created_by ON opportunities(created_by);
    CREATE INDEX IF NOT EXISTS idx_opportunities_employer_id ON opportunities(employer_id);
  `);
  console.log("✅ opportunities columns created.");

  // 2. company_claims table
  await runSQL(`
    CREATE TABLE IF NOT EXISTS company_claims (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      claimed_by uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
      status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
      reviewed_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
      reviewed_at timestamptz,
      message text,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
    ALTER TABLE company_claims ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Admin full access on company_claims" ON company_claims;
    CREATE POLICY "Admin full access on company_claims" ON company_claims FOR ALL USING (true) WITH CHECK (true);
    DROP POLICY IF EXISTS "Employer own pending claims" ON company_claims;
    CREATE POLICY "Employer own pending claims" ON company_claims FOR SELECT USING (claimed_by = auth.uid());
  `);
  console.log("✅ company_claims table & RLS created.");

  // 3. recruiter_saved_candidates table
  await runSQL(`
    CREATE TABLE IF NOT EXISTS recruiter_saved_candidates (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      employer_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
      candidate_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
      note text,
      created_at timestamptz DEFAULT now(),
      UNIQUE(employer_id, candidate_id)
    );
    ALTER TABLE recruiter_saved_candidates ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Employer own saved candidates" ON recruiter_saved_candidates;
    CREATE POLICY "Employer own saved candidates" ON recruiter_saved_candidates FOR ALL USING (employer_id = auth.uid()) WITH CHECK (employer_id = auth.uid());
    DROP POLICY IF EXISTS "Admin full access on recruiter_saved_candidates" ON recruiter_saved_candidates;
    CREATE POLICY "Admin full access on recruiter_saved_candidates" ON recruiter_saved_candidates FOR ALL USING (true);
  `);
  console.log("✅ recruiter_saved_candidates table & RLS created.");

  // 4. Case-insensitive unique username index
  await runSQL(`
    CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_username_lower_key ON user_profiles (lower(username));
  `);
  console.log("✅ user_profiles_username_lower_key index created.");

  // Verify
  const oppCols = await runSQL(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'opportunities' AND column_name IN ('created_by', 'employer_id', 'job_status', 'screening_questions');
  `);
  console.log("Verified Opportunities Columns:", oppCols);

  const tables = await runSQL(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name IN ('company_claims', 'recruiter_saved_candidates');
  `);
  console.log("Verified Tables:", tables);
}

applyMigration().catch(console.error);
