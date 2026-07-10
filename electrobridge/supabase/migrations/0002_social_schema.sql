-- =====================================================================
-- 0002_social_schema.sql  (run on Supabase Project 2 — Social/User Data)
-- LinkedIn-style layer: profiles, connections, feed, messaging, employers.
-- Optional for visitors; only used by registered users.
-- =====================================================================

-- ---------------------------------------------------------------
-- USER PROFILES
-- ---------------------------------------------------------------
CREATE TABLE user_profiles (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name        TEXT,
  email               TEXT,
  avatar_url          TEXT,
  headline            TEXT,
  bio                 TEXT,
  location            TEXT,
  country             TEXT,

  account_type        TEXT DEFAULT 'seeker' CHECK (account_type IN ('seeker','employer')),

  current_role        TEXT,
  current_company     TEXT,
  experience_years    INTEGER,
  skills              TEXT[] DEFAULT '{}',
  interests           TEXT[] DEFAULT '{}',

  linkedin_url        TEXT,
  github_url          TEXT,
  website_url         TEXT,

  is_profile_public   BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  profile_views       INTEGER DEFAULT 0,

  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------
-- EMPLOYER PROFILES
-- ---------------------------------------------------------------
CREATE TABLE employer_profiles (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id       UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  company_name   TEXT NOT NULL,
  company_slug   TEXT UNIQUE,
  logo_url       TEXT,
  website        TEXT,
  about          TEXT,
  industry       TEXT,
  company_size   TEXT,
  headquarters   TEXT,
  is_verified    BOOLEAN DEFAULT false,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------
-- SAVED OPPORTUNITIES (app-level FK to Project 1 opportunities.id)
-- ---------------------------------------------------------------
CREATE TABLE saved_opportunities (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL,
  saved_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, opportunity_id)
);

-- ---------------------------------------------------------------
-- ACADEMY PROGRESS (synced for logged-in users)
-- ---------------------------------------------------------------
CREATE TABLE academy_user_progress (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  track_slug    TEXT NOT NULL,
  day_id        UUID NOT NULL,
  completed_at  TIMESTAMPTZ DEFAULT now(),
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

-- ---------------------------------------------------------------
-- CONNECTIONS  (LinkedIn-style graph)
-- ---------------------------------------------------------------
CREATE TABLE connections (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id  UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  addressee_id  UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  status        TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined')),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(requester_id, addressee_id),
  CHECK (requester_id <> addressee_id)
);

-- ---------------------------------------------------------------
-- FEED POSTS
-- ---------------------------------------------------------------
CREATE TABLE feed_posts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id      UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  content        TEXT NOT NULL,
  opportunity_id UUID,             -- optional app-level ref to Project 1
  image_url      TEXT,
  like_count     INTEGER DEFAULT 0,
  comment_count  INTEGER DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------
-- MESSAGES
-- ---------------------------------------------------------------
CREATE TABLE messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id     UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  recipient_id  UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  body          TEXT NOT NULL,
  read_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_conn_addressee ON connections(addressee_id, status);
CREATE INDEX idx_feed_author     ON feed_posts(author_id, created_at DESC);
CREATE INDEX idx_msg_thread      ON messages(sender_id, recipient_id, created_at);
CREATE INDEX idx_saved_user      ON saved_opportunities(user_id);
CREATE INDEX idx_progress_user   ON academy_user_progress(user_id);

-- ---------------------------------------------------------------
-- RLS — users control their own data; public profiles readable
-- ---------------------------------------------------------------
ALTER TABLE user_profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE employer_profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_opportunities        ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_user_progress      ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_assessment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections                ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_posts                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages                   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read public profiles"  ON user_profiles FOR SELECT USING (is_profile_public = true OR auth.uid() = id);
CREATE POLICY "update own profile"     ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "insert own profile"     ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "manage own employer"    ON employer_profiles FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "manage own saved"       ON saved_opportunities FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "manage own progress"    ON academy_user_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "manage own assessments" ON academy_assessment_results FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "see own connections"    ON connections FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE POLICY "create connections"     ON connections FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "update own connections" ON connections FOR UPDATE USING (auth.uid() = addressee_id OR auth.uid() = requester_id);

CREATE POLICY "read feed"              ON feed_posts FOR SELECT USING (true);
CREATE POLICY "author writes feed"     ON feed_posts FOR ALL USING (auth.uid() = author_id);

CREATE POLICY "read own messages"      ON messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "send messages"          ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Helper RPC for profile view counting (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION increment_profile_views(profile_id UUID)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE user_profiles SET profile_views = profile_views + 1 WHERE id = profile_id;
$$;
