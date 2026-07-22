import { NextRequest } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
import { requireCron, serverError } from "@berojgardegreewala/api";

export async function GET(request: NextRequest) {
  try { await requireCron(request); }
  catch (e) { return e instanceof Response ? e : serverError(); }

  if (!isAdminConfigured || !supabaseAdmin) {
    return new Response(JSON.stringify({ error: "Database not configured" }), { status: 503, headers: { "Content-Type": "application/json" } });
  }

  try {
    const today = new Date().toISOString().split("T")[0];

    const { error, count } = await supabaseAdmin
      .from("opportunities")
      .update({ is_active: false, verification_status: "expired" })
      .lt("deadline", today)
      .eq("is_active", true);

    if (error) throw error;

    return new Response(JSON.stringify({ message: "Cleanup complete", expired: count || 0 }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Admin cleanup error:", error);
    return new Response(JSON.stringify({ error: "Cleanup failed" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
