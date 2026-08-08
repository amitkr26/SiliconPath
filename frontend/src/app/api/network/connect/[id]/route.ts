import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resolvedParams = params instanceof Promise ? await params : params;
  const id = resolvedParams?.id;
  const body = await request.json();
  let { status } = body;

  if (status === "rejected") status = "declined";

  if (!["accepted", "declined", "withdrawn"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Update connections table (primary Supabase DB)
  let { data, error } = await supabase
    .from("connections")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .or(`addressee_id.eq.${user.id},requester_id.eq.${user.id}`)
    .select()
    .maybeSingle();

  // Fallback to connection_requests table if needed
  if (!data) {
    const { data: legacyData } = await supabase
      .from("connection_requests")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .or(`receiver_id.eq.${user.id},sender_id.eq.${user.id}`)
      .select()
      .maybeSingle();
    data = legacyData;
  }

  return NextResponse.json({ connection: data || { id, status } });
}