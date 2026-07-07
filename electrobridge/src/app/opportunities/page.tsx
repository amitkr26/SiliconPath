import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabase";
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

export default async function OpportunitiesPage() {
  let initialData: any[] = [];
  
  if (supabaseAdmin?.from) {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabaseAdmin
      .from("opportunities")
      .select("*")
      .eq("is_active", true)
      .eq("verification_status", "verified")
      .or(`deadline.gte.${today},deadline.is.null`)
      .order("created_at", { ascending: false })
      .limit(30);
      
    if (data) {
      initialData = data;
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
