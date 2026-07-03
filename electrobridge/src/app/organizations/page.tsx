import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2 } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Organizations — ElectroBridge",
  description:
    "Browse electronics and semiconductor research opportunities by organization — DRDO, ISRO, CSIR, IITs, and more.",
};

interface OrgItem {
  name: string;
  slug: string;
  count: number;
}

async function getOrganizations(): Promise<OrgItem[]> {
  if (!supabaseAdmin?.from) return [];
  const today = new Date().toISOString().split("T")[0];
  const { data } = await supabaseAdmin
    .from("opportunities")
    .select("organization")
    .eq("is_active", true)
    .or(`deadline.gte.${today},deadline.is.null`);

  if (!data) return [];

  const orgCount: Record<string, number> = {};
  data.forEach((item: { organization: string }) => {
    const org = item.organization?.trim();
    if (org) {
      orgCount[org] = (orgCount[org] || 0) + 1;
    }
  });

  return Object.entries(orgCount)
    .map(([name, count]) => ({
      name,
      slug: name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

export default async function OrganizationsPage() {
  const organizations = await getOrganizations();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-white">
          Organizations
        </h1>
        <p className="text-[#94A3B8] mt-2 text-sm">
          Browse opportunities by organization ({organizations.length} total).
        </p>
      </div>

      {organizations.length === 0 ? (
        <div className="text-center py-20">
          <Building2 className="w-12 h-12 text-[#94A3B8] mx-auto mb-4" />
          <p className="text-[#94A3B8]">No organizations found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {organizations.map((org) => (
            <Link
              key={org.slug}
              href={`/organizations/${org.slug}`}
              className="bg-[#1A2438] border border-[#1F2937] rounded-lg p-5 hover:border-cyan/30 transition-all duration-300 hover:translate-y-[-2px] group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyan/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-[#00E5FF] text-sm font-bold">
                    {org.name
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .substring(0, 2)
                      .toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold text-sm group-hover:text-[#00E5FF] transition-colors truncate">
                    {org.name}
                  </h3>
                  <p className="text-[#94A3B8] text-xs mt-0.5">
                    {org.count} active{" "}
                    {org.count === 1 ? "opportunity" : "opportunities"}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#00E5FF] transition-colors flex-shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
