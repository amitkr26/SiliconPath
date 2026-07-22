-- ── 1. Create resources table (referenced by API routes + seeds) ──
CREATE TABLE IF NOT EXISTS resources (
  id            BIGSERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE,
  url           TEXT NOT NULL,
  kind          TEXT CHECK (kind IN ('course','channel','tool','book','paper')),
  difficulty    TEXT CHECK (difficulty IN ('beginner','intermediate','advanced')),
  category      TEXT,
  topic_tags    TEXT[] DEFAULT '{}',
  track_slug    TEXT,
  notes         TEXT,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ── 2. Fix slug function mismatch: wire generate_opp_slug to the auto_slug trigger ──
CREATE OR REPLACE FUNCTION auto_slug() RETURNS trigger AS $$
BEGIN
  NEW.slug := generate_opp_slug(NEW.title, NEW.organization, NEW.category);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── 3. Add is_published to learning_tracks (referenced by academy SSG) ──
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'learning_tracks' AND column_name = 'is_published') THEN
    ALTER TABLE learning_tracks ADD COLUMN is_published BOOLEAN DEFAULT true;
  END IF;
END $$;

-- ── 4. Add verification_status values if missing ──
DO $$ BEGIN
  ALTER TABLE opportunities DROP CONSTRAINT IF EXISTS opportunities_verification_status_check;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE opportunities ADD CONSTRAINT opportunities_verification_status_check
    CHECK (verification_status IN ('pending','verified','rejected','expired','link_unavailable'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
