import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";
import type { Opportunity } from "@/types";
import OpportunityCard from "@/components/OpportunityCard";

interface Props {
  params: { slug: string };
}

function slugToOrgName(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

async function getOrganizationOpportunities(
  slug: string
): Promise<{ name: string; opportunities: any[] }> {
  if (!supabaseAdmin?.from) return { name: slugToOrgName(slug), opportunities: [] };

  const today = new Date().toISOString().split("T")[0];

  // 1. Fetch organization by slug
  const { data: orgData } = await supabaseAdmin
    .from("organizations")
    .select("id, name")
    .eq("slug", slug)
    .maybeSingle();

  if (!orgData) {
    return { name: slugToOrgName(slug), opportunities: [] };
  }

  // 2. Fetch opportunities by organization_id
  const { data } = await supabaseAdmin
    .from("opportunities")
    .select("*, organizations(*)")
    .eq("is_active", true)
    .eq("organization_id", orgData.id)
    .or(`deadline.gte.${today},deadline.is.null`)
    .order("created_at", { ascending: false });

  if (!data || data.length === 0) {
    return { name: orgData.name, opportunities: [] };
  }

  const mappedOpportunities = data.map((opp: any) => ({
    ...opp,
    organization: opp.organizations?.name || orgData.name,
    org_slug: opp.organizations?.slug || slug,
  }));

  return { name: orgData.name, opportunities: mappedOpportunities };
}

export async function generateMetadata({ params }: Props) {
  const { name, opportunities } = await getOrganizationOpportunities(params.slug);
  if (!opportunities.length) return { title: "Organization Not Found" };
  return {
    title: `${name} — ${opportunities.length} Active Opportunities | BerojgarDegreeWala`,
    description: `Browse ${opportunities.length} active JRF, PhD, and research opportunities at ${name}. Find current openings and apply through BerojgarDegreeWala.`,
    alternates: { canonical: `https://berojgardegreewala.vercel.app/organizations/${params.slug}` },
  };
}

export default async function OrganizationPage({ params }: Props) {
  const { name, opportunities } = await getOrganizationOpportunities(params.slug);

  if (opportunities.length === 0) notFound();

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    description: `${name} — ${opportunities.length} active opportunities on BerojgarDegreeWala`,
    url: `https://berojgardegreewala.vercel.app/organizations/${params.slug}`,
    numberOfEmployees: { "@type": "QuantitativeValue", value: opportunities.length },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://berojgardegreewala.vercel.app" },
      { "@type": "ListItem", position: 2, name: "Organizations", item: "https://berojgardegreewala.vercel.app/organizations" },
      { "@type": "ListItem", position: 3, name },
    ],
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Link
        href="/opportunities"
        className="inline-flex items-center gap-1 text-[#94A3B8] hover:text-white transition-colors text-sm mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Opportunities
      </Link>

      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-white">{name}</h1>
        <p className="text-[#94A3B8] mt-2 text-sm">
          {opportunities.length} active {opportunities.length === 1 ? "opportunity" : "opportunities"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {opportunities.map((opp) => (
          <OpportunityCard key={opp.id} opportunity={opp} />
        ))}
      </div>
    </div>
  );
}
