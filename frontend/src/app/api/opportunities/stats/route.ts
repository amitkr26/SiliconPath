import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
import { serverError } from "@berojgardegreewala/api";

export async function GET(request: NextRequest) {
  if (!isAdminConfigured) {
    return NextResponse.json(
      { error: "Database not configured." },
      { status: 503 }
    );
  }

  try {
    const [{ count: total }, { count: active }, { count: verified }] = await Promise.all([
      supabaseAdmin.from("opportunities").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("opportunities").select("*", { count: "exact", head: true }).eq("is_active", true),
      supabaseAdmin.from("opportunities").select("*", { count: "exact", head: true }).eq("verification_status", "verified"),
    ]);

    const byCategory = await supabaseAdmin
      .from("opportunities")
      .select("category")
      .eq("is_active", true)
      .eq("verification_status", "verified");

    const categoryCounts: Record<string, number> = {};
    (byCategory.data || []).forEach((o: { category: string }) => {
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