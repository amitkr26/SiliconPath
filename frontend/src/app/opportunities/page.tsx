import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabase";
import { mapDbOpportunityToClient } from "@/lib/utils";
import { GARBAGE_TITLE_PATTERNS } from "@/lib/scrapers/utils";
import OpportunitiesClient from "./OpportunitiesClient";

export const metadata: Metadata = {
  title: "All Opportunities | BerojgarDegreeWala",
  description: "Browse verified semiconductor, VLSI, JRF, and PhD opportunities.",
  alternates: {
    canonical: "https://berojgardegreewala.vercel.app/opportunities",
  },
};

// Revalidate every 5 minutes
export const revalidate = 300;

// Drop legacy nav-heading rows ("Payment Gateway", "At a Glance", ...) on read.
function isDisplayableOpportunity(o: { title?: string | null }): boolean {
  if (!o || !o.title) return false;
  const t = o.title.trim();
  if (t.length < 6) return false;
  return !GARBAGE_TITLE_PATTERNS.test(t);
}

export default async function OpportunitiesPage() {
  let initialData: ReturnType<typeof mapDbOpportunityToClient>[] = [];

  if (supabaseAdmin?.from) {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabaseAdmin
      .from("opportunities")
      .select("*, organizations(*)")
      .eq("is_active", true)
      .eq("verification_status", "verified")
      .or(`deadline.gte.${today},deadline.is.null`)
      .order("created_at", { ascending: false })
      .limit(30);

    if (data) {
      initialData = data.map(mapDbOpportunityToClient).filter(isDisplayableOpportunity);
    }
  }

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": initialData.map((opp, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "url": `https://berojgardegreewala.vercel.app/opportunities/${opp.slug}`,
    })),
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
