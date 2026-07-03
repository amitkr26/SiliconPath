-- ═══════════════════════════════════════════════════════════════════════════════
-- ElectroBridge LinkedIn-Style Professional Networking Features
-- Run on Supabase Primary (db1)
-- Project: https://supabase.com/dashboard/project/aqauempuwmbizqoaolop/sql/new
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════
-- PHASE 1A: ENHANCED USER PROFILES
-- ═══════════════════════════════

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS username text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS headline text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS about text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS banner_url text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS current_position text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS current_org text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS country text DEFAULT 'India';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS website_url text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_open_to_work boolean DEFAULT false;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS open_to_work_types text[];
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS profile_views integer DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS follower_count integer DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS following_count integer DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS connection_count integer DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_profile_public boolean DEFAULT true;

-- Make username unique (separate from column creation)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_profiles_username_key'
  ) THEN
    ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_username_key UNIQUE (username);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION auto_username()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.username IS NULL THEN
    NEW.username := split_part(
      (SELECT email FROM auth.users WHERE id = NEW.id), '@', 1
    ) || '_' || substr(NEW.id::text, 1, 4);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS set_username ON user_profiles;
CREATE TRIGGER set_username BEFORE INSERT ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION auto_username();


-- ═══════════════════════════════
-- PHASE 1B: FOLLOW / CONNECT SYSTEM
-- ═══════════════════════════════

CREATE TABLE IF NOT EXISTS user_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK(follower_id != following_id)
);

CREATE TABLE IF NOT EXISTS connection_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  status text DEFAULT 'pending'
    CHECK(status IN ('pending', 'accepted', 'declined', 'withdrawn')),
  message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(sender_id, receiver_id),
  CHECK(sender_id != receiver_id)
);

CREATE TABLE IF NOT EXISTS connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_1 uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id_2 uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  connected_at timestamptz DEFAULT now()
);

-- Enforce uniqueness of connections (A↔B only once) via trigger
CREATE OR REPLACE FUNCTION check_connection_unique()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM connections
    WHERE (user_id_1 = NEW.user_id_2 AND user_id_2 = NEW.user_id_1)
       OR (user_id_1 = NEW.user_id_1 AND user_id_2 = NEW.user_id_2)
  ) THEN
    RAISE EXCEPTION 'Connection already exists between these users';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_new_connection ON connections;
CREATE TRIGGER on_new_connection
  BEFORE INSERT ON connections
  FOR EACH ROW EXECUTE FUNCTION check_connection_unique();

