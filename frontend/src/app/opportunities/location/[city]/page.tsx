import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, MapPin, Briefcase } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";
import OpportunityCard from "@/components/OpportunityCard";

interface Props {
  params: { city: string };
}

// Convert "bangalore" to "Bangalore"
function formatCity(citySlug: string): string {
  return citySlug
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cityName = formatCity(params.city);
  return {
    title: `VLSI & Semiconductor Jobs in ${cityName} | BerojgarDegreeWala`,
    description: `Browse verified VLSI, embedded systems, and semiconductor jobs and internships in ${cityName}. Find active opportunities from top organizations.`,
    alternates: { canonical: `https://berojgardegreewala.vercel.app/opportunities/location/${params.city.toLowerCase()}` },
  };
}

export default async function LocationPage({ params }: Props) {
  const cityName = formatCity(params.city);
  let opportunities: any[] = [];
  
  if (supabaseAdmin?.from) {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabaseAdmin
      .from("opportunities")
      .select("*")
      .eq("is_active", true)
      .eq("verification_status", "verified")
      .ilike("location", `%${cityName}%`)
      .or(`deadline.gte.${today},deadline.is.null`)
      .order("created_at", { ascending: false });
      
    if (data) {
      opportunities = data;
    }
  }

  // If no opportunities exist for this city, we still render the page but show empty state.
  // This is better for SEO than throwing a 404 for valid cities that just happen to be empty right now.

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": opportunities.map((opp, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "url": `https://berojgardegreewala.vercel.app/opportunities/${opp.slug}`
    }))
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />

      <Link href="/opportunities" className="inline-flex items-center gap-1 text-[#94A3B8] hover:text-white transition-colors text-sm mb-6">
        <ArrowLeft className="w-4 h-4" />
        All Opportunities
      </Link>

      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-white flex items-center gap-2">
          <MapPin className="w-6 h-6 text-[#00E5FF]" />
          Jobs in {cityName}
        </h1>
        <p className="text-[#94A3B8] mt-2 text-sm">
          Semiconductor, VLSI, and Electronics Research positions located in {cityName}.
        </p>
        <p className="text-[#00E5FF] text-sm mt-1 font-medium">
          {opportunities.length} active {opportunities.length === 1 ? 'position' : 'positions'}
        </p>
      </div>

      {opportunities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {opportunities.map((opp: any) => (
             <OpportunityCard key={opp.id} opportunity={opp} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-[#1A2438] border border-[#1F2937] rounded-xl mb-12">
          <Briefcase className="w-12 h-12 text-[#00E5FF]/30 mx-auto mb-3" />
          <p className="text-[#94A3B8] text-lg mb-1">No active positions in {cityName} right now.</p>
          <p className="text-[#94A3B8] text-sm">New positions are added daily. Check back soon.</p>
          <Link href="/opportunities" className="inline-flex items-center gap-2 mt-4 bg-[#00E5FF] text-[#0B1120] font-semibold rounded-lg px-4 py-2 text-sm hover:bg-[#00E5FF]/90 transition-colors">
            Browse All Locations
          </Link>
        </div>
      )}
    </div>
  );
}
