import { createClient } from "@/lib/supabase/server";

type NotificationType =
  | "connection_request"
  | "connection_accepted"
  | "follow"
  | "post_like"
  | "post_comment"
  | "post_repost"
  | "skill_endorsement"
  | "recommendation"
  | "message";

export async function createNotification({
  userId,
  type,
  actorId,
  entityType,
  entityId,
  message,
}: {
  userId: string;
  type: NotificationType;
  actorId: string;
  entityType?: string;
  entityId?: string;
  message?: string;
}) {
  const supabase = await createClient();
  await supabase.from("notifications").insert({
    user_id: userId,
    type,
    actor_id: actorId,
    entity_type: entityType || null,
    entity_id: entityId || null,
    message: message || null,
  });
}
