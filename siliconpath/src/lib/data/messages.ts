import { createSupabaseServer } from "../auth/server.js";

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

/** Returns the message thread between the current user and `otherId`, oldest first. */
export async function getThread(otherId: string): Promise<Message[]> {
  const supabase = createSupabaseServer();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];
  const me = userData.user.id;
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .or(
      `and(sender_id.eq.${me},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${me})`
    )
    .order("created_at", { ascending: true });
  if (error) throw new Error(`[data] getThread failed: ${error.message}`);
  return (data ?? []) as Message[];
}

export async function sendMessage(recipientId: string, body: string): Promise<void> {
  const supabase = createSupabaseServer();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("[data] sendMessage: not authenticated");
  const trimmed = body.trim();
  if (!trimmed) throw new Error("[data] sendMessage: empty body");
  const { error } = await supabase
    .from("messages")
    .insert({ sender_id: userData.user.id, recipient_id: recipientId, body: trimmed });
  if (error) throw new Error(`[data] sendMessage failed: ${error.message}`);
}
