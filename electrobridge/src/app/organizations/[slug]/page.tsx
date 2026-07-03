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
): Promise<{ name: string; opportunities: Opportunity[] }> {
  if (!supabaseAdmin?.from) return { name: slugToOrgName(slug), opportunities: [] };

  const today = new Date().toISOString().split("T")[0];

  // Try org_slug first, then fallback to ilike
  let { data } = await supabaseAdmin
    .from("opportunities")
    .select("*")
    .eq("is_active", true)
    .eq("org_slug", slug)
    .or(`deadline.gte.${today},deadline.is.null`)
    .order("created_at", { ascending: false });

  if (!data || data.length === 0) {
    const orgName = slugToOrgName(slug);
    const { data: data2 } = await supabaseAdmin
      .from("opportunities")
      .select("*")
      .eq("is_active", true)
      .ilike("organization", `%${orgName}%`)
      .or(`deadline.gte.${today},deadline.is.null`)
      .order("created_at", { ascending: false });
    data = data2;
  }

  if (!data || data.length === 0) {
    return { name: slugToOrgName(slug), opportunities: [] };
  }

  return { name: data[0].organization, opportunities: data };
}

export async function generateMetadata({ params }: Props) {
  const { name, opportunities } = await getOrganizationOpportunities(params.slug);
  if (!opportunities.length) return { title: "Organization Not Found" };
  return {
    title: `${name} — ${opportunities.length} Active Opportunities | ElectroBridge`,
    description: `Browse ${opportunities.length} active JRF, PhD, and research opportunities at ${name}. Find current openings and apply through ElectroBridge.`,
    alternates: { canonical: `https://electrobridge.vercel.app/organizations/${params.slug}` },
  };
}

export default async function OrganizationPage({ params }: Props) {
  const { name, opportunities } = await getOrganizationOpportunities(params.slug);

  if (opportunities.length === 0) notFound();

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    description: `${name} — ${opportunities.length} active opportunities on ElectroBridge`,
    url: `https://electrobridge.vercel.app/organizations/${params.slug}`,
    numberOfEmployees: { "@type": "QuantitativeValue", value: opportunities.length },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://electrobridge.vercel.app" },
      { "@type": "ListItem", position: 2, name: "Organizations", item: "https://electrobridge.vercel.app/organizations" },
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
