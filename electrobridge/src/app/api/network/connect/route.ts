import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { receiverId, message } = await request.json();
  if (!receiverId) return NextResponse.json({ error: "Receiver ID required" }, { status: 400 });
  if (receiverId === user.id) return NextResponse.json({ error: "Cannot connect with yourself" }, { status: 400 });

  const { data, error } = await supabase.from("connection_requests").insert({
    sender_id: user.id,
    receiver_id: receiverId,
    message: message || null,
  }).select().single();

  if (error) {
    if (error.message?.includes("unique") || error.code === "23505") {
      return NextResponse.json({ error: "Connection request already sent" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await createNotification({
    userId: receiverId,
    type: "connection_request",
    actorId: user.id,
    entityId: data.id,
    message: message ? `wants to connect: "${message}"` : "wants to connect with you",
  });

  return NextResponse.json(data, { status: 201 });
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("connection_requests")
    .select("*, sender:user_profiles!sender_id(full_name, username, avatar_url, headline)")
    .or(`receiver_id.eq.${user.id},sender_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ requests: data || [] });
}