CREATE OR REPLACE FUNCTION handle_connection_accepted()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND (OLD.status IS DISTINCT FROM 'accepted') THEN
    INSERT INTO connections (user_id_1, user_id_2)
    VALUES (NEW.sender_id, NEW.receiver_id)
    ON CONFLICT DO NOTHING;

    UPDATE user_profiles
    SET connection_count = connection_count + 1
    WHERE id IN (NEW.sender_id, NEW.receiver_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_connection_accepted ON connection_requests;
CREATE TRIGGER on_connection_accepted
  AFTER UPDATE ON connection_requests
  FOR EACH ROW EXECUTE FUNCTION handle_connection_accepted();

CREATE OR REPLACE FUNCTION handle_follow()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE user_profiles SET follower_count = follower_count + 1
    WHERE id = NEW.following_id;
    UPDATE user_profiles SET following_count = following_count + 1
    WHERE id = NEW.follower_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE user_profiles SET follower_count = GREATEST(follower_count - 1, 0)
    WHERE id = OLD.following_id;
    UPDATE user_profiles SET following_count = GREATEST(following_count - 1, 0)
    WHERE id = OLD.follower_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_follow_change ON user_follows;
CREATE TRIGGER on_follow_change
  AFTER INSERT OR DELETE ON user_follows
  FOR EACH ROW EXECUTE FUNCTION handle_follow();


-- ═══════════════════════════════
-- PHASE 1C: ACTIVITY FEED
-- ═══════════════════════════════

CREATE TABLE IF NOT EXISTS feed_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  post_type text DEFAULT 'post'
    CHECK(post_type IN (
      'post', 'article', 'opportunity_share', 'achievement', 'question'
    )),
  media_urls text[],
  opportunity_id uuid REFERENCES opportunities(id) ON DELETE SET NULL,
  article_title text,
  article_cover_url text,
  tags text[],
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  reposts_count integer DEFAULT 0,
  views_count integer DEFAULT 0,
  visibility text DEFAULT 'public'
    CHECK(visibility IN ('public', 'connections', 'followers')),
  is_pinned boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS feed_post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES feed_posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction text DEFAULT 'like'
    CHECK(reaction IN ('like', 'celebrate', 'support', 'insightful', 'curious')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS feed_post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES feed_posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_comment_id uuid REFERENCES feed_post_comments(id) ON DELETE CASCADE,
  content text NOT NULL,
  likes_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS feed_post_reposts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES feed_posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  comment text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE feed_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE feed_posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_post_like ON feed_post_likes;
CREATE TRIGGER on_post_like
  AFTER INSERT OR DELETE ON feed_post_likes
  FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE feed_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE feed_posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_post_comment ON feed_post_comments;
CREATE TRIGGER on_post_comment
  AFTER INSERT OR DELETE ON feed_post_comments
  FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();


-- ═══════════════════════════════
-- PHASE 1D: COMPANY PAGES
-- ═══════════════════════════════

CREATE TABLE IF NOT EXISTS company_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  tagline text,
  description text,
  logo_url text,
  banner_url text,
  website text,
  industry text,
  company_type text
    CHECK(company_type IN (
      'Government PSU', 'Research Lab', 'IIT/NIT', 'Private MNC',
      'Private Indian', 'Startup', 'International'
    )),
  headquarters text,
  founded_year integer,
  employee_count_range text,
  specialties text[],
  follower_count integer DEFAULT 0,
  is_verified boolean DEFAULT false,
  is_claimed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS company_followers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES company_pages(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, user_id)
);

CREATE OR REPLACE FUNCTION update_company_followers()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE company_pages SET follower_count = follower_count + 1 WHERE id = NEW.company_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE company_pages SET follower_count = GREATEST(follower_count - 1, 0) WHERE id = OLD.company_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_company_follow ON company_followers;
CREATE TRIGGER on_company_follow
  AFTER INSERT OR DELETE ON company_followers
  FOR EACH ROW EXECUTE FUNCTION update_company_followers();

ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS
  company_page_id uuid REFERENCES company_pages(id) ON DELETE SET NULL;


-- ═══════════════════════════════
-- PHASE 1E: SKILL ENDORSEMENTS + RECOMMENDATIONS
-- ═══════════════════════════════

CREATE TABLE IF NOT EXISTS skill_endorsements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  endorser_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  skill text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(profile_owner_id, endorser_id, skill),
  CHECK(profile_owner_id != endorser_id)
);

CREATE TABLE IF NOT EXISTS recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  relationship text,
  content text NOT NULL,
  is_visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  CHECK(author_id != recipient_id)
);


-- ═══════════════════════════════
-- PHASE 1F: DIRECT MESSAGING
-- ═══════════════════════════════

CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1 uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_2 uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_at timestamptz DEFAULT now(),
  last_message_preview text,
  unread_count_1 integer DEFAULT 0,
  unread_count_2 integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enforce uniqueness of conversations (A↔B only one) via trigger
CREATE OR REPLACE FUNCTION check_conversation_unique()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM conversations
    WHERE (participant_1 = NEW.participant_2 AND participant_2 = NEW.participant_1)
       OR (participant_1 = NEW.participant_1 AND participant_2 = NEW.participant_2)
  ) THEN
    RAISE EXCEPTION 'Conversation already exists between these users';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_new_conversation ON conversations;
CREATE TRIGGER on_new_conversation
  BEFORE INSERT ON conversations
  FOR EACH ROW EXECUTE FUNCTION check_conversation_unique();

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET
    last_message_at = NEW.created_at,
    last_message_preview = left(NEW.content, 100),
    unread_count_1 = CASE
      WHEN participant_1 != NEW.sender_id THEN unread_count_1 + 1
      ELSE unread_count_1
    END,
    unread_count_2 = CASE
      WHEN participant_2 != NEW.sender_id THEN unread_count_2 + 1
      ELSE unread_count_2
    END
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_new_message ON messages;
CREATE TRIGGER on_new_message
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_on_message();


