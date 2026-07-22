-- target: supabase_db2
-- ════════════════════════════════════════
-- BEROJGARDEGREEWALA — SUPABASE SECONDARY (DB2)
-- PURPOSE: User profiles, resumes, networking, direct messages
-- Tables: user_profiles, user_resumes, saved_opportunities, applications,
--         user_follows, connection_requests, feed_posts, messages, notifications
-- ════════════════════════════════════════

-- ── USER PROFILES ──
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  full_name text,
  headline text,
  about text,
  avatar_url text,
  banner_url text,
  qualification text,
  specialization text,
  current_position text,
  current_org text,
  city text,
  country text DEFAULT 'India',
  website_url text,
  linkedin_url text,
  github_url text,
  has_net boolean DEFAULT false,
  has_gate boolean DEFAULT false,
  preferred_location text,
  is_open_to_work boolean DEFAULT false,
  open_to_work_types text[],
  is_profile_public boolean DEFAULT true,
  skills text[],
  profile_views integer DEFAULT 0,
  follower_count integer DEFAULT 0,
  following_count integer DEFAULT 0,
  connection_count integer DEFAULT 0,
  resume_ats_score integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ── USER RESUMES ──
CREATE TABLE IF NOT EXISTS user_resumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text, email text, phone text, linkedin text, github text,
  education jsonb DEFAULT '[]',
  skills text[],
  experience jsonb DEFAULT '[]',
  projects jsonb DEFAULT '[]',
  publications jsonb DEFAULT '[]',
  ats_score integer DEFAULT 0,
  ats_feedback jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ── SAVED OPPORTUNITIES ──
CREATE TABLE IF NOT EXISTS saved_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id uuid NOT NULL,   -- Cross-DB reference to DB1
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, opportunity_id)
);

-- ── APPLICATIONS ──
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id uuid NOT NULL,   -- Cross-DB reference to DB1
  opportunity_title text,
  opportunity_org text,
  opportunity_deadline date,
  status text DEFAULT 'saved' CHECK(status IN (
    'saved', 'applied', 'under_review', 'shortlisted',
    'interview', 'offer', 'accepted', 'rejected', 'withdrawn'
  )),
  notes text,
  applied_at timestamptz,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- ── USER ALERTS ──
CREATE TABLE IF NOT EXISTS user_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  keywords text[],
  categories text[],
  locations text[],
  frequency text DEFAULT 'daily' CHECK(frequency IN ('instant', 'daily', 'weekly')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ── SOCIAL: FOLLOWS ──
CREATE TABLE IF NOT EXISTS user_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK(follower_id != following_id)
);

-- ── SOCIAL: CONNECTIONS ──
CREATE TABLE IF NOT EXISTS connection_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  status text DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'declined', 'withdrawn')),
  message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(sender_id, receiver_id),
  CHECK(sender_id != receiver_id)
);

-- ── FEED POSTS ──
CREATE TABLE IF NOT EXISTS feed_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  post_type text DEFAULT 'post' CHECK(post_type IN (
    'post', 'article', 'opportunity_share', 'achievement', 'question'
  )),
  opportunity_id uuid,            -- Cross-DB reference to DB1
  opportunity_title text,
  opportunity_org text,
  tags text[],
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  visibility text DEFAULT 'public' CHECK(visibility IN ('public', 'connections')),
  created_at timestamptz DEFAULT now()
);

-- ── COMMUNITY POSTS ──
CREATE TABLE IF NOT EXISTS community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  category text DEFAULT 'general' CHECK(category IN (
    'general', 'qna', 'discussion', 'showcase', 'trending', 'interview_exp'
  )),
  tags text[],
  upvotes integer DEFAULT 0,
  comment_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS community_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS community_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  UNIQUE(post_id, user_id)
);

-- ── MESSAGES ──
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

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ── NOTIFICATIONS ──
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  actor_id uuid REFERENCES auth.users(id),
  entity_type text,
  entity_id uuid,
  message text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ── SKILL ENDORSEMENTS ──
CREATE TABLE IF NOT EXISTS skill_endorsements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  endorser_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  skill text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(profile_owner_id, endorser_id, skill)
);

-- ── RECOMMENDATIONS ──
CREATE TABLE IF NOT EXISTS recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  relationship text,
  content text NOT NULL,
  is_visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ── ROW LEVEL SECURITY ──
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_endorsements ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
