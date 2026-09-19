-- target: supabase_db1 (primary)
-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX: Social feature RLS policies for v2 column names
-- Created: 2026-08-17
-- Problem: v1 migrations created RLS policies referencing v1 columns
--   (user_id_1/user_id_2, participant_1/participant_2, user_id, content)
--   but the live tables use v2 columns (requester_id/addressee_id,
--   participant_a/participant_b, author_id, body).
--   Additionally, user_profiles RLS only allows viewing own profile.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── 1. USER PROFILES: Add public read policy ──
-- The existing policies only allow viewing own profile.
-- Network suggestions, messages, feed all need to read other users.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles'
      AND policyname = 'Public profiles readable by authenticated users'
  ) THEN
    CREATE POLICY "Public profiles readable by authenticated users"
      ON user_profiles FOR SELECT
      USING (
        is_profile_public = true
        OR auth.uid() = id
      );
  END IF;
END $$;

-- ── 2. CONNECTIONS: Fix RLS for v2 schema (requester_id/addressee_id) ──
-- Drop broken v1 policies that reference user_id_1/user_id_2
DO $$ BEGIN
  DROP POLICY IF EXISTS "See own connections" ON connections;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- Create correct v2 policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'connections'
      AND policyname = 'Users see own connections v2'
  ) THEN
    CREATE POLICY "Users see own connections v2" ON connections
      FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

    CREATE POLICY "Users can send connection requests v2" ON connections
      FOR INSERT WITH CHECK (auth.uid() = requester_id);

    CREATE POLICY "Users can update own connections v2" ON connections
      FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

    CREATE POLICY "Users can delete own connections v2" ON connections
      FOR DELETE USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
  END IF;
END $$;

-- ── 3. CONVERSATIONS: Fix RLS for v2 schema (participant_a/participant_b) ──
DO $$ BEGIN
  DROP POLICY IF EXISTS "See own conversations" ON conversations;
  DROP POLICY IF EXISTS "Create conversations" ON conversations;
  DROP POLICY IF EXISTS "Update own conversations" ON conversations;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'conversations'
      AND policyname = 'Users see own conversations v2'
  ) THEN
    CREATE POLICY "Users see own conversations v2" ON conversations
      FOR SELECT USING (auth.uid() = participant_a OR auth.uid() = participant_b);

    CREATE POLICY "Users can create conversations v2" ON conversations
      FOR INSERT WITH CHECK (auth.uid() = participant_a OR auth.uid() = participant_b);

    CREATE POLICY "Users can update own conversations v2" ON conversations
      FOR UPDATE USING (auth.uid() = participant_a OR auth.uid() = participant_b);
  END IF;
END $$;

-- ── 4. MESSAGES: Fix RLS for v2 schema (body column) ──
DO $$ BEGIN
  DROP POLICY IF EXISTS "See own messages" ON messages;
  DROP POLICY IF EXISTS "Send messages" ON messages;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'messages'
      AND policyname = 'Users see own messages v2'
  ) THEN
    CREATE POLICY "Users see own messages v2" ON messages
      FOR SELECT USING (
        auth.uid() = sender_id
        OR auth.uid() IN (
          SELECT participant_a FROM conversations WHERE id = conversation_id
          UNION
          SELECT participant_b FROM conversations WHERE id = conversation_id
        )
      );

    CREATE POLICY "Users can send messages v2" ON messages
      FOR INSERT WITH CHECK (auth.uid() = sender_id);

    CREATE POLICY "Users can mark messages read v2" ON messages
      FOR UPDATE USING (
        auth.uid() IN (
          SELECT participant_a FROM conversations WHERE id = conversation_id
          UNION
          SELECT participant_b FROM conversations WHERE id = conversation_id
        )
      );
  END IF;
END $$;

-- ── 5. FEED POSTS: Fix RLS for v2 schema (author_id column) ──
DO $$ BEGIN
  DROP POLICY IF EXISTS "Public posts readable" ON feed_posts;
  DROP POLICY IF EXISTS "Auth creates posts" ON feed_posts;
  DROP POLICY IF EXISTS "Own posts update" ON feed_posts;
  DROP POLICY IF EXISTS "Own posts delete" ON feed_posts;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'feed_posts'
      AND policyname = 'Feed posts readable v2'
  ) THEN
    CREATE POLICY "Feed posts readable v2" ON feed_posts
      FOR SELECT USING (
        visibility = 'public'
        OR auth.uid() = author_id
      );

    CREATE POLICY "Auth creates feed posts v2" ON feed_posts
      FOR INSERT WITH CHECK (auth.uid() = author_id);

    CREATE POLICY "Own feed posts update v2" ON feed_posts
      FOR UPDATE USING (auth.uid() = author_id);

    CREATE POLICY "Own feed posts delete v2" ON feed_posts
      FOR DELETE USING (auth.uid() = author_id);
  END IF;
