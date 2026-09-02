import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { post_id } = await request.json();
  if (!post_id) return NextResponse.json({ error: "post_id required" }, { status: 400 });

  const { error } = await supabase.rpc("toggle_upvote", {
    p_post_id: post_id,
    p_user_id: user.id,
  });

  if (error) return apiError(error, "community-vote");
  return NextResponse.json({ success: true });
}
