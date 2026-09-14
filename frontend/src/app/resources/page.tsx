import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap, Briefcase, Globe, FileText, BookMarked, ArrowRight, Zap, Award, Network, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Resources — JRF Guide, PhD Guide, DRDO Labs, CSIR Research",
  description: "Comprehensive guide to JRF positions in India, PhD admissions, list of DRDO and CSIR labs for electronics research, NET vs GATE comparison, international fellowship programs, and more.",
  alternates: { canonical: "https://berojgardegreewala.vercel.app/resources" },
  openGraph: {
    title: "BerojgarDegreeWala Resources — JRF Guide & Research Information",
    description: "Step-by-step JRF application guide, PhD admission guide, NET vs GATE comparison, DRDO/CSIR lab directory, international fellowship programs for Indian researchers.",
    url: "https://berojgardegreewala.vercel.app/resources",
  },
};

const GUIDE_CARDS = [
  { href: "/resources/jrf-vs-srf-difference", icon: GraduationCap, title: "JRF vs SRF vs RA Guide", description: "Everything about Junior Research Fellowship: eligibility, stipend ₹37,000-42,000/month, age limit, and progression to SRF and RA." },
  { href: "/resources/drdo-recruitment-electronics", icon: Briefcase, title: "DRDO Recruitment Guide", description: "Complete process to join DRDO as Scientist B: GATE shortlisting, written exam syllabus, and the interview format." },
  { href: "/resources/fully-funded-phd-vlsi-abroad", icon: Globe, title: "Fully-Funded PhD Abroad", description: "How to secure a salaried PhD position in Europe and Singapore. Email templates and top university programs for VLSI." },
  { href: "/resources/vlsi-careers", icon: Zap, title: "VLSI Career Guide", description: "VLSI career paths in India: roles (design, verification, layout), top companies (Intel, AMD, Qualcomm, TI), salary ranges, required skills." },
  { href: "/resources/net-vs-gate", icon: Network, title: "NET vs GATE Comparison", description: "Which exam should you choose? UGC-NET Electronic Science vs GATE ECE: syllabus, stipend, career paths, age limits, and strategy." },
];

const SECTIONS = [
  {
    icon: Briefcase,
    title: "Complete List of DRDO Labs Offering Electronics Research Positions",
    content: [
      "LRDE (Electronics & Radar Development Establishment) — Bangalore: Radar systems, signal processing, antenna design.",
      "DEAL (Defence Electronics Applications Laboratory) — Dehradun: Communication systems, RF engineering, electronic warfare.",
      "RCI (Research Centre Imarat) — Hyderabad: Missile electronics, guidance systems, embedded systems.",
      "SAG (Scientific Analysis Group) — Delhi: Cryptography, signal analysis, electronic warfare.",
      "CAIR (Centre for Artificial Intelligence & Robotics) — Bangalore: AI/ML, robotics, autonomous systems.",
      "DRDO Young Scientist Labs: Several new labs focusing on quantum technologies, photonics, and advanced electronics.",
    ],
  },
  {
    icon: Award,
    title: "CSIR Labs for Electronics & Semiconductor Research",
    content: [
      "CSIR-NPL (National Physical Laboratory) — Delhi: Semiconductor metrology, nanoelectronics, quantum standards, VLSI characterization.",
      "CSIR-CEERI (Central Electronics Engineering Research Institute) — Pilani: Microelectronics, MEMS, sensors, VLSI design, photovoltaic devices.",
      "CSIR-CSIO (Central Scientific Instruments Organisation) — Chandigarh: Biomedical electronics, instrumentation, optical sensors.",
      "CSIR-CMERI (Central Mechanical Engineering Research Institute) — Durgapur: Industrial electronics, robotics, automation.",
    ],
  },
  {
    icon: FileText,
    title: "JRF vs SRF vs Project Associate — What's the Difference?",
    content: [
      "JRF (Junior Research Fellow): Entry-level research position for fresh MSc holders with NET/GATE. Tenure: 2 years. Stipend: ₹37,000/month + HRA.",
      "SRF (Senior Research Fellow): Promotion from JRF after 2 years, or direct entry for candidates with PhD. Stipend: ₹42,000/month + HRA. Involves leading research projects.",
      "Project Associate: Short-term (6-12 month) positions on specific funded projects. Lower stipend (₹20,000-₹30,000/month). Less stringent eligibility: can join with BE/BTech.",
      "Research Associate: For PhD holders. Higher stipend (₹47,000-₹54,000/month). Involves independent research and project management.",
    ],
  },
  {
    icon: BookMarked,
    title: "UGC-NET Electronic Science Syllabus Overview",
    content: [
      "Unit 1: Electronic Devices — Semiconductor physics, PN junction, BJT, FET, MOSFET, optoelectronic devices.",
      "Unit 2: Circuit Theory — Network theorems, transient analysis, two-port networks, filters and attenuators.",
      "Unit 3: Analog Electronics — Op-amps, oscillators, regulators, amplifiers, feedback circuits.",
      "Unit 4: Digital Electronics — Logic families, combinational/sequential circuits, memories, microprocessors.",
      "Unit 5: Signals & Systems — Fourier/Laplace/Z transforms, convolution, sampling theorem, LTI systems.",
      "Unit 6: Communication Systems — AM/FM/PM modulation, digital modulation, satellite/optical communication.",
      "Unit 7: Electromagnetics — Maxwell's equations, wave propagation, transmission lines, antennas.",
      "Unit 8: VLSI & Embedded Systems — CMOS design, FPGA, microcontroller programming, embedded C.",
    ],
  },
];

export default function ResourcesPage() {
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
        name: "Research Resources",
        item: "https://berojgardegreewala.vercel.app/resources",
      },
    ],
  };

  return (
    <div className="min-h-screen bg-bg-primary py-10 px-4 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsSchema) }}
      />
      <div className="max-w-4xl mx-auto">
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <li>
              <Link href="/" className="hover:text-slate-900 transition-colors">
                Home
              </Link>
            </li>
            <li>/</li>
            <li className="text-slate-900 font-bold" aria-current="page">
              Resources
            </li>
          </ol>
        </nav>
        
        {/* HEADER */}
        <div className="mb-8 border-b border-slate-200 pb-6">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">
            <Sparkles className="w-4 h-4" />
            <span>Research & Career Guides</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Electronics &amp; VLSI Resources
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm font-normal mt-1">
            Comprehensive guides for JRF, PhD, DRDO, CSIR, and VLSI careers in India.
          </p>
        </div>

        {/* GUIDES GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
          {GUIDE_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.href}
                href={card.href}
                className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-card hover:shadow-elevated hover:border-blue-300 hover:-translate-y-0.5 transition-all group block"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-1">
                      {card.title}
                    </h2>
                    <p className="text-slate-600 text-xs font-normal leading-relaxed line-clamp-2">
                      {card.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-blue-600 text-xs font-semibold mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Read Guide</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* DETAILED RESOURCE SECTIONS */}
        <div className="space-y-6">
          {SECTIONS.map((sec) => {
            const Icon = sec.icon;
            return (
              <div key={sec.title} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">{sec.title}</h3>
                </div>
                <ul className="space-y-2.5 pl-2">
                  {sec.content.map((item, idx) => (
                    <li key={idx} className="text-slate-700 text-xs sm:text-sm font-normal leading-relaxed flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
