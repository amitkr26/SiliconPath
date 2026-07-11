import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabase";
import { mapDbOpportunityToClient } from "@/lib/utils";
import { GARBAGE_TITLE_PATTERNS, SCRAPED_TITLE_MIN_LENGTH } from "@/lib/scrapers/utils";
import OpportunitiesClient from "./OpportunitiesClient";

export const metadata: Metadata = {
  title: "All Opportunities | SiliconPath",
  description: "Browse verified semiconductor, VLSI, JRF, and PhD opportunities.",
  alternates: {
    canonical: "https://siliconpath.vercel.app/opportunities",
  },
};

// Revalidate every 5 minutes
export const revalidate = 300;

/**
 * Guard the display path against stale garbage rows that were inserted before
 * the scraper's title filter existed (e.g. nav headings like "Payment Gateway",
 * "At a Glance", "Departments"). Uses the same GARBAGE_TITLE_PATTERNS the
 * scraper uses to skip them at ingest time.
 */
function isDisplayableOpportunity(opp: { title?: string | null }): boolean {
  const title = (opp?.title || "").trim();
  if (!title) return false;
  if (title.length < SCRAPED_TITLE_MIN_LENGTH) return false;
  if (GARBAGE_TITLE_PATTERNS.test(title)) return false;
  return true;
}

export default async function OpportunitiesPage() {
  let initialData: any[] = [];

  if (supabaseAdmin?.from) {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabaseAdmin
      .from("opportunities")
      .select("*, organizations(*)")
      .eq("is_active", true)
      .eq("verification_status", "verified")
      .or(`deadline.gte.${today},deadline.is.null`)
      .order("created_at", { ascending: false })
      .limit(60);

    if (data) {
      initialData = data.map(mapDbOpportunityToClient).filter(isDisplayableOpportunity).slice(0, 30);
    }
  }

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": initialData.map((opp, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "url": `https://siliconpath.vercel.app/opportunities/${opp.slug}`
    }))
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <OpportunitiesClient initialData={initialData} />
    </>
  );
}
