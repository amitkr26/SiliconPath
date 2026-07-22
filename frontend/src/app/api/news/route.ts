import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
import { mapNewsArticleToClient } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json(
      { articles: [], count: 0, error: "Database not configured." },
      { status: 200 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "30");
    const search = searchParams.get("search");
    const tag = searchParams.get("tag");

    let query = supabaseAdmin
      .from("news_articles")
      .select("*")
      .order("published_at", { ascending: false })
      .limit(limit);

    if (search) {
      const cleanSearch = search.replace(/[{}()"\\,.]/g, "").slice(0, 100);
      query = query.or(`title.ilike.%${cleanSearch}%,summary.ilike.%${cleanSearch}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase news query error:", error.message);
      return NextResponse.json({ articles: [], count: 0 });
    }

    let articles = (data || []).map(mapNewsArticleToClient);

    // In-memory tag filtering for 100% reliability
    if (tag && tag.toLowerCase() !== "all") {
      const lowerTag = tag.toLowerCase();
      articles = articles.filter((a: any) => {
        const tArr = Array.isArray(a.tags) ? a.tags : [];
        return (
          tArr.some((t: string) => t.toLowerCase() === lowerTag) ||
          (a.title && a.title.toLowerCase().includes(lowerTag)) ||
          (a.summary && a.summary.toLowerCase().includes(lowerTag))
        );
      });
    }

    return NextResponse.json({ articles, count: articles.length });
  } catch (err: any) {
    console.error("API /api/news error:", err);
    return NextResponse.json({ articles: [], count: 0 });
  }
}
