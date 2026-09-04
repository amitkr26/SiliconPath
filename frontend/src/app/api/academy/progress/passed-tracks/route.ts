import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (isAdminConfigured && supabaseAdmin && userId) {
    try {
      const { data } = await supabaseAdmin
        .from("user_learning_progress")
        .select("track_slug")
        .eq("user_id", userId)
        .eq("status", "passed");

      if (data) {
        return NextResponse.json(data.map((d: any) => d.track_slug).filter(Boolean));
      }
    } catch (err) {
      console.error("DB passed tracks query error:", err);
    }
  }

  return NextResponse.json([]);
}
