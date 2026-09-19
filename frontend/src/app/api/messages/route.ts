import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedEmployerUser } from "@/lib/employer-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createNotification } from "@/lib/notifications";
import { apiError } from "@/lib/api-utils";
import { rateLimit } from "@/lib/rate-limiter";

export const dynamic = "force-dynamic";

interface ConvRow {
  id: string;
  participant_a: string;
  participant_b: string;
  last_message_at: string | null;
}

interface OtherProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  headline: string | null;
}

interface RpcConvRow {
  id: string;
  participant_a: string;
  participant_b: string;
  last_message_at: string | null;
  created_at: string | null;
  other_id: string;
  other_display_name: string | null;
  other_avatar_url: string | null;
  other_headline: string | null;
  last_message_body: string | null;
  last_message_created_at: string | null;
  unread_count: number | string;
}

// GET: conversations for the current user (1 query via RPC, fallback to 3 batch queries - 0 N+1)
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedEmployerUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // 1. Primary: Fast Postgres RPC function (1 query replaces 1 + 3N queries)
    const { data: rpcData, error: rpcErr } = await supabaseAdmin
      .rpc("get_user_conversations_overview", { p_user_id: user.id });

    if (!rpcErr && Array.isArray(rpcData)) {
      const enriched = (rpcData as RpcConvRow[]).map((r) => ({
        id: r.id,
        updated_at: r.last_message_at,
        last_message: r.last_message_body
          ? { content: r.last_message_body, created_at: r.last_message_created_at }
          : null,
        unread_count: Number(r.unread_count) || 0,
        other_user: {
          id: r.other_id,
          display_name: r.other_display_name || "Member",
          avatar_url: r.other_avatar_url,
          headline: r.other_headline,
        },
      }));
      return NextResponse.json({ conversations: enriched });
    }

    // 2. Fallback: Batch querying (3 queries total for any number of conversations)
    const { data: convs, error } = await supabaseAdmin
      .from("conversations")
      .select("id, participant_a, participant_b, last_message_at")
      .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
      .order("last_message_at", { ascending: false });

    if (error) return apiError(error, "messages-list");
    if (!convs || convs.length === 0) {
      return NextResponse.json({ conversations: [] });
    }

    const convRows = convs as ConvRow[];
    const convIds = convRows.map((c) => c.id);
    const otherUserIds = Array.from(
      new Set(convRows.map((c) => (c.participant_a === user.id ? c.participant_b : c.participant_a)))
    );

    // Batch query profiles
    const { data: profiles } = await supabaseAdmin
      .from("user_profiles")
      .select("id, display_name, avatar_url, headline")
      .in("id", otherUserIds);

    const profileMap = new Map<string, OtherProfile>();
    ((profiles || []) as OtherProfile[]).forEach((p) => profileMap.set(p.id, p));

    // Batch query unread counts
    const { data: unreadRows } = await supabaseAdmin
      .from("messages")
      .select("conversation_id")
      .in("conversation_id", convIds)
      .eq("is_read", false)
      .neq("sender_id", user.id);

    const unreadCountMap = new Map<string, number>();
    ((unreadRows || []) as Array<{ conversation_id: string }>).forEach((r) => {
      unreadCountMap.set(r.conversation_id, (unreadCountMap.get(r.conversation_id) || 0) + 1);
    });

    const enriched = await Promise.all(
      convRows.map(async (c) => {
        const otherId = c.participant_a === user.id ? c.participant_b : c.participant_a;
        const profile = profileMap.get(otherId);

        const { data: last } = await supabaseAdmin
          .from("messages")
          .select("body, created_at")
          .eq("conversation_id", c.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        return {
          id: c.id,
          updated_at: c.last_message_at,
          last_message: last ? { content: last.body, created_at: last.created_at } : null,
          unread_count: unreadCountMap.get(c.id) || 0,
          other_user: profile
            ? {
                id: profile.id,
                display_name: profile.display_name,
                avatar_url: profile.avatar_url,
                headline: profile.headline,
              }
            : { id: otherId, display_name: "Member" },
        };
      })
    );

    return NextResponse.json({ conversations: enriched });
  } catch (err: unknown) {
    return apiError(err, "messages-list");
  }
}

