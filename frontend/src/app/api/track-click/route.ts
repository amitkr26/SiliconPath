import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase-admin";
import { neon1 } from "@/lib/db";
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

    // P0.4: apply_clicks column no longer exists on live opportunities —
    // clicks now land in Neon click_events (event_type 'apply_click'), the
    // table analytics/platform + admin/analytics already read.
    if (neon1) {
      await neon1`
        INSERT INTO click_events (opportunity_id, event_type)
        VALUES (${String(opportunity_id)}, 'apply_click')
      `.catch((err: unknown) => {
        console.error("Error tracking click:", err);
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error tracking click:", error);
    return serverError("Failed to track click");
  }
}
