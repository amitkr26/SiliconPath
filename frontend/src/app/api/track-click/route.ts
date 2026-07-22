import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
import { serverError } from "@berojgardegreewala/api";

export async function POST(request: NextRequest) {
  if (!isAdminConfigured) {
    return NextResponse.json(
      { error: "Database not configured." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { opportunity_id } = body;

    if (!opportunity_id) {
      return NextResponse.json(
        { error: "opportunity_id is required" },
        { status: 400 }
      );
    }

    const { data: current } = await supabaseAdmin
      .from("opportunities")
      .select("apply_clicks")
      .eq("id", opportunity_id)
      .single();

    const currentClicks = current?.apply_clicks || 0;
    const { error } = await supabaseAdmin
      .from("opportunities")
      .update({ apply_clicks: currentClicks + 1 })
      .eq("id", opportunity_id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error tracking click:", error);
    return serverError("Failed to track click");
  }
}