-- ═══════════════════════════════
-- PHASE 1G: NOTIFICATIONS
-- ═══════════════════════════════

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK(type IN (
    'connection_request', 'connection_accepted', 'follow',
    'post_like', 'post_comment', 'post_repost',
    'skill_endorsement', 'recommendation', 'message',
    'opportunity_match', 'profile_view', 'company_post'
  )),
  actor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type text,
  entity_id uuid,
  message text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, is_read, created_at DESC);


-- ═══════════════════════════════
-- PHASE 1H: ROW LEVEL SECURITY
-- ═══════════════════════════════

ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_post_reposts ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_endorsements ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Follows
CREATE POLICY "Anyone can see follows" ON user_follows FOR SELECT USING (true);
CREATE POLICY "Auth can follow" ON user_follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Auth can unfollow" ON user_follows FOR DELETE USING (auth.uid() = follower_id);

-- Connection requests
CREATE POLICY "See own requests" ON connection_requests FOR SELECT
  USING (auth.uid() IN (sender_id, receiver_id));
CREATE POLICY "Send requests" ON connection_requests FOR INSERT
  WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Manage received requests" ON connection_requests FOR UPDATE
  USING (auth.uid() IN (sender_id, receiver_id));
CREATE POLICY "Withdraw requests" ON connection_requests FOR DELETE
  USING (auth.uid() = sender_id);

-- Connections
CREATE POLICY "See own connections" ON connections FOR SELECT
  USING (auth.uid() IN (user_id_1, user_id_2));

-- Feed posts
CREATE POLICY "Public posts readable" ON feed_posts FOR SELECT USING (
  visibility = 'public' OR auth.uid() = user_id
);
CREATE POLICY "Auth creates posts" ON feed_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own posts update" ON feed_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Own posts delete" ON feed_posts FOR DELETE USING (auth.uid() = user_id);

-- Feed likes
CREATE POLICY "Anyone sees likes" ON feed_post_likes FOR SELECT USING (true);
CREATE POLICY "Auth likes" ON feed_post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth unlikes" ON feed_post_likes FOR DELETE USING (auth.uid() = user_id);

-- Comments
CREATE POLICY "Anyone sees comments" ON feed_post_comments FOR SELECT USING (true);
CREATE POLICY "Auth comments" ON feed_post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Delete own comments" ON feed_post_comments FOR DELETE USING (auth.uid() = user_id);

-- Reposts
CREATE POLICY "Anyone sees reposts" ON feed_post_reposts FOR SELECT USING (true);
CREATE POLICY "Auth reposts" ON feed_post_reposts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth unreposts" ON feed_post_reposts FOR DELETE USING (auth.uid() = user_id);

-- Company pages
CREATE POLICY "Anyone sees companies" ON company_pages FOR SELECT USING (true);
CREATE POLICY "Anyone sees company followers" ON company_followers FOR SELECT USING (true);
CREATE POLICY "Auth follows companies" ON company_followers FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth unfollows companies" ON company_followers FOR DELETE
  USING (auth.uid() = user_id);

-- Endorsements
CREATE POLICY "Anyone sees endorsements" ON skill_endorsements FOR SELECT USING (true);
CREATE POLICY "Auth endorses" ON skill_endorsements FOR INSERT
  WITH CHECK (auth.uid() = endorser_id AND auth.uid() != profile_owner_id);
CREATE POLICY "Auth unendorses" ON skill_endorsements FOR DELETE
  USING (auth.uid() = endorser_id);

-- Recommendations
CREATE POLICY "See visible recommendations" ON recommendations FOR SELECT
  USING (is_visible = true OR auth.uid() IN (author_id, recipient_id));
CREATE POLICY "Auth writes recommendations" ON recommendations FOR INSERT
  WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Hide own received" ON recommendations FOR UPDATE
  USING (auth.uid() = recipient_id);

