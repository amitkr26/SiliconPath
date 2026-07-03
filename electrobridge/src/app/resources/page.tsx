import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, GraduationCap, Briefcase, Globe, FileText, BookMarked, ArrowRight, Zap, Award, Network } from "lucide-react";

export const metadata: Metadata = {
  title: "Resources — JRF Guide, PhD Guide, DRDO Labs, CSIR Research | ElectroBridge",
  description: "Comprehensive guide to JRF positions in India, PhD admissions, list of DRDO and CSIR labs for electronics research, NET vs GATE comparison, international fellowship programs, and more.",
  alternates: { canonical: "https://electrobridge.vercel.app/resources" },
  openGraph: {
    title: "ElectroBridge Resources — JRF Guide & Research Information",
    description: "Step-by-step JRF application guide, PhD admission guide, NET vs GATE comparison, DRDO/CSIR lab directory, international fellowship programs for Indian researchers.",
    url: "https://electrobridge.vercel.app/resources",
  },
};

const GUIDE_CARDS = [
  { href: "/resources/jrf-guide", icon: GraduationCap, title: "JRF Complete Guide", description: "Everything about Junior Research Fellowship: eligibility, stipend ₹37,000-42,000/month, age limit, how to apply, documents needed, DRDO/ISRO/CSIR openings.", color: "from-cyan/20 to-blue-500/20 border-cyan/30", iconBg: "bg-cyan/10", iconColor: "text-[#00E5FF]" },
  { href: "/resources/phd-guide", icon: BookOpen, title: "PhD in Electronics Guide", description: "Complete PhD admission guide: 3 admission routes, top institutions with stipends, funding options (CSIR/UGC/INSPIRE/PMRF), professor email template, application timeline.", color: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30", iconBg: "bg-emerald-500/10", iconColor: "text-emerald-400" },
  { href: "/resources/vlsi-careers", icon: Zap, title: "VLSI Career Guide", description: "VLSI career paths in India: roles (design, verification, layout), top companies (Intel, AMD, Qualcomm, TI), salary ranges, required skills, and training resources.", color: "from-purple-500/20 to-pink-500/20 border-purple-500/30", iconBg: "bg-purple-500/10", iconColor: "text-purple-400" },
  { href: "/resources/international-fellowships", icon: Globe, title: "International Fellowships", description: "DAAD (Germany), SINGA (Singapore), MEXT (Japan), Marie Curie (EU) — fully-funded PhD and research fellowships for Indian electronics researchers abroad.", color: "from-blue-500/20 to-indigo-500/20 border-blue-500/30", iconBg: "bg-blue-500/10", iconColor: "text-blue-400" },
  { href: "/resources/net-vs-gate", icon: Network, title: "NET vs GATE Comparison", description: "Which exam should you choose? UGC-NET Electronic Science vs GATE ECE: syllabus, stipend, career paths, age limits, and strategy to appear for both.", color: "from-amber-500/20 to-orange-500/20 border-amber-500/30", iconBg: "bg-amber-500/10", iconColor: "text-amber-400" },
];

const sections = [
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-display text-3xl font-bold text-white mb-2">Resources</h1>
      <p className="text-[#94A3B8] text-sm mb-10">
        Comprehensive guides and information for electronics researchers and professionals.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
        {GUIDE_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className={`bg-gradient-to-br ${card.color} bg-[#1A2438] border rounded-xl p-5 hover:translate-y-[-2px] transition-all duration-300 group`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg ${card.iconBg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${card.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-display text-base font-bold text-white mb-1">{card.title}</h2>
                  <p className="text-[#94A3B8] text-xs leading-relaxed line-clamp-2">{card.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-[#00E5FF] text-xs font-medium mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                Read Guide <ArrowRight className="w-3 h-3" />
              </div>
            </Link>
          );
        })}
      </div>

      <div className="space-y-8">
        <h2 className="font-display text-2xl font-bold text-white">Reference Information</h2>
        {sections.map((section) => (
          <div key={section.title} className="bg-[#1A2438] border border-[#1F2937] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-cyan/10 flex items-center justify-center flex-shrink-0">
                <section.icon className="w-5 h-5 text-[#00E5FF]" />
              </div>
              <h2 className="font-display text-lg font-bold text-white">{section.title}</h2>
            </div>
            <ul className="space-y-2">
              {section.content.map((item, i) => (
                <li key={i} className="text-[#94A3B8] text-sm leading-relaxed flex items-start gap-2">
                  <span className="text-[#00E5FF] mt-1 flex-shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
