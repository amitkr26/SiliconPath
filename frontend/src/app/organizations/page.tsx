import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, MapPin, Sparkles } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Organizations — BerojgarDegreeWala",
  description:
    "Browse electronics and semiconductor research opportunities by organization — DRDO, ISRO, CSIR, IITs, Intel, Qualcomm, AMD, TSMC, and more.",
};

interface OrgItem {
  name: string;
  slug: string;
  type?: string;
  location?: string;
  description?: string;
  count: number;
}

const FEATURED_ORGS: OrgItem[] = [
  { name: "DRDO", slug: "drdo", type: "Government Defence Research Lab", location: "New Delhi / Pan India", description: "Defence Research and Development Organisation hiring Scientist B/C, JRF, and SRF.", count: 8 },
  { name: "ISRO", slug: "isro", type: "Space Research Centre", location: "Bengaluru / Ahmedabad", description: "Indian Space Research Organisation recruiting for satellite, avionics & VLSI payloads.", count: 8 },
  { name: "CSIR Labs", slug: "csir", type: "National Research Institute", location: "Pilani / Pune / New Delhi", description: "Council of Scientific and Industrial Research labs (CEERI, NPL, NCL).", count: 12 },
  { name: "IIT Bombay", slug: "iit-bombay", type: "Premier Academic Institution", location: "Mumbai, Maharashtra", description: "IRCC R&D project positions and PhD research fellowships in Microelectronics.", count: 15 },
  { name: "IIT Madras", slug: "iit-madras", type: "Premier Academic Institution", location: "Chennai, Tamil Nadu", description: "ICSR IC design, SHAKTI RISC-V processor, and semiconductor research openings.", count: 14 },
  { name: "IISc Bangalore", slug: "iisc-bangalore", type: "Premier Research University", location: "Bengaluru, Karnataka", description: "Centre for Nano Science and Engineering (CeNSE) & DESE research Fellowships.", count: 18 },
  { name: "Arm Ltd", slug: "arm-ltd", type: "Semiconductor IP Leader", location: "Bengaluru / Global", description: "CPU design, SoC security, physical IP verification, and graphics engineering.", count: 24 },
  { name: "Intel Corporation", slug: "intel", type: "Semiconductor IDM", location: "Bengaluru / Hyderabad", description: "Logic design, structural design, post-silicon validation, and EDA software.", count: 32 },
  { name: "Qualcomm", slug: "qualcomm", type: "Fabless Semiconductor Giant", location: "Hyderabad / Bengaluru", description: "Snapdragon modem design, 5G RFIC, GPU verification, and firmware development.", count: 28 },
];

async function getOrganizations(): Promise<OrgItem[]> {
  if (!supabaseAdmin?.from) return FEATURED_ORGS;

  const { data: orgs } = await supabaseAdmin
    .from("organizations")
    .select("id, name, slug, type, location, description")
    .order("name", { ascending: true });

  if (!orgs || orgs.length === 0) return FEATURED_ORGS;

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

  const fetched = orgs.map((org: any): OrgItem => ({
    name: org.name,
    slug: org.slug || org.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    type: org.type,
    location: org.location,
    description: org.description,
    count: countMap[org.id] || 0,
  })).sort((a: OrgItem, b: OrgItem) => b.count - a.count || a.name.localeCompare(b.name));

  return fetched.length > 0 ? fetched : FEATURED_ORGS;
}

export default async function OrganizationsPage() {
  const organizations = await getOrganizations();

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="mb-8 border-b border-slate-200 pb-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-2">
            <Sparkles className="w-4 h-4" />
            <span>Official Organization Directory</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Organizations & Research Labs
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Explore active openings across DRDO, ISRO, CSIR, IITs, and top global semiconductor enterprises ({organizations.length} total).
          </p>
        </div>

        {/* ORGANIZATIONS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations.map((org) => (
            <Link
              key={org.slug}
              href={`/opportunities?search=${encodeURIComponent(org.name)}`}
              className="glass-premium rounded-2xl p-6 hover:-translate-y-1 transition-all duration-300 group block"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <span className="text-blue-600 font-extrabold text-sm group-hover:text-white transition-colors">
                    {org.name
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .substring(0, 2)
                      .toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-slate-900 font-bold text-base group-hover:text-blue-600 transition-colors truncate">
                    {org.name}
                  </h3>
                  {org.type && (
                    <span className="inline-block px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-semibold mt-1">
                      {org.type}
                    </span>
                  )}
                  {org.location && (
                    <p className="text-slate-500 text-xs mt-2 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{org.location}</span>
                    </p>
                  )}
                  {org.description && (
                    <p className="text-slate-600 text-xs mt-2 line-clamp-2 leading-relaxed">
                      {org.description}
                    </p>
                  )}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-blue-600">
                      {org.count > 0 ? `${org.count} Open Opportunities` : "Explore Openings"}
                    </span>
                    <ArrowRight className="w-4 h-4 text-blue-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}
