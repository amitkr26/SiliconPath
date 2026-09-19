-- ==============================================================================
-- Migration: 20260823120000_security_hardening_followup.sql
-- Project: aqauempuwmbizqoaolop
-- Date: 2026-08-23
-- Purpose: Live Supabase Security Advisor Findings Remediation
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


-- 2. SECURITY DEFINER SEARCH_PATH HARDENING & EXECUTE PRIVILEGE REMEDIATION

DO $$
DECLARE
  func_rec RECORD;
BEGIN
  -- 2.1 Set explicit safe search_path = public on all SECURITY DEFINER functions
  FOR func_rec IN (
    SELECT p.oid::regprocedure AS proc_name
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
  ) LOOP
    EXECUTE 'ALTER FUNCTION ' || func_rec.proc_name || ' SET search_path = public';
  END LOOP;

  -- 2.2 Revoke direct execution on internal trigger/admin functions from anon, authenticated, public
  FOR func_rec IN (
    SELECT p.oid::regprocedure AS proc_name
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'handle_new_user',
        'auto_username',
        'handle_connection_accepted',
        'handle_connection_count',
        'handle_follow',
        'update_post_likes_count',
        'update_post_comments_count',
        'update_conversation_on_message',
        'auto_slug',
        'check_connection_unique',
        'update_company_followers',
        'check_conversation_unique',
        'rls_auto_enable'
      )
  ) LOOP
    EXECUTE 'REVOKE EXECUTE ON FUNCTION ' || func_rec.proc_name || ' FROM anon, authenticated, public';
  END LOOP;

  -- 2.3 Ensure handle_new_user specifically has search_path including auth schema if needed
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') THEN
    ALTER FUNCTION public.handle_new_user() SET search_path = public, auth;
  END IF;

  -- 2.4 Ensure legitimate public RPC increment_profile_views is granted to anon and authenticated
  FOR func_rec IN (
    SELECT p.oid::regprocedure AS proc_name
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'increment_profile_views'
  ) LOOP
    EXECUTE 'GRANT EXECUTE ON FUNCTION ' || func_rec.proc_name || ' TO anon, authenticated';
  END LOOP;
END $$;
