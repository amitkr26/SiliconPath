import { MetadataRoute } from "next";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase-admin";
import { isCurrentlyAvailable, computeIstToday, buildAvailabilityDbFilter } from "@/lib/availability";

const STATIC_PAGES: { url: string; freq: "daily" | "hourly" | "weekly" | "monthly"; priority: number }[] = [
  { url: "https://berojgardegreewala.vercel.app", freq: "daily", priority: 1 },
  { url: "https://berojgardegreewala.vercel.app/opportunities", freq: "daily", priority: 0.9 },
  { url: "https://berojgardegreewala.vercel.app/news", freq: "hourly", priority: 0.8 },
  { url: "https://berojgardegreewala.vercel.app/organizations", freq: "weekly", priority: 0.7 },
  { url: "https://berojgardegreewala.vercel.app/categories", freq: "weekly", priority: 0.7 },
  { url: "https://berojgardegreewala.vercel.app/about", freq: "monthly", priority: 0.5 },
  { url: "https://berojgardegreewala.vercel.app/resources", freq: "monthly", priority: 0.5 },
  { url: "https://berojgardegreewala.vercel.app/contact", freq: "monthly", priority: 0.3 },
  { url: "https://berojgardegreewala.vercel.app/ask-ai", freq: "monthly", priority: 0.5 },
];

const CATEGORY_PAGES = ["jrf", "srf", "phd", "govt-job", "fellowship", "private", "international"];

const LOCATION_HUBS = ["bengaluru", "hyderabad", "noida", "pune", "chennai", "ahmedabad"];

const RESOURCE_PAGES = [
  "jrf-guide",
  "jrf-vs-srf-difference",
  "drdo-recruitment-electronics",
  "phd-guide",
  "fully-funded-phd-vlsi-abroad",
  "international-fellowships",
  "net-vs-gate",
  "vlsi-careers",
  "vlsi-career-guide",
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

  // Location Hub pages
  for (const city of LOCATION_HUBS) {
    urls.push({
      url: `https://berojgardegreewala.vercel.app/opportunities/location/${city}`,
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
    const today = computeIstToday();

    // Opportunity detail pages — only active, verified, currently available
    const { data: opportunities } = await supabaseAdmin
      .from("opportunities")
      .select("slug, created_at, category, deadline, verification_status, posted_date, last_link_checked")
      .eq("is_active", true)
      .eq("verification_status", "verified")
      .or(buildAvailabilityDbFilter(today));

    if (opportunities) {
      const available = opportunities.filter((opp: any) => isCurrentlyAvailable(opp, today));
      for (const opp of available as Array<{ slug: string; created_at?: string }>) {
        urls.push({
          url: `https://berojgardegreewala.vercel.app/opportunities/${opp.slug}`,
          lastModified: new Date(opp.created_at || Date.now()),
          changeFrequency: "daily" as const,
          priority: 0.8,
        });
      }
    }

    // Organization pages (canonical source: organizations table)
    const { data: orgs } = await supabaseAdmin
      .from("organizations")
      .select("slug, created_at");

    if (orgs) {
      for (const org of orgs as Array<{ slug: string; created_at?: string }>) {
        urls.push({
          url: `https://berojgardegreewala.vercel.app/organizations/${org.slug}`,
          lastModified: new Date(org.created_at || Date.now()),
          changeFrequency: "weekly" as const,
          priority: 0.6,
        });
      }
    }

    // News article pages (by slug) — no arbitrary cap
    const { data: news } = await supabaseAdmin
      .from("news_articles")
      .select("slug, published_at")
      .not("slug", "is", null);

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
