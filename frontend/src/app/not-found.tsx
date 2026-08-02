import Link from "next/link";
import { Briefcase, GraduationCap, Search, Building2, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center px-4 text-center py-12">
      <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-6">
        <Search className="w-8 h-8 text-accent animate-pulse" />
      </div>
      <h1 className="font-display text-6xl font-bold text-text-primary mb-2">404</h1>
      <p className="text-xl text-text-primary font-semibold mb-2">Page Not Found</p>
      <p className="text-text-secondary max-w-md mb-8 text-sm">
        The requested URL could not be found. Explore verified VLSI opportunities or academy tracks below.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-md mb-8">
        <Link href="/" className="flex items-center justify-center gap-2 p-3 rounded-xl bg-surface border border-border hover:border-accent/40 text-text-primary text-xs font-medium transition-all">
          <Home className="w-4 h-4 text-accent" /> Home
        </Link>
        <Link href="/search" className="flex items-center justify-center gap-2 p-3 rounded-xl bg-surface border border-border hover:border-accent/40 text-text-primary text-xs font-medium transition-all">
          <Search className="w-4 h-4 text-accent" /> Search
        </Link>
        <Link href="/academy" className="flex items-center justify-center gap-2 p-3 rounded-xl bg-surface border border-border hover:border-accent/40 text-text-primary text-xs font-medium transition-all">
          <GraduationCap className="w-4 h-4 text-accent" /> VLSI Academy
        </Link>
        <Link href="/companies" className="flex items-center justify-center gap-2 p-3 rounded-xl bg-surface border border-border hover:border-accent/40 text-text-primary text-xs font-medium transition-all">
          <Building2 className="w-4 h-4 text-accent" /> Companies
        </Link>
        <Link href="/categories" className="flex items-center justify-center gap-2 p-3 rounded-xl bg-surface border border-border hover:border-accent/40 text-text-primary text-xs font-medium transition-all">
          <Briefcase className="w-4 h-4 text-accent" /> Categories
        </Link>
      </div>

      <Link
        href="/"
        className="inline-flex items-center gap-2 bg-accent text-bg-primary font-semibold rounded-xl px-6 py-2.5 text-sm hover:bg-accent-hover transition-colors"
      >
        &larr; Return to SiliconPath
      </Link>
    </div>
  );
}
