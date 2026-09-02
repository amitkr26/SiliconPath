import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createNotification } from "@/lib/notifications";
import { apiError } from "@/lib/api-utils";

// GET: current follow relationship state for the authenticated viewer.
export async function GET(request: NextRequest, { params }: { params: { userId: string } | Promise<{ userId: string }> }) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const userId = resolvedParams?.userId;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("user_follows")
    .select("id")
    .eq("follower_id", user.id)
    .eq("following_id", userId)
    .maybeSingle();

  if (error) return apiError(error, "network-follow-get");
  return NextResponse.json({ following: !!data });
}

export async function POST(request: NextRequest, { params }: { params: { userId: string } | Promise<{ userId: string }> }) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const userId = resolvedParams?.userId;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (userId === user.id) return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });

  const { error } = await supabaseAdmin.from("user_follows").insert({
    follower_id: user.id,
    following_id: userId,
  });

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Already following", following: true }, { status: 409 });
    if (error.code === "23503") return NextResponse.json({ error: "User not found" }, { status: 404 });
    return apiError(error, "network-follow-create");
  }

  try {
    await createNotification({
      userId,
      type: "follow",
      actorId: user.id,
      message: "started following you",
    });
  } catch {
    // notification failure must not fail the follow
  }

  return NextResponse.json({ success: true }, { status: 201 });
}

export async function DELETE(request: NextRequest, { params }: { params: { userId: string } | Promise<{ userId: string }> }) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const userId = resolvedParams?.userId;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("user_follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", userId)
    .select("id")
    .maybeSingle();

  if (error) return apiError(error, "network-follow-delete");
  return NextResponse.json({ success: true, deleted: !!data });
}
