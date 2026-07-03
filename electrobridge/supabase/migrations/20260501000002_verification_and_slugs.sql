-- ============================================================
-- PART 1: Verification System
-- ============================================================
ALTER TABLE opportunities 
  ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'unverified' 
    CHECK (verification_status IN ('verified', 'unverified', 'link_unavailable', 'expired')),
  ADD COLUMN IF NOT EXISTS verified_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS official_page_url text,
  ADD COLUMN IF NOT EXISTS apply_link_type text DEFAULT 'homepage'
    CHECK (apply_link_type IN ('direct', 'homepage', 'pdf', 'email', 'portal')),
  ADD COLUMN IF NOT EXISTS last_link_checked timestamp with time zone,
  ADD COLUMN IF NOT EXISTS link_check_status integer,
  ADD COLUMN IF NOT EXISTS admin_notes text;

-- Verify known-good organizations
UPDATE opportunities SET
  verification_status = 'verified',
  verified_at = now(),
  apply_link_type = 'homepage',
  official_page_url = 'https://www.ursc.gov.in/jobs/jobs.jsp',
  admin_notes = 'Ad No. URSC:02:2026. Apply via official URSC jobs page.'
WHERE organization = 'ISRO URSC' AND verification_status IS DISTINCT FROM 'verified';

UPDATE opportunities SET
  verification_status = 'verified',
  apply_link_type = 'homepage',
  official_page_url = 'https://www.drdo.gov.in/careers',
  admin_notes = 'Check DRDO careers page for current openings.'
WHERE organization LIKE '%DRDO%' AND verification_status IS DISTINCT FROM 'verified';

UPDATE opportunities SET
  verification_status = 'verified',
  apply_link_type = 'homepage',
  official_page_url = 'https://www.nplindia.org',
  admin_notes = 'CSIR-NPL walk-in rounds. Check NPL website for schedule.'
WHERE organization = 'CSIR-NPL Delhi' AND verification_status IS DISTINCT FROM 'verified';

UPDATE opportunities SET
  verification_status = 'verified',
  apply_link_type = 'portal',
  official_page_url = 'https://www.tu-chemnitz.de',
  admin_notes = 'International PhD. Contact Prof. Georgeta Salvan directly.'
WHERE organization = 'TU Chemnitz' AND verification_status IS DISTINCT FROM 'verified';

UPDATE opportunities SET
  verification_status = 'verified',
  apply_link_type = 'portal',
  official_page_url = 'https://www.a-star.edu.sg/Scholarships/for-graduate-studies/singapore-international-graduate-award-singa',
  admin_notes = 'SINGA official portal. Applications open Aug-Sept each year.'
WHERE organization = 'A*STAR Singapore' AND verification_status IS DISTINCT FROM 'verified';

UPDATE opportunities SET
  verification_status = 'verified',
  apply_link_type = 'homepage',
  official_page_url = 'http://www.ird.iitd.ac.in',
  admin_notes = 'IIT Delhi IRD project positions. Check IRD portal regularly.'
WHERE organization = 'IIT Delhi IRD' AND verification_status IS DISTINCT FROM 'verified';

UPDATE opportunities SET
  verification_status = 'verified',
  apply_link_type = 'direct',
  official_page_url = 'https://careers.ti.com',
  admin_notes = 'Texas Instruments official careers portal.'
WHERE organization = 'Texas Instruments India' AND verification_status IS DISTINCT FROM 'verified';

-- Mark auto-scraped posts without stipend as unverified
UPDATE opportunities SET
  verification_status = 'unverified'
WHERE (stipend IS NULL OR stipend = '') AND verification_status IS DISTINCT FROM 'unverified';

-- Link check logs table
CREATE TABLE IF NOT EXISTS link_check_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id uuid REFERENCES opportunities(id) ON DELETE CASCADE,
  checked_at timestamp with time zone DEFAULT now(),
  http_status integer,
  is_reachable boolean,
  error_message text
);

-- Reports table
CREATE TABLE IF NOT EXISTS opportunity_reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id uuid REFERENCES opportunities(id),
  report_type text,
  description text,
  reported_at timestamp with time zone DEFAULT now(),
  is_resolved boolean DEFAULT false
);
ALTER TABLE opportunity_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can report" ON opportunity_reports FOR INSERT WITH CHECK (true);

-- ============================================================
-- PART 2: Slug System
-- ============================================================
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS slug text UNIQUE;

CREATE OR REPLACE FUNCTION generate_slug(title text, organization text, category text)
RETURNS text AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  base_slug := lower(category) || '-' ||
    regexp_replace(lower(organization), '[^a-z0-9]+', '-', 'g') || '-' ||
    regexp_replace(lower(title), '[^a-z0-9]+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  base_slug := left(base_slug, 80);
  
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM opportunities WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

UPDATE opportunities 
SET slug = generate_slug(title, organization, category)
WHERE slug IS NULL;

ALTER TABLE opportunities ALTER COLUMN slug SET NOT NULL;

CREATE OR REPLACE FUNCTION auto_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_slug(NEW.title, NEW.organization, NEW.category);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_slug ON opportunities;
CREATE TRIGGER set_slug BEFORE INSERT ON opportunities
FOR EACH ROW EXECUTE FUNCTION auto_slug();

ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS org_slug text;

UPDATE opportunities SET org_slug = lower(regexp_replace(organization, '[^a-zA-Z0-9]+', '-', 'g'));
UPDATE opportunities SET org_slug = trim(both '-' from org_slug);
