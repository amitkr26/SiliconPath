import Link from "next/link";
import { CircuitBoard, ShieldCheck, Sparkles, Rocket, Atom, GraduationCap, Building2, ExternalLink, Lock, CheckCircle2 } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-950 border-t-2 border-slate-900 text-slate-300 mt-20 relative z-10">
      
      {/* TOP TRUST BANNER */}
      <div className="border-b border-slate-900 bg-slate-900/60 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-bold text-slate-400">
          <div className="flex items-center gap-2 text-white font-black uppercase tracking-wider">
            <ShieldCheck className="w-5 h-5 text-accent" />
            <span>India&apos;s Verified Semiconductor &amp; VLSI Career Gateway</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-slate-300">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 100% Official Circular Links
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Zero Intermediary Fees
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Free Public Aggregator
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          
          {/* BRAND COLUMN */}
          <div className="lg:col-span-2 space-y-5">
            <Link href="/" className="flex items-center gap-2.5 group inline-flex">
              <div className="w-10 h-10 rounded-xl bg-accent border-2 border-white flex items-center justify-center shadow-brutal-sm">
                <CircuitBoard className="w-6 h-6 text-white stroke-[2.5]" />
              </div>
              <span className="font-black text-2xl tracking-tight text-white group-hover:text-blue-400 transition-colors">
                Berojgar<span className="text-accent">DegreeWala</span>
              </span>
            </Link>
            <p className="text-slate-400 text-xs font-medium leading-relaxed max-w-sm">
              Empowering India&apos;s Semiconductor, VLSI, and Deep-Tech researchers and hardware engineers with direct official notifications from DRDO, ISRO, CSIR, IITs, and premier fabless enterprises.
            </p>

            <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-bold">
              <Link href="/opportunities?search=ISRO" className="px-3 py-1 bg-slate-900 border border-slate-800 hover:border-accent text-slate-300 rounded-lg transition-all">
                🚀 ISRO Careers
              </Link>
              <Link href="/opportunities?search=DRDO" className="px-3 py-1 bg-slate-900 border border-slate-800 hover:border-accent text-slate-300 rounded-lg transition-all">
                🛡️ DRDO JRF
              </Link>
              <Link href="/opportunities?search=CSIR" className="px-3 py-1 bg-slate-900 border border-slate-800 hover:border-accent text-slate-300 rounded-lg transition-all">
                🔬 CSIR Labs
              </Link>
              <Link href="/opportunities?search=IIT" className="px-3 py-1 bg-slate-900 border border-slate-800 hover:border-accent text-slate-300 rounded-lg transition-all">
                🎓 IIT Microelectronics
              </Link>
            </div>
          </div>

          {/* COLUMN 1: OPPORTUNITIES */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-white tracking-widest uppercase pb-1 border-b-2 border-accent inline-block">
              Opportunities
            </h4>
            <div className="flex flex-col gap-2.5 font-bold text-xs">
              <Link href="/opportunities?category=jrf" className="text-slate-400 hover:text-white transition-colors">
                Junior Research Fellow (JRF)
              </Link>
              <Link href="/opportunities?category=srf" className="text-slate-400 hover:text-white transition-colors">
                Senior Research Fellow (SRF)
              </Link>
              <Link href="/opportunities?category=phd" className="text-slate-400 hover:text-white transition-colors">
                PhD &amp; Doctoral Admissions
              </Link>
              <Link href="/opportunities?category=government" className="text-slate-400 hover:text-white transition-colors">
                Scientist &apos;B&apos; Government Posts
              </Link>
              <Link href="/opportunities?category=job" className="text-slate-400 hover:text-white transition-colors">
                Private VLSI Engineering Jobs
              </Link>
              <Link href="/opportunities?category=internship" className="text-slate-400 hover:text-white transition-colors">
                Semiconductor Internships
              </Link>
              <Link href="/opportunities" className="text-accent hover:underline flex items-center gap-1 pt-1">
                Browse All {2850}+ Jobs &rarr;
              </Link>
            </div>
          </div>

          {/* COLUMN 2: GUIDES & ACADEMY */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-white tracking-widest uppercase pb-1 border-b-2 border-accent inline-block">
              Guides &amp; Academy
            </h4>
            <div className="flex flex-col gap-2.5 font-bold text-xs">
              <Link href="/academy" className="text-slate-400 hover:text-white transition-colors">
                VLSI Courses &amp; Labs
              </Link>
              <Link href="/resources/jrf-guide" className="text-slate-400 hover:text-white transition-colors">
                JRF Complete Guide (2026)
              </Link>
              <Link href="/resources/jrf-vs-srf-difference" className="text-slate-400 hover:text-white transition-colors">
                JRF vs SRF vs RA Guide
              </Link>
              <Link href="/resources/drdo-recruitment-electronics" className="text-slate-400 hover:text-white transition-colors">
                DRDO ECE Syllabus &amp; Exam
              </Link>
              <Link href="/resources/fully-funded-phd-vlsi-abroad" className="text-slate-400 hover:text-white transition-colors">
                Fully-Funded PhD Abroad
              </Link>
              <Link href="/resources/net-vs-gate" className="text-slate-400 hover:text-white transition-colors">
                CSIR NET vs GATE Comparison
              </Link>
              <Link href="/resources/vlsi-careers" className="text-slate-400 hover:text-white transition-colors">
                VLSI Career Roadmap
              </Link>
            </div>
          </div>

          {/* COLUMN 3: PLATFORM & PORTALS */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-white tracking-widest uppercase pb-1 border-b-2 border-accent inline-block">
              Portals &amp; Tools
            </h4>
            <div className="flex flex-col gap-2.5 font-bold text-xs">
              <Link href="/signup?role=candidate" className="text-accent hover:underline">
                Candidate Profile (@username)
              </Link>
              <Link href="/signup?role=employer" className="text-emerald-400 hover:underline">
                Employer &amp; Lab Dashboard
              </Link>
              <Link href="/organizations" className="text-slate-400 hover:text-white transition-colors">
                Organizations Directory
              </Link>
              <Link href="/ask-ai" className="text-slate-400 hover:text-white transition-colors">
                Ask AI Assistant
              </Link>
              <Link href="/resume" className="text-slate-400 hover:text-white transition-colors">
                AI Resume Builder
              </Link>
              <Link href="/news" className="text-slate-400 hover:text-white transition-colors">
                Daily Industry News
              </Link>
              <Link href="/admin" className="text-slate-400 hover:text-white transition-colors flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-slate-500" /> Admin Console
              </Link>
              <Link href="/contact" className="text-slate-400 hover:text-white transition-colors">
                Contact &amp; Support
              </Link>
            </div>
          </div>

        </div>

        {/* BOTTOM BAR */}
        <div className="border-t border-slate-900 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-bold text-slate-500">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <p>&copy; {new Date().getFullYear()} BerojgarDegreeWala (SiliconPath). All rights reserved.</p>
            <div className="flex items-center gap-3">
              <Link href="/about" className="hover:text-slate-300 transition-colors">About</Link>
              <span>&bull;</span>
              <Link href="/contact" className="hover:text-slate-300 transition-colors">Contact</Link>
              <span>&bull;</span>
              <Link href="/admin" className="hover:text-slate-300 transition-colors">Admin Login</Link>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-400 text-[11px] font-semibold">
              Live Scrapers &amp; News Sync Active
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
