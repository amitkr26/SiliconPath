import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  let { status } = body;

  if (status === "rejected") status = "declined";

  if (!["accepted", "declined", "withdrawn"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const { db2 } = await import("@/lib/db");
  const db = db2 || supabase;

  // Try updating connections table first (v2 schema)
  let { data, error } = await db
    .from("connections")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .or(`addressee_id.eq.${user.id},requester_id.eq.${user.id}`)
    .select()
    .maybeSingle();

  // Fallback to legacy connection_requests table if needed
  if (!data) {
    const { data: legacyData } = await db
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