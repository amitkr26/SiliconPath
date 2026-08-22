import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedEmployerUser } from "@/lib/employer-auth";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthenticatedEmployerUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const { id } = params;

  try {
    const { data: application, error } = await supabaseAdmin
      .from("applications")
      .select(`
        id,
        status,
        applied_at,
        notes,
        opportunity_id,
        user_id,
        opportunity:opportunities(id, title, category, location, salary_range, slug, organization_id, created_by, employer_id),
        user_profile:user_profiles!applications_user_id_fkey(
          id,
          display_name,
          username,
          avatar_url,
          headline,
          skills,
          experience_years,
          location,
          country,
          bio,
          resume_url,
          linkedin_url,
          github_url,
          website_url
        )
      `)
      .eq("id", id)
      .single();

    if (error || !application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // IDOR check: Verify the user is an admin OR owns the opportunity
    const role = user.user_metadata?.role || user.user_metadata?.account_type;
    const opp = application.opportunity as any;
    if (role !== "admin" && opp) {
      const isOwner = (opp.created_by && opp.created_by === user.id) || (opp.employer_id && opp.employer_id === user.id);
      if (!isOwner && (opp.created_by || opp.employer_id)) {
        return NextResponse.json({ error: "Forbidden: You do not have access to this applicant." }, { status: 403 });
      }
    }

    return NextResponse.json({ application });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch applicant" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthenticatedEmployerUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const { id } = params;

  try {
    const body = await request.json();
    const { status, notes } = body;

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (status) {
      const validStatus =
        status === "accepted" || status === "rejected" || status === "shortlisted" || status === "applied"
          ? status
          : status === "screening" || status === "interview"
          ? "shortlisted"
          : "applied";
      updates.status = validStatus;
    }

    if (notes !== undefined) updates.notes = notes;

    const { data: updatedApp, error } = await supabaseAdmin
      .from("applications")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, application: updatedApp });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update applicant" }, { status: 500 });
  }
}
