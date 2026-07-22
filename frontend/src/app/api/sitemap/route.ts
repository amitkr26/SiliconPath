import { NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
import { serverError } from "@berojgardegreewala/api";

export async function GET() {
  if (!isAdminConfigured) {
    return NextResponse.json(
      { error: "Database not configured." },
      { status: 503 }
    );
  }

  try {
    const [{ data: opportunities }, { data: news }] = await Promise.all([
      supabaseAdmin
        .from("opportunities")
        .select("slug, updated_at")
        .eq("is_active", true)
        .eq("verification_status", "verified")
        .order("updated_at", { ascending: false })
        .limit(1000),
      supabaseAdmin
        .from("news_articles")
        .select("slug, updated_at")
        .order("updated_at", { ascending: false })
        .limit(1000),
    ]);

    const baseUrl = "https://berojgardegreewala.vercel.app";
    const urls = [
      { url: baseUrl, lastmod: new Date().toISOString(), changefreq: "daily", priority: 1.0 },
      { url: `${baseUrl}/opportunities`, lastmod: new Date().toISOString(), changefreq: "daily", priority: 0.9 },
      { url: `${baseUrl}/news`, lastmod: new Date().toISOString(), changefreq: "daily", priority: 0.8 },
      { url: `${baseUrl}/academy`, lastmod: new Date().toISOString(), changefreq: "weekly", priority: 0.8 },
      { url: `${baseUrl}/companies`, lastmod: new Date().toISOString(), changefreq: "weekly", priority: 0.7 },
    ];

    (opportunities || []).forEach((o: { slug: string; updated_at: string }) => {
      urls.push({ url: `${baseUrl}/opportunities/${o.slug}`, lastmod: o.updated_at, changefreq: "daily", priority: 0.8 });
    });

    (news || []).forEach((n: { slug: string; updated_at: string }) => {
      urls.push({ url: `${baseUrl}/news/${n.slug}`, lastmod: n.updated_at, changefreq: "weekly", priority: 0.7 });
    });

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.url}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join("\n")}
</urlset>`;

    return new NextResponse(sitemap, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error generating sitemap:", error);
    return serverError("Failed to generate sitemap");
  }
}