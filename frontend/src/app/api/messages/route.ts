import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedEmployerUser } from "@/lib/employer-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createNotification } from "@/lib/notifications";
import { apiError } from "@/lib/api-utils";

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

// GET: conversations for the current user
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedEmployerUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: convs, error } = await supabaseAdmin
    .from("conversations")
    .select("id, participant_a, participant_b, last_message_at")
    .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
    .order("last_message_at", { ascending: false });

  if (error) return apiError(error, "messages-list");

  const enriched = await Promise.all(
    ((convs || []) as ConvRow[]).map(async (c) => {
      const otherId = c.participant_a === user.id ? c.participant_b : c.participant_a;
      const { data: profile } = await supabaseAdmin
        .from("user_profiles")
        .select("id, display_name, avatar_url, headline")
        .eq("id", otherId)
        .maybeSingle();

      const { data: last } = await supabaseAdmin
        .from("messages")
        .select("body, created_at")
        .eq("conversation_id", c.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const { count: unread } = await supabaseAdmin
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", c.id)
        .eq("is_read", false)
        .neq("sender_id", user.id);

      return {
        id: c.id,
        updated_at: c.last_message_at,
        last_message: last ? { content: last.body, created_at: last.created_at } : null,
        unread_count: unread ?? 0,
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

  if (!content.trim()) {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }

  if (conversationId && !participantId) {
    const { data: conv } = await supabaseAdmin
      .from("conversations")
      .select("participant_a, participant_b")
      .eq("id", conversationId)
      .maybeSingle();

    if (conv) {
      participantId = conv.participant_a === user.id ? conv.participant_b : conv.participant_a;
    }
  }

  if (!conversationId && (!participantId || !participantId.includes("-"))) {
    return NextResponse.json({ error: "recipientId or conversationId is required" }, { status: 400 });
  }

  if (participantId === user.id) {
    return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 });
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
