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

  try {
    // 1. Fetch employer's opportunities
    const { data: jobs } = await supabaseAdmin
      .from("opportunities")
      .select("id, title, category, location, salary_range, created_at, is_active")
      .order("created_at", { ascending: false });

    const jobList = (jobs || []) as Array<{ id: string; title: string; category: string; location?: string; salary_range?: string; created_at: string; is_active: boolean }>;
    const jobIds = jobList.map((j: { id: string }) => j.id);

    // 2. Fetch all applications belonging to these opportunities
    let appsQuery = supabaseAdmin
      .from("applications")
      .select("id, opportunity_id, status, applied_at");

    if (jobIds.length > 0) {
      appsQuery = appsQuery.in("opportunity_id", jobIds);
    }

    const { data: applications } = await appsQuery;
    const appList = (applications || []) as Array<{ id: string; opportunity_id: string; status: string; applied_at: string }>;

    // 3. Compute real funnel stats
    const stageCounts = {
      applied: appList.filter((a: { status: string }) => a.status === "applied" || a.status === "submitted").length,
      screening: appList.filter((a: { status: string }) => a.status === "screening" || a.status === "reviewed").length,
      shortlisted: appList.filter((a: { status: string }) => a.status === "shortlisted").length,
      interview: appList.filter((a: { status: string }) => a.status === "interview").length,
      accepted: appList.filter((a: { status: string }) => a.status === "accepted").length,
      rejected: appList.filter((a: { status: string }) => a.status === "rejected").length,
    };

    // 4. Per-job breakdown
    const jobBreakdown = jobList.map((job: { id: string; title: string; category: string; is_active: boolean }) => {
      const jobApps = appList.filter((a: { opportunity_id: string }) => a.opportunity_id === job.id);
      return {
        id: job.id,
        title: job.title,
        category: job.category,
        is_active: job.is_active,
        total_applications: jobApps.length,
        shortlisted: jobApps.filter((a: { status: string }) => a.status === "shortlisted" || a.status === "interview" || a.status === "accepted").length,
        hired: jobApps.filter((a: { status: string }) => a.status === "accepted").length,
      };
    });

    return NextResponse.json({
      totalJobs: jobList.length,
      activeJobs: jobList.filter((j: { is_active: boolean }) => j.is_active).length,
      totalApplications: appList.length,
      funnel: stageCounts,
      jobs: jobBreakdown,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch analytics" }, { status: 500 });
  }
}
