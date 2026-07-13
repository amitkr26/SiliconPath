import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
import { verifyCron } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  if (!verifyCron(request)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 401 });
  }

  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const today = new Date().toISOString().split("T")[0];

    const { error, count } = await supabaseAdmin
      .from("opportunities")
      .update({ is_active: false, verification_status: "expired" })
      .lt("deadline", today)
      .eq("is_active", true);

    if (error) throw error;

    return NextResponse.json({ message: "Cleanup complete", expired: count || 0 });
  } catch (error) {
    console.error("Admin cleanup error:", error);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}