import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (isAdminConfigured && supabaseAdmin && userId) {
    try {
      const { data } = await supabaseAdmin
        .from("user_learning_progress")
        .select("day_id")
        .eq("user_id", userId)
        .eq("status", "completed");

      if (data) {
        return NextResponse.json(data.map((d: any) => d.day_id).filter(Boolean));
      }
    } catch (err) {
      console.error("DB completed days query error:", err);
    }
  }

  return NextResponse.json([]);
}
