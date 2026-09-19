-- Migration: 20260919000001_messaging_hardening_realtime_indexes.sql
-- Description: Messaging hardening, Realtime publication, composite indexes, hardened RLS, and high-speed overview RPCs

-- 1. Enable Supabase Realtime for messages table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;

-- 2. Indexes for fast conversation sorting and unread counting
CREATE INDEX IF NOT EXISTS idx_messages_unread_partial
  ON public.messages (conversation_id, sender_id)
  WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_conversations_participant_a_last_msg
  ON public.conversations (participant_a, last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_participant_b_last_msg
  ON public.conversations (participant_b, last_message_at DESC);

-- 3. Harden RLS on messages INSERT to enforce participant membership
DROP POLICY IF EXISTS "send messages" ON public.messages;
CREATE POLICY "send messages" ON public.messages
  FOR INSERT TO public
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (c.participant_a = auth.uid() OR c.participant_b = auth.uid())
    )
  );

-- 4. RLS on messages UPDATE for marking received messages read
DROP POLICY IF EXISTS "mark own received messages read" ON public.messages;
CREATE POLICY "mark own received messages read" ON public.messages
  FOR UPDATE TO public
  USING (
    sender_id != auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (c.participant_a = auth.uid() OR c.participant_b = auth.uid())
    )
  )
  WITH CHECK (
    sender_id != auth.uid() AND
    is_read = true AND
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (c.participant_a = auth.uid() OR c.participant_b = auth.uid())
    )
  );

-- 5. Scalar RPC: get unread message count for a user in a single fast query
CREATE OR REPLACE FUNCTION public.get_unread_message_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(COUNT(m.id)::INTEGER, 0)
  FROM public.messages m
  JOIN public.conversations c ON c.id = m.conversation_id
  WHERE (c.participant_a = p_user_id OR c.participant_b = p_user_id)
    AND m.sender_id != p_user_id
    AND m.is_read = false;
$$;

-- 6. RPC: get user conversations overview in 1 single query (eliminates N+1 loop)
CREATE OR REPLACE FUNCTION public.get_user_conversations_overview(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  participant_a UUID,
  participant_b UUID,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  other_id UUID,
  other_display_name TEXT,
  other_avatar_url TEXT,
  other_headline TEXT,
  last_message_body TEXT,
  last_message_created_at TIMESTAMPTZ,
  unread_count BIGINT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  WITH user_convs AS (
    SELECT c.id, c.participant_a, c.participant_b, c.last_message_at, c.created_at,
           CASE WHEN c.participant_a = p_user_id THEN c.participant_b ELSE c.participant_a END AS other_user_id
    FROM public.conversations c
    WHERE c.participant_a = p_user_id OR c.participant_b = p_user_id
    ORDER BY c.last_message_at DESC NULLS LAST
  ),
  last_msgs AS (
    SELECT DISTINCT ON (m.conversation_id)
           m.conversation_id, m.body, m.created_at
    FROM public.messages m
    JOIN user_convs uc ON uc.id = m.conversation_id
    ORDER BY m.conversation_id, m.created_at DESC
  ),
  unreads AS (
    SELECT m.conversation_id, COUNT(m.id) AS unread_cnt
    FROM public.messages m
    JOIN user_convs uc ON uc.id = m.conversation_id
    WHERE m.is_read = false AND m.sender_id != p_user_id
    GROUP BY m.conversation_id
  )
  SELECT
    uc.id,
    uc.participant_a,
    uc.participant_b,
    uc.last_message_at,
    uc.created_at,
    uc.other_user_id AS other_id,
    up.display_name AS other_display_name,
    up.avatar_url AS other_avatar_url,
    up.headline AS other_headline,
    lm.body AS last_message_body,
    lm.created_at AS last_message_created_at,
    COALESCE(u.unread_cnt, 0) AS unread_count
  FROM user_convs uc
  LEFT JOIN public.user_profiles up ON up.id = uc.other_user_id
  LEFT JOIN last_msgs lm ON lm.conversation_id = uc.id
  LEFT JOIN unreads u ON u.conversation_id = uc.id
  ORDER BY uc.last_message_at DESC NULLS LAST;
$$;
