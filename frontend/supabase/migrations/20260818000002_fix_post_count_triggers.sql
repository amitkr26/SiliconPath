-- Fix feed post count triggers:
-- 1. update_post_likes_count wrote a nonexistent feed_posts.likes_count column
--    (42703) -> every like INSERT failed at the DB level while the API route
--    masked it by returning { liked: true } without checking the error.
-- 2. Both counters are SECURITY DEFINER so the count UPDATE is not
--    RLS-filtered for plain-user (authenticated) inserts — counts now always
--    match the number of like/comment rows regardless of insert path.
-- Applied live to Project 1 (aqauempuwmbizqoaolop) via Management API.
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE feed_posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE feed_posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_post_comments_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE feed_posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE feed_posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$function$;
