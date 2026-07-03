import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: conversations, error } = await supabase
    .from("conversations")
    .select("*")
    .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
    .order("last_message_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const enriched = await Promise.all(
    (conversations || []).map(async (c) => {
      const otherId = c.participant_1 === user.id ? c.participant_2 : c.participant_1;
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("id, full_name, username, avatar_url, headline")
        .eq("id", otherId)
        .single();

      const unread = c.participant_1 === user.id ? c.unread_count_1 : c.unread_count_2;

      return {
        ...c,
        other_user: profile,
        unread_count: unread,
        last_message_at: c.last_message_at,
        last_message_preview: c.last_message_preview,
      };
    })
  );

  return NextResponse.json({ conversations: enriched });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { participantId, content } = await request.json();
  if (!participantId || !content) {
    return NextResponse.json({ error: "participantId and content required" }, { status: 400 });
  }
  if (participantId === user.id) {
    return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 });
  }

  // Find or create conversation
  const p1 = user.id < participantId ? user.id : participantId;
  const p2 = user.id < participantId ? participantId : user.id;

  let { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("participant_1", p1)
    .eq("participant_2", p2)
    .single();

  let conversationId: string;

  if (existing) {
    conversationId = existing.id;
  } else {
    const { data: newConv, error: createError } = await supabase
      .from("conversations")
      .insert({ participant_1: p1, participant_2: p2 })
      .select("id")
      .single();

    if (createError) return NextResponse.json({ error: createError.message }, { status: 500 });
    conversationId = newConv!.id;
  }

  const { data: message, error: msgError } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: user.id, content })
    .select()
    .single();

  if (msgError) return NextResponse.json({ error: msgError.message }, { status: 500 });

  return NextResponse.json({ conversation_id: conversationId, message }, { status: 201 });
}
