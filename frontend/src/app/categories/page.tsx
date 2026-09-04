import type { Metadata } from "next";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { GraduationCap, FlaskConical, BookOpen, Building2, Award, Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = {
  title: "Browse Opportunities by Category — JRF, PhD, Govt Jobs",
  description: "Browse electronics and semiconductor opportunities by category: JRF, SRF, PhD, Government Jobs, Fellowships, and Private Sector positions. Updated daily.",
  alternates: { canonical: "https://berojgardegreewala.vercel.app/categories" },
};

const CATEGORIES_CONFIG = [
  { slug: "jrf", label: "JRF", icon: GraduationCap, description: "Junior Research Fellowship positions at DRDO, ISRO, CSIR, IITs for NET/GATE qualified MSc holders. Stipend: ?37,000/month.", chip: "bg-blue-50 text-blue-700 border-blue-600", badge: "accent" as const },
  { slug: "srf", label: "SRF", icon: FlaskConical, description: "Senior Research Fellowship for experienced researchers (2+ years JRF or PhD). Stipend: ?42,000/month.", chip: "bg-purple-50 text-purple-700 border-purple-600", badge: "purple" as const },
  { slug: "phd", label: "PhD", icon: BookOpen, description: "Funded doctoral opportunities at IITs, IISc, CSIR labs, and international universities with JRF/INSPIRE/PMRF funding.", chip: "bg-emerald-50 text-emerald-700 border-emerald-600", badge: "success" as const },
  { slug: "govt-job", label: "Govt Job", icon: Building2, description: "Scientist, engineer, and technical positions at DRDO, ISRO, BARC, CSIR. Stable careers with 7th CPC pay scales.", chip: "bg-amber-50 text-amber-700 border-amber-600", badge: "warning" as const },
  { slug: "fellowship", label: "Fellowship", icon: Award, description: "Research fellowships and scholarships: DST-INSPIRE, DAAD (Germany), SINGA (Singapore), MEXT (Japan), and more.", chip: "bg-indigo-50 text-indigo-700 border-indigo-600", badge: "accent" as const },
  { slug: "private", label: "Private Sector", icon: Briefcase, description: "Electronics and semiconductor industry positions at R&D labs, tech companies, and startups in India and globally.", chip: "bg-orange-50 text-orange-700 border-orange-600", badge: "neutral" as const },
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
      <h1 className="font-display text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-2">Browse by Category</h1>
      <p className="text-slate-600 text-sm font-medium mb-10">Find opportunities across all electronics research categories.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {CATEGORIES_CONFIG.map((cat) => {
          const Icon = cat.icon;
          return (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className="bg-white border-2 border-slate-900 rounded-2xl p-6 shadow-brutal hover:shadow-brutal-lg hover:-translate-y-1 transition-all group block"
            >
              <div className={`w-12 h-12 rounded-xl border-2 border-slate-900 ${cat.chip} flex items-center justify-center mb-4 shadow-brutal-sm`}>
                <Icon className="w-6 h-6" />
              </div>
              <h2 className="font-display text-lg font-black text-slate-900 mb-2">{cat.label}</h2>
              <p className="text-slate-600 text-sm font-medium leading-relaxed mb-4">{cat.description}</p>
              <div className="flex items-center justify-between">
                <Badge tone={cat.badge}>{counts[cat.slug] || 0} active</Badge>
                <span className="text-slate-500 text-sm font-semibold group-hover:text-blue-600 transition-colors">Browse &rarr;</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
