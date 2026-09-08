import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase-admin";
import { requireAdmin, serverError } from "@berojgardegreewala/api";

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .substring(0, 80)
    .replace(/-+$/, "");
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
  } catch (e) {
    return e instanceof Response ? e : serverError("Unauthorized");
  }

  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "20", 10));
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const from = (page - 1) * limit;

    const { data, count, error } = await supabaseAdmin
      .from("news_articles")
      .select("*", { count: "exact" })
      .order("published_at", { ascending: false })
      .range(from, from + limit - 1);

    if (error) throw error;
    return NextResponse.json({ articles: data || [], count: count || 0, page, limit });
  } catch (error) {
    console.error("Admin list news error:", error);
    return serverError("Failed to fetch news articles");
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
  } catch (e) {
    return e instanceof Response ? e : serverError("Unauthorized");
  }

  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const title = (body.title || "").trim();
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const slug = (body.slug || slugify(title) || `news-${Date.now()}`).trim();
    const summary = (body.description || body.summary || "").trim();
    const sourceName = (body.source_name || "SiliconPath Staff").trim();
    const url = (body.source_url || body.url || `https://siliconpath.dev/news/${slug}`).trim();
    const category = (body.category || "General").trim();
    const tags = Array.isArray(body.tags) ? body.tags : [];
    const imageUrl = body.image_url || null;
    const publishedAt = body.published_at || new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from("news_articles")
      .insert([
        {
          title,
          slug,
          summary,
          source_name: sourceName,
          url,
          category,
          tags,
          image_url: imageUrl,
          published_at: publishedAt,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ article: data }, { status: 201 });
  } catch (error: any) {
    console.error("Admin create news error:", error);
    return serverError(error?.message || "Failed to create news article");
  }
}
