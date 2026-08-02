import Link from "next/link";
import { CircuitBoard } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-cyan-900/30 text-slate-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* BRAND COLUMN */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-3 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center shadow-md shadow-cyan-500/20">
                <CircuitBoard className="w-4 h-4 text-slate-950" />
              </div>
              <span className="font-bold text-lg tracking-tight text-white group-hover:text-cyan-400 transition-colors">
                Silicon<span className="text-cyan-400">Path</span>
              </span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Aggregated career opportunities for VLSI, semiconductor and hardware engineers, plus a free structured VLSI academy.
            </p>
          </div>

          {/* PLATFORM COLUMN */}
          <div>
            <h4 className="text-sm font-semibold text-white tracking-wide uppercase mb-4">Platform</h4>
            <div className="flex flex-col gap-2.5">
              <Link href="/" className="text-slate-400 hover:text-cyan-400 transition-colors text-sm font-medium">Opportunities</Link>
              <Link href="/categories" className="text-slate-400 hover:text-cyan-400 transition-colors text-sm">Browse Categories</Link>
              <Link href="/companies" className="text-slate-400 hover:text-cyan-400 transition-colors text-sm">Companies</Link>
              <Link href="/search" className="text-slate-400 hover:text-cyan-400 transition-colors text-sm">Search</Link>
            </div>
          </div>

          {/* ACADEMY TRACKS */}
          <div>
            <h4 className="text-sm font-semibold text-white tracking-wide uppercase mb-4">Academy Tracks</h4>
            <div className="flex flex-col gap-2.5">
              <Link href="/academy" className="text-slate-400 hover:text-cyan-400 transition-colors text-sm">Digital Design & RTL</Link>
              <Link href="/academy" className="text-slate-400 hover:text-cyan-400 transition-colors text-sm">Verification (UVM)</Link>
              <Link href="/academy" className="text-slate-400 hover:text-cyan-400 transition-colors text-sm">Physical Design & STA</Link>
              <Link href="/academy" className="text-slate-400 hover:text-cyan-400 transition-colors text-sm">Analog & Mixed-Signal</Link>
            </div>
          </div>

          {/* RESOURCES COLUMN */}
          <div>
            <h4 className="text-sm font-semibold text-white tracking-wide uppercase mb-4">Learn & Help</h4>
            <div className="flex flex-col gap-2.5">
              <Link href="/academy" className="text-slate-400 hover:text-cyan-400 transition-colors text-sm">VLSI Academy</Link>
              <Link href="/about" className="text-slate-400 hover:text-cyan-400 transition-colors text-sm">About SiliconPath</Link>
              <Link href="/contact" className="text-slate-400 hover:text-cyan-400 transition-colors text-sm">Contact Support</Link>
            </div>
          </div>
        </div>

        {/* BOTTOM BAR */}
        <div className="border-t border-slate-800/80 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} SiliconPath. VLSI opportunities & education.</p>
          <p>Built for semiconductor professionals worldwide</p>
        </div>
      </div>
    </footer>
  );
}
