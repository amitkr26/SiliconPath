import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedEmployerUser } from "@/lib/employer-auth";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedEmployerUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = user.user_metadata?.role;
  if (role !== "employer" && role !== "provider" && role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  try {
    // 1. Fetch authenticated employer's scoped opportunities
    // Use created_by from migration 20260821000001
    let jobsQuery = supabaseAdmin
      .from("opportunities")
      .select("id, title, category, location, salary_range, created_at, is_active, created_by")
      .order("created_at", { ascending: false });

    if (role !== "admin") {
      jobsQuery = jobsQuery.eq("created_by", user.id);
    }

    const { data: jobs, error: jobErr } = await jobsQuery;
    if (jobErr) throw jobErr;

    const jobList = (jobs || []) as Array<{ id: string; title: string; category: string; location?: string; salary_range?: string; created_at: string; is_active: boolean }>;
    const jobIds = jobList.map((j: { id: string }) => j.id);

    // 2. Fetch all applications belonging to this employer's opportunities
    let appList: Array<{ id: string; opportunity_id: string; status: string; applied_at: string }> = [];

    if (jobIds.length > 0) {
      const { data: applications, error: appErr } = await supabaseAdmin
        .from("applications")
        .select("id, opportunity_id, status, applied_at")
        .in("opportunity_id", jobIds);

      if (!appErr && applications) {
        appList = applications as Array<{ id: string; opportunity_id: string; status: string; applied_at: string }>;
      }
    }

    // 3. Compute real employer-scoped funnel stats
    const stageCounts = {
      applied: appList.filter((a) => a.status === "applied" || a.status === "submitted").length,
      screening: appList.filter((a) => a.status === "screening" || a.status === "reviewed").length,
      shortlisted: appList.filter((a) => a.status === "shortlisted").length,
      interview: appList.filter((a) => a.status === "interview").length,
      accepted: appList.filter((a) => a.status === "accepted").length,
      rejected: appList.filter((a) => a.status === "rejected").length,
    };

    // 4. Per-job breakdown
    const jobBreakdown = jobList.map((job) => {
      const jobApps = appList.filter((a) => a.opportunity_id === job.id);
      return {
        id: job.id,
        title: job.title,
        category: job.category,
        is_active: job.is_active,
        total_applications: jobApps.length,
        shortlisted: jobApps.filter((a) => a.status === "shortlisted" || a.status === "interview" || a.status === "accepted").length,
        hired: jobApps.filter((a) => a.status === "accepted").length,
      };
    });

    return NextResponse.json({
      totalJobs: jobList.length,
      activeJobs: jobList.filter((j) => j.is_active).length,
      totalApplications: appList.length,
      funnel: stageCounts,
      jobs: jobBreakdown,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch analytics" }, { status: 500 });
  }
}
