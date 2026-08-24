import { Suspense } from "react";
import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabase";
import { mapDbOpportunityToClient } from "@/lib/utils";
import { GARBAGE_TITLE_PATTERNS } from "@/lib/scrapers/utils";
import { searchOpportunities } from "@/lib/opportunities-query";
import OpportunitiesClient from "./OpportunitiesClient";

export const metadata: Metadata = {
  title: "All Opportunities",
  description: "Browse verified semiconductor, VLSI, JRF, and PhD opportunities.",
  openGraph: {
    url: "https://berojgardegreewala.vercel.app/opportunities",
  },
  alternates: {
    canonical: "https://berojgardegreewala.vercel.app/opportunities",
  },
};

export const dynamic = "force-dynamic";

function isDisplayableOpportunity(o: { title?: string | null }): boolean {
  if (!o || !o.title) return false;
  const t = o.title.trim();
  if (t.length < 6) return false;
  return !GARBAGE_TITLE_PATTERNS.test(t);
}

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams?: Promise<{ search?: string; category?: string }> | { search?: string; category?: string };
}) {
  let initialData: ReturnType<typeof mapDbOpportunityToClient>[] = [];
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const searchVal = resolvedSearchParams.search || "";
  const categoryVal = resolvedSearchParams.category || "All";

  if (supabaseAdmin?.from) {
    try {
      const { data } = await searchOpportunities({
        search: searchVal,
        category: categoryVal,
        limit: 30,
        page: 1,
      });

      if (data && data.length > 0) {
        initialData = data.map(mapDbOpportunityToClient).filter(isDisplayableOpportunity);
      }
    } catch (err) {
      console.error("[Opportunities Feed Error]:", err);
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
      <Suspense fallback={
        <div className="min-h-screen bg-bg-primary flex items-center justify-center p-8">
          <p className="text-slate-900 font-bold text-sm">Loading opportunities...</p>
        </div>
      }>
        <OpportunitiesClient initialData={initialData} />
      </Suspense>
    </>
  );
}
