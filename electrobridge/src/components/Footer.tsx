import Link from "next/link";
import { Zap } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-surface/50 border-t border-border mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-accent" />
              <span className="font-display text-lg font-bold text-text-primary">
                Electro<span className="text-accent">Bridge</span>
              </span>
            </Link>
            <p className="text-text-secondary text-sm leading-relaxed mb-4">
              AI-powered career platform for the semiconductor and electronics engineering community.
            </p>
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold text-text-primary mb-4">Platform</h4>
            <div className="flex flex-col gap-2.5">
              <Link href="/opportunities" className="text-text-secondary hover:text-accent transition-colors text-sm">Opportunities</Link>
              <Link href="/news" className="text-text-secondary hover:text-accent transition-colors text-sm">News</Link>
              <Link href="/chat" className="text-text-secondary hover:text-accent transition-colors text-sm">Ask AI</Link>
              <Link href="/match" className="text-text-secondary hover:text-accent transition-colors text-sm">Find My Match</Link>
            </div>
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold text-text-primary mb-4">Resources</h4>
            <div className="flex flex-col gap-2.5">
              <Link href="/resources/jrf-guide" className="text-text-secondary hover:text-accent transition-colors text-sm">JRF Complete Guide</Link>
              <Link href="/resources/phd-guide" className="text-text-secondary hover:text-accent transition-colors text-sm">PhD Admission Guide</Link>
              <Link href="/resources/international-fellowships" className="text-text-secondary hover:text-accent transition-colors text-sm">International Fellowships</Link>
              <Link href="/resources/vlsi-careers" className="text-text-secondary hover:text-accent transition-colors text-sm">VLSI Career Guide</Link>
            </div>
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold text-text-primary mb-4">Company</h4>
            <div className="flex flex-col gap-2.5">
              <Link href="/about" className="text-text-secondary hover:text-accent transition-colors text-sm">About</Link>
              <Link href="/contact" className="text-text-secondary hover:text-accent transition-colors text-sm">Contact</Link>
              <Link href="/organizations" className="text-text-secondary hover:text-accent transition-colors text-sm">Organizations</Link>
              <Link href="/admin" className="text-text-secondary hover:text-accent transition-colors text-sm">Admin</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-border/50 mt-10 pt-6 text-center">
          <p className="text-text-muted text-xs">
            &copy; {new Date().getFullYear()} ElectroBridge. Built for India&apos;s semiconductor revolution.
          </p>
        </div>
      </div>
    </footer>
  );
}
