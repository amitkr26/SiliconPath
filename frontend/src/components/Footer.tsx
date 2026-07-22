import Link from "next/link";
import { Zap, CircuitBoard } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-surface/50 border-t border-border mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <CircuitBoard className="w-5 h-5 text-accent" />
              <span className="font-display text-lg font-bold text-text-primary">
                Berojgar<span className="text-accent">DegreeWala</span>
              </span>
            </Link>
            <p className="text-text-secondary text-sm leading-relaxed mb-4">
              AI-powered opportunity aggregator for the semiconductor, VLSI, and electronics engineering community. Updated daily.
            </p>
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold text-text-primary mb-4">Platform</h4>
            <div className="flex flex-col gap-2.5">
              <Link href="/opportunities" className="text-text-secondary hover:text-accent transition-colors text-sm">Opportunities</Link>
              <Link href="/academy" className="text-text-secondary hover:text-accent transition-colors text-sm font-semibold text-accent">VLSI Academy</Link>
              <Link href="/news" className="text-text-secondary hover:text-accent transition-colors text-sm">News Feed</Link>
              <Link href="/chat" className="text-text-secondary hover:text-accent transition-colors text-sm">Ask AI</Link>
              <Link href="/match" className="text-text-secondary hover:text-accent transition-colors text-sm">Find My Match</Link>
              <Link href="/community" className="text-text-secondary hover:text-accent transition-colors text-sm">Community Forum</Link>
              <Link href="/network" className="text-text-secondary hover:text-accent transition-colors text-sm">Network</Link>
              <Link href="/feed" className="text-text-secondary hover:text-accent transition-colors text-sm">Social Feed</Link>
            </div>
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold text-text-primary mb-4">Opportunities</h4>
            <div className="flex flex-col gap-2.5">
              <Link href="/category/jrf" className="text-text-secondary hover:text-accent transition-colors text-sm">JRF Positions</Link>
              <Link href="/category/srf" className="text-text-secondary hover:text-accent transition-colors text-sm">SRF Positions</Link>
              <Link href="/category/phd" className="text-text-secondary hover:text-accent transition-colors text-sm">PhD Admissions</Link>
              <Link href="/category/govt-job" className="text-text-secondary hover:text-accent transition-colors text-sm">Government Jobs</Link>
              <Link href="/category/fellowship" className="text-text-secondary hover:text-accent transition-colors text-sm">Fellowships</Link>
              <Link href="/category/private" className="text-text-secondary hover:text-accent transition-colors text-sm">Private Sector</Link>
              <Link href="/category/international" className="text-text-secondary hover:text-accent transition-colors text-sm">International</Link>
            </div>
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold text-text-primary mb-4">Company & Resources</h4>
            <div className="flex flex-col gap-2.5">
              <Link href="/about" className="text-text-secondary hover:text-accent transition-colors text-sm">About Us</Link>
              <Link href="/organizations" className="text-text-secondary hover:text-accent transition-colors text-sm">Organizations Directory</Link>
              <Link href="/resources/jrf-guide" className="text-text-secondary hover:text-accent transition-colors text-sm">JRF Complete Guide</Link>
              <Link href="/resources/phd-guide" className="text-text-secondary hover:text-accent transition-colors text-sm">PhD Admission Guide</Link>
              <Link href="/resources/vlsi-careers" className="text-text-secondary hover:text-accent transition-colors text-sm">VLSI Career Guide</Link>
              <Link href="/contact" className="text-text-secondary hover:text-accent transition-colors text-sm">Contact Support</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-border/50 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-text-muted text-xs">
            &copy; {new Date().getFullYear()} BerojgarDegreeWala. Built for India&apos;s semiconductor revolution.
          </p>
          <p className="text-text-muted text-xs">
            Data aggregated from DRDO, ISRO, CSIR, IITs & 100+ organizations
          </p>
        </div>
      </div>
    </footer>
  );
}
