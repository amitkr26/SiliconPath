import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, MapPin, Briefcase } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isCurrentlyAvailable, computeIstToday, buildAvailabilityDbFilter } from "@/lib/availability";
import { countProgrammatic } from "@/lib/seo/data-loader";
import { evaluateProgrammaticGate } from "@/lib/seo/gate";
import OpportunityCard from "@/components/OpportunityCard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface Props {
  params: Promise<{ city: string }>;
}

// Convert "bangalore" to "Bangalore"
function formatCity(citySlug: string): string {
  return citySlug
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city } = await params;
  const cityName = formatCity(city);

  // Programmatic quality gate: city hubs with < 3 active verified
  // opportunities fail closed with noindex,follow.
  let robots;
  try {
    const gate = evaluateProgrammaticGate({ location: city.toLowerCase() }, await countProgrammatic({ location: city.toLowerCase() }));
    if (!gate?.indexable) robots = { index: false, follow: true } as const;
  } catch {
    robots = { index: false, follow: true } as const;
  }

  return {
    title: `VLSI & Semiconductor Jobs in ${cityName}`,
    description: `Browse verified VLSI, embedded systems, and semiconductor jobs and internships in ${cityName}. Find active opportunities from top organizations.`,
    alternates: { canonical: `https://berojgardegreewala.vercel.app/opportunities/location/${city.toLowerCase()}` },
    ...(robots ? { robots } : {}),
  };
}

export default async function LocationPage({ params }: Props) {
  const { city } = await params;
  const cityName = formatCity(city);
  let opportunities: any[] = [];
  
  if (supabaseAdmin?.from) {
    const today = computeIstToday();
    const { data } = await supabaseAdmin
      .from("opportunities")
      .select("*")
      .eq("is_active", true)
      .eq("verification_status", "verified")
      .not("verification_status", "eq", "rejected")
      .not("verification_status", "eq", "pending")
      .not("verification_status", "eq", "expired")
      .not("verification_status", "eq", "link_unavailable")
      .ilike("location", `%${cityName}%`)
      .or(buildAvailabilityDbFilter(today))
      .order("created_at", { ascending: false });
      
    if (data) {
      opportunities = data.filter((opp: any) => isCurrentlyAvailable(opp, today));
    }
  }

  // If no opportunities exist for this city, we still render the page but show empty state.
  // This is better for SEO than throwing a 404 for valid cities that just happen to be empty right now.

  const locationUrl = `https://berojgardegreewala.vercel.app/opportunities/location/${city.toLowerCase()}`;

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": opportunities.map((opp, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "url": `https://berojgardegreewala.vercel.app/opportunities/${opp.slug}`
    }))
  };

  const breadcrumbsSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://berojgardegreewala.vercel.app",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Opportunities",
        item: "https://berojgardegreewala.vercel.app/opportunities",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: `Jobs in ${cityName}`,
        item: locationUrl,
      },
    ],
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsSchema) }} />

      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="flex items-center gap-2 text-xs font-semibold text-slate-500 flex-wrap">
          <li>
            <Link href="/" className="hover:text-slate-900 transition-colors">
              Home
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link href="/opportunities" className="hover:text-slate-900 transition-colors">
              Opportunities
            </Link>
          </li>
          <li>/</li>
          <li className="text-slate-900" aria-current="page">
            {cityName}
          </li>
        </ol>
      </nav>

      <Link href="/opportunities" className="inline-flex items-center gap-1 text-text-secondary hover:text-accent transition-colors text-sm mb-6 font-medium">
        <ArrowLeft className="w-4 h-4" />
        All Opportunities
      </Link>

      <div className="mb-8">
        <h1 className="font-display text-3xl font-black text-slate-900 flex items-center gap-2">
          <MapPin className="w-6 h-6 text-blue-600" />
          Jobs in {cityName}
        </h1>
        <p className="text-slate-600 mt-2 text-sm font-medium">
          Semiconductor, VLSI, and Electronics Research positions located in {cityName}.
        </p>
        <p className="text-accent text-sm mt-1 font-bold">
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
        <Card className="text-center py-12 mb-12">
          <Briefcase className="w-12 h-12 text-blue-600/30 mx-auto mb-3" />
          <p className="text-slate-900 text-lg font-bold mb-1">No active positions in {cityName} right now.</p>
          <p className="text-slate-500 text-sm font-medium">New positions are added daily. Check back soon.</p>
          <div className="mt-4 flex justify-center">
            <Button href="/opportunities" variant="secondary">
              Browse All Locations
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}