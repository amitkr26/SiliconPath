import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { Card } from "@/components/ui/Card";
import OrganizationsClient from "./OrganizationsClient";

export const metadata: Metadata = {
  title: "Semiconductor & Hardware Organizations Directory",
  description:
    "Browse electronics and semiconductor research opportunities by organization — DRDO, ISRO, CSIR, IITs, Intel, Qualcomm, AMD, TSMC, and more.",
  alternates: { canonical: "https://berojgardegreewala.vercel.app/organizations" },
};

import { ALL_ORGANIZATIONS } from "@/data/semiconductor-orgs";

interface OrgItem {
  name: string;
  slug: string;
  type?: string;
  location?: string;
  website?: string | null;
  logo_url?: string | null;
  description?: string;
  count: number;
}

async function getOrganizations(): Promise<OrgItem[]> {
  if (!supabaseAdmin?.from) return ALL_ORGANIZATIONS;

  try {
    const { data: orgs } = await supabaseAdmin
      .from("organizations")
      .select("id, name, slug, type, location, website, logo_url, description")
      .order("name", { ascending: true });

    if (!orgs || orgs.length === 0) return ALL_ORGANIZATIONS;

    const { data: opps } = await supabaseAdmin
      .from("opportunities")
      .select("organization_id")
      .eq("is_active", true);

    const countMap: Record<string, number> = {};
    if (opps) {
      opps.forEach((o: any) => {
        if (o.organization_id) {
          countMap[o.organization_id] = (countMap[o.organization_id] || 0) + 1;
        }
      });
    }

    const fetched: OrgItem[] = orgs.map((org: any): OrgItem => ({
      name: org.name,
      slug: org.slug || org.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      type: org.type,
      location: org.location,
      website: org.website || null,
      logo_url: org.logo_url || null,
      description: org.description,
      count: countMap[org.id] || 0,
    }));

    // Merge static orgs that might not yet be in the database
    const existingSlugs = new Set(fetched.map((o) => o.slug.toLowerCase()));
    for (const staticOrg of ALL_ORGANIZATIONS) {
      if (!existingSlugs.has(staticOrg.slug.toLowerCase())) {
        fetched.push(staticOrg);
      }
    }

    return fetched.sort((a: OrgItem, b: OrgItem) => b.count - a.count || a.name.localeCompare(b.name));
  } catch {
    return ALL_ORGANIZATIONS;
  }
}

export default async function OrganizationsPage() {
  const organizations = await getOrganizations();

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://berojgardegreewala.vercel.app" },
      { "@type": "ListItem", position: 2, name: "Organizations", item: "https://berojgardegreewala.vercel.app/organizations" },
    ],
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Semiconductor & Hardware Organizations in India",
    itemListElement: organizations.slice(0, 30).map((org, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: org.name,
      url: `https://berojgardegreewala.vercel.app/organizations/${org.slug}`,
    })),
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <OrganizationsClient initialOrganizations={organizations} />
    </main>
  );
}
