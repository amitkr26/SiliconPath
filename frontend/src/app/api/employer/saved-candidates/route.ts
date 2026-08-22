import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedEmployerUser } from "@/lib/employer-auth";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedEmployerUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  try {
    const { data: saved, error } = await supabaseAdmin
      .from("recruiter_saved_candidates")
      .select(`
        id,
        candidate_id,
        note,
        created_at,
        candidate:user_profiles!recruiter_saved_candidates_candidate_id_fkey(
          id,
          display_name,
          username,
          avatar_url,
          headline,
          skills,
          experience_years,
          location,
          bio
        )
      `)
      .eq("employer_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      // Fallback without FK alias if needed
      const { data: rawSaved } = await supabaseAdmin
        .from("recruiter_saved_candidates")
        .select("*")
        .eq("employer_id", user.id)
        .order("created_at", { ascending: false });

      return NextResponse.json({ saved: rawSaved || [], count: (rawSaved || []).length });
    }

    return NextResponse.json({ saved: saved || [], count: (saved || []).length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch saved candidates" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedEmployerUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { candidate_id, note } = body;

    if (!candidate_id) {
      return NextResponse.json({ error: "candidate_id is required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("recruiter_saved_candidates")
      .upsert(
        {
          employer_id: user.id,
          candidate_id,
          note: note || null,
          created_at: new Date().toISOString(),
        },
        { onConflict: "employer_id,candidate_id" }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, saved: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to save candidate" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getAuthenticatedEmployerUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const candidateId = searchParams.get("candidateId");
    const id = searchParams.get("id");

    let query = supabaseAdmin
      .from("recruiter_saved_candidates")
      .delete()
      .eq("employer_id", user.id);

    if (candidateId) {
      query = query.eq("candidate_id", candidateId);
    } else if (id) {
      query = query.eq("id", id);
    } else {
      return NextResponse.json({ error: "candidateId or id query parameter required" }, { status: 400 });
    }

    const { error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, message: "Candidate removed from saved list" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to remove saved candidate" }, { status: 500 });
  }
}
