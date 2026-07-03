import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import { ArrowLeft, Briefcase } from "lucide-react";
import CategoryBadge from "@/components/CategoryBadge";

const CATEGORY_CONFIG: Record<string, {
  title: string;
  h1: string;
  subline: string;
  description: string;
  metaDesc: string;
  keywords: string;
  slugLabel: string;
}> = {
  "jrf": {
    title: "JRF / Junior Research Fellowship Positions in Electronics 2026",
    h1: "JRF / Junior Research Fellowship Positions in Electronics & Semiconductor — 2026",
    subline: "Verified JRF positions at DRDO, ISRO, CSIR, IITs — updated daily",
    description: `Junior Research Fellowship (JRF) positions in electronics and semiconductor science offer MSc and NET/GATE qualified researchers an opportunity to pursue funded PhD research at premier institutions. JRF stipend in 2026 is ₹37,000 per month for the first two years, upgradeable to SRF at ₹42,000 per month. Organizations like DRDO, ISRO, CSIR labs, IITs, and NITs regularly advertise JRF positions. Eligibility typically requires UGC-NET (Electronic Science) or GATE (ECE) qualification with MSc in Electronics, Physics, or related field.`,
    metaDesc: "Find active JRF positions in electronics & semiconductor science. Stipend ₹37,000/month. DRDO, ISRO, CSIR, IIT JRF openings updated daily.",
    keywords: "JRF electronics, JRF semiconductor, DRDO JRF, ISRO JRF, CSIR JRF, JRF stipend 2026, JRF eligibility, junior research fellow electronics India",
    slugLabel: "JRF",
  },
  "srf": {
    title: "SRF / Senior Research Fellowship Positions in Electronics 2026",
    h1: "SRF / Senior Research Fellowship Positions in Electronics & Semiconductor — 2026",
    subline: "Senior Research Fellowship positions for experienced researchers",
    description: `Senior Research Fellowship (SRF) positions in electronics and semiconductor science are for researchers with 2+ years of JRF experience or PhD qualifications. SRF stipend in 2026 is ₹42,000 per month plus HRA. SRFs lead independent research projects in areas like VLSI design, semiconductor device physics, photonics, and embedded systems at DRDO labs, CSIR institutes, IITs, and other premier research organizations.`,
    metaDesc: "Active SRF positions in electronics & semiconductor research. Stipend ₹42,000/month. Senior Research Fellowship openings updated daily.",
    keywords: "SRF electronics, senior research fellow, DRDO SRF, CSIR SRF, SRF stipend 2026",
    slugLabel: "SRF",
  },
  "phd": {
    title: "PhD Opportunities in Electronics & Semiconductor — 2026",
    h1: "PhD Opportunities in Electronics & Semiconductor — 2026",
    subline: "Fully-funded PhD positions at premier Indian and international institutions",
    description: `PhD opportunities in electronics and semiconductor science offer researchers a path to doctoral degrees at institutions like IITs, IISc, CSIR labs, and international universities. Funding is available through CSIR-UGC JRF, DST-INSPIRE, institutional fellowships, and international scholarships like DAAD (Germany), SINGA (Singapore), and MEXT (Japan). Research areas include VLSI design, semiconductor devices, photonics, embedded systems, and nanotechnology.`,
    metaDesc: "PhD positions in electronics & semiconductor science. Funded doctoral opportunities at IITs, IISc, CSIR, international universities. Updated daily.",
    keywords: "PhD electronics India, PhD semiconductor, funded PhD, PhD admission 2026, IIT PhD electronics, CSIR PhD",
    slugLabel: "PhD",
  },
  "govt-job": {
    title: "Government Research Jobs in Electronics & Semiconductor 2026",
    h1: "Government Research Jobs in Electronics & Semiconductor — 2026",
    subline: "Scientist, engineer, and technical positions at government research organizations",
    description: `Government research jobs in electronics offer stable careers at organizations like DRDO, ISRO, BARC, and CSIR. Positions include Scientist B/C/D, Technical Officer, Research Associate, and Project Engineer. Selection is through written exams followed by interviews. Benefits include pay scales as per 7th CPC, HRA, medical benefits, and pension under NPS. Eligibility ranges from BE/BTech to MTech/PhD with NET/GATE qualifications.`,
    metaDesc: "Government research jobs in electronics & semiconductor. DRDO, ISRO, BARC, CSIR scientist positions. Updated daily.",
    keywords: "DRDO recruitment, ISRO recruitment, CSIR jobs, government research jobs electronics, scientist jobs India 2026",
    slugLabel: "Govt Job",
  },
  "fellowship": {
    title: "Research Fellowships & Scholarships in Electronics 2026",
    h1: "Research Fellowships & Scholarships in Electronics & Semiconductor — 2026",
    subline: "CSIR-UGC JRF, DST-INSPIRE, international scholarships and more",
    description: `Research fellowships and scholarships for electronics researchers include CSIR-UGC NET JRF (₹37,000/month), DST-INSPIRE Fellowship (₹31,000/month), and international programs like DAAD (Germany, €861-1200/month), SINGA (Singapore, SGD 2,000/month), and MEXT (Japan, ¥143,000/month). These fellowships fund MSc and PhD research across electronics, semiconductor science, and related fields at premier institutions in India and abroad.`,
    metaDesc: "Research fellowships and scholarships for electronics researchers. CSIR, UGC, DST-INSPIRE, DAAD, SINGA, MEXT. Updated daily.",
    keywords: "research fellowship electronics, CSIR JRF, UGC NET fellowship, DST INSPIRE, DAAD fellowship, SINGA fellowship, MEXT scholarship",
    slugLabel: "Fellowship",
  },
  "private": {
    title: "Private Sector Electronics & Semiconductor Jobs 2026",
    h1: "Private Sector Electronics & Semiconductor Jobs — 2026",
    subline: "VLSI, embedded systems, chip design jobs at top semiconductor companies",
    description: `Private sector electronics and semiconductor jobs in India span roles like RTL Design, Physical Design, Verification, DFT, and Analog Design at companies including Intel, Qualcomm, AMD, Texas Instruments, Synopsys, Cadence, Nvidia, and Micron. Salaries range from ₹5-12 LPA for freshers to ₹45-80 LPA for senior engineers. Major hiring hubs are Bangalore, Hyderabad, Pune, and Noida.`,
    metaDesc: "Private sector electronics & semiconductor jobs. VLSI, embedded, chip design roles at Intel, Qualcomm, AMD, TI, Synopsys. Updated daily.",
    keywords: "VLSI jobs India, semiconductor jobs, chip design jobs, Intel India jobs, Qualcomm jobs, embedded systems jobs, electronics engineer jobs",
    slugLabel: "Private Job",
  },
  "international": {
    title: "International Opportunities for Electronics Researchers 2026",
    h1: "International Opportunities for Electronics Researchers — 2026",
    subline: "PhD positions, fellowships, and research jobs abroad for Indian electronics researchers",
    description: `International opportunities for Indian electronics researchers include fully-funded PhD programs (DAAD Germany, SINGA Singapore, MEXT Japan), post-doctoral fellowships (Marie Curie Europe, JSPS Japan), and research positions at leading global universities. These programs typically offer competitive stipends, world-class research infrastructure, and international collaboration opportunities. Application processes vary by country and program.`,
    metaDesc: "International opportunities for Indian electronics researchers. PhD abroad, international fellowships, research jobs overseas. Updated daily.",
    keywords: "PhD abroad electronics, international fellowship India, DAAD Germany, SINGA Singapore, MEXT Japan, Marie Curie fellowship, research abroad",
    slugLabel: "International",
  },
};

