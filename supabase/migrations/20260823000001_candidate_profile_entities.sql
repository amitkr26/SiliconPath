-- target: supabase_db1
-- ═══════════════════════════════════════════════════════════════════════════════
-- Phase 9: Candidate Professional Identity & Networking Entities
-- Created: 2026-08-23
-- Tables: candidate_experiences, candidate_educations, candidate_projects,
--         candidate_certifications, candidate_achievements
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Candidate Experiences
CREATE TABLE IF NOT EXISTS candidate_experiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  role_title text NOT NULL,
  employment_type text DEFAULT 'Full-time' CHECK (employment_type IN ('Full-time', 'Part-time', 'Internship', 'Contract', 'Research', 'Apprenticeship')),
  location text,
  start_date date NOT NULL,
  end_date date,
  is_current boolean DEFAULT false,
  description text,
  skills_used text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT check_current_end_date CHECK (
    (is_current = true AND end_date IS NULL) OR
    (is_current = false)
  )
);

CREATE INDEX IF NOT EXISTS idx_candidate_exp_candidate_id ON candidate_experiences(candidate_id);

ALTER TABLE candidate_experiences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read candidate experiences" ON candidate_experiences;
CREATE POLICY "Public read candidate experiences" ON candidate_experiences
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles p
      WHERE p.id = candidate_experiences.candidate_id
      AND (p.is_profile_public = true OR p.id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Candidate manage own experiences" ON candidate_experiences;
CREATE POLICY "Candidate manage own experiences" ON candidate_experiences
  FOR ALL USING (candidate_id = auth.uid()) WITH CHECK (candidate_id = auth.uid());

DROP POLICY IF EXISTS "Admin full access on candidate_experiences" ON candidate_experiences;
CREATE POLICY "Admin full access on candidate_experiences" ON candidate_experiences
  FOR ALL USING (true);


-- 2. Candidate Educations
CREATE TABLE IF NOT EXISTS candidate_educations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  institution text NOT NULL,
  degree text NOT NULL,
  field_of_study text,
  start_year integer,
  end_year integer,
  grade text,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_candidate_edu_candidate_id ON candidate_educations(candidate_id);

ALTER TABLE candidate_educations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read candidate educations" ON candidate_educations;
CREATE POLICY "Public read candidate educations" ON candidate_educations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles p
      WHERE p.id = candidate_educations.candidate_id
      AND (p.is_profile_public = true OR p.id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Candidate manage own educations" ON candidate_educations;
CREATE POLICY "Candidate manage own educations" ON candidate_educations
  FOR ALL USING (candidate_id = auth.uid()) WITH CHECK (candidate_id = auth.uid());

DROP POLICY IF EXISTS "Admin full access on candidate_educations" ON candidate_educations;
CREATE POLICY "Admin full access on candidate_educations" ON candidate_educations
  FOR ALL USING (true);


-- 3. Candidate Projects
CREATE TABLE IF NOT EXISTS candidate_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  technologies text[] DEFAULT '{}',
  project_url text,
  github_url text,
  start_date date,
  end_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_candidate_proj_candidate_id ON candidate_projects(candidate_id);

ALTER TABLE candidate_projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read candidate projects" ON candidate_projects;
CREATE POLICY "Public read candidate projects" ON candidate_projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles p
      WHERE p.id = candidate_projects.candidate_id
      AND (p.is_profile_public = true OR p.id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Candidate manage own projects" ON candidate_projects;
CREATE POLICY "Candidate manage own projects" ON candidate_projects
  FOR ALL USING (candidate_id = auth.uid()) WITH CHECK (candidate_id = auth.uid());

DROP POLICY IF EXISTS "Admin full access on candidate_projects" ON candidate_projects;
CREATE POLICY "Admin full access on candidate_projects" ON candidate_projects
  FOR ALL USING (true);


-- 4. Candidate Certifications
CREATE TABLE IF NOT EXISTS candidate_certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  issuing_org text NOT NULL,
  issue_date date,
  expiration_date date,
  credential_id text,
  credential_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_candidate_cert_candidate_id ON candidate_certifications(candidate_id);

ALTER TABLE candidate_certifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read candidate certifications" ON candidate_certifications;
CREATE POLICY "Public read candidate certifications" ON candidate_certifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles p
      WHERE p.id = candidate_certifications.candidate_id
      AND (p.is_profile_public = true OR p.id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Candidate manage own certifications" ON candidate_certifications;
CREATE POLICY "Candidate manage own certifications" ON candidate_certifications
  FOR ALL USING (candidate_id = auth.uid()) WITH CHECK (candidate_id = auth.uid());

DROP POLICY IF EXISTS "Admin full access on candidate_certifications" ON candidate_certifications;
CREATE POLICY "Admin full access on candidate_certifications" ON candidate_certifications
  FOR ALL USING (true);


-- 5. Candidate Achievements
CREATE TABLE IF NOT EXISTS candidate_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  issuer text,
  date_awarded date,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_candidate_achieve_candidate_id ON candidate_achievements(candidate_id);

ALTER TABLE candidate_achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read candidate achievements" ON candidate_achievements;
CREATE POLICY "Public read candidate achievements" ON candidate_achievements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles p
      WHERE p.id = candidate_achievements.candidate_id
      AND (p.is_profile_public = true OR p.id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Candidate manage own achievements" ON candidate_achievements;
CREATE POLICY "Candidate manage own achievements" ON candidate_achievements
  FOR ALL USING (candidate_id = auth.uid()) WITH CHECK (candidate_id = auth.uid());

DROP POLICY IF EXISTS "Admin full access on candidate_achievements" ON candidate_achievements;
CREATE POLICY "Admin full access on candidate_achievements" ON candidate_achievements
  FOR ALL USING (true);
