import Link from "next/link";
import { CircuitBoard, ArrowRight } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white text-slate-600 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 pb-10 border-b border-slate-100">
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-3">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center">
                <CircuitBoard className="w-4 h-4 text-white stroke-[2]" />
              </div>
              <span className="font-display font-bold text-base tracking-tight text-slate-900">
                Silicon<span className="text-blue-600">Path</span>
              </span>
            </Link>
            <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
              100% free VLSI &amp; semiconductor engineering curriculum. From RTL to GDSII — no paywalls, no login required.
            </p>
            <div className="pt-1 flex items-center gap-3">
              <Link
                href="/learn"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                Start Learning Free <ArrowRight className="w-3 h-3" />
              </Link>
              <span className="text-slate-300">·</span>
              <Link
                href="/sta-interview-questions"
                className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
              >
                128 STA Questions
              </Link>
            </div>
          </div>

          {/* Column 1: Learn */}
          <div>
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">
              Learn
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/learn" className="text-slate-500 hover:text-slate-900 transition-colors">
                  Learning Paths (15)
                </Link>
              </li>
              <li>
                <Link href="/academy" className="text-slate-500 hover:text-slate-900 transition-colors">
                  VLSI Academy Tracks
                </Link>
              </li>
              <li>
                <Link href="/engineering-lab" className="text-slate-500 hover:text-slate-900 transition-colors">
                  Engineering Lab
                </Link>
              </li>
              <li>
                <Link href="/learn/physical-design" className="text-slate-500 hover:text-slate-900 transition-colors">
                  Physical Design Flow
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Practice */}
          <div>
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">
              Practice
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/sta-interview-questions" className="text-slate-500 hover:text-slate-900 transition-colors">
                  STA Interview Q&amp;A
                </Link>
              </li>
              <li>
                <Link href="/learn/interview-qa" className="text-slate-500 hover:text-slate-900 transition-colors">
                  Interview Prep Path
                </Link>
              </li>
              <li>
                <Link href="/courses/openlane-rtl-to-gds" className="text-slate-500 hover:text-slate-900 transition-colors">
                  OpenLane RTL-to-GDS
                </Link>
              </li>
              <li>
                <Link href="/courses/resume-tips" className="text-slate-500 hover:text-slate-900 transition-colors">
                  Resume Guidance
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Platform & Ecosystem */}
          <div>
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">
              About
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/about" className="text-slate-500 hover:text-slate-900 transition-colors">
                  About SiliconPath
                </Link>
              </li>
              <li>
                <a
                  href="https://berojgardegreewala.vercel.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-500 hover:text-slate-900 transition-colors"
                >
                  BerojgarDegreeWala
                </a>
              </li>
              <li>
                <a
                  href="https://electrobridge.vercel.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-500 hover:text-slate-900 transition-colors"
                >
                  ElectroBridge Resume
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>
            &copy; {new Date().getFullYear()} SiliconPath. 100% free and open for semiconductor engineers.
          </p>
          <p className="text-slate-400">
            Built for India&apos;s electronics and semiconductor ecosystem.
          </p>
        </div>
      </div>
    </footer>
  );
}