export async function generateMetadata({ params }: { params: { category: string } }): Promise<Metadata> {
  const config = CATEGORY_CONFIG[params.category];
  if (!config) return { title: "Category Not Found" };
  return {
    title: config.title + " | ElectroBridge",
    description: config.metaDesc,
    keywords: config.keywords,
    alternates: { canonical: `https://electrobridge.vercel.app/category/${params.category}` },
    openGraph: {
      title: config.title,
      description: config.metaDesc,
      url: `https://electrobridge.vercel.app/category/${params.category}`,
    },
  };
}

export default async function CategoryPage({ params }: { params: { category: string } }) {
  const config = CATEGORY_CONFIG[params.category];
  if (!config) notFound();

  const today = new Date().toISOString().split("T")[0];
  let opportunities: any[] = [];

  if (supabaseAdmin?.from) {
    let query = supabaseAdmin
      .from("opportunities")
      .select("*")
      .eq("is_active", true)
      .eq("verification_status", "verified")
      .or(`deadline.gte.${today},deadline.is.null`)
      .order("created_at", { ascending: false })
      .limit(30);

    if (config.slugLabel === "International") {
      query = query.or(`location.ilike.%International%,tags.cs.{international}`);
    } else {
      query = query.eq("category", config.slugLabel);
    }

    const { data } = await query;
    if (data) opportunities = data;
  }

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: getFAQ(params.category),
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <Link href="/opportunities" className="inline-flex items-center gap-1 text-[#94A3B8] hover:text-white transition-colors text-sm mb-6">
        <ArrowLeft className="w-4 h-4" />
        All Opportunities
      </Link>

      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-white">{config.h1}</h1>
        <p className="text-[#94A3B8] mt-2 text-sm">{config.subline}</p>
        <p className="text-[#00E5FF] text-sm mt-1 font-medium">{opportunities.length} active {config.slugLabel.toLowerCase().replace("job", "jobs")} positions</p>
      </div>

      <div className="bg-[#1A2438] border border-[#1F2937] rounded-xl p-6 mb-8">
        <p className="text-[#94A3B8] text-sm leading-relaxed">{config.description}</p>
      </div>

      {/* Quick resource links */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Link href="/resources/jrf-guide" className="px-3 py-1.5 bg-[#00E5FF]/10 text-[#00E5FF] rounded-full text-xs font-medium border border-cyan/20 hover:bg-[#00E5FF]/20 transition-colors">
          JRF Complete Guide →
        </Link>
        <Link href="/resources/phd-guide" className="px-3 py-1.5 bg-[#00E5FF]/10 text-[#00E5FF] rounded-full text-xs font-medium border border-cyan/20 hover:bg-[#00E5FF]/20 transition-colors">
          PhD Guide →
        </Link>
        <Link href="/resources/international-fellowships" className="px-3 py-1.5 bg-[#00E5FF]/10 text-[#00E5FF] rounded-full text-xs font-medium border border-cyan/20 hover:bg-[#00E5FF]/20 transition-colors">
          International Fellowships →
        </Link>
        <Link href="/resources/vlsi-careers" className="px-3 py-1.5 bg-[#00E5FF]/10 text-[#00E5FF] rounded-full text-xs font-medium border border-cyan/20 hover:bg-[#00E5FF]/20 transition-colors">
          VLSI Careers →
        </Link>
      </div>

      {opportunities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {opportunities.map((opp: any) => (
            <Link
              key={opp.id}
              href={`/opportunities/${opp.slug}`}
              className="bg-[#1A2438] border border-[#1F2937] rounded-lg p-4 hover:border-cyan/30 transition-all hover:translate-y-[-2px] block"
            >
              <div className="flex items-center gap-2 mb-2">
                <CategoryBadge category={opp.category} />
                {opp.deadline && (
                  <span className="text-[10px] text-[#94A3B8]">
                    {new Date(opp.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                )}
              </div>
              <h3 className="text-white text-sm font-semibold line-clamp-2 leading-snug">{opp.title}</h3>
              <p className="text-[#94A3B8] text-xs mt-1">{opp.organization}</p>
              {(opp.stipend || opp.location) && (
                <p className="text-[#94A3B8] text-xs mt-1">
                  {opp.stipend && <span className="text-[#00E5FF] font-medium">{opp.stipend}</span>}
                  {opp.stipend && opp.location && <span> • </span>}
                  {opp.location && <span>{opp.location}</span>}
                </p>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-[#1A2438] border border-[#1F2937] rounded-xl mb-12">
          <Briefcase className="w-12 h-12 text-[#00E5FF]/30 mx-auto mb-3" />
          <p className="text-[#94A3B8] text-lg mb-1">No active {config.slugLabel.toLowerCase().replace("job", "jobs")} positions right now.</p>
          <p className="text-[#94A3B8] text-sm">New positions are added daily. Check back soon or browse all opportunities.</p>
          <Link href="/opportunities" className="inline-flex items-center gap-2 mt-4 bg-[#00E5FF] text-[#0B1120] font-semibold rounded-lg px-4 py-2 text-sm hover:bg-[#00E5FF]/90 transition-colors">
            Browse All Opportunities
          </Link>
        </div>
      )}

      {/* FAQ Section */}
      <div className="bg-[#1A2438] border border-[#1F2937] rounded-xl p-6">
        <h2 className="font-display text-xl font-bold text-white mb-6">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {getFAQ(params.category).map((faq: any, i: number) => (
            <details key={i} className="group">
              <summary className="text-white text-sm font-medium cursor-pointer list-none flex items-center justify-between py-2">
                {faq.name}
                <span className="text-[#00E5FF] text-xs group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="text-[#94A3B8] text-sm mt-2 leading-relaxed pl-4 border-l-2 border-cyan/30">
                {faq.acceptedAnswer.text}
              </p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}

function getFAQ(category: string): any[] {
  const faqs: Record<string, any[]> = {
    "jrf": [
      { "@type": "Question", name: "What is the JRF stipend in 2026?", acceptedAnswer: { "@type": "Answer", text: "The JRF stipend in India for 2026 is ₹37,000 per month for the first two years, increasing to ₹42,000 per month (SRF) for years 3-5. Additional benefits include HRA (10-30% of stipend depending on city) and an annual contingency grant of ₹20,000 for science researchers." } },
      { "@type": "Question", name: "What is the age limit for JRF?", acceptedAnswer: { "@type": "Answer", text: "The maximum age for JRF is 28 years for General category, 33 years for SC/ST/PwD/Women, and 31 years for OBC-NCL as per UGC and CSIR norms. Age relaxation is applicable as per government rules." } },
      { "@type": "Question", name: "Do I need NET or GATE for JRF?", acceptedAnswer: { "@type": "Answer", text: "Yes, a valid UGC-NET (Electronic Science) or GATE (ECE) score is required for most JRF positions. Some institutional JRFs at IITs and DRDO may accept CSIR-UGC NET. DST-INSPIRE fellowship has a separate eligibility criteria." } },
      { "@type": "Question", name: "How to apply for JRF positions?", acceptedAnswer: { "@type": "Answer", text: "JRF applications are submitted through individual organization portals. For DRDO labs, check drdo.gov.in/careers. For CSIR labs, visit csirhrdg.res.in. For IIT positions, check each institute's website. Use ElectroBridge to see all active JRF positions in one place and apply through the official links provided." } },
    ],
    "srf": [
      { "@type": "Question", name: "What is the SRF stipend?", acceptedAnswer: { "@type": "Answer", text: "SRF stipend in 2026 is ₹42,000 per month plus HRA. SRF positions are for researchers with 2+ years of JRF experience or those holding a PhD degree." } },
      { "@type": "Question", name: "How is SRF different from JRF?", acceptedAnswer: { "@type": "Answer", text: "SRF (Senior Research Fellow) is a promotion from JRF after 2 years of research experience. SRFs have higher stipend (₹42,000 vs ₹37,000), lead independent projects, and are expected to have publications." } },
    ],
    "phd": [
      { "@type": "Question", name: "How to apply for PhD in electronics in India?", acceptedAnswer: { "@type": "Answer", text: "PhD admission in India typically requires GATE/NET qualification followed by an interview. IITs conduct centralized CCMT/COAP counseling. IISc has its own entrance exam. CSIR labs offer PhD through AcSIR. International PhD requires GRE/TOEFL and direct professor contact. Check individual institute websites for exact timelines." } },
      { "@type": "Question", name: "What are the funding options for PhD?", acceptedAnswer: { "@type": "Answer", text: "Funding options include CSIR-UGC JRF (₹37,000/month), DST-INSPIRE (₹31,000/month), institutional fellowships at IITs/IISc, and international scholarships like DAAD (Germany, €861-1200/month), SINGA (Singapore, SGD 2,000/month), and MEXT (Japan, ¥143,000/month)." } },
    ],
    "govt-job": [
      { "@type": "Question", name: "Which exams are needed for government research jobs?", acceptedAnswer: { "@type": "Answer", text: "Government research jobs typically require GATE or NET qualification followed by organization-specific written tests and interviews. DRDO conducts SET (Scientist Entry Test). ISRO has ISRO Centralized Recruitment. BARC conducts OCES/DGFS through BARC Training School." } },
      { "@type": "Question", name: "What is the salary range for government research jobs?", acceptedAnswer: { "@type": "Answer", text: "Government research scientist salaries follow 7th CPC pay matrix: Scientist B (₹56,100-1,77,500), Scientist C (₹67,700-2,08,700), Scientist D (₹78,800-2,09,200) plus allowances. Entry-level salaries range from ₹56,000 to ₹80,000 per month including HRA and DA." } },
    ],
    "fellowship": [
      { "@type": "Question", name: "What fellowships are available for electronics researchers?", acceptedAnswer: { "@type": "Answer", text: "Major fellowships include CSIR-UGC NET JRF (₹37,000/month), DST-INSPIRE Fellowship (₹31,000/month), DRDO JRF (₹37,000/month), ISRO JRF (₹37,000/month), and international programs like DAAD (€861-1200/month), SINGA (SGD 2,000/month), and MEXT (¥143,000/month)." } },
    ],
    "private": [
      { "@type": "Question", name: "What VLSI roles are in demand in India?", acceptedAnswer: { "@type": "Answer", text: "In-demand VLSI roles include RTL Design (Verilog/SystemVerilog), Physical Design (Place & Route, Timing), Verification (UVM), DFT (Scan, ATPG), Analog/Mixed-Signal Design, and CAD (EDA tool development). Bangalore leads with 60% of VLSI jobs, followed by Hyderabad, Pune, and Noida." } },
      { "@type": "Question", name: "What is the salary for freshers in VLSI?", acceptedAnswer: { "@type": "Answer", text: "Fresher VLSI engineers earn ₹5-12 LPA depending on role and company. RTL Design and Verification roles at top companies like Intel, Qualcomm, AMD offer ₹8-12 LPA. Physical Design roles offer ₹6-10 LPA. Salaries increase to ₹12-25 LPA after 2-4 years of experience." } },
    ],
    "international": [
      { "@type": "Question", name: "Which countries offer PhD funding for Indian electronics researchers?", acceptedAnswer: { "@type": "Answer", text: "Germany (DAAD, €861-1200/month), Singapore (SINGA, SGD 2,000/month), Japan (MEXT, ¥143,000/month), and EU (Marie Curie, €2,700/month) offer fully-funded PhD programs for Indian electronics researchers. Each program covers tuition, living expenses, and travel." } },
      { "@type": "Question", name: "What are the eligibility criteria for international fellowships?", acceptedAnswer: { "@type": "Answer", text: "Eligibility varies: DAAD requires MSc with strong academics, under 32 years. SINGA requires BTech/MSc with excellent grades, under 35. MEXT requires MSc, under 35, with a research proposal. Most require English proficiency (IELTS/TOEFL) and some may require GRE scores." } },
    ],
  };
  return faqs[category] || [];
}
