import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { messageSchema, validateOrThrow } from "@/lib/validation";

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

// GET: conversations for the current user (v2: participant_a/b, messages.body).
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: convs, error } = await supabase
    .from("conversations")
    .select("id, participant_a, participant_b, last_message_at")
    .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
    .order("last_message_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const enriched = await Promise.all(
    ((convs || []) as ConvRow[]).map(async (c) => {
      const otherId = c.participant_a === user.id ? c.participant_b : c.participant_a;
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("id, display_name, avatar_url, headline")
        .eq("id", otherId)
        .maybeSingle();

      const { data: last } = await supabase
        .from("messages")
        .select("body, created_at")
        .eq("conversation_id", c.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const { count: unread } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", c.id)
        .eq("is_read", false)
        .neq("sender_id", user.id);

      return {
        id: c.id,
        last_message_at: c.last_message_at,
        other_user: (profile || null) as OtherProfile | null,
        last_message_preview: last?.body || "No messages yet",
        unread_count: unread || 0,
      };
    })
  );

  return NextResponse.json({ conversations: enriched });
}

// POST: start a conversation + send first message (v2 schema).
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const raw = await request.json();
  const { participantId, content } = validateOrThrow<{ participantId: string; content: string }>(
    messageSchema,
    raw
  );
  if (participantId === user.id) {
    return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 });
  }

  const a = user.id < participantId ? user.id : participantId;
  const b = user.id < participantId ? participantId : user.id;

  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("participant_a", a)
    .eq("participant_b", b)
    .maybeSingle();

  let conversationId: string;
  if (existing) {
    conversationId = existing.id;
  } else {
    const { data: created, error: createErr } = await supabase
      .from("conversations")
      .insert({ participant_a: a, participant_b: b })
      .select("id")
      .single();
    if (createErr) return NextResponse.json({ error: createErr.message }, { status: 500 });
    conversationId = created.id;
  }

  const { data: message, error: msgErr } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: user.id, body: content })
    .select()
    .single();

  if (msgErr) return NextResponse.json({ error: msgErr.message }, { status: 500 });

  await supabase
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversationId);

  return NextResponse.json({ conversation_id: conversationId, message }, { status: 201 });
}
