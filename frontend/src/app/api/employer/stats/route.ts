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
    // 1. Fetch employer-scoped jobs
    let jobQuery = supabaseAdmin
      .from("opportunities")
      .select("id, is_active");

    if (role !== "admin") {
      jobQuery = jobQuery.eq("created_by", user.id);
    }

    const { data: myJobs } = await jobQuery;
    const jobsList = myJobs || [];
    const activeJobsCount = jobsList.filter((j: { is_active: boolean }) => j.is_active).length;
    const myJobIds = jobsList.map((j: { id: string }) => j.id);

    // 2. Fetch applications for employer's jobs
    let totalAppsCount = 0;
    let shortlistedAppsCount = 0;

    if (myJobIds.length > 0) {
      const { data: myApps } = await supabaseAdmin
        .from("applications")
        .select("id, status")
        .in("opportunity_id", myJobIds);

      const appsList = myApps || [];
      totalAppsCount = appsList.length;
      shortlistedAppsCount = appsList.filter((a: { status: string }) =>
        a.status === "shortlisted" || a.status === "interview" || a.status === "accepted"
      ).length;
    }

    // 3. Overall verified talent pool count
    const { count: candidateCount } = await supabaseAdmin
      .from("user_profiles")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({
      activeJobs: activeJobsCount,
      totalApplications: totalAppsCount,
      shortlistedApplications: shortlistedAppsCount,
      totalTalentPool: candidateCount || 0,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch stats" }, { status: 500 });
  }
}
