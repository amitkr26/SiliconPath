-- target: supabase_db1 (primary)
-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX: user_follows / connections count columns missing on live user_profiles
-- Created: 2026-08-18
-- Problem: trigger `handle_follow()` (on user_follows INSERT/DELETE) does
--   `UPDATE user_profiles SET follower_count = follower_count + 1 ...` but the
--   live `user_profiles` table has no follower_count / following_count /
--   connection_count columns. Every follow POST failed with:
--     ERROR: column "follower_count" does not exist
--   (reported in production DevTools as a 500 on POST /api/network/follow/[id]).
-- Fix: add the three count columns (they are part of the intended schema —
--   see project-bible/06-database/README.md user_profiles) and backfill them
--   from actual user_follows / connections data.
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS follower_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS following_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS connection_count integer NOT NULL DEFAULT 0;

-- Backfill from real data (idempotent)
UPDATE public.user_profiles u
SET follower_count = (SELECT count(*) FROM public.user_follows f WHERE f.following_id = u.id),
    following_count = (SELECT count(*) FROM public.user_follows f WHERE f.follower_id = u.id);

UPDATE public.user_profiles u
SET connection_count = (
  SELECT count(*) FROM public.connections c
  WHERE c.status = 'accepted' AND (c.requester_id = u.id OR c.addressee_id = u.id)
);
