export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
import { mapDbOpportunityToClient } from "@/lib/utils";
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

    const { data, error } = await supabaseAdmin
      .from("opportunities")
      .select("*")
      .eq("is_active", true)
      .eq("verification_status", "verified")
      .or(buildAvailabilityDbFilter(today))
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) throw error;

    // Post-filter: canonical availability
    const opportunities = (data || [])
      .filter((opp: any) => isCurrentlyAvailable(opp, today))
      .slice(0, 10)
      .map(mapDbOpportunityToClient);
    return NextResponse.json({ data: opportunities });
  } catch (error) {
    console.error("Error fetching featured opportunities:", error);
    return serverError("Failed to fetch featured opportunities");
  }
}