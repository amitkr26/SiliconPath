import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createNotification } from "@/lib/notifications";
import { apiError } from "@/lib/api-utils";
import { rateLimit } from "@/lib/rate-limiter";

export const dynamic = "force-dynamic";

interface ConvParticipantData {
  id: string;
  participant_a: string;
  participant_b: string;
}

async function assertParticipant(
  _supabase: Awaited<ReturnType<typeof createClient>>,
  conversationId: string,
  userId: string
): Promise<{ ok: true; conv: ConvParticipantData } | { ok: false; status: number; error: string }> {
  const { data: conv } = await supabaseAdmin
    .from("conversations")
    .select("id, participant_a, participant_b")
    .eq("id", conversationId)
    .maybeSingle();

  if (!conv) return { ok: false, status: 404, error: "Conversation not found" };
  if (conv.participant_a !== userId && conv.participant_b !== userId) {
    return { ok: false, status: 403, error: "Not a participant" };
  }
  return { ok: true, conv: conv as ConvParticipantData };
}

/**
 * GET: Fetch conversation messages with cursor-based pagination.
 * Read-only: Does NOT execute write/update side effects during GET.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } | Promise<{ conversationId: string }> }
) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const conversationId = resolvedParams?.conversationId;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const check = await assertParticipant(supabase, conversationId, user.id);
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

  const url = new URL(request.url);
  const limitParam = parseInt(url.searchParams.get("limit") || "30", 10);
  const limit = Math.min(Math.max(1, isNaN(limitParam) ? 30 : limitParam), 100);
  const before = url.searchParams.get("before");

  let query = supabaseAdmin
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (before) {
    if (before.includes("|")) {
      const [cursorTime, cursorId] = before.split("|");
      query = query.or(
        `created_at.lt.${cursorTime},and(created_at.eq.${cursorTime},id.lt.${cursorId})`
      );
    } else {
      query = query.lt("created_at", before);
    }
  }

  query = query.limit(limit);

  const { data: messages, error } = await query;
  if (error) return apiError(error, "messages-fetch");

  // Reverse descending fetch to ascending chronological order for frontend display
  const chronological = (messages || []).slice().reverse();
  const nextCursor =
    messages && messages.length === limit
      ? `${messages[messages.length - 1].created_at}|${messages[messages.length - 1].id}`
      : null;

  return NextResponse.json({
    messages: chronological,
    next_cursor: nextCursor,
    has_more: !!nextCursor,
  });
}

/**
 * POST: Send a message to the specified conversation.
 * Enforces: participant verification, block check, 4000-char cap, 20 msg/min rate limit, notification dispatch.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { conversationId: string } | Promise<{ conversationId: string }> }
) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const conversationId = resolvedParams?.conversationId;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const check = await assertParticipant(supabase, conversationId, user.id);
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

  let raw: Record<string, unknown>;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const content = String(raw.content || raw.body || raw.message || "");
  const trimmed = content.trim();

  // 1. Length & Empty Validation
  if (!trimmed) {
    return NextResponse.json({ error: "Content required" }, { status: 400 });
  }
  if (content.length > 4000) {
    return NextResponse.json({ error: "Message exceeds 4,000 characters limit" }, { status: 400 });
  }

  const otherParticipantId =
    check.conv.participant_a === user.id ? check.conv.participant_b : check.conv.participant_a;

  // 2. Block Check in canonical `connections`
  const { data: blockedConn } = await supabaseAdmin
    .from("connections")
    .select("id, requester_id, addressee_id, status")
    .or(
      `and(requester_id.eq.${user.id},addressee_id.eq.${otherParticipantId}),and(requester_id.eq.${otherParticipantId},addressee_id.eq.${user.id})`
    )
    .eq("status", "blocked")
    .maybeSingle();

  if (blockedConn) {
    return NextResponse.json(
      { error: "Cannot message this user because one of the parties has blocked communication" },
      { status: 403 }
    );
  }

  // 3. Rate Limit Check: 20 messages per authenticated user per rolling minute
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

  const { data: message, error } = await supabaseAdmin
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: user.id, body: content })
    .select()
    .single();

  if (error) return apiError(error, "messages-send");

  // Notify recipient of new message
  try {
    await createNotification({
      userId: otherParticipantId,
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

  return NextResponse.json(message, { status: 201 });
}

/**
 * PATCH: Mark specific messages or all incoming conversation messages as read.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { conversationId: string } | Promise<{ conversationId: string }> }
) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const conversationId = resolvedParams?.conversationId;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const check = await assertParticipant(supabase, conversationId, user.id);
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

  let raw: Record<string, unknown>;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const messageIds = raw.messageIds as string[] | undefined;
  const markAllRead = Boolean(raw.markAllRead);

  if (!markAllRead && (!Array.isArray(messageIds) || messageIds.length === 0)) {
    return NextResponse.json(
      { error: "messageIds array or markAllRead: true required" },
      { status: 400 }
    );
  }

  let updateQuery = supabaseAdmin
    .from("messages")
    .update({ is_read: true })
    .eq("conversation_id", conversationId)
    .neq("sender_id", user.id)
    .eq("is_read", false);

  if (!markAllRead && messageIds) {
    updateQuery = updateQuery.in("id", messageIds);
  }

  const { error } = await updateQuery;
  if (error) return apiError(error, "messages-mark-read");

  return NextResponse.json({ ok: true });
}
