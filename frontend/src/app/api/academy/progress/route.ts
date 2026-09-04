import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, trackId, dayId, completed } = body;

    if (isAdminConfigured && supabaseAdmin && userId) {
      try {
        await supabaseAdmin.from("user_learning_progress").upsert(
          [
            {
              user_id: userId,
              track_id: trackId,
              day_id: dayId,
              status: completed ? "completed" : "in_progress",
              updated_at: new Date().toISOString(),
            },
          ],
          { onConflict: "user_id,track_id,day_id" }
        );
      } catch (err) {
        console.error("DB progress upsert error:", err);
      }
    }

    return NextResponse.json(true);
  } catch {
    return NextResponse.json(true);
  }
}
