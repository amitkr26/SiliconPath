import { MetadataRoute } from "next";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";

const STATIC_PAGES: { url: string; freq: "daily" | "hourly" | "weekly" | "monthly"; priority: number }[] = [
  { url: "https://siliconpath.vercel.app", freq: "daily", priority: 1 },
  { url: "https://siliconpath.vercel.app/search", freq: "daily", priority: 0.9 },
  { url: "https://siliconpath.vercel.app/academy", freq: "daily", priority: 0.8 },
  { url: "https://siliconpath.vercel.app/categories", freq: "weekly", priority: 0.7 },
  { url: "https://siliconpath.vercel.app/companies", freq: "weekly", priority: 0.6 },
  { url: "https://siliconpath.vercel.app/about", freq: "monthly", priority: 0.5 },
  { url: "https://siliconpath.vercel.app/contact", freq: "monthly", priority: 0.3 },
];

const CATEGORY_PAGES = ["jrf", "srf", "phd", "government", "fellowship", "internship"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const urls: MetadataRoute.Sitemap = STATIC_PAGES.map((p) => ({
    url: p.url,
    lastModified: new Date(),
    changeFrequency: p.freq,
    priority: p.priority,
  }));

  for (const cat of CATEGORY_PAGES) {
    urls.push({
      url: `https://siliconpath.vercel.app/search?category=${cat}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    });
  }

  if (isAdminConfigured && supabaseAdmin?.from) {
    const { data: opportunities } = await supabaseAdmin
      .from("opportunities")
      .select("slug, created_at")
      .eq("is_active", true)
      .eq("verification_status", "verified");

    if (opportunities) {
      for (const opp of opportunities as Array<{ slug: string; created_at?: string }>) {
        urls.push({
          url: `https://siliconpath.vercel.app/opportunities/${opp.slug}`,
          lastModified: new Date(opp.created_at || Date.now()),
          changeFrequency: "daily" as const,
          priority: 0.8,
        });
      }
    }

    const { data: companies } = await supabaseAdmin
      .from("company_pages")
      .select("slug, created_at");

    if (companies) {
      for (const c of companies) {
        urls.push({
          url: `https://siliconpath.vercel.app/companies/${c.slug}`,
          lastModified: new Date(c.created_at || Date.now()),
          changeFrequency: "weekly" as const,
          priority: 0.6,
        });
      }
    }
  }

  return urls;
}
