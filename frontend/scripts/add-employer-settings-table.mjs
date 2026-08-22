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

async function addMissingEmployerTables() {
  console.log("Creating employer_settings and workspace_members tables...");

  await runSQL(`
    CREATE TABLE IF NOT EXISTS employer_settings (
      employer_id uuid PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
      email_alerts boolean DEFAULT true,
      instant_applicant_alert boolean DEFAULT true,
      weekly_digest boolean DEFAULT true,
      dm_notifications boolean DEFAULT true,
      default_stage_notes text,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
    ALTER TABLE employer_settings ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Employer own settings" ON employer_settings;
    CREATE POLICY "Employer own settings" ON employer_settings FOR ALL USING (employer_id = auth.uid()) WITH CHECK (employer_id = auth.uid());
    DROP POLICY IF EXISTS "Admin full access on employer_settings" ON employer_settings;
    CREATE POLICY "Admin full access on employer_settings" ON employer_settings FOR ALL USING (true);

    CREATE TABLE IF NOT EXISTS workspace_members (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      employer_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
      email text NOT NULL,
      role text NOT NULL DEFAULT 'recruiter' CHECK (role IN ('admin', 'recruiter', 'hiring_manager', 'interviewer')),
      status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'suspended')),
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      UNIQUE(employer_id, email)
    );
    ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Employer own workspace members" ON workspace_members;
    CREATE POLICY "Employer own workspace members" ON workspace_members FOR ALL USING (employer_id = auth.uid()) WITH CHECK (employer_id = auth.uid());
    DROP POLICY IF EXISTS "Admin full access on workspace_members" ON workspace_members;
    CREATE POLICY "Admin full access on workspace_members" ON workspace_members FOR ALL USING (true);
  `);

  console.log("✅ Created employer_settings and workspace_members tables.");
}

addMissingEmployerTables().catch(console.error);
