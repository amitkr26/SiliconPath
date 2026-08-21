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
    const [
      { count: activeJobsCount },
      { count: totalAppsCount },
      { count: shortlistedAppsCount },
      { count: candidateCount },
    ] = await Promise.all([
      supabaseAdmin.from("opportunities").select("*", { count: "exact", head: true }).eq("is_active", true),
      supabaseAdmin.from("applications").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("applications").select("*", { count: "exact", head: true }).in("status", ["shortlisted", "interview", "accepted"]),
      supabaseAdmin.from("user_profiles").select("*", { count: "exact", head: true }),
    ]);

    return NextResponse.json({
      activeJobs: activeJobsCount || 0,
      totalApplications: totalAppsCount || 0,
      shortlistedApplications: shortlistedAppsCount || 0,
      totalTalentPool: candidateCount || 0,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch stats" }, { status: 500 });
  }
}
