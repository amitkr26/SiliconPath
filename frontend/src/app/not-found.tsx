import Link from "next/link";
import { Briefcase, GraduationCap, Newspaper, Sparkles, Building2, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center px-4 text-center py-12">
      <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-6">
        <Sparkles className="w-8 h-8 text-accent animate-pulse" />
      </div>
      <h1 className="font-display text-6xl font-bold text-text-primary mb-2">404</h1>
      <p className="text-xl text-text-primary font-semibold mb-2">Page Not Found</p>
      <p className="text-text-secondary max-w-md mb-8 text-sm">
        The requested URL could not be found. Explore verified opportunities, research news, or VLSI academy tracks below.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-md mb-8">
        <Link href="/" className="flex items-center justify-center gap-2 p-3 rounded-xl bg-surface border border-border hover:border-accent/40 text-text-primary text-xs font-medium transition-all">
          <Home className="w-4 h-4 text-accent" /> Home
        </Link>
        <Link href="/opportunities" className="flex items-center justify-center gap-2 p-3 rounded-xl bg-surface border border-border hover:border-accent/40 text-text-primary text-xs font-medium transition-all">
          <Briefcase className="w-4 h-4 text-accent" /> Opportunities
        </Link>
        <Link href="/chat" className="flex items-center justify-center gap-2 p-3 rounded-xl bg-surface border border-border hover:border-accent/40 text-text-primary text-xs font-medium transition-all">
          <Sparkles className="w-4 h-4 text-accent" /> AI Assistant
        </Link>
        <Link href="/academy" className="flex items-center justify-center gap-2 p-3 rounded-xl bg-surface border border-border hover:border-accent/40 text-text-primary text-xs font-medium transition-all">
          <GraduationCap className="w-4 h-4 text-accent" /> VLSI Academy
        </Link>
        <Link href="/news" className="flex items-center justify-center gap-2 p-3 rounded-xl bg-surface border border-border hover:border-accent/40 text-text-primary text-xs font-medium transition-all">
          <Newspaper className="w-4 h-4 text-accent" /> Industry News
        </Link>
        <Link href="/organizations" className="flex items-center justify-center gap-2 p-3 rounded-xl bg-surface border border-border hover:border-accent/40 text-text-primary text-xs font-medium transition-all">
          <Building2 className="w-4 h-4 text-accent" /> Organizations
        </Link>
      </div>

      <Link
        href="/"
        className="inline-flex items-center gap-2 bg-accent text-bg-primary font-semibold rounded-xl px-6 py-2.5 text-sm hover:bg-accent-hover transition-colors"
      >
        &larr; Return to BerojgarDegreeWala
      </Link>
    </div>
  );
}
