-- ============================================================================
-- SiliconPath v2 :: RECONCILIATION migration for the social layer.
--
-- Context: the DB was reset to the clean v2 schema, but the existing social
-- API routes (feed, messages, network, resume, endorsements, recommendations)
-- were written against the ORIGINAL schema. They compile (Supabase string
-- queries are not type-checked) but fail at runtime because the columns/tables
-- they reference no longer exist.
--
-- This migration ADDITIVELY restores the names those routes expect, so the app
-- works at runtime without a risky blind rewrite of ~18 routes. Everything is
-- idempotent (IF NOT EXISTS) and safe to run more than once.
--
-- Run in the Supabase SQL Editor for Project 2 (SOCIAL / USER DATA).
-- ============================================================================

-- ---- user_profiles: columns the profile / resume / feed APIs expect ----
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS full_name        TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS username         TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS current_org      TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS current_position TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS about            TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS city             TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS banner_url       TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS connection_count INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS follower_count   INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS following_count  INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS education        JSONB DEFAULT '[]';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS experience       JSONB DEFAULT '[]';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS projects         JSONB DEFAULT '[]';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS publications     JSONB DEFAULT '[]';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS open_to_work_types TEXT[] DEFAULT '{}';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS resume_ats_score INTEGER DEFAULT 0;

-- Keep full_name in sync with display_name so both names work.
UPDATE user_profiles SET full_name = display_name WHERE full_name IS NULL AND display_name IS NOT NULL;

-- ---- connections: legacy column names used by network/feed APIs ----
ALTER TABLE connections ADD COLUMN IF NOT EXISTS user_id_1    UUID REFERENCES user_profiles(id) ON DELETE CASCADE;
ALTER TABLE connections ADD COLUMN IF NOT EXISTS user_id_2    UUID REFERENCES user_profiles(id) ON DELETE CASCADE;
ALTER TABLE connections ADD COLUMN IF NOT EXISTS connected_at TIMESTAMPTZ DEFAULT now();
-- Backfill legacy columns from the v2 requester/addressee columns.
UPDATE connections SET user_id_1 = requester_id WHERE user_id_1 IS NULL AND requester_id IS NOT NULL;
UPDATE connections SET user_id_2 = addressee_id WHERE user_id_2 IS NULL AND addressee_id IS NOT NULL;

-- ---- follows (separate from connections) ----
CREATE TABLE IF NOT EXISTS user_follows (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id  UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- ---- feed_posts: legacy columns ----
ALTER TABLE feed_posts ADD COLUMN IF NOT EXISTS user_id    UUID REFERENCES user_profiles(id) ON DELETE CASCADE;
ALTER TABLE feed_posts ADD COLUMN IF NOT EXISTS post_type  TEXT DEFAULT 'post';
ALTER TABLE feed_posts ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public';
ALTER TABLE feed_posts ADD COLUMN IF NOT EXISTS tags       TEXT[] DEFAULT '{}';
UPDATE feed_posts SET user_id = author_id WHERE user_id IS NULL AND author_id IS NOT NULL;

-- ---- feed post interactions expected by feed API joins ----
CREATE TABLE IF NOT EXISTS feed_post_likes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID REFERENCES feed_posts(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  reaction   TEXT DEFAULT 'like',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS feed_post_reposts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID REFERENCES feed_posts(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS feed_post_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID REFERENCES feed_posts(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ---- conversations / messages: legacy participant + content columns ----
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS participant_1        UUID REFERENCES user_profiles(id) ON DELETE CASCADE;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS participant_2        UUID REFERENCES user_profiles(id) ON DELETE CASCADE;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS unread_count_1       INTEGER DEFAULT 0;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS unread_count_2       INTEGER DEFAULT 0;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS last_message_preview TEXT;
UPDATE conversations SET participant_1 = participant_a WHERE participant_1 IS NULL AND participant_a IS NOT NULL;
UPDATE conversations SET participant_2 = participant_b WHERE participant_2 IS NULL AND participant_b IS NOT NULL;

ALTER TABLE messages ADD COLUMN IF NOT EXISTS content TEXT;
UPDATE messages SET content = body WHERE content IS NULL AND body IS NOT NULL;

-- ---- endorsements + recommendations (profile page) ----
CREATE TABLE IF NOT EXISTS skill_endorsements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  skill       TEXT NOT NULL,
  endorsed_by UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, skill, endorsed_by)
);

CREATE TABLE IF NOT EXISTS recommendations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  author_id    UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  relationship TEXT,
  content      TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- ---- indexes for the legacy access paths ----
CREATE INDEX IF NOT EXISTS idx_conn_u1        ON connections(user_id_1);
CREATE INDEX IF NOT EXISTS idx_conn_u2        ON connections(user_id_2);
CREATE INDEX IF NOT EXISTS idx_follows_flwr   ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_flwg   ON user_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_fp_user        ON feed_posts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fpl_post       ON feed_post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_fpc_post       ON feed_post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_conv_p1        ON conversations(participant_1);
CREATE INDEX IF NOT EXISTS idx_conv_p2        ON conversations(participant_2);
CREATE INDEX IF NOT EXISTS idx_endorse_user   ON skill_endorsements(user_id);
CREATE INDEX IF NOT EXISTS idx_recs_user      ON recommendations(user_id);

-- ---- RLS for the new tables (public read, owner-scoped writes) ----
ALTER TABLE user_follows       ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_post_likes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_post_reposts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_endorsements ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations    ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_follows' AND policyname='manage own follows') THEN
    CREATE POLICY "manage own follows" ON user_follows FOR ALL USING (auth.uid() = follower_id);
    CREATE POLICY "read follows" ON user_follows FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='feed_post_likes' AND policyname='manage own likes') THEN
    CREATE POLICY "manage own likes" ON feed_post_likes FOR ALL USING (auth.uid() = user_id);
    CREATE POLICY "read likes" ON feed_post_likes FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='feed_post_reposts' AND policyname='manage own reposts') THEN
    CREATE POLICY "manage own reposts" ON feed_post_reposts FOR ALL USING (auth.uid() = user_id);
    CREATE POLICY "read reposts" ON feed_post_reposts FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='feed_post_comments' AND policyname='manage own comments') THEN
    CREATE POLICY "manage own comments" ON feed_post_comments FOR ALL USING (auth.uid() = user_id);
    CREATE POLICY "read comments" ON feed_post_comments FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='skill_endorsements' AND policyname='manage endorsements') THEN
    CREATE POLICY "manage endorsements" ON skill_endorsements FOR ALL USING (auth.uid() = endorsed_by);
    CREATE POLICY "read endorsements" ON skill_endorsements FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='recommendations' AND policyname='manage recommendations') THEN
    CREATE POLICY "manage recommendations" ON recommendations FOR ALL USING (auth.uid() = author_id);
    CREATE POLICY "read recommendations" ON recommendations FOR SELECT USING (true);
  END IF;
END $$;
