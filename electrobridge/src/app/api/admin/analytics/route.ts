import { NextRequest } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
import { requireAdmin, serverError } from "@siliconpath/api";

export async function GET(request: NextRequest) {
  try { await requireAdmin(request); }
  catch (e) { return e instanceof Response ? e : serverError(); }

  if (!isAdminConfigured || !supabaseAdmin) {
    return new Response(JSON.stringify({ error: "Database not configured" }), { status: 503, headers: { "Content-Type": "application/json" } });
  }

  try {
    const [{ count: opportunities }, { count: news }, { count: users }, { count: applications }] = await Promise.all([
      supabaseAdmin.from("opportunities").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("news_articles").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("user_profiles").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("applications").select("*", { count: "exact", head: true }),
    ]);

    return new Response(JSON.stringify({
      opportunities: opportunities || 0,
      newsArticles: news || 0,
      users: users || 0,
      applications: applications || 0,
    }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Admin analytics error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch analytics" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
