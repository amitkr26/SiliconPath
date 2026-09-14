import Link from "next/link";
import { Briefcase, Newspaper, Sparkles, Building2, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center px-4 text-center py-16 bg-slate-50/40">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-6 shadow-sm">
        <Sparkles className="w-8 h-8 text-blue-600" />
      </div>
      <h1 className="text-5xl sm:text-6xl font-extrabold text-slate-900 mb-2 tracking-tight">404</h1>
      <p className="text-lg sm:text-xl font-bold text-slate-800 mb-2">Page Not Found</p>
      <p className="text-slate-600 max-w-md mb-8 text-xs sm:text-sm font-normal">
        The requested URL could not be found. Explore verified opportunities, research news, or resources below.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-lg mb-8">
        {[
          { label: "Home", href: "/", icon: Home },
          { label: "Opportunities", href: "/opportunities", icon: Briefcase },
          { label: "AI Assistant", href: "/ask-ai", icon: Sparkles },
          { label: "Industry News", href: "/news", icon: Newspaper },
          { label: "Organizations", href: "/organizations", icon: Building2 },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white border border-slate-200/90 shadow-sm hover:shadow-card hover:border-blue-300 text-slate-700 hover:text-blue-600 text-xs font-semibold transition-all"
            >
              <Icon className="w-4 h-4 text-blue-600" /> {item.label}
            </Link>
          );
        })}
      </div>

      <Button href="/" size="lg" className="shadow-sm">
        <ArrowLeft className="w-4 h-4" /> Return to BerojgarDegreeWala
      </Button>
    </div>
  );
}