END $$;

-- ── 6. FEED POST LIKES: Fix RLS if table exists ──
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feed_post_likes') THEN
    DROP POLICY IF EXISTS "Anyone sees likes" ON feed_post_likes;
    DROP POLICY IF EXISTS "Auth likes" ON feed_post_likes;
    DROP POLICY IF EXISTS "Auth unlikes" ON feed_post_likes;

    CREATE POLICY "Anyone sees feed likes v2" ON feed_post_likes
      FOR SELECT USING (true);
    CREATE POLICY "Auth can like v2" ON feed_post_likes
      FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Auth can unlike v2" ON feed_post_likes
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ── 7. FEED POST COMMENTS: Fix RLS if table exists ──
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feed_post_comments') THEN
    DROP POLICY IF EXISTS "Anyone sees comments" ON feed_post_comments;
    DROP POLICY IF EXISTS "Auth comments" ON feed_post_comments;
    DROP POLICY IF EXISTS "Delete own comments" ON feed_post_comments;

    CREATE POLICY "Anyone sees feed comments v2" ON feed_post_comments
      FOR SELECT USING (true);
    CREATE POLICY "Auth can comment v2" ON feed_post_comments
      FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Auth can delete own comment v2" ON feed_post_comments
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ── 8. FEED POST REPOSTS: Fix RLS if table exists ──
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feed_post_reposts') THEN
    DROP POLICY IF EXISTS "Anyone sees reposts" ON feed_post_reposts;
    DROP POLICY IF EXISTS "Auth reposts" ON feed_post_reposts;
    DROP POLICY IF EXISTS "Auth unreposts" ON feed_post_reposts;

    CREATE POLICY "Anyone sees reposts v2" ON feed_post_reposts
      FOR SELECT USING (true);
    CREATE POLICY "Auth can repost v2" ON feed_post_reposts
      FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Auth can unrepost v2" ON feed_post_reposts
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ── 9. NOTIFICATIONS: Fix RLS ──
DO $$ BEGIN
  DROP POLICY IF EXISTS "Own notifications" ON notifications;
  DROP POLICY IF EXISTS "System creates notifications" ON notifications;
  DROP POLICY IF EXISTS "Mark own as read" ON notifications;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'notifications'
      AND policyname = 'Users see own notifications v2'
  ) THEN
    CREATE POLICY "Users see own notifications v2" ON notifications
      FOR SELECT USING (auth.uid() = user_id);

    CREATE POLICY "Auth creates notifications v2" ON notifications
      FOR INSERT WITH CHECK (auth.uid() = actor_id OR auth.uid() = user_id);

    CREATE POLICY "Users update own notifications v2" ON notifications
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ── 10. USER FOLLOWS: Fix RLS ──
DO $$ BEGIN
  DROP POLICY IF EXISTS "Anyone can see follows" ON user_follows;
  DROP POLICY IF EXISTS "Auth can follow" ON user_follows;
  DROP POLICY IF EXISTS "Auth can unfollow" ON user_follows;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_follows'
      AND policyname = 'Follows readable v2'
  ) THEN
    CREATE POLICY "Follows readable v2" ON user_follows
      FOR SELECT USING (true);
    CREATE POLICY "Auth can follow v2" ON user_follows
      FOR INSERT WITH CHECK (auth.uid() = follower_id);
    CREATE POLICY "Auth can unfollow v2" ON user_follows
      FOR DELETE USING (auth.uid() = follower_id);
  END IF;
END $$;

-- ── 11. POST_REACTIONS: SKIP — feed_post_likes is the real table (verified live) ──
-- Code uses feed_post_likes, not post_reactions. This section left intentionally empty.

-- ── 12. FEED_POSTS: Ensure missing columns exist ──
ALTER TABLE feed_posts ADD COLUMN IF NOT EXISTS like_count integer DEFAULT 0;
ALTER TABLE feed_posts ADD COLUMN IF NOT EXISTS comment_count integer DEFAULT 0;
ALTER TABLE feed_posts ADD COLUMN IF NOT EXISTS reposts_count integer DEFAULT 0;
ALTER TABLE feed_posts ADD COLUMN IF NOT EXISTS views_count integer DEFAULT 0;
ALTER TABLE feed_posts ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'public';
ALTER TABLE feed_posts ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
