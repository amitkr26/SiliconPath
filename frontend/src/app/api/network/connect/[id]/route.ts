import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase";

// PATCH: respond to a connection request.
// Role semantics (canonical `connections` table, statuses pending/accepted/rejected/blocked):
//   - addressee  may accept ("accepted") or decline ("rejected" / "declined")
//   - requester  may only cancel their own pending request ("withdrawn" -> row deleted)
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
  const { status } = body;

  if (!["accepted", "rejected", "declined", "withdrawn"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Load the request first so we can enforce who may act on it.
  const { data: conn } = await supabaseAdmin
    .from("connections")
    .select("id, requester_id, addressee_id, status")
    .eq("id", id)
    .maybeSingle();

  if (!conn) {
    // Legacy fallback table (connection_requests: pending/accepted/declined/withdrawn)
    const { data: legacy } = await supabaseAdmin
      .from("connection_requests")
      .select("id, sender_id, receiver_id, status")
      .eq("id", id)
      .maybeSingle();
    if (!legacy) return NextResponse.json({ error: "Request not found" }, { status: 404 });

    const isSender = legacy.sender_id === user.id;
    const isReceiver = legacy.receiver_id === user.id;
    if (!isSender && !isReceiver) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if ((status === "accepted" || status === "declined") && !isReceiver) {
      return NextResponse.json({ error: "Only the recipient can respond to this request" }, { status: 403 });
    }
    if (status === "withdrawn" && !isSender) {
      return NextResponse.json({ error: "Only the sender can withdraw this request" }, { status: 403 });
    }

    const { data: updated, error } = await supabaseAdmin
      .from("connection_requests")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ connection: updated });
  }

  const isRequester = conn.requester_id === user.id;
  const isAddressee = conn.addressee_id === user.id;
  if (!isRequester && !isAddressee) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (status === "withdrawn") {
    // Cancel: requester deletes their own pending request
    if (!isRequester) return NextResponse.json({ error: "Only the sender can withdraw this request" }, { status: 403 });
    const { error } = await supabaseAdmin.from("connections").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ connection: { id, status: "withdrawn" } });
  }

  if (!isAddressee) {
    return NextResponse.json({ error: "Only the recipient can respond to this request" }, { status: 403 });
  }

  // connections CHECK vocabulary is pending/accepted/rejected/blocked
  const normalized = status === "declined" ? "rejected" : status;
  const { data, error } = await supabaseAdmin
    .from("connections")
    .update({ status: normalized, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ connection: data || { id, status: normalized } });
}
