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
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString();

    const [{ count: opportunities }, { count: news }, { count: users }, { count: applications },
      { count: newOpsWeek }, { count: newUsersWeek },
      { data: categoryData }] = await Promise.all([
      supabaseAdmin.from("opportunities").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("news_articles").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("user_profiles").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("applications").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("opportunities").select("created_at", { count: "exact", head: true }).gte("created_at", weekAgo),
      supabaseAdmin.from("user_profiles").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
      supabaseAdmin.from("opportunities").select("category").not("category", "is", null),
    ]);

    const catCount: Record<string, number> = {};
    (categoryData || []).forEach((o: { category?: string }) => { if (o.category) catCount[o.category] = (catCount[o.category] || 0) + 1; });

    const { data: platformData } = await supabaseAdmin.from("platform_analytics")
      .select("event_type, created_at").gte("created_at", monthAgo).order("created_at", { ascending: false });

    const pageViews = platformData?.filter((d: any) => d.event_type === "page_view").length || 0;
    const searches = platformData?.filter((d: any) => d.event_type === "search").length || 0;
    const applications_d = platformData?.filter((d: any) => d.event_type === "application").length || 0;

    return new Response(JSON.stringify({
      opportunities: opportunities || 0,
      newsArticles: news || 0,
      users: users || 0,
      applications: applications || 0,
      newThisWeek: { opportunities: newOpsWeek || 0, users: newUsersWeek || 0 },
      categories: catCount,
      events: { pageViews, searches, applications: applications_d },
    }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Admin analytics error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch analytics" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
