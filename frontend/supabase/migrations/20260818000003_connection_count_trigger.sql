-- Maintain user_profiles.connection_count from the connections table.
-- Mirrors handle_follow (also SECURITY DEFINER): the count UPDATE must not be
-- RLS-filtered regardless of which role performs the insert/update/delete.
-- Only 'accepted' connections count; pending/rejected/blocked do not.
CREATE OR REPLACE FUNCTION public.handle_connection_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_new_accepted boolean;
  v_old_accepted boolean;
BEGIN
  v_new_accepted := COALESCE(NEW.status, '') = 'accepted';
  v_old_accepted := COALESCE(OLD.status, '') = 'accepted';

  IF TG_OP = 'INSERT' AND v_new_accepted THEN
    UPDATE user_profiles SET connection_count = connection_count + 1 WHERE id = NEW.requester_id;
    UPDATE user_profiles SET connection_count = connection_count + 1 WHERE id = NEW.addressee_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NOT v_old_accepted AND v_new_accepted THEN
      UPDATE user_profiles SET connection_count = connection_count + 1 WHERE id = NEW.requester_id;
      UPDATE user_profiles SET connection_count = connection_count + 1 WHERE id = NEW.addressee_id;
    ELSIF v_old_accepted AND NOT v_new_accepted THEN
      UPDATE user_profiles SET connection_count = GREATEST(connection_count - 1, 0) WHERE id = NEW.requester_id;
      UPDATE user_profiles SET connection_count = GREATEST(connection_count - 1, 0) WHERE id = NEW.addressee_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND v_old_accepted THEN
    UPDATE user_profiles SET connection_count = GREATEST(connection_count - 1, 0) WHERE id = OLD.requester_id;
    UPDATE user_profiles SET connection_count = GREATEST(connection_count - 1, 0) WHERE id = OLD.addressee_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

DROP TRIGGER IF EXISTS on_connection_change ON public.connections;
CREATE TRIGGER on_connection_change
AFTER INSERT OR UPDATE OR DELETE ON public.connections
FOR EACH ROW EXECUTE FUNCTION public.handle_connection_count();

-- Backfill: counts currently 0 for everyone despite existing accepted rows.
UPDATE user_profiles u SET connection_count = s.cnt
FROM (
  SELECT id, count(*) AS cnt FROM (
    SELECT requester_id AS id FROM connections WHERE status = 'accepted'
    UNION ALL
    SELECT addressee_id AS id FROM connections WHERE status = 'accepted'
  ) t GROUP BY id
) s
WHERE u.id = s.id;