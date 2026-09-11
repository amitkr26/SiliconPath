import Link from "next/link";
import { CircuitBoard, GraduationCap } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-950 border-t-2 border-slate-900 text-slate-300 mt-20 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* BRAND COLUMN */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5 group inline-flex">
              <div className="w-10 h-10 rounded-xl bg-accent border-2 border-white flex items-center justify-center shadow-brutal-sm">
                <CircuitBoard className="w-6 h-6 text-white stroke-[2.5]" />
              </div>
              <span className="font-black text-2xl tracking-tight text-white group-hover:text-blue-400 transition-colors">
                Silicon<span className="text-accent">Path</span>
              </span>
            </Link>
            <p className="text-slate-400 text-xs font-medium leading-relaxed max-w-sm">
              Master VLSI design, verification, and physical design through structured learning tracks. From digital logic to UVM to full OpenLane flows.
            </p>
          </div>

          {/* COLUMN 1: ACADEMY TRACKS */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-black text-white tracking-widest uppercase pb-1 border-b-2 border-blue-500 inline-block">
              Academy Tracks
            </h4>
            <div className="flex flex-col gap-2 font-semibold text-xs">
              <Link href="/academy/digital-logic" className="text-slate-400 hover:text-white transition-colors">
                Digital Logic Fundamentals
              </Link>
              <Link href="/academy/verilog" className="text-slate-400 hover:text-white transition-colors">
                Verilog HDL
              </Link>
              <Link href="/academy/systemverilog" className="text-slate-400 hover:text-white transition-colors">
                SystemVerilog for Verification
              </Link>
              <Link href="/academy/uvm" className="text-slate-400 hover:text-white transition-colors">
                UVM Methodology
              </Link>
              <Link href="/academy/rtl-design" className="text-slate-400 hover:text-white transition-colors">
                RTL Design &amp; Synthesis
              </Link>
              <Link href="/academy/physical-design" className="text-slate-400 hover:text-white transition-colors">
                Physical Design &amp; Backend
              </Link>
              <Link href="/academy/interview-prep" className="text-slate-400 hover:text-white transition-colors">
                VLSI Interview Prep
              </Link>
            </div>
          </div>

          {/* COLUMN 2: LINKS */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-black text-white tracking-widest uppercase pb-1 border-b-2 border-blue-500 inline-block">
              Platform
            </h4>
            <div className="flex flex-col gap-2 font-semibold text-xs">
              <Link href="/academy" className="text-slate-400 hover:text-white transition-colors">
                All Tracks
              </Link>
              <Link href="/login" className="text-slate-400 hover:text-white transition-colors">
                Sign In
              </Link>
              <Link href="/signup" className="text-slate-400 hover:text-white transition-colors">
                Create Account
              </Link>
            </div>
          </div>

        </div>

        {/* BOTTOM BAR */}
        <div className="border-t border-slate-900 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-bold text-slate-500">
          <p>&copy; {new Date().getFullYear()} SiliconPath. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-400 text-[11px] font-semibold">
              Academy Active
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
