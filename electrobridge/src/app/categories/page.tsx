import type { Metadata } from "next";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import { GraduationCap, FlaskConical, BookOpen, Building2, Award, Briefcase } from "lucide-react";

export const metadata: Metadata = {
  title: "Browse Opportunities by Category — JRF, PhD, Govt Jobs | ElectroBridge",
  description: "Browse electronics and semiconductor opportunities by category: JRF, SRF, PhD, Government Jobs, Fellowships, and Private Sector positions. Updated daily.",
  alternates: { canonical: "https://electrobridge.vercel.app/categories" },
};

const CATEGORIES_CONFIG = [
  { slug: "jrf", label: "JRF", icon: GraduationCap, description: "Junior Research Fellowship positions at DRDO, ISRO, CSIR, IITs for NET/GATE qualified MSc holders. Stipend: ₹37,000/month.", color: "from-cyan/20 to-blue-500/20 border-cyan/30", iconBg: "bg-cyan/10", iconColor: "text-[#00E5FF]" },
  { slug: "srf", label: "SRF", icon: FlaskConical, description: "Senior Research Fellowship for experienced researchers (2+ years JRF or PhD). Stipend: ₹42,000/month.", color: "from-purple-500/20 to-pink-500/20 border-purple-500/30", iconBg: "bg-purple-500/10", iconColor: "text-purple-400" },
  { slug: "phd", label: "PhD", icon: BookOpen, description: "Funded doctoral opportunities at IITs, IISc, CSIR labs, and international universities with JRF/INSPIRE/PMRF funding.", color: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30", iconBg: "bg-emerald-500/10", iconColor: "text-emerald-400" },
  { slug: "govt-job", label: "Govt Job", icon: Building2, description: "Scientist, engineer, and technical positions at DRDO, ISRO, BARC, CSIR. Stable careers with 7th CPC pay scales.", color: "from-amber-500/20 to-orange-500/20 border-amber-500/30", iconBg: "bg-amber-500/10", iconColor: "text-amber-400" },
  { slug: "fellowship", label: "Fellowship", icon: Award, description: "Research fellowships and scholarships: DST-INSPIRE, DAAD (Germany), SINGA (Singapore), MEXT (Japan), and more.", color: "from-blue-500/20 to-indigo-500/20 border-blue-500/30", iconBg: "bg-blue-500/10", iconColor: "text-blue-400" },
  { slug: "private", label: "Private Sector", icon: Briefcase, description: "Electronics and semiconductor industry positions at R&D labs, tech companies, and startups in India and globally.", color: "from-orange-500/20 to-red-500/20 border-orange-500/30", iconBg: "bg-orange-500/10", iconColor: "text-orange-400" },
];

export default async function CategoriesPage() {
  const counts: Record<string, number> = {};
  if (supabaseAdmin?.from) {
    for (const cat of CATEGORIES_CONFIG) {
      const { count } = await supabaseAdmin
        .from("opportunities")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true)
        .eq("category", cat.label);
      counts[cat.slug] = count || 0;
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-display text-3xl font-bold text-white mb-2">Browse by Category</h1>
      <p className="text-[#94A3B8] text-sm mb-10">Find opportunities across all electronics research categories.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {CATEGORIES_CONFIG.map((cat) => {
          const Icon = cat.icon;
          return (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className={`bg-[#1A2438] border bg-gradient-to-br ${cat.color} rounded-xl p-6 hover:translate-y-[-2px] transition-all duration-300 group`}
            >
              <div className={`w-12 h-12 rounded-xl ${cat.iconBg} flex items-center justify-center mb-4`}>
                <Icon className={`w-6 h-6 ${cat.iconColor}`} />
              </div>
              <h2 className="font-display text-lg font-bold text-white mb-2">{cat.label}</h2>
              <p className="text-[#94A3B8] text-sm leading-relaxed mb-4">{cat.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-[#00E5FF] text-sm font-semibold">{counts[cat.slug] || 0} active</span>
                <span className="text-[#94A3B8] text-sm group-hover:text-[#00E5FF] transition-colors">Browse &rarr;</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
