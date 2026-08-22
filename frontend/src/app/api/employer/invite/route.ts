import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedEmployerUser } from "@/lib/employer-auth";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedEmployerUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { candidateId, candidateUsername, message } = body;
    const jobId = body.jobId || body.opportunityId;

    if (!jobId || (!candidateId && !candidateUsername)) {
      return NextResponse.json({ error: "Candidate and Job ID are required" }, { status: 400 });
    }

    // 0. Verify employer ownership of the job
    if (jobId) {
      const { data: opp } = await supabaseAdmin
        .from("opportunities")
        .select("id, organization_id, created_by, employer_id")
        .eq("id", jobId)
        .maybeSingle();

      if (!opp) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
      }

      const role = user.user_metadata?.role;
      if (role !== "admin") {
        const isOwner = (opp.created_by && opp.created_by === user.id) || (opp.employer_id && opp.employer_id === user.id);
        if (!isOwner && (opp.created_by || opp.employer_id)) {
          return NextResponse.json(
            { error: "Forbidden: Candidate invitation forbidden for unowned job" },
            { status: 403 }
          );
        }
      }
    }

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

    // 1. Fetch or create direct conversation between employer and candidate (canonical ordering)
    const a = user.id < resolvedCandidateId ? user.id : resolvedCandidateId;
    const b = user.id < resolvedCandidateId ? resolvedCandidateId : user.id;

    let conversationId: string | null = null;
    const { data: existingConv } = await supabaseAdmin
      .from("conversations")
      .select("id")
      .eq("participant_a", a)
      .eq("participant_b", b)
      .maybeSingle();

    if (existingConv) {
      conversationId = existingConv.id;
    } else {
      const { data: newConv, error: convError } = await supabaseAdmin
        .from("conversations")
        .insert({
          participant_a: a,
          participant_b: b,
          last_message_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (convError) {
        // Fallback search if race occurred
        const { data: racedConv } = await supabaseAdmin
          .from("conversations")
          .select("id")
          .eq("participant_a", a)
          .eq("participant_b", b)
          .maybeSingle();
        if (racedConv) conversationId = racedConv.id;
        else throw convError;
      } else {
        conversationId = newConv.id;
      }
    }

    // 2. Insert invitation reachout message
    const invitationText = message
      ? `[Direct Opportunity Invitation] ${message}`
      : "Hello! We reviewed your profile on SiliconPath and would like to invite you to apply for our open position.";

    const { data: messageRecord, error: msgError } = await supabaseAdmin
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        body: invitationText,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (msgError) throw msgError;

    // 3. Create persistent notification for candidate
    await supabaseAdmin.from("notifications").insert({
      user_id: resolvedCandidateId,
      type: "invitation",
      message: `You received a direct recruitment invitation from @${user.user_metadata?.username || "recruiter"}!`,
      is_read: false,
    });

    return NextResponse.json({
      success: true,
      conversationId,
      message: messageRecord,
    });
  } catch (err: any) {
    console.error("Employer Invite API Error:", err);
    return NextResponse.json({ error: err.message || "Failed to send invitation" }, { status: 500 });
  }
}
