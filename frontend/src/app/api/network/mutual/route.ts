import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const targetUserId = searchParams.get("targetUserId") || searchParams.get("userId") || searchParams.get("targetId");

  if (!targetUserId) {
    return NextResponse.json({ error: "Target user ID required" }, { status: 400 });
  }

  // If viewing self, mutual connections is 0
  if (targetUserId === user.id) {
    return NextResponse.json({ count: 0, mutual: [] });
  }

  // 1. Get user's accepted connection IDs
  const { data: myConns } = await supabaseAdmin
    .from("connections")
    .select("requester_id, addressee_id")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    .eq("status", "accepted");

  const myConnectionIds = new Set<string>(
    (myConns || []).map((c: { requester_id: string; addressee_id: string }) =>
      c.requester_id === user.id ? c.addressee_id : c.requester_id
    )
  );

  if (myConnectionIds.size === 0) {
    return NextResponse.json({ count: 0, mutual: [] });
  }

  // 2. Get target user's accepted connection IDs
  const { data: theirConns } = await supabaseAdmin
    .from("connections")
    .select("requester_id, addressee_id")
    .or(`requester_id.eq.${targetUserId},addressee_id.eq.${targetUserId}`)
    .eq("status", "accepted");

  const theirConnectionIds = new Set<string>(
    (theirConns || []).map((c: { requester_id: string; addressee_id: string }) =>
      c.requester_id === targetUserId ? c.addressee_id : c.requester_id
    )
  );

  // 3. Find intersection
  const mutualIds: string[] = [];
  myConnectionIds.forEach((id: string) => {
    if (theirConnectionIds.has(id)) {
      mutualIds.push(id);
    }
  });

  if (mutualIds.length === 0) {
    return NextResponse.json({ count: 0, mutual: [] });
  }

  // 4. Fetch profiles of mutual connections
  const { data: mutualProfiles } = await supabaseAdmin
    .from("user_profiles")
    .select("id, username, display_name, headline, avatar_url, current_company")
    .in("id", mutualIds.slice(0, 10));

  return NextResponse.json({
    count: mutualIds.length,
    mutual: mutualProfiles || [],
  });
}
