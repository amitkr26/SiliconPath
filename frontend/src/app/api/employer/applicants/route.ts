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

  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId");
  const stage = searchParams.get("stage");

  try {
    // P0.7: First, get all jobs posted by this employer
    // Note: migration adds created_by; employer_id not yet in schema
    const { data: employerJobs } = await supabaseAdmin
      .from("opportunities")
      .select("id")
      .eq("created_by", user.id);

    const jobIds: string[] = (employerJobs || []).map((j: any) => j.id);

    let appsQuery = supabaseAdmin
      .from("applications")
      .select(`
        id,
        status,
        applied_at,
        notes,
        opportunity_id,
        user_id,
        opportunity:opportunities(id, title, category, location, salary_range, slug),
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

    // Filter by employer's jobs only (strictly prevents IDOR across employers)
    const role = user.user_metadata?.role;
    if (role !== "admin") {
      if (jobId && jobId !== "all") {
        if (!jobIds.includes(jobId)) {
          return NextResponse.json({ error: "Forbidden: You do not own this job" }, { status: 403 });
        }
        appsQuery = appsQuery.eq("opportunity_id", jobId);
      } else {
        if (jobIds.length === 0) {
          return NextResponse.json({ applicants: [], applications: [], total: 0 });
        }
        appsQuery = appsQuery.in("opportunity_id", jobIds);
      }
    } else {
      if (jobId && jobId !== "all") {
        appsQuery = appsQuery.eq("opportunity_id", jobId);
      }
    }

    if (stage && stage !== "all") {
      appsQuery = appsQuery.eq("status", stage);
    }

    const { data: applications, error } = await appsQuery;

    if (error) {
      let fallbackQuery = supabaseAdmin
        .from("applications")
        .select("*, opportunity:opportunities(*)")
        .order("applied_at", { ascending: false });

      if (jobId && jobId !== "all") {
        fallbackQuery = fallbackQuery.eq("opportunity_id", jobId);
      } else if (jobIds.length > 0) {
        fallbackQuery = fallbackQuery.in("opportunity_id", jobIds);
      }

      const { data: fallbackApps } = await fallbackQuery;

      return NextResponse.json({
        applicants: fallbackApps || [],
        applications: fallbackApps || [],
        total: (fallbackApps || []).length,
      });
    }

    return NextResponse.json({
      applicants: applications || [],
      applications: applications || [],
      total: (applications || []).length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch applicants" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getAuthenticatedEmployerUser(request);
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

    const validStatus = status === "accepted" || status === "rejected" || status === "shortlisted" || status === "applied"
      ? status
      : (status === "screening" || status === "interview")
      ? "shortlisted"
      : "applied";

    const updatePayload: Record<string, any> = {
      status: validStatus,
      updated_at: new Date().toISOString(),
    };

    if (notes !== undefined) {
      updatePayload.notes = notes;
    }

    const { data, error } = await supabaseAdmin
      .from("applications")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      application: data,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update applicant" }, { status: 500 });
  }
}
