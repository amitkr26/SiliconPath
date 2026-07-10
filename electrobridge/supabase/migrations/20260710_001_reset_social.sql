-- ============================================================================
-- SiliconPath v2 :: Supabase Project 2 (SOCIAL / USER DATA) :: FULL RESET
-- WARNING: This DROPS all user data. There is no undo.
-- Run in the Supabase SQL Editor for your SECONDARY project.
--
-- NOTE: `current_role` is a PostgreSQL reserved word, so the professional
-- title column is named `job_title` (not current_role).
-- ============================================================================

DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS feed_posts CASCADE;
DROP TABLE IF EXISTS post_reactions CASCADE;
DROP TABLE IF EXISTS connections CASCADE;
DROP TABLE IF EXISTS saved_opportunities CASCADE;
DROP TABLE IF EXISTS job_applications CASCADE;
DROP TABLE IF EXISTS company_profiles CASCADE;
DROP TABLE IF EXISTS academy_user_progress CASCADE;
DROP TABLE IF EXISTS academy_assessment_results CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- ---------------------------------------------------------------------------
-- User profiles (LinkedIn-style). account_type splits seekers vs providers.
-- ---------------------------------------------------------------------------
CREATE TABLE user_profiles (
  id                 UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name       TEXT,
  email              TEXT,
  avatar_url         TEXT,
  headline           TEXT,
  bio                TEXT,
  location           TEXT,
  country            TEXT,

  account_type       TEXT DEFAULT 'seeker' CHECK (account_type IN ('seeker','provider')),
  job_title          TEXT,
  current_company    TEXT,
  experience_years   INTEGER,
  skills             TEXT[] DEFAULT '{}',
  interests          TEXT[] DEFAULT '{}',

  linkedin_url       TEXT,
  github_url         TEXT,
  website_url        TEXT,

  is_profile_public  BOOLEAN DEFAULT true,
  is_open_to_work    BOOLEAN DEFAULT false,
  email_notifications BOOLEAN DEFAULT true,

  profile_views      INTEGER DEFAULT 0,

  created_at         TIMESTAMPTZ DEFAULT now(),
  updated_at         TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Provider (company / institution / university / org) profiles
-- ---------------------------------------------------------------------------
CREATE TABLE company_profiles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE,
  kind          TEXT DEFAULT 'company' CHECK (kind IN ('company','institution','university','government','research_lab','startup')),
  logo_url      TEXT,
  website       TEXT,
  industry      TEXT,
  size          TEXT,
  location      TEXT,
  country       TEXT,
  about         TEXT,
  is_verified   BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Connections (LinkedIn-style graph)
-- ---------------------------------------------------------------------------
CREATE TABLE connections (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id  UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  addressee_id  UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  status        TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','blocked')),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(requester_id, addressee_id)
);

-- ---------------------------------------------------------------------------
-- Feed posts + reactions
-- ---------------------------------------------------------------------------
CREATE TABLE feed_posts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id      UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  content        TEXT NOT NULL,
  media_urls     TEXT[] DEFAULT '{}',
  opportunity_id UUID, -- app-level ref to opportunities in Project 1
  like_count     INTEGER DEFAULT 0,
  comment_count  INTEGER DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE post_reactions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID REFERENCES feed_posts(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  kind       TEXT DEFAULT 'like' CHECK (kind IN ('like','celebrate','support','insightful')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Direct messages
-- ---------------------------------------------------------------------------
CREATE TABLE conversations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_a UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  participant_b UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(participant_a, participant_b)
);

CREATE TABLE messages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id        UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  body             TEXT NOT NULL,
  is_read          BOOLEAN DEFAULT false,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Saved opportunities + job applications
-- ---------------------------------------------------------------------------
CREATE TABLE saved_opportunities (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL, -- app-level ref
  saved_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, opportunity_id)
);

CREATE TABLE job_applications (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL,
  status         TEXT DEFAULT 'applied' CHECK (status IN ('applied','reviewing','interview','offer','rejected','withdrawn')),
  note           TEXT,
  applied_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, opportunity_id)
);

-- ---------------------------------------------------------------------------
-- Academy user progress
-- ---------------------------------------------------------------------------
CREATE TABLE academy_user_progress (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  track_slug   TEXT NOT NULL,
  day_id       UUID NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, day_id)
);

CREATE TABLE academy_assessment_results (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  track_slug  TEXT NOT NULL,
  score       INTEGER NOT NULL,
  passed      BOOLEAN NOT NULL,
  answers     JSONB,
  taken_at    TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- profile view counter RPC
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION increment_profile_views(profile_id UUID)
RETURNS void AS $$
  UPDATE user_profiles SET profile_views = profile_views + 1 WHERE id = profile_id;
$$ LANGUAGE sql;

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX idx_conn_requester ON connections(requester_id, status);
CREATE INDEX idx_conn_addressee ON connections(addressee_id, status);
CREATE INDEX idx_feed_author    ON feed_posts(author_id, created_at DESC);
CREATE INDEX idx_msg_convo      ON messages(conversation_id, created_at);
CREATE INDEX idx_saved_user     ON saved_opportunities(user_id);
CREATE INDEX idx_apps_user      ON job_applications(user_id, status);
CREATE INDEX idx_progress_user  ON academy_user_progress(user_id);

-- ---------------------------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE user_profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections                ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_posts                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reactions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations              ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_opportunities        ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications           ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_user_progress      ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_assessment_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read public profiles" ON user_profiles
  FOR SELECT USING (is_profile_public = true OR auth.uid() = id);
CREATE POLICY "insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "read companies" ON company_profiles
  FOR SELECT USING (true);
CREATE POLICY "manage own company" ON company_profiles
  FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "see own connections" ON connections
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE POLICY "create connection" ON connections
  FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "update own connection" ON connections
  FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "read feed" ON feed_posts
  FOR SELECT USING (true);
CREATE POLICY "manage own posts" ON feed_posts
  FOR ALL USING (auth.uid() = author_id);
CREATE POLICY "manage own reactions" ON post_reactions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "see own conversations" ON conversations
  FOR SELECT USING (auth.uid() = participant_a OR auth.uid() = participant_b);
CREATE POLICY "see own messages" ON messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM conversations c WHERE c.id = conversation_id
            AND (c.participant_a = auth.uid() OR c.participant_b = auth.uid()))
  );
CREATE POLICY "send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "manage saved" ON saved_opportunities
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "manage applications" ON job_applications
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "manage progress" ON academy_user_progress
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "manage results" ON academy_assessment_results
  FOR ALL USING (auth.uid() = user_id);
