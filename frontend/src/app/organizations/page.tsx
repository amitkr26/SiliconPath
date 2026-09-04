import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { Card } from "@/components/ui/Card";
import OrganizationsClient from "./OrganizationsClient";

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
    <div className="min-h-screen bg-[#FAF9F6] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER */}
        <Card className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-black uppercase text-blue-600 mb-1 px-3 py-1 bg-blue-50 border-2 border-slate-900 rounded-lg shadow-brutal-sm">
              <Sparkles className="w-4 h-4 stroke-[2.5]" />
              <span>OFFICIAL DIRECTORY</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-2">
              Semiconductor &amp; Hardware Organizations
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm font-semibold mt-1">
              Explore active research labs, defense establishments (DRDO, ISRO, CSIR), IIT microelectronics centres, and global fabless/IDM giants.
            </p>
          </div>
        </Card>

        {/* INTERACTIVE ORGANIZATIONS CLIENT */}
        <OrganizationsClient initialOrganizations={organizations} />

      </div>
    </div>
  );
}
