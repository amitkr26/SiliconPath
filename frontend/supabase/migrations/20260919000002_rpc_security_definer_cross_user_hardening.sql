-- ==============================================================================
-- BerojgarDegreeWala Migration: 20260919000002_rpc_security_definer_cross_user_hardening.sql
-- Description: Harden get_unread_message_count and get_user_conversations_overview
--              against cross-user data exfiltration and search_path manipulation.
-- Target DB: Supabase DB1
-- ==============================================================================

-- 1. Harden get_unread_message_count
CREATE OR REPLACE FUNCTION public.get_unread_message_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Security Gate:
  -- 1. If caller is an authenticated user, p_user_id MUST equal auth.uid().
  --    Cross-user inspection of unread messages is strictly forbidden.
  -- 2. Anon callers are denied.
  -- 3. Service role / postgres superuser callers are permitted.
  IF (auth.role() = 'authenticated' AND (auth.uid() IS NULL OR auth.uid() != p_user_id))
     OR (auth.role() = 'anon') THEN
    RAISE EXCEPTION 'Access denied: unauthorized access to user messaging data' USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(COUNT(*)::INTEGER, 0)
  INTO v_count
  FROM public.messages m
  JOIN public.conversations c ON c.id = m.conversation_id
  WHERE (c.participant_a = p_user_id OR c.participant_b = p_user_id)
    AND m.sender_id != p_user_id
    AND m.is_read = false;

  RETURN v_count;
END;
$$;

-- 2. Harden get_user_conversations_overview
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
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
BEGIN
  -- Security Gate:
  -- 1. If caller is an authenticated user, p_user_id MUST equal auth.uid().
  --    Cross-user inspection of conversation lists is strictly forbidden.
  -- 2. Anon callers are denied.
  -- 3. Service role / postgres superuser callers are permitted.
  IF (auth.role() = 'authenticated' AND (auth.uid() IS NULL OR auth.uid() != p_user_id))
     OR (auth.role() = 'anon') THEN
    RAISE EXCEPTION 'Access denied: unauthorized access to user messaging data' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH user_convs AS (
    SELECT c.id, c.participant_a, c.participant_b, c.last_message_at, c.created_at,
           CASE WHEN c.participant_a = p_user_id THEN c.participant_b ELSE c.participant_a END AS other_user_id
    FROM public.conversations c
    WHERE c.participant_a = p_user_id OR c.participant_b = p_user_id
  )
  SELECT
    uc.id,
    uc.participant_a,
    uc.participant_b,
    uc.last_message_at,
    uc.created_at,
    p.id AS other_id,
    p.display_name AS other_display_name,
    p.avatar_url AS other_avatar_url,
    p.headline AS other_headline,
    lm.body AS last_message_body,
    lm.created_at AS last_message_created_at,
    COALESCE(unr.unread_cnt, 0)::BIGINT AS unread_count
  FROM user_convs uc
  LEFT JOIN public.user_profiles p ON p.id = uc.other_user_id
  LEFT JOIN LATERAL (
    SELECT m.body, m.created_at
    FROM public.messages m
    WHERE m.conversation_id = uc.id
    ORDER BY m.created_at DESC
    LIMIT 1
  ) lm ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS unread_cnt
    FROM public.messages m
    WHERE m.conversation_id = uc.id
      AND m.sender_id != p_user_id
      AND m.is_read = false
  ) unr ON true
  ORDER BY uc.last_message_at DESC NULLS LAST;
END;
$$;
