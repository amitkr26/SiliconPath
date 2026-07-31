import Link from "next/link";
import { CircuitBoard, Shield } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-950 border-t-4 border-slate-900 text-slate-300 mt-16 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* BRAND COLUMN */}
          <div className="sm:col-span-2 lg:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2.5 group inline-flex">
              <div className="w-10 h-10 rounded-xl bg-blue-600 border-2 border-slate-900 flex items-center justify-center shadow-[3px_3px_0px_0px_#FFFFFF]">
                <CircuitBoard className="w-6 h-6 text-white stroke-[2.5]" />
              </div>
              <span className="font-black text-xl tracking-tight text-white group-hover:text-blue-400 transition-colors">
                Berojgar<span className="text-blue-500">DegreeWala</span>
              </span>
            </Link>
            <p className="text-slate-400 text-xs font-semibold leading-relaxed">
              India&apos;s premier platform for semiconductor & hardware engineers: 100% verified research opportunities, VLSI Academy curriculum, professional network, and AI career tools.
            </p>
            <div className="pt-2">
              <Link 
                href="/admin" 
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-black border-2 border-slate-900 shadow-[2px_2px_0px_0px_#FFFFFF] hover:bg-blue-700 transition-all"
              >
                <Shield className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Admin Login</span>
              </Link>
            </div>
          </div>

          {/* ECOSYSTEM COLUMN */}
          <div>
            <h4 className="text-xs font-black text-white tracking-widest uppercase mb-4 pb-1 border-b-2 border-blue-600 inline-block">Platform Ecosystem</h4>
            <div className="flex flex-col gap-2 font-bold text-xs">
              <Link href="/opportunities" className="text-slate-400 hover:text-blue-400 transition-colors">Opportunities Engine</Link>
              <Link href="/academy" className="text-slate-400 hover:text-blue-400 transition-colors">VLSI Academy</Link>
              <Link href="/network" className="text-slate-400 hover:text-blue-400 transition-colors">Hardware Network</Link>
              <Link href="/news" className="text-slate-400 hover:text-blue-400 transition-colors">News Feed</Link>
              <Link href="/community" className="text-slate-400 hover:text-blue-400 transition-colors">Community Forum</Link>
              <Link href="/chat" className="text-slate-400 hover:text-blue-400 transition-colors">Ask AI Assistant</Link>
              <Link href="/resume" className="text-slate-400 hover:text-blue-400 transition-colors">AI Resume Builder</Link>
            </div>
          </div>

          {/* OPPORTUNITY CATEGORIES */}
          <div>
            <h4 className="text-xs font-black text-white tracking-widest uppercase mb-4 pb-1 border-b-2 border-blue-600 inline-block">Opportunities</h4>
            <div className="flex flex-col gap-2 font-bold text-xs">
              <Link href="/category/jrf" className="text-slate-400 hover:text-blue-400 transition-colors">JRF Positions</Link>
              <Link href="/category/srf" className="text-slate-400 hover:text-blue-400 transition-colors">SRF Positions</Link>
              <Link href="/category/phd" className="text-slate-400 hover:text-blue-400 transition-colors">PhD Admissions</Link>
              <Link href="/category/govt-job" className="text-slate-400 hover:text-blue-400 transition-colors">Government Jobs</Link>
              <Link href="/category/fellowship" className="text-slate-400 hover:text-blue-400 transition-colors">Fellowships</Link>
              <Link href="/category/private" className="text-slate-400 hover:text-blue-400 transition-colors">Private Sector</Link>
              <Link href="/category/international" className="text-slate-400 hover:text-blue-400 transition-colors">International</Link>
            </div>
          </div>

          {/* RESOURCES COLUMN */}
          <div>
            <h4 className="text-xs font-black text-white tracking-widest uppercase mb-4 pb-1 border-b-2 border-blue-600 inline-block">Resources & Guides</h4>
            <div className="flex flex-col gap-2 font-bold text-xs">
              <Link href="/organizations" className="text-slate-400 hover:text-blue-400 transition-colors">Organizations Directory</Link>
              <Link href="/resources/jrf-guide" className="text-slate-400 hover:text-blue-400 transition-colors">JRF Complete Guide</Link>
              <Link href="/resources/phd-guide" className="text-slate-400 hover:text-blue-400 transition-colors">PhD Admission Guide</Link>
              <Link href="/resources/vlsi-careers" className="text-slate-400 hover:text-blue-400 transition-colors">VLSI Career Guide</Link>
              <Link href="/contact" className="text-slate-400 hover:text-blue-400 transition-colors">Contact Support</Link>
            </div>
          </div>
        </div>

        {/* BOTTOM BAR */}
        <div className="border-t-2 border-slate-900 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold text-slate-500">
          <p>&copy; {new Date().getFullYear()} BerojgarDegreeWala. Built for India&apos;s semiconductor revolution.</p>
          <p>Data aggregated daily from DRDO, ISRO, CSIR, IITs & premier fabless enterprises.</p>
        </div>
      </div>
    </footer>
  );
}
