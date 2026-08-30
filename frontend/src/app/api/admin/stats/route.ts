import { NextRequest } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
import { requireAdmin, serverError } from "@berojgardegreewala/api";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try { await requireAdmin(request); }
  catch (e) { return e instanceof Response ? e : serverError(); }

  if (!isAdminConfigured || !supabaseAdmin) {
    return Response.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    // Run all counts in parallel (ponytail: O(n) queries, each O(1) — acceptable for an admin panel)
    const [
      totalRes, activeRes, pendingRes, rejectedRes,
      brokenRes, expiredRes, qualityRes
    ] = await Promise.all([
      supabaseAdmin.from("opportunities").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("opportunities").select("*", { count: "exact", head: true }).eq("is_active", true),
      supabaseAdmin.from("opportunities").select("*", { count: "exact", head: true }).eq("verification_status", "pending"),
      supabaseAdmin.from("opportunities").select("*", { count: "exact", head: true }).eq("verification_status", "rejected"),
      supabaseAdmin.from("opportunities").select("*", { count: "exact", head: true }).eq("link_check_status", 404),
      supabaseAdmin.from("opportunities").select("*", { count: "exact", head: true }).eq("verification_status", "expired"),
      // quality_score may not exist yet — select it carefully
      supabaseAdmin.from("opportunities").select("quality_score").limit(1).maybeSingle(),
    ]);

    const hasQualityScore = !qualityRes.error;
    let lowQuality = 0;
    if (hasQualityScore) {
      const { count } = await supabaseAdmin
        .from("opportunities")
        .select("*", { count: "exact", head: true })
        .not("quality_score", "is", null)
        .lt("quality_score", 50);
      lowQuality = count ?? 0;
    }

    return Response.json({
      total: totalRes.count ?? 0,
      active: activeRes.count ?? 0,
      pending: pendingRes.count ?? 0,
      rejected: rejectedRes.count ?? 0,
      broken_link: brokenRes.count ?? 0,
      expired: expiredRes.count ?? 0,
      low_quality: lowQuality,
      has_quality_score: hasQualityScore,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return Response.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
