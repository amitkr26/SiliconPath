import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedEmployerUser } from "@/lib/employer-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { apiError } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

/**
 * GET /api/messages/unread-count
 * Returns total unread message count for the authenticated user across all conversations.
 * Scalar query (1 DB query), replacing the previous N+1 full-conversation loop in Navbar.
 */
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedEmployerUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Primary: Fast Postgres RPC function (1 single scalar query)
    const { data: count, error: rpcErr } = await supabaseAdmin
      .rpc("get_unread_message_count", { p_user_id: user.id });

    if (!rpcErr && typeof count === "number") {
      return NextResponse.json({ unread_count: count });
    }

    // 2. Fallback: Query conversations and count unread messages in 2 queries
    const { data: convs, error: convErr } = await supabaseAdmin
      .from("conversations")
      .select("id")
      .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`);

    if (convErr) return apiError(convErr, "messages-unread-count");
    if (!convs || convs.length === 0) {
      return NextResponse.json({ unread_count: 0 });
    }

    const convIds = (convs as Array<{ id: string }>).map((c) => c.id);
    const { count: unreadCount, error: countErr } = await supabaseAdmin
      .from("messages")
      .select("id", { count: "exact", head: true })
      .in("conversation_id", convIds)
      .eq("is_read", false)
      .neq("sender_id", user.id);

    if (countErr) return apiError(countErr, "messages-unread-count");

    return NextResponse.json({ unread_count: unreadCount ?? 0 });
  } catch (err: unknown) {
    return apiError(err, "messages-unread-count");
  }
}