-- Conversations
CREATE POLICY "See own conversations" ON conversations FOR SELECT
  USING (auth.uid() IN (participant_1, participant_2));
CREATE POLICY "Create conversations" ON conversations FOR INSERT
  WITH CHECK (auth.uid() IN (participant_1, participant_2));
CREATE POLICY "Update own conversations" ON conversations FOR UPDATE
  USING (auth.uid() IN (participant_1, participant_2));

-- Messages
CREATE POLICY "See own messages" ON messages FOR SELECT
  USING (
    auth.uid() = sender_id OR
    auth.uid() IN (
      SELECT participant_1 FROM conversations WHERE id = conversation_id
      UNION
      SELECT participant_2 FROM conversations WHERE id = conversation_id
    )
  );
CREATE POLICY "Send messages" ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Notifications
CREATE POLICY "Own notifications" ON notifications FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "System creates notifications" ON notifications FOR INSERT
  WITH CHECK (true);
CREATE POLICY "Mark own as read" ON notifications FOR UPDATE
  USING (auth.uid() = user_id);


-- ═══════════════════════════════
-- PHASE 1I: SEED COMPANY PAGES
-- ═══════════════════════════════

INSERT INTO company_pages (slug, name, tagline, company_type, headquarters,
  specialties, is_verified, industry) VALUES
('drdo', 'DRDO', 'Designing defence technology for national security',
  'Government PSU', 'New Delhi',
  ARRAY['Defence Electronics', 'Radar', 'Embedded Systems', 'VLSI', 'Semiconductor'],
  true, 'Defence Research'),
('isro', 'ISRO', 'Space for all — India''s premier space agency',
  'Government PSU', 'Bengaluru',
  ARRAY['Space Electronics', 'Satellite Systems', 'Semiconductor', 'RF Systems'],
  true, 'Space Research'),
('csir', 'CSIR', 'Scientific and Industrial Research for India',
  'Government PSU', 'New Delhi',
  ARRAY['Materials Science', 'Electronics', 'Photonics', 'Spintronics'],
  true, 'Scientific Research'),
('iit-delhi', 'IIT Delhi', 'Excellence in Technology Education and Research',
  'IIT/NIT', 'New Delhi',
  ARRAY['VLSI Design', 'Embedded Systems', 'Photonics', 'Semiconductor'],
  true, 'Higher Education'),
('iit-bombay', 'IIT Bombay', 'Advancing Knowledge — Technology for Society',
  'IIT/NIT', 'Mumbai',
  ARRAY['Microelectronics', 'VLSI', 'Embedded Systems', 'Power Electronics'],
  true, 'Higher Education'),
('texas-instruments', 'Texas Instruments India', 'Analog + Embedded Processing',
  'Private MNC', 'Bengaluru',
  ARRAY['Analog IC Design', 'Embedded Processors', 'VLSI', 'DSP'],
  true, 'Semiconductor'),
('qualcomm-india', 'Qualcomm India', 'Leading 5G and semiconductor innovation',
  'Private MNC', 'Bengaluru',
  ARRAY['5G Chips', 'SoC Design', 'VLSI', 'RF Design', 'AI Chips'],
  true, 'Semiconductor'),
('intel-india', 'Intel India', 'Delivering breakthrough technology',
  'Private MNC', 'Bengaluru',
  ARRAY['Microprocessors', 'VLSI', 'AI Chips', 'Semiconductor Manufacturing'],
  true, 'Semiconductor'),
('tata-electronics', 'Tata Electronics', 'Building India''s semiconductor future',
  'Private Indian', 'Mumbai',
  ARRAY['Semiconductor Manufacturing', 'Assembly', 'Electronics Manufacturing'],
  true, 'Semiconductor Manufacturing'),
('iist', 'IIST Thiruvananthapuram', 'Space Science and Technology Education',
  'IIT/NIT', 'Thiruvananthapuram',
  ARRAY['Space Electronics', 'Avionics', 'RF Systems', 'Embedded Systems'],
  true, 'Space Research')
ON CONFLICT (slug) DO NOTHING;
