import Link from "next/link";
import { Briefcase, GraduationCap, Newspaper, Sparkles, Building2, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center px-4 text-center py-16">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 border-2 border-slate-900 shadow-brutal-sm flex items-center justify-center mb-6">
        <Sparkles className="w-8 h-8 text-accent animate-pulse" />
      </div>
      <h1 className="text-6xl sm:text-7xl font-black text-slate-900 mb-2 tracking-tight">404</h1>
      <p className="text-xl sm:text-2xl font-black text-slate-900 mb-2">Page Not Found</p>
      <p className="text-slate-600 max-w-md mb-8 text-sm font-medium">
        The requested URL could not be found. Explore verified opportunities, research news, or VLSI academy tracks below.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-lg mb-8">
        {[
          { label: "Home", href: "/", icon: Home },
          { label: "Opportunities", href: "/opportunities", icon: Briefcase },
          { label: "AI Assistant", href: "/ask-ai", icon: Sparkles },
          { label: "VLSI Academy", href: "/academy", icon: GraduationCap },
          { label: "Industry News", href: "/news", icon: Newspaper },
          { label: "Organizations", href: "/organizations", icon: Building2 },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white border-2 border-slate-900 shadow-brutal-sm hover:shadow-brutal hover:-translate-y-0.5 text-slate-900 text-xs font-bold transition-all"
            >
              <Icon className="w-4 h-4 text-accent" /> {item.label}
            </Link>
          );
        })}
      </div>

      <Button href="/" size="lg">
        <ArrowLeft className="w-4 h-4" /> Return to BerojgarDegreeWala
      </Button>
    </div>
  );
}
