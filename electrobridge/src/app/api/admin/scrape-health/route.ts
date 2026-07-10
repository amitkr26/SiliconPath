import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
import { verifyAdmin } from "@/lib/admin-auth";

// Scrape health monitor data (admin-only).
// Reads v2 tables: scrape_runs, scrape_sources, and a sample of recent opportunities
// (with joined organization name) so data quality can be eyeballed for the
// person-name-as-organization bug class.
export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { data: runs } = await supabaseAdmin
    .from("scrape_runs")
    .select("id, source_id, status, results_count, error, duration_ms, started_at, completed_at")
    .order("started_at", { ascending: false })
    .limit(25);

  const { data: sources } = await supabaseAdmin
    .from("scrape_sources")
    .select("id, name, url, adapter, is_active, consecutive_failures, last_success_at, last_error, total_results")
    .order("consecutive_failures", { ascending: false })
    .limit(100);

  const { data: recentOpps } = await supabaseAdmin
    .from("opportunities")
    .select("id, title, category, created_at, verification_status, organizations(name)")
    .order("created_at", { ascending: false })
    .limit(20);

  const activeSources = (sources || []).filter((s: { is_active: boolean }) => s.is_active).length;
  const failing = (sources || []).filter(
    (s: { consecutive_failures: number | null }) => (s.consecutive_failures || 0) > 0
  ).length;

  return NextResponse.json({
    summary: {
      total_sources: (sources || []).length,
      active_sources: activeSources,
      failing_sources: failing,
      last_run_at: runs && runs.length > 0 ? runs[0].started_at : null,
    },
    runs: runs || [],
    sources: sources || [],
    recent_opportunities: recentOpps || [],
  });
}
