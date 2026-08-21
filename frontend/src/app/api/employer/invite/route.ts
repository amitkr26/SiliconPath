import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { candidateId, candidateUsername, jobId, message } = body;

    if (!jobId || (!candidateId && !candidateUsername)) {
      return NextResponse.json({ error: "Candidate and Job ID are required" }, { status: 400 });
    }

    // 1. Resolve candidate ID if username passed
    let resolvedCandidateId = candidateId;
    if (!resolvedCandidateId && candidateUsername) {
      const { data: cand } = await supabaseAdmin
        .from("user_profiles")
        .select("id")
        .eq("username", candidateUsername.toLowerCase().replace(/^@/, ""))
        .maybeSingle();
      if (cand) resolvedCandidateId = cand.id;
    }

    if (!resolvedCandidateId) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    // 2. Fetch opportunity details
    const { data: opp } = await supabaseAdmin
      .from("opportunities")
      .select("id, title, slug")
      .eq("id", jobId)
      .single();

    if (!opp) {
      return NextResponse.json({ error: "Job opportunity not found" }, { status: 404 });
    }

    // 3. Find or create conversation in conversations table
    const { data: existingConv } = await supabaseAdmin
      .from("conversations")
      .select("id")
      .or(`and(participant_a.eq.${user.id},participant_b.eq.${resolvedCandidateId}),and(participant_a.eq.${resolvedCandidateId},participant_b.eq.${user.id})`)
      .maybeSingle();

    let convId = existingConv?.id;
    if (!convId) {
      const { data: newConv, error: convErr } = await supabaseAdmin
        .from("conversations")
        .insert({
          participant_a: user.id,
          participant_b: resolvedCandidateId,
          last_message_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      if (convErr) throw convErr;
      convId = newConv.id;
    }

    // 4. Send message in messages table
    const invitationBody = message
      ? `${message}\n\n👉 Position Details: /opportunities/${opp.slug || opp.id}`
      : `Hello! We reviewed your hardware profile and would like to invite you to apply for our position: "${opp.title}".\n\n👉 Review & Apply: /opportunities/${opp.slug || opp.id}`;

    await supabaseAdmin.from("messages").insert({
      conversation_id: convId,
      sender_id: user.id,
      body: invitationBody,
      created_at: new Date().toISOString(),
    });

    // 5. Create real notification for candidate
    await supabaseAdmin.from("notifications").insert({
      user_id: resolvedCandidateId,
      type: "opportunity",
      message: `You were invited to apply for "${opp.title}"! Check your messages.`,
      is_read: false,
      created_at: new Date().toISOString(),
      metadata: {
        opportunity_id: opp.id,
        conversation_id: convId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Invitation sent successfully!",
      conversationId: convId,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to send invitation" }, { status: 500 });
  }
}
