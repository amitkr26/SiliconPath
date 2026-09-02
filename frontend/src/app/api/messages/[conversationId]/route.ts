import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase";
import { apiError } from "@/lib/api-utils";

async function assertParticipant(
  supabase: Awaited<ReturnType<typeof createClient>>,
  conversationId: string,
  userId: string
) {
  const { data: conv } = await supabaseAdmin
    .from("conversations")
    .select("id, participant_a, participant_b")
    .eq("id", conversationId)
    .maybeSingle();
  if (!conv) return { ok: false as const, status: 404, error: "Conversation not found" };
  if (conv.participant_a !== userId && conv.participant_b !== userId) {
    return { ok: false as const, status: 403, error: "Not a participant" };
  }
  return { ok: true as const };
}

export async function GET(_request: NextRequest, { params }: { params: { conversationId: string } | Promise<{ conversationId: string }> }) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const conversationId = resolvedParams?.conversationId;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const check = await assertParticipant(supabase, conversationId, user.id);
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

  const { data: messages, error } = await supabaseAdmin
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) return apiError(error, "messages-fetch");

  // Mark incoming messages read.
  await supabaseAdmin
    .from("messages")
    .update({ is_read: true })
    .eq("conversation_id", conversationId)
    .neq("sender_id", user.id)
    .eq("is_read", false);

  return NextResponse.json({ messages: messages || [] });
}

export async function POST(request: NextRequest, { params }: { params: { conversationId: string } | Promise<{ conversationId: string }> }) {
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
  if (!content.trim()) {
    return NextResponse.json({ error: "Content required" }, { status: 400 });
  }

  const { data: message, error } = await supabaseAdmin
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: user.id, body: String(content) })
    .select()
    .single();

  if (error) return apiError(error, "messages-send");

  await supabaseAdmin
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversationId);

  return NextResponse.json(message, { status: 201 });
}
