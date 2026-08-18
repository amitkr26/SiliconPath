import { supabaseAdmin } from "@/lib/supabase";

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

// ponytail: uses supabaseAdmin — the cookie-bound client's RLS blocks
// inserting notifications for a *different* user (user_id != auth.uid()),
// causing every cross-user notification to silently fail.
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
  await supabaseAdmin.from("notifications").insert({
    user_id: userId,
    type,
    actor_id: actorId,
    entity_type: entityType || null,
    entity_id: entityId || null,
    message: message || null,
  });
}
