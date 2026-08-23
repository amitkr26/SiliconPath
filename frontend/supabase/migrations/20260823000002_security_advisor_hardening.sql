-- ==============================================================================
-- PHASE 14: SUPABASE SECURITY ADVISOR REMEDIATION & HARDENING
-- Project: aqauempuwmbizqoaolop
-- Date: 2026-08-23
-- ==============================================================================

-- 1. RLS POLICIES FOR TABLES WITH RLS ENABLED BUT NO POLICIES

-- Table: calendar_exports
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'calendar_exports' AND policyname = 'calendar_exports_user_access'
  ) THEN
    CREATE POLICY "calendar_exports_user_access" ON public.calendar_exports
      FOR ALL TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Table: link_check_logs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'link_check_logs' AND policyname = 'link_check_logs_admin_read'
  ) THEN
    CREATE POLICY "link_check_logs_admin_read" ON public.link_check_logs
      FOR SELECT TO authenticated
      USING ((auth.jwt() ->> 'role') = 'admin' OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
  END IF;
END $$;

-- Table: scrape_sources
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'scrape_sources' AND policyname = 'scrape_sources_admin_read'
  ) THEN
    CREATE POLICY "scrape_sources_admin_read" ON public.scrape_sources
      FOR SELECT TO authenticated
      USING ((auth.jwt() ->> 'role') = 'admin' OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
  END IF;
END $$;

-- Table: subscribers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'subscribers' AND policyname = 'subscribers_public_insert'
  ) THEN
    CREATE POLICY "subscribers_public_insert" ON public.subscribers
      FOR INSERT TO anon, authenticated
      WITH CHECK (email IS NOT NULL AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
  END IF;
END $$;


-- 2. SECURITY DEFINER SEARCH_PATH HARDENING & EXECUTE REVOCATION

DO $$
BEGIN
  -- handle_new_user
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') THEN
    ALTER FUNCTION public.handle_new_user() SET search_path = public, auth;
    REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
  END IF;

  -- auto_username
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'auto_username') THEN
    ALTER FUNCTION public.auto_username() SET search_path = public;
    REVOKE EXECUTE ON FUNCTION public.auto_username() FROM anon, authenticated;
  END IF;

  -- handle_connection_accepted
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_connection_accepted') THEN
    ALTER FUNCTION public.handle_connection_accepted() SET search_path = public;
    REVOKE EXECUTE ON FUNCTION public.handle_connection_accepted() FROM anon, authenticated;
  END IF;

  -- handle_connection_count
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_connection_count') THEN
    ALTER FUNCTION public.handle_connection_count() SET search_path = public;
    REVOKE EXECUTE ON FUNCTION public.handle_connection_count() FROM anon, authenticated;
  END IF;

  -- handle_follow
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_follow') THEN
    ALTER FUNCTION public.handle_follow() SET search_path = public;
    REVOKE EXECUTE ON FUNCTION public.handle_follow() FROM anon, authenticated;
  END IF;

  -- update_post_likes_count
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_post_likes_count') THEN
    ALTER FUNCTION public.update_post_likes_count() SET search_path = public;
    REVOKE EXECUTE ON FUNCTION public.update_post_likes_count() FROM anon, authenticated;
  END IF;

  -- update_post_comments_count
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_post_comments_count') THEN
    ALTER FUNCTION public.update_post_comments_count() SET search_path = public;
    REVOKE EXECUTE ON FUNCTION public.update_post_comments_count() FROM anon, authenticated;
  END IF;

  -- update_conversation_on_message
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_conversation_on_message') THEN
    ALTER FUNCTION public.update_conversation_on_message() SET search_path = public;
    REVOKE EXECUTE ON FUNCTION public.update_conversation_on_message() FROM anon, authenticated;
  END IF;

  -- generate_slug
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_slug' AND pronargs = 1) THEN
    ALTER FUNCTION public.generate_slug(text) SET search_path = public;
  END IF;

  -- auto_slug
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'auto_slug') THEN
    ALTER FUNCTION public.auto_slug() SET search_path = public;
    REVOKE EXECUTE ON FUNCTION public.auto_slug() FROM anon, authenticated;
  END IF;

  -- check_connection_unique
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_connection_unique') THEN
    ALTER FUNCTION public.check_connection_unique() SET search_path = public;
    REVOKE EXECUTE ON FUNCTION public.check_connection_unique() FROM anon, authenticated;
  END IF;

  -- update_company_followers
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_company_followers') THEN
    ALTER FUNCTION public.update_company_followers() SET search_path = public;
    REVOKE EXECUTE ON FUNCTION public.update_company_followers() FROM anon, authenticated;
  END IF;

  -- check_conversation_unique
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_conversation_unique') THEN
    ALTER FUNCTION public.check_conversation_unique() SET search_path = public;
    REVOKE EXECUTE ON FUNCTION public.check_conversation_unique() FROM anon, authenticated;
  END IF;

  -- rls_auto_enable
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'rls_auto_enable') THEN
    ALTER FUNCTION public.rls_auto_enable() SET search_path = public;
    REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM anon, authenticated, public;
  END IF;

  -- increment_profile_views (Explicitly public RPC)
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'increment_profile_views') THEN
    ALTER FUNCTION public.increment_profile_views(uuid) SET search_path = public;
    GRANT EXECUTE ON FUNCTION public.increment_profile_views(uuid) TO anon, authenticated;
  END IF;
END $$;
