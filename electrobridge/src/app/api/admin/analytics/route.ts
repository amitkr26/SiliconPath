import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
import { verifyAdmin } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 401 });
  }

  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const [{ count: opportunities }, { count: news }, { count: users }, { count: applications }] = await Promise.all([
      supabaseAdmin.from("opportunities").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("news_articles").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("user_profiles").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("applications").select("*", { count: "exact", head: true }),
    ]);

    return NextResponse.json({
      opportunities: opportunities || 0,
      newsArticles: news || 0,
      users: users || 0,
      applications: applications || 0,
    });
  } catch (error) {
    console.error("Admin analytics error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}