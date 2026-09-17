import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Globe, MapPin, Building2 } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isCurrentlyAvailable, computeIstToday, buildAvailabilityDbFilter } from "@/lib/availability";
import type { Opportunity } from "@/types";
import OpportunityCard from "@/components/OpportunityCard";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import { getStaticOrgBySlug } from "@/data/semiconductor-orgs";

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
): Promise<OrgDetails | null> {
  const staticOrg = getStaticOrgBySlug(slug);

  if (!supabaseAdmin?.from) {
    if (!staticOrg) return null;
    return {
      name: staticOrg.name,
      logo_url: staticOrg.logo_url || null,
      website: staticOrg.website || null,
      location: staticOrg.location || null,
      type: staticOrg.type || null,
      description: staticOrg.description || null,
      opportunities: [],
    };
  }

  // 1. Fetch organization by slug
  const { data: orgData } = await supabaseAdmin
    .from("organizations")
    .select("id, name, logo_url, website, location, type, description")
    .eq("slug", slug)
    .maybeSingle();

  if (!orgData) {
    if (staticOrg) {
      return {
        name: staticOrg.name,
        logo_url: staticOrg.logo_url || null,
        website: staticOrg.website || null,
        location: staticOrg.location || null,
        type: staticOrg.type || null,
        description: staticOrg.description || null,
        opportunities: [],
      };
    }
    return null;
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

  const mappedOpportunities = (data || []).map((opp: any) => ({
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
  const orgDetails = await getOrganizationOpportunities(params.slug);
  if (!orgDetails) return { title: "Organization Not Found" };

  const { name, opportunities, description: orgDesc } = orgDetails;
  const count = opportunities.length;
  const title = count > 0 ? `${name} — ${count} Active Opportunities` : `${name} — Profile & Hardware Openings`;
  const metaDesc = count > 0
    ? `Browse ${count} active JRF, PhD, and research opportunities at ${name}. Find current openings and apply through BerojgarDegreeWala.`
    : orgDesc
    ? `${name}: ${orgDesc.slice(0, 140)}... Track upcoming verified hardware opportunities on BerojgarDegreeWala.`
    : `Explore verified research profile, official circulars, and recruitment updates for ${name} on BerojgarDegreeWala.`;

  return {
    title,
    description: metaDesc,
    alternates: { canonical: `https://berojgardegreewala.vercel.app/organizations/${params.slug}` },
    openGraph: {
      title: `${name} | BerojgarDegreeWala`,
      description: metaDesc,
      url: `https://berojgardegreewala.vercel.app/organizations/${params.slug}`,
    },
  };
}

export default async function OrganizationPage({ params }: Props) {
  const orgDetails = await getOrganizationOpportunities(params.slug);
  if (!orgDetails) notFound();

  const { name, logo_url, website, location, type, description, opportunities } = orgDetails;

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    description: description || `${name} — Semiconductor and hardware research organization on BerojgarDegreeWala`,
    url: `https://berojgardegreewala.vercel.app/organizations/${params.slug}`,
    ...(logo_url ? { logo: logo_url } : {}),
    ...(website ? { sameAs: [website] } : {}),
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

      {opportunities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {opportunities.map((opp) => (
            <OpportunityCard key={opp.id} opportunity={opp} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900">No Active Openings Right Now</h3>
          <p className="text-slate-600 text-sm max-w-md mx-auto mt-1 mb-6">
            There are currently no active JRF, PhD, or job listings for {name}. Verified opportunities are refreshed daily from official circulars.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/opportunities"
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              Browse All Active Opportunities
            </Link>
            <Link
              href="/organizations"
              className="inline-flex items-center justify-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
            >
              View Other Organizations
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
