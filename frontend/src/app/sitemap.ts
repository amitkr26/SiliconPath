import { MetadataRoute } from "next";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";

const STATIC_PAGES: { url: string; freq: "daily" | "hourly" | "weekly" | "monthly"; priority: number }[] = [
  { url: "https://berojgardegreewala.vercel.app", freq: "daily", priority: 1 },
  { url: "https://berojgardegreewala.vercel.app/opportunities", freq: "daily", priority: 0.9 },
  { url: "https://berojgardegreewala.vercel.app/news", freq: "hourly", priority: 0.8 },
  { url: "https://berojgardegreewala.vercel.app/organizations", freq: "weekly", priority: 0.7 },
  { url: "https://berojgardegreewala.vercel.app/about", freq: "monthly", priority: 0.5 },
  { url: "https://berojgardegreewala.vercel.app/resources", freq: "monthly", priority: 0.5 },
  { url: "https://berojgardegreewala.vercel.app/contact", freq: "monthly", priority: 0.3 },
  { url: "https://berojgardegreewala.vercel.app/match", freq: "monthly", priority: 0.4 },
  { url: "https://berojgardegreewala.vercel.app/chat", freq: "monthly", priority: 0.4 },
  { url: "https://berojgardegreewala.vercel.app/login", freq: "monthly", priority: 0.2 },
  { url: "https://berojgardegreewala.vercel.app/signup", freq: "monthly", priority: 0.2 },
  { url: "https://berojgardegreewala.vercel.app/companies", freq: "weekly", priority: 0.6 },
  { url: "https://berojgardegreewala.vercel.app/search", freq: "weekly", priority: 0.5 },
];

const CATEGORY_PAGES = ["jrf", "srf", "phd", "govt-job", "fellowship", "private", "international"];

const RESOURCE_PAGES = [
  "jrf-guide",
  "phd-guide",
  "international-fellowships",
  "vlsi-careers",
  "net-vs-gate",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const urls: MetadataRoute.Sitemap = STATIC_PAGES.map((p) => ({
    url: p.url,
    lastModified: new Date(),
    changeFrequency: p.freq,
    priority: p.priority,
  }));

  // Category pages
  for (const cat of CATEGORY_PAGES) {
    urls.push({
      url: `https://berojgardegreewala.vercel.app/category/${cat}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    });
  }

  // Resource pages
  for (const res of RESOURCE_PAGES) {
    urls.push({
      url: `https://berojgardegreewala.vercel.app/resources/${res}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }

  if (isAdminConfigured && supabaseAdmin?.from) {
    // Opportunity detail pages
    const { data: opportunities } = await supabaseAdmin
      .from("opportunities")
      .select("slug, created_at")
      .eq("is_active", true)
      .eq("verification_status", "verified");

    if (opportunities) {
      for (const opp of opportunities as Array<{ slug: string; created_at?: string }>) {
        urls.push({
          url: `https://berojgardegreewala.vercel.app/opportunities/${opp.slug}`,
          lastModified: new Date(opp.created_at || Date.now()),
          changeFrequency: "daily" as const,
          priority: 0.8,
        });
      }
    }

    // Organization pages
    const { data: orgs } = await supabaseAdmin
      .from("opportunities")
      .select("org_slug")
      .eq("is_active", true);

    if (orgs) {
      const slugSet = new Set<string>();
      orgs.forEach((o: { org_slug: string }) => { if (o.org_slug) slugSet.add(o.org_slug); });
      const uniqueSlugs = Array.from(slugSet);
      for (const slug of uniqueSlugs) {
        urls.push({
          url: `https://berojgardegreewala.vercel.app/organizations/${slug}`,
          lastModified: new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.6,
        });
      }
    }

    // Company detail pages
    const { data: companies } = await supabaseAdmin
      .from("company_pages")
      .select("slug, created_at");

    if (companies) {
      for (const c of companies) {
        urls.push({
          url: `https://berojgardegreewala.vercel.app/companies/${c.slug}`,
          lastModified: new Date(c.created_at || Date.now()),
          changeFrequency: "weekly" as const,
          priority: 0.6,
        });
      }
    }

    // News article pages (by slug)
    const { data: news } = await supabaseAdmin
      .from("news_articles")
      .select("slug, published_at")
      .not("slug", "is", null)
      .limit(200);

    if (news) {
      for (const article of news as Array<{ slug: string; published_at?: string }>) {
        urls.push({
          url: `https://berojgardegreewala.vercel.app/news/${article.slug}`,
          lastModified: new Date(article.published_at || Date.now()),
          changeFrequency: "monthly" as const,
          priority: 0.5,
        });
      }
    }
  }

  return urls;
}
