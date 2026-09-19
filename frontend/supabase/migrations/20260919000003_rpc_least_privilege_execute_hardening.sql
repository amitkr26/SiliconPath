-- ==============================================================================
-- BerojgarDegreeWala Migration: 20260919000003_rpc_least_privilege_execute_hardening.sql
-- Description: Revoke direct RPC execute permissions from PUBLIC, anon, and
--              authenticated roles on get_unread_message_count and
--              get_user_conversations_overview. Enforce least privilege by
--              permitting execution exclusively for service_role and postgres.
-- Target DB: Supabase DB1
-- ==============================================================================

-- 1. Revoke execute privileges on get_unread_message_count
REVOKE EXECUTE ON FUNCTION public.get_unread_message_count(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_unread_message_count(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_unread_message_count(uuid) FROM authenticated;

-- 2. Revoke execute privileges on get_user_conversations_overview
REVOKE EXECUTE ON FUNCTION public.get_user_conversations_overview(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_conversations_overview(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_conversations_overview(uuid) FROM authenticated;

-- 3. Explicitly grant execute to service_role (trusted Next.js server client)
GRANT EXECUTE ON FUNCTION public.get_unread_message_count(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_conversations_overview(uuid) TO service_role;
