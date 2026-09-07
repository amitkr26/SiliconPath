import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedEmployerUser, isUserAdmin, isUserEmployer } from "@/lib/employer-auth";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

async function isEmployerAuthorized(user: any, oppId: string) {
  if (isUserAdmin(user)) return true;
  const isEmployer = await isUserEmployer(user);
  if (!isEmployer) return false;

  const { data: opp } = await supabaseAdmin
    .from("opportunities")
    .select("id, organization_id, created_by")
    .eq("id", oppId)
    .maybeSingle();

  if (!opp) return false;

  // P0.6: Employer must be the creator of the opportunity OR an admin
  const isOwner = opp.created_by === user.id;
  if (!isOwner) {
    // Also check if the organization belongs to this employer
    const { data: org } = await supabaseAdmin
      .from("organizations")
      .select("id, created_by")
      .eq("id", opp.organization_id)
      .maybeSingle();
    if (!org || org.created_by !== user.id) return false;
  }

  return true;
}

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
  if (!id) return NextResponse.json({ error: "Job ID required" }, { status: 400 });

  const authorized = await isEmployerAuthorized(user, id);
  if (!authorized) {
    return NextResponse.json({ error: "Forbidden: You do not own this job posting." }, { status: 403 });
  }

  try {
    const { data: job, error } = await supabaseAdmin
      .from("opportunities")
      .select("*, organization:organizations(*)")
      .eq("id", id)
      .single();

    if (error || !job) {
      return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
    }

    // Get applicant counts for this job
    const { count: applicantCount } = await supabaseAdmin
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("opportunity_id", id);

    return NextResponse.json({
      job: {
        ...job,
        applicant_count: applicantCount || 0,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch job" }, { status: 500 });
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
  const authorized = await isEmployerAuthorized(user, id);
  if (!authorized) {
    return NextResponse.json({ error: "Forbidden: You do not own this job posting." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { title, category, location, stipend, deadline, eligibility, description, is_active, apply_link, tags } = body;

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (title) updates.title = title;
    if (category) updates.category = category.toLowerCase();
    if (location !== undefined) updates.location = location;
    if (stipend !== undefined) updates.salary_range = stipend;
    if (deadline !== undefined) updates.deadline = deadline;
    if (eligibility !== undefined) updates.eligibility = eligibility;
    if (description !== undefined) updates.description = description;
    if (typeof is_active === "boolean") updates.is_active = is_active;
    if (apply_link !== undefined) updates.apply_url = apply_link;
    if (Array.isArray(tags)) updates.tags = tags;

    const { data: updatedJob, error } = await supabaseAdmin
      .from("opportunities")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, job: updatedJob });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update job" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthenticatedEmployerUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const { id } = params;
  const authorized = await isEmployerAuthorized(user, id);
  if (!authorized) {
    return NextResponse.json({ error: "Forbidden: You do not own this job posting." }, { status: 403 });
  }

  try {
    const { error } = await supabaseAdmin
      .from("opportunities")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: "Job deleted" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete job" }, { status: 500 });
  }
}
