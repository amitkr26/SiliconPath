import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, trackId, dayId, dayNumber, completed, status, score } = body;

    // Support both shapes: day completion (dayId/completed) and assessment (dayNumber/status/score)
    const resolvedDayId = dayId || (dayNumber === 999 ? "assessment" : undefined);
    const resolvedStatus = status || (completed ? "completed" : "in_progress");

    if (isAdminConfigured && supabaseAdmin && userId && resolvedDayId) {
      try {
        const row: Record<string, any> = {
          user_id: userId,
          track_id: trackId,
          day_id: resolvedDayId,
          status: resolvedStatus,
          updated_at: new Date().toISOString(),
        };
        if (typeof score === "number") {
          row.score = score;
        }
        await supabaseAdmin.from("user_learning_progress").upsert([row], {
          onConflict: "user_id,track_id,day_id",
        });
      } catch (err) {
        console.error("DB progress upsert error:", err);
      }
    }

    return NextResponse.json(true);
  } catch {
    return NextResponse.json(true);
  }
}
