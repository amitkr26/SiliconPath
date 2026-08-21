import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

async function isEmployerAuthorized(userId: string, userMetadata: any, oppId: string) {
  const role = userMetadata?.role || userMetadata?.account_type;
  if (role === "admin") return true;
  if (role !== "employer" && role !== "provider") return false;

  // Check ownership of opportunity (IDOR security check)
  const { data: opp } = await supabaseAdmin
    .from("opportunities")
    .select("created_by, employer_id")
    .eq("id", oppId)
    .maybeSingle();

  if (!opp) return false;
  // If created_by is unset or matches user
  if (!opp.created_by && !opp.employer_id) return true;
  return opp.created_by === userId || opp.employer_id === userId;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const { id } = params;
  if (!id) return NextResponse.json({ error: "Job ID required" }, { status: 400 });

  const authorized = await isEmployerAuthorized(user.id, user.user_metadata, id);
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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const { id } = params;
  const authorized = await isEmployerAuthorized(user.id, user.user_metadata, id);
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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const { id } = params;
  const authorized = await isEmployerAuthorized(user.id, user.user_metadata, id);
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
