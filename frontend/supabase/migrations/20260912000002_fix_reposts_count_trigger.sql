-- Fix feed_post_reposts count trigger:
-- reposts_count on feed_posts was never incremented because no trigger existed.
-- Pattern matches update_post_likes_count / update_post_comments_count.
CREATE OR REPLACE FUNCTION public.update_post_reposts_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE feed_posts SET reposts_count = reposts_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE feed_posts SET reposts_count = GREATEST(reposts_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$function$;

DROP TRIGGER IF EXISTS on_repost_change ON feed_post_reposts;
CREATE TRIGGER on_repost_change
  AFTER INSERT OR DELETE ON feed_post_reposts
  FOR EACH ROW EXECUTE FUNCTION update_post_reposts_count();

-- Harden: set search_path and revoke direct execution (matches likes/comments pattern)
ALTER FUNCTION public.update_post_reposts_count() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.update_post_reposts_count() FROM anon, authenticated;

-- Backfill: set reposts_count to actual row count for all existing posts
UPDATE feed_posts p SET reposts_count = (
  SELECT COUNT(*)::int FROM feed_post_reposts r WHERE r.post_id = p.id
);
