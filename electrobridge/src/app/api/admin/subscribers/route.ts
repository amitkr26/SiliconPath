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

    return NextResponse.json({
      subscribers: data || [],
      count: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error("Admin subscribers error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}