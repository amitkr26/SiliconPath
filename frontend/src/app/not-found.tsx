import Link from "next/link";
import { GraduationCap, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center px-4 text-center py-16">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 border-2 border-slate-900 shadow-brutal-sm flex items-center justify-center mb-6">
        <GraduationCap className="w-8 h-8 text-blue-600" />
      </div>
      <h1 className="text-6xl sm:text-7xl font-black text-slate-900 mb-2 tracking-tight">404</h1>
      <p className="text-xl sm:text-2xl font-black text-slate-900 mb-2">Page Not Found</p>
      <p className="text-slate-600 max-w-md mb-8 text-sm font-medium">
        The requested URL could not be found. Explore VLSI academy tracks below.
      </p>

      <div className="grid grid-cols-2 gap-3 w-full max-w-sm mb-8">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white border-2 border-slate-900 shadow-brutal-sm hover:shadow-brutal hover:-translate-y-0.5 text-slate-900 text-xs font-bold transition-all"
        >
          <Home className="w-4 h-4 text-blue-600" /> Home
        </Link>
        <Link
          href="/academy"
          className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white border-2 border-slate-900 shadow-brutal-sm hover:shadow-brutal hover:-translate-y-0.5 text-slate-900 text-xs font-bold transition-all"
        >
          <GraduationCap className="w-4 h-4 text-blue-600" /> Academy
        </Link>
      </div>

      <Button href="/academy" size="lg">
        <ArrowLeft className="w-4 h-4" /> Go to Academy
      </Button>
    </div>
  );
}
