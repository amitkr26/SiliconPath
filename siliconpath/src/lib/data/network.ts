import { createSupabaseServer } from "../auth/server.js";

export interface Connection {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
}

export async function listMyConnections(): Promise<Connection[]> {
  const supabase = createSupabaseServer();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];
  const { data, error } = await supabase
    .from("connections")
    .select("*")
    .or(`requester_id.eq.${userData.user.id},addressee_id.eq.${userData.user.id}`)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`[data] listMyConnections failed: ${error.message}`);
  return (data ?? []) as Connection[];
}

export async function requestConnection(addresseeId: string): Promise<void> {
  const supabase = createSupabaseServer();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("[data] requestConnection: not authenticated");
  const { error } = await supabase
    .from("connections")
    .insert({ requester_id: userData.user.id, addressee_id: addresseeId });
  if (error) throw new Error(`[data] requestConnection failed: ${error.message}`);
}

export async function respondToConnection(id: string, accept: boolean): Promise<void> {
  const supabase = createSupabaseServer();
  const { error } = await supabase
    .from("connections")
    .update({ status: accept ? "accepted" : "declined" })
    .eq("id", id);
  if (error) throw new Error(`[data] respondToConnection failed: ${error.message}`);
}
