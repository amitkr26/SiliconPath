import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
import { mapDbOpportunityToClient } from "@/lib/utils";
import { serverError } from "@berojgardegreewala/api";

export async function GET(request: NextRequest) {
  if (!isAdminConfigured) {
    return NextResponse.json(
      { error: "Database not configured." },
      { status: 503 }
    );
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("opportunities")
      .select("*")
      .eq("is_active", true)
      .eq("verification_status", "verified")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) throw error;

    const opportunities = (data || []).map(mapDbOpportunityToClient);
    return NextResponse.json({ data: opportunities });
  } catch (error) {
    console.error("Error fetching featured opportunities:", error);
    return serverError("Failed to fetch featured opportunities");
  }
}