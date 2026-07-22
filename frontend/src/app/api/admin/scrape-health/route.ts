import { NextRequest } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
import { requireAdmin, serverError } from "@berojgardegreewala/api";

export async function GET(request: NextRequest) {
  try { await requireAdmin(request); }
  catch (e) { return e instanceof Response ? e : serverError(); }

  if (!isAdminConfigured || !supabaseAdmin) {
    return new Response(JSON.stringify({ error: "Database not configured" }), { status: 503, headers: { "Content-Type": "application/json" } });
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
    .select("id, title, organization, category, created_at, verification_status")
    .order("created_at", { ascending: false })
    .limit(20);

  const activeSources = (sources || []).filter((s: { is_active: boolean }) => s.is_active).length;
  const failing = (sources || []).filter(
    (s: { consecutive_failures: number | null }) => (s.consecutive_failures || 0) > 0
  ).length;

  return new Response(JSON.stringify({
    summary: {
      total_sources: (sources || []).length,
      active_sources: activeSources,
      failing_sources: failing,
      last_run_at: runs && runs.length > 0 ? runs[0].started_at : null,
    },
    runs: runs || [],
    sources: sources || [],
    recent_opportunities: recentOpps || [],
  }), { headers: { "Content-Type": "application/json" } });
}
