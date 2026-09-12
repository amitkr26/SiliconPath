import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Globe, MapPin, Building2 } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isCurrentlyAvailable, computeIstToday, buildAvailabilityDbFilter } from "@/lib/availability";
import type { Opportunity } from "@/types";
import OpportunityCard from "@/components/OpportunityCard";
import ImageWithFallback from "@/components/ui/ImageWithFallback";

interface Props {
  params: { slug: string };
}

function slugToOrgName(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

interface OrgDetails {
  name: string;
  logo_url: string | null;
  website: string | null;
  location: string | null;
  type: string | null;
  description: string | null;
  opportunities: any[];
}

async function getOrganizationOpportunities(
  slug: string
): Promise<OrgDetails> {
  const fallbackDetails: OrgDetails = {
    name: slugToOrgName(slug),
    logo_url: null,
    website: null,
    location: null,
    type: null,
    description: null,
    opportunities: [],
  };

  if (!supabaseAdmin?.from) return fallbackDetails;

  const today = new Date().toISOString().split("T")[0];

  // 1. Fetch organization by slug
  const { data: orgData } = await supabaseAdmin
    .from("organizations")
    .select("id, name, logo_url, website, location, type, description")
    .eq("slug", slug)
    .maybeSingle();

  if (!orgData) {
    return fallbackDetails;
  }

  // 2. Fetch opportunities by organization_id
  const { data } = await supabaseAdmin
    .from("opportunities")
    .select("*, organizations(*)")
    .eq("is_active", true)
    .eq("verification_status", "verified")
    .not("verification_status", "eq", "rejected")
    .not("verification_status", "eq", "pending")
    .not("verification_status", "eq", "expired")
    .not("verification_status", "eq", "link_unavailable")
    .eq("organization_id", orgData.id)
    .or(buildAvailabilityDbFilter(computeIstToday()))
    .order("created_at", { ascending: false });

  if (!data || data.length === 0) {
    return {
      name: orgData.name,
      logo_url: orgData.logo_url || null,
      website: orgData.website || null,
      location: orgData.location || null,
      type: orgData.type || null,
      description: orgData.description || null,
      opportunities: [],
    };
  }

  const mappedOpportunities = data.map((opp: any) => ({
    ...opp,
    organization: opp.organizations?.name || orgData.name,
    org_slug: opp.organizations?.slug || slug,
    organization_logo_url: opp.organizations?.logo_url || orgData.logo_url || null,
  }));

  return {
    name: orgData.name,
    logo_url: orgData.logo_url || null,
    website: orgData.website || null,
    location: orgData.location || null,
    type: orgData.type || null,
    description: orgData.description || null,
    opportunities: mappedOpportunities,
  };
}

export async function generateMetadata({ params }: Props) {
  const { name, opportunities } = await getOrganizationOpportunities(params.slug);
  if (!opportunities.length) return { title: "Organization Not Found" };
  return {
    title: `${name} — ${opportunities.length} Active Opportunities`,
    description: `Browse ${opportunities.length} active JRF, PhD, and research opportunities at ${name}. Find current openings and apply through BerojgarDegreeWala.`,
    alternates: { canonical: `https://berojgardegreewala.vercel.app/organizations/${params.slug}` },
  };
}

export default async function OrganizationPage({ params }: Props) {
  const orgDetails = await getOrganizationOpportunities(params.slug);
  const { name, logo_url, website, location, type, description, opportunities } = orgDetails;

  if (opportunities.length === 0) notFound();

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    description: `${name} — ${opportunities.length} active opportunities on BerojgarDegreeWala`,
    url: `https://berojgardegreewala.vercel.app/organizations/${params.slug}`,
    ...(logo_url ? { logo: logo_url } : {}),
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
        href="/organizations"
        className="inline-flex items-center gap-1.5 text-slate-500 hover:text-blue-600 transition-colors text-xs font-semibold mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Directory
      </Link>

      {/* ORGANIZATION IDENTITY HEADER */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 mb-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <ImageWithFallback
            src={logo_url}
            alt={`${name} logo`}
            name={name}
            variant="monogram"
            size={72}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border border-slate-200 shadow-xs flex-shrink-0"
          />

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="font-display text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{name}</h1>
              {type && (
                <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                  {type}
                </span>
              )}
            </div>

            {description && (
              <p className="text-slate-600 text-xs sm:text-sm line-clamp-2 max-w-3xl mt-1">
                {description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-500 font-medium">
              {location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {location}
                </span>
              )}
              {website && (
                <a
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-600 hover:underline"
                >
                  <Globe className="w-3.5 h-3.5" />
                  Official Website
                </a>
              )}
              <span className="text-slate-700 font-semibold">
                {opportunities.length} active {opportunities.length === 1 ? "opening" : "openings"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {opportunities.map((opp) => (
          <OpportunityCard key={opp.id} opportunity={opp} />
        ))}
      </div>
    </div>
  );
}
