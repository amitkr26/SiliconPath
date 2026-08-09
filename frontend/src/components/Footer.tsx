import Link from "next/link";
import { CircuitBoard } from "lucide-react";

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
              India&apos;s premier platform for semiconductor &amp; VLSI engineers: 100% verified research openings, VLSI Courses, professional network, and AI career tools.
            </p>
          </div>

          {/* ECOSYSTEM COLUMN */}
          <div>
            <h4 className="text-xs font-black text-white tracking-widest uppercase mb-4 pb-1 border-b-2 border-blue-600 inline-block">Platform Services</h4>
            <div className="flex flex-col gap-2 font-bold text-xs">
              <Link href="/opportunities" className="text-slate-400 hover:text-blue-400 transition-colors">Jobs &amp; Opportunities</Link>
              <Link href="/academy" className="text-slate-400 hover:text-blue-400 transition-colors">VLSI Courses</Link>
              <Link href="/network" className="text-slate-400 hover:text-blue-400 transition-colors">Professional Network</Link>
              <Link href="/community" className="text-slate-400 hover:text-blue-400 transition-colors">Community Forum</Link>
              <Link href="/signup?role=candidate" className="text-blue-400 hover:underline">Candidate Registration (@username)</Link>
              <Link href="/signup?role=employer" className="text-emerald-400 hover:underline">Employer Registration Portal</Link>
              <Link href="/ask-ai" className="text-slate-400 hover:text-blue-400 transition-colors">Ask AI Assistant</Link>
              <Link href="/resume" className="text-slate-400 hover:text-blue-400 transition-colors">AI Resume Builder</Link>
            </div>
          </div>

          {/* JOB CATEGORIES */}
          <div>
            <h4 className="text-xs font-black text-white tracking-widest uppercase mb-4 pb-1 border-b-2 border-blue-600 inline-block">Job Categories</h4>
            <div className="flex flex-col gap-2 font-bold text-xs">
              <Link href="/opportunities?category=jrf" className="text-slate-400 hover:text-blue-400 transition-colors">Junior Research Fellow (JRF)</Link>
              <Link href="/opportunities?category=srf" className="text-slate-400 hover:text-blue-400 transition-colors">Senior Research Fellow (SRF)</Link>
              <Link href="/opportunities?category=phd" className="text-slate-400 hover:text-blue-400 transition-colors">PhD &amp; Doctoral Admissions</Link>
              <Link href="/opportunities?category=government" className="text-slate-400 hover:text-blue-400 transition-colors">Government Research Jobs</Link>
              <Link href="/opportunities?category=job" className="text-slate-400 hover:text-blue-400 transition-colors">Private VLSI Engineering Jobs</Link>
              <Link href="/opportunities?category=internship" className="text-slate-400 hover:text-blue-400 transition-colors">Internships &amp; Fellowships</Link>
              <Link href="/opportunities?search=DRDO" className="text-slate-400 hover:text-blue-400 transition-colors">DRDO Recruitment</Link>
            </div>
          </div>

          {/* RESOURCES COLUMN */}
          <div>
            <h4 className="text-xs font-black text-white tracking-widest uppercase mb-4 pb-1 border-b-2 border-blue-600 inline-block">Resources &amp; Guides</h4>
            <div className="flex flex-col gap-2 font-bold text-xs">
              <Link href="/organizations" className="text-slate-400 hover:text-blue-400 transition-colors">Organizations Directory</Link>
              <Link href="/resources/jrf-guide" className="text-slate-400 hover:text-blue-400 transition-colors">JRF Complete Guide</Link>
              <Link href="/resources/phd-guide" className="text-slate-400 hover:text-blue-400 transition-colors">PhD Admission Guide</Link>
              <Link href="/resources/vlsi-careers" className="text-slate-400 hover:text-blue-400 transition-colors">VLSI Career Roadmap</Link>
              <Link href="/contact" className="text-slate-400 hover:text-blue-400 transition-colors">Contact Support</Link>
            </div>
          </div>
        </div>

        {/* BOTTOM BAR */}
        <div className="border-t-2 border-slate-900 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold text-slate-500">
          <p>&copy; {new Date().getFullYear()} BerojgarDegreeWala. Built for India&apos;s semiconductor &amp; VLSI engineers.</p>
          <p>Verified openings from DRDO, ISRO, CSIR, IITs &amp; top fabless enterprises.</p>
        </div>
      </div>
    </footer>
  );
}
