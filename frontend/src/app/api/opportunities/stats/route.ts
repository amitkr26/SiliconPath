import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
import { serverError } from "@berojgardegreewala/api";
import { isCurrentlyAvailable, computeIstToday, buildAvailabilityDbFilter } from "@/lib/availability";

export async function GET(request: NextRequest) {
  if (!isAdminConfigured) {
    return NextResponse.json(
      { error: "Database not configured." },
      { status: 503 }
    );
  }

  try {
    const today = computeIstToday();
    const availFilter = buildAvailabilityDbFilter(today);

    const [{ count: total }, { count: active }, { count: verified }] = await Promise.all([
      supabaseAdmin.from("opportunities").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("opportunities").select("*", { count: "exact", head: true })
        .eq("is_active", true)
        .neq("verification_status", "rejected")
        .neq("verification_status", "expired")
        .neq("verification_status", "link_unavailable")
        .or(availFilter),
      supabaseAdmin.from("opportunities").select("*", { count: "exact", head: true })
        .eq("is_active", true)
        .eq("verification_status", "verified")
        .neq("verification_status", "expired")
        .neq("verification_status", "link_unavailable")
        .or(availFilter),
    ]);

    const byCategory = await supabaseAdmin
      .from("opportunities")
      .select("category, deadline, verification_status, posted_date, created_at, last_link_checked, is_active")
      .eq("is_active", true)
      .neq("verification_status", "rejected")
      .neq("verification_status", "expired")
      .neq("verification_status", "link_unavailable")
      .or(availFilter)
      .limit(500);

    // Post-filter: canonical availability for accurate category counts
    const categoryCounts: Record<string, number> = {};
    (byCategory.data || [])
      .filter((o: any) => isCurrentlyAvailable(o, today))
      .forEach((o: { category: string }) => {
        categoryCounts[o.category] = (categoryCounts[o.category] || 0) + 1;
      });

    return NextResponse.json({
      total: total || 0,
      active: active || 0,
      verified: verified || 0,
      byCategory: categoryCounts,
    });
  } catch (error) {
    console.error("Error fetching opportunity stats:", error);
    return serverError("Failed to fetch stats");
  }
}