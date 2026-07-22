-- target: supabase_db1
-- LinkedIn-style features (dormant — will activate when companies join)

CREATE TABLE IF NOT EXISTS company_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  tagline TEXT,
  description TEXT,
  website TEXT,
  logo_url TEXT,
  banner_url TEXT,
  industry TEXT,
  size TEXT CHECK (size IN ('1-10','11-50','51-200','201-500','501-1000','1000+')),
  founded_year INTEGER,
  location TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  follower_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS company_followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, user_id)
);

CREATE TABLE IF NOT EXISTS company_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  job_type TEXT CHECK (job_type IN ('Full-time','Part-time','Internship','Contract','Research')),
  experience_level TEXT,
  salary_range TEXT,
  apply_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','withdrawn')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requester_id, receiver_id)
);

CREATE TABLE IF NOT EXISTS user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

CREATE TABLE IF NOT EXISTS feed_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES company_profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  post_type TEXT DEFAULT 'post' CHECK (post_type IN ('post','article','achievement','question','opportunity')),
  media_urls TEXT[] DEFAULT '{}',
  likes INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feed_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS feed_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS skill_endorsements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  endorser_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, endorser_id, skill)
);

-- RLS for all LinkedIn tables
ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read companies" ON company_profiles FOR SELECT USING (TRUE);
CREATE POLICY "Company owner manage" ON company_profiles FOR ALL USING (auth.uid() = user_id);

ALTER TABLE company_followers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth manage follows" ON company_followers FOR ALL USING (auth.uid() = user_id);

ALTER TABLE company_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active jobs" ON company_jobs FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Service role manage company jobs" ON company_jobs FOR ALL USING (auth.role() = 'service_role');

ALTER TABLE user_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own connections" ON user_connections FOR ALL
  USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth manage user follows" ON user_follows FOR ALL
  USING (auth.uid() = follower_id);
CREATE POLICY "Public read follows" ON user_follows FOR SELECT USING (TRUE);

ALTER TABLE feed_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read feed" ON feed_posts FOR SELECT USING (is_published = TRUE);
CREATE POLICY "Auth create posts" ON feed_posts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users manage own posts" ON feed_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own posts" ON feed_posts FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE feed_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth manage likes" ON feed_likes FOR ALL USING (auth.uid() = user_id);

ALTER TABLE feed_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read comments" ON feed_comments FOR SELECT USING (true);
CREATE POLICY "Auth create comments" ON feed_comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users delete own comments" ON feed_comments FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own messages" ON direct_messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Auth send messages" ON direct_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own notifications" ON notifications FOR ALL
  USING (auth.uid() = user_id);

ALTER TABLE skill_endorsements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read endorsements" ON skill_endorsements FOR SELECT USING (TRUE);
CREATE POLICY "Auth endorse" ON skill_endorsements FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
