import { NextRequest } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
import { requireAdmin, serverError } from "@berojgardegreewala/api";

export async function GET(request: NextRequest) {
  try { await requireAdmin(request); }
  catch (e) { return e instanceof Response ? e : serverError(); }

  if (!isAdminConfigured || !supabaseAdmin) {
    return new Response(JSON.stringify({ error: "Database not configured" }), { status: 503, headers: { "Content-Type": "application/json" } });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));
    const start = (page - 1) * limit;

    const { data, count, error } = await supabaseAdmin
      .from("subscribers")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(start, start + limit - 1);

    if (error) throw error;

    return new Response(JSON.stringify({
      subscribers: data || [],
      count: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Admin subscribers error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
