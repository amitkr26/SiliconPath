-- ════════════════════════════════════════════════════════════
-- SILICONPATH — DB1 Schema Consolidation (Phase 2)
-- Database: Supabase Primary (Core Platform + Social)
-- Migration: 001 (additive, non-destructive)
-- ════════════════════════════════════════════════════════════

-- ============================================================
-- PART 1: MISSING TABLES
-- ============================================================

-- user_alerts (defined in DB2 migration but lives on DB1)
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

-- ============================================================
-- PART 2: MISSING COLUMNS
-- ============================================================

-- opportunities: ensure canonical columns exist
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS company_page_id uuid REFERENCES company_pages(id) ON DELETE SET NULL;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS source_type text;

-- news_articles: ensure canonical columns exist
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS source_name text;
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS url text UNIQUE;

-- copy data between drifted columns (safe no-op if already populated)
UPDATE news_articles SET source_name = source WHERE source_name IS NULL AND source IS NOT NULL;
UPDATE news_articles SET url = source_url WHERE url IS NULL AND source_url IS NOT NULL;

-- scraper_sources: add missing columns
ALTER TABLE scraper_sources ADD COLUMN IF NOT EXISTS batch integer DEFAULT 1;
ALTER TABLE scraper_sources ADD COLUMN IF NOT EXISTS organization_id uuid;
ALTER TABLE scraper_sources ADD COLUMN IF NOT EXISTS adapter text;

-- feed_posts: add missing columns from linkedin migration
ALTER TABLE feed_posts ADD COLUMN IF NOT EXISTS article_title text;
ALTER TABLE feed_posts ADD COLUMN IF NOT EXISTS article_cover_url text;
ALTER TABLE feed_posts ADD COLUMN IF NOT EXISTS reposts_count integer DEFAULT 0;
ALTER TABLE feed_posts ADD COLUMN IF NOT EXISTS views_count integer DEFAULT 0;
ALTER TABLE feed_posts ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false;
ALTER TABLE feed_posts ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- feed_post_likes: add reaction column if table uses different schema
ALTER TABLE feed_post_likes ADD COLUMN IF NOT EXISTS reaction text DEFAULT 'like'
  CHECK(reaction IN ('like', 'celebrate', 'support', 'insightful', 'curious'));

-- Add backward-compat generated columns for column drift
-- apply_link <-> apply_url alias
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS apply_url text GENERATED ALWAYS AS (COALESCE(apply_link, '')) STORED;
-- stipend <-> salary_range alias
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS salary_range text GENERATED ALWAYS AS (COALESCE(stipend, '')) STORED;

-- Connection views for backward compat
-- (application-level aliases in KNOWN_COLUMN_ALIASES handle this; these generated cols are optional)

-- ============================================================
-- PART 3: MISSING INDEXES
-- ============================================================

-- User profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_city ON user_profiles(city);
CREATE INDEX IF NOT EXISTS idx_user_profiles_open_to_work ON user_profiles(is_open_to_work);

-- Saved opportunities
CREATE INDEX IF NOT EXISTS idx_saved_opp_user ON saved_opportunities(user_id);

-- Applications
CREATE INDEX IF NOT EXISTS idx_applications_user ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_opportunity ON applications(opportunity_id);

-- Feed posts
CREATE INDEX IF NOT EXISTS idx_feed_posts_user ON feed_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_feed_posts_created ON feed_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_posts_type ON feed_posts(post_type);

-- Feed interactions
CREATE INDEX IF NOT EXISTS idx_feed_likes_post ON feed_post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_feed_comments_post ON feed_post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_feed_reposts_post ON feed_post_reposts(post_id);

-- Conversations & messages
CREATE INDEX IF NOT EXISTS idx_conversations_p1 ON conversations(participant_1);
CREATE INDEX IF NOT EXISTS idx_conversations_p2 ON conversations(participant_2);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);

-- Social
CREATE INDEX IF NOT EXISTS idx_endorsements_owner ON skill_endorsements(profile_owner_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_recipient ON recommendations(recipient_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON user_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_conn_req_sender ON connection_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_conn_req_receiver ON connection_requests(receiver_id);

-- Company pages
CREATE INDEX IF NOT EXISTS idx_company_pages_industry ON company_pages(industry);
CREATE INDEX IF NOT EXISTS idx_company_followers_company ON company_followers(company_id);

-- Community
CREATE INDEX IF NOT EXISTS idx_community_posts_created ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_category ON community_posts(category);
CREATE INDEX IF NOT EXISTS idx_community_comments_post ON community_comments(post_id);

-- Academy
CREATE INDEX IF NOT EXISTS idx_learning_tracks_order ON learning_tracks(order_index);
CREATE INDEX IF NOT EXISTS idx_learning_progress_status ON user_learning_progress(status);
CREATE INDEX IF NOT EXISTS idx_assessment_results_track ON user_track_assessment_results(track_id);

-- Scraper sources
CREATE INDEX IF NOT EXISTS idx_scraper_sources_active ON scraper_sources(is_active, last_scraped_at);
CREATE INDEX IF NOT EXISTS idx_scraper_sources_type ON scraper_sources(type);

-- User alerts
CREATE INDEX IF NOT EXISTS idx_user_alerts_user ON user_alerts(user_id);

-- Subs
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);
CREATE INDEX IF NOT EXISTS idx_subscribers_active ON subscribers(is_active);

-- ============================================================
-- PART 4: MISSING FOREIGN KEYS
-- ============================================================

-- Only add FKs where both tables are on the same database
-- (cross-db reference columns like opportunity_id in saved_opportunities cannot have FKs)

-- ============================================================
-- PART 5: MISSING RLS POLICIES
-- ============================================================

-- User profiles: public read for profile pages
DROP POLICY IF EXISTS "Public can read profiles" ON user_profiles;
CREATE POLICY "Public can read profiles" ON user_profiles
  FOR SELECT USING (is_profile_public = true OR auth.uid() = id);

-- user_alerts: manage own
ALTER TABLE user_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own alerts" ON user_alerts;
CREATE POLICY "Users manage own alerts" ON user_alerts
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- PART 6: MISSING TRIGGERS
-- ============================================================

-- Generic updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at column (safe: DROP+CREATE IF NOT EXISTS pattern)
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'opportunities', 'companies', 'company_pages', 'user_profiles',
      'feed_posts', 'learning_tracks', 'connection_requests',
      'applications', 'user_resumes'
    ])
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%s_updated_at ON %s;', tbl, tbl
    );
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON %s
       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();', tbl, tbl
    );
  END LOOP;
END;
$$;

-- ============================================================
-- PART 7: FUNCTION CONSOLIDATION
-- ============================================================

-- Drop duplicate slug function, keep the working one
-- generate_opp_slug (db1_core_schema) and generate_slug (verification_and_slugs)
-- are functionally identical. Keep both for backward compat.
