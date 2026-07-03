import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  if (!isAdminConfigured) {
    return NextResponse.json(
      { error: "Database not configured." },
      { status: 503 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search");
    const tag = searchParams.get("tag");

    let query = supabaseAdmin
      .from("news_articles")
      .select("*")
      .order("published_at", { ascending: false })
      .limit(limit);

    if (tag) {
      query = query.contains("tags", [tag]);
    }

    if (search) {
      query = query.or(
        `title.ilike.%${search}%,summary.ilike.%${search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase query error:", JSON.stringify(error));
      throw error;
    }

    return NextResponse.json({ articles: data || [], count: data?.length || 0 });
  } catch (error) {
    console.error("Error fetching news:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch news" },
      { status: 500 }
    );
  }
}
