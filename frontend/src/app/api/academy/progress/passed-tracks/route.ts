import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (isAdminConfigured && supabaseAdmin && userId) {
    try {
      const { data: completed } = await supabaseAdmin
        .from("user_learning_progress")
        .select("track_id")
        .eq("user_id", userId)
        .eq("day_id", "assessment")
        .eq("status", "completed");

      if (completed && completed.length > 0) {
        const trackIds = [...new Set(completed.map((d: any) => d.track_id))];
        const { data: tracks } = await supabaseAdmin
          .from("learning_tracks")
          .select("slug")
          .in("id", trackIds);

        if (tracks) {
          return NextResponse.json(tracks.map((t: any) => t.slug).filter(Boolean));
        }
      }
    } catch (err) {
      console.error("DB passed tracks query error:", err);
    }
  }

  return NextResponse.json([]);
}
