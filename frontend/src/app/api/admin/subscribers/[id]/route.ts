import { NextRequest } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
import { requireAdmin, serverError } from "@berojgardegreewala/api";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try { await requireAdmin(request); }
  catch (e) { return e instanceof Response ? e : serverError(); }

  if (!isAdminConfigured || !supabaseAdmin) {
    return new Response(JSON.stringify({ error: "Database not configured" }), { status: 503, headers: { "Content-Type": "application/json" } });
  }

  try {
    const { id } = await params;

    const { error } = await supabaseAdmin
      .from("subscribers")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Admin delete subscriber error:", error);
    return new Response(JSON.stringify({ error: "Failed to delete" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
