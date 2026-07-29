import { Suspense } from "react";
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

  if (supabaseAdmin?.from) {
    const today = new Date().toISOString().split("T")[0];
    let query = supabaseAdmin
      .from("opportunities")
      .select("*, organizations(*)")
      .eq("is_active", true)
      .or("verification_status.eq.verified,verification_status.is.null,verification_status.eq.auto_verified")
      .or(`deadline.gte.${today},deadline.is.null`)
      .order("created_at", { ascending: false });

    if (searchVal) {
      const cleanSearch = searchVal.replace(/[{}()"\\,.]/g, "").trim().slice(0, 100);
      const words = cleanSearch.split(/\s+/).filter((k) => k.length >= 2);

      const conditions: string[] = [];

      for (const w of words) {
        conditions.push(`title.ilike.%${w}%`);
        conditions.push(`category.ilike.%${w}%`);
        conditions.push(`eligibility.ilike.%${w}%`);
      }

      const { data: orgs } = await supabaseAdmin
        .from("organizations")
        .select("id")
        .or(words.map((w) => `name.ilike.%${w}%`).join(","));

      if (orgs && orgs.length > 0) {
        const orgIds = orgs.map((o: { id: string }) => o.id);
        conditions.push(`organization_id.in.(${orgIds.join(",")})`);
      }

      if (conditions.length > 0) {
        query = query.or(conditions.join(","));
      }
    }

    const { data } = await query.limit(30);

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
      <Suspense fallback={
        <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-8">
          <p className="text-slate-900 font-bold text-sm">Loading opportunities...</p>
        </div>
      }>
        <OpportunitiesClient initialData={initialData} />
      </Suspense>
    </>
  );
}
