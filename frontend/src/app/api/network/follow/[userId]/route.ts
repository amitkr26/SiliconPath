import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications";

export async function POST(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (userId === user.id) return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });

  const { error } = await supabase.from("user_follows").insert({
    follower_id: user.id,
    following_id: userId,
  });

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Already following" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await createNotification({
    userId,
    type: "follow",
    actorId: user.id,
    message: "started following you",
  });

  return NextResponse.json({ success: true }, { status: 201 });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await supabase.from("user_follows").delete()
    .eq("follower_id", user.id)
    .eq("following_id", userId);

  return NextResponse.json({ success: true });
}
