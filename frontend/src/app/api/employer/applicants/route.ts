import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId");
  const stage = searchParams.get("stage");

  try {
    // 1. Get opportunities posted by this employer (or all active if employer is admin)
    let jobsQuery = supabaseAdmin
      .from("opportunities")
      .select("id, title, category, location, stipend");

    const role = user.user_metadata?.role;
    if (role !== "admin") {
      jobsQuery = jobsQuery.or(`created_by.eq.${user.id},employer_id.eq.${user.id}`);
    }

    const { data: myJobs } = await jobsQuery;
    const jobIds = (myJobs || []).map((j: any) => j.id);

    // If employer has specific jobs, filter applications by them
    let appsQuery = supabaseAdmin
      .from("applications")
      .select(`
        id,
        status,
        applied_at,
        notes,
        opportunity_id,
        user_id,
        opportunity:opportunities(id, title, category, location, stipend, slug),
        user_profile:user_profiles!applications_user_id_fkey(
          id,
          display_name,
          username,
          avatar_url,
          headline,
          skills,
          experience_years,
          location,
          bio,
          resume_url,
          linkedin_url,
          github_url
        )
      `)
      .order("applied_at", { ascending: false });

    if (jobId && jobId !== "all") {
      appsQuery = appsQuery.eq("opportunity_id", jobId);
    } else if (jobIds.length > 0 && role !== "admin") {
      appsQuery = appsQuery.in("opportunity_id", jobIds);
    }

    if (stage && stage !== "all") {
      appsQuery = appsQuery.eq("status", stage);
    }

    const { data: applications, error } = await appsQuery;

    if (error) {
      // Fallback: if foreign key fails or empty, fetch basic applications
      const { data: fallbackApps } = await supabaseAdmin
        .from("applications")
        .select("*, opportunity:opportunities(*)")
        .order("applied_at", { ascending: false })
        .limit(50);

      return NextResponse.json({
        applications: fallbackApps || [],
        total: (fallbackApps || []).length,
      });
    }

    return NextResponse.json({
      applications: applications || [],
      total: (applications || []).length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch applicants" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { id, status, notes } = body;

    if (!id) {
      return NextResponse.json({ error: "Application ID is required" }, { status: 400 });
    }

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (status) updates.status = status;
    if (notes !== undefined) updates.notes = notes;

    const { data, error } = await supabaseAdmin
      .from("applications")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, application: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update application" }, { status: 500 });
  }
}
