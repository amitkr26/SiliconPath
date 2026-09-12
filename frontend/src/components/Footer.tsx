import Link from "next/link";
import { CircuitBoard, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-300 mt-20 relative z-10">
      
      {/* TOP TRUST STRIP */}
      <div className="border-b border-slate-800/80 bg-slate-900/40 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-400">
          <div className="flex items-center gap-2 text-white font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4.5 h-4.5 text-blue-500" />
            <span>India&apos;s Semiconductor &amp; VLSI Career Gateway</span>
          </div>
          <div className="flex flex-wrap items-center gap-5 text-slate-300 text-xs">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Links to Official Sources
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Apply Directly to Portals
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Free Public Aggregator
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          
          {/* BRAND COLUMN */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5 group inline-flex">
              <div className="w-8 h-8 rounded-lg bg-blue-600 border border-white/20 flex items-center justify-center">
                <CircuitBoard className="w-4.5 h-4.5 text-white stroke-[2]" />
              </div>
              <span className="font-bold text-xl tracking-tight text-white group-hover:text-blue-400 transition-colors">
                Berojgar<span className="text-blue-500">DegreeWala</span>
              </span>
            </Link>
            <p className="text-slate-400 text-xs font-normal leading-relaxed max-w-sm">
              Empowering India&apos;s semiconductor, microelectronics, and deep-tech talent pool with aggregated opportunity notifications from DRDO, ISRO, CSIR, IITs, and premier fabless enterprises.
            </p>

            <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-medium">
              <Link href="/opportunities?search=ISRO" className="px-2.5 py-1 bg-slate-900/80 border border-slate-800 hover:border-blue-500/60 text-slate-300 hover:text-white rounded-md transition-colors">
                ISRO Careers
              </Link>
              <Link href="/opportunities?search=DRDO" className="px-2.5 py-1 bg-slate-900/80 border border-slate-800 hover:border-blue-500/60 text-slate-300 hover:text-white rounded-md transition-colors">
                DRDO JRF 2026
              </Link>
              <Link href="/opportunities?search=CSIR" className="px-2.5 py-1 bg-slate-900/80 border border-slate-800 hover:border-blue-500/60 text-slate-300 hover:text-white rounded-md transition-colors">
                CSIR Labs Fellowships
              </Link>
              <Link href="/opportunities?search=IIT" className="px-2.5 py-1 bg-slate-900/80 border border-slate-800 hover:border-blue-500/60 text-slate-300 hover:text-white rounded-md transition-colors">
                IIT Microelectronics PhD
              </Link>
              <Link href="/opportunities?search=Verification" className="px-2.5 py-1 bg-slate-900/80 border border-slate-800 hover:border-blue-500/60 text-slate-300 hover:text-white rounded-md transition-colors">
                RTL &amp; UVM Verification
              </Link>
              <Link href="/opportunities?search=Physical%20Design" className="px-2.5 py-1 bg-slate-900/80 border border-slate-800 hover:border-blue-500/60 text-slate-300 hover:text-white rounded-md transition-colors">
                Physical Design &amp; STA
              </Link>
            </div>
          </div>

          {/* COLUMN 1: GUIDES */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold text-white tracking-wider uppercase pb-1 border-b border-blue-500/50 inline-block">
              Guides
            </h4>
            <div className="flex flex-col gap-2 font-medium text-xs">
              <Link href="/resources/jrf-guide" className="text-slate-400 hover:text-white transition-colors">
                JRF Complete Guide (DST Norms)
              </Link>
              <Link href="/resources/jrf-vs-srf-difference" className="text-slate-400 hover:text-white transition-colors">
                JRF vs SRF vs RA Guide
              </Link>
              <Link href="/resources/drdo-recruitment-electronics" className="text-slate-400 hover:text-white transition-colors">
                DRDO ECE Syllabus &amp; Exam
              </Link>
              <Link href="/resources/phd-guide" className="text-slate-400 hover:text-white transition-colors">
                IIT/IISc PhD Admission Guide
              </Link>
              <Link href="/resources/fully-funded-phd-vlsi-abroad" className="text-slate-400 hover:text-white transition-colors">
                Fully-Funded PhD Abroad (Europe/US)
              </Link>
              <Link href="/resources/international-fellowships" className="text-slate-400 hover:text-white transition-colors">
                Global Semiconductor Fellowships
              </Link>
              <Link href="/resources/net-vs-gate" className="text-slate-400 hover:text-white transition-colors">
                CSIR NET vs GATE Comparison
              </Link>
              <Link href="/resources/vlsi-careers" className="text-slate-400 hover:text-white transition-colors">
                VLSI Career &amp; Salary Roadmap
              </Link>
            </div>
          </div>

          {/* COLUMN 2: PORTALS & TOOLS */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold text-white tracking-wider uppercase pb-1 border-b border-blue-500/50 inline-block">
              Portals &amp; Tools
            </h4>
            <div className="flex flex-col gap-2 font-medium text-xs">
              <Link href="/opportunities" className="text-slate-400 hover:text-white transition-colors">
                Verified Opportunities Feed
              </Link>
              <Link href="/organizations" className="text-slate-400 hover:text-white transition-colors">
                Organizations &amp; Labs Directory
              </Link>
              <Link href="/ask-ai" className="text-slate-400 hover:text-white transition-colors">
                Deep-Tech AI Assistant
              </Link>
              <Link href="/news" className="text-slate-400 hover:text-white transition-colors">
                Daily Industry News &amp; Circulars
              </Link>
              <Link href="/resources" className="text-slate-400 hover:text-white transition-colors">
                All Research Resources Hub
              </Link>
              <Link href="/contact" className="text-slate-400 hover:text-white transition-colors">
                Contact &amp; Support
              </Link>
            </div>
          </div>

          {/* COLUMN 3: OUR ECOSYSTEM */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold text-white tracking-wider uppercase pb-1 border-b border-blue-500/50 inline-block">
              Our Ecosystem
            </h4>
            <div className="flex flex-col gap-2 font-medium text-xs">
              <a href="https://siliconpath.vercel.app" target="_blank" rel="noopener" className="text-slate-400 hover:text-white transition-colors">
                SiliconPath — Free VLSI Learning Platform
              </a>
              <a href="https://electrobridge.vercel.app" target="_blank" rel="noopener" className="text-slate-400 hover:text-white transition-colors">
                ElectroBridge — AI Resume Builder for Engineers
              </a>
            </div>
          </div>

        </div>

        {/* BOTTOM BAR */}
        <div className="border-t border-slate-800/80 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-500">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <p>&copy; {new Date().getFullYear()} BerojgarDegreeWala. All rights reserved.</p>
            <div className="flex items-center gap-3">
              <Link href="/about" className="hover:text-slate-300 transition-colors">About</Link>
              <span>&bull;</span>
              <Link href="/contact" className="hover:text-slate-300 transition-colors">Contact</Link>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-400 text-[11px] font-medium">
              Live Scrapers &amp; News Sync Active
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