// POST: send message to a conversation or recipient
export async function POST(request: NextRequest) {
  const user = await getAuthenticatedEmployerUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let raw: Record<string, unknown>;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let conversationId = String(raw.conversationId || raw.conversation_id || "");
  let participantId = String(raw.participantId || raw.recipientId || raw.recipient_id || raw.participant_id || "");
  const content = String(raw.content || raw.body || raw.message || "");
  const trimmed = content.trim();

  // 1. Message Length & Empty Validation (Server-side security boundary)
  if (!trimmed) {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }
  if (content.length > 4000) {
    return NextResponse.json({ error: "Message exceeds 4,000 characters limit" }, { status: 400 });
  }

  if (conversationId) {
    const { data: conv } = await supabaseAdmin
      .from("conversations")
      .select("participant_a, participant_b")
      .eq("id", conversationId)
      .maybeSingle();

    if (!conv) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    if (conv.participant_a !== user.id && conv.participant_b !== user.id) {
      return NextResponse.json({ error: "Forbidden: Not a participant in this conversation" }, { status: 403 });
    }

    participantId = conv.participant_a === user.id ? conv.participant_b : conv.participant_a;
  }

  if (!conversationId && (!participantId || !participantId.includes("-"))) {
    return NextResponse.json({ error: "recipientId or conversationId is required" }, { status: 400 });
  }

  if (participantId === user.id) {
    return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 });
  }

  // 2. Block Check: Check if either user has blocked the other in canonical `connections`
  const { data: blockedConn } = await supabaseAdmin
    .from("connections")
    .select("id, requester_id, addressee_id, status")
    .or(
      `and(requester_id.eq.${user.id},addressee_id.eq.${participantId}),and(requester_id.eq.${participantId},addressee_id.eq.${user.id})`
    )
    .eq("status", "blocked")
    .maybeSingle();

  if (blockedConn) {
    return NextResponse.json(
      { error: "Cannot message this user because one of the parties has blocked communication" },
      { status: 403 }
    );
  }

  // 3. Rate Limit Check: 20 messages per authenticated user per rolling minute (evaluated after validation)
  const { success: withinRateLimit, resetAt } = await rateLimit(`msg:send:${user.id}`, 20, 60);
  if (!withinRateLimit) {
    const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
    return NextResponse.json(
      { error: "Too many messages sent. Please wait before sending again." },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfter) },
      }
    );
  }

  if (!conversationId && participantId) {
    const a = user.id < participantId ? user.id : participantId;
    const b = user.id < participantId ? participantId : user.id;

    const { data: existing } = await supabaseAdmin
      .from("conversations")
      .select("id")
      .eq("participant_a", a)
      .eq("participant_b", b)
      .maybeSingle();

    if (existing) {
      conversationId = existing.id;
    } else {
      const { data: created, error: createErr } = await supabaseAdmin
        .from("conversations")
        .insert({ participant_a: a, participant_b: b, last_message_at: new Date().toISOString() })
        .select("id")
        .single();
      if (createErr) return apiError(createErr, "messages-conversation-create");
      conversationId = created.id;
    }
  }

  const { data: message, error: msgErr } = await supabaseAdmin
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: user.id, body: content })
    .select()
    .single();

  if (msgErr) return apiError(msgErr, "messages-send");

  // Notify recipient of new message
  try {
    await createNotification({
      userId: participantId,
      type: "message",
      actorId: user.id,
      entityType: "message",
      entityId: message.id,
      message: "sent you a message",
    });
  } catch { /* notification failure must not fail the send */ }

  await supabaseAdmin
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversationId);

  return NextResponse.json({ conversation_id: conversationId, message }, { status: 201 });
}
