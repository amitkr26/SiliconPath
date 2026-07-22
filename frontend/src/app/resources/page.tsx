import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap, Briefcase, Globe, FileText, BookMarked, ArrowRight, Zap, Award, Network, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Resources — JRF Guide, PhD Guide, DRDO Labs, CSIR Research | BerojgarDegreeWala",
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
  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* HEADER */}
        <div className="mb-8 border-b border-slate-200 pb-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-2">
            <Sparkles className="w-4 h-4" />
            <span>Research & Career Guides</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Electronics & VLSI Resources
          </h1>
          <p className="text-slate-600 text-sm mt-1">
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
                className="glass-premium rounded-2xl p-5 hover:-translate-y-1 transition-all duration-300 group block"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <Icon className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-1">
                      {card.title}
                    </h2>
                    <p className="text-slate-600 text-xs leading-relaxed line-clamp-2">
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
              <div key={sec.title} className="glass-premium rounded-2xl p-6 border border-slate-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{sec.title}</h3>
                </div>
                <ul className="space-y-2.5 pl-2">
                  {sec.content.map((item, idx) => (
                    <li key={idx} className="text-slate-700 text-xs sm:text-sm leading-relaxed flex items-start gap-2">
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
