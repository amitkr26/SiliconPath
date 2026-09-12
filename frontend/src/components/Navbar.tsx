"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, X, ChevronDown, CircuitBoard } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Dropdown data                                                      */
/* ------------------------------------------------------------------ */

const learnDropdown = [
  {
    title: "Foundations",
    links: [
      { label: "Digital Electronics", href: "/learn/digital-electronics" },
      { label: "Verilog", href: "/learn/verilog" },
      { label: "Hardware Protocols", href: "/learn/hardware-protocols" },
      { label: "Design Verification", href: "/learn/design-verification" },
      { label: "Clock Domain Crossing", href: "/learn/clock-domain-crossing" },
    ],
  },
  {
    title: "Backend (RTL to GDSII)",
    links: [
      { label: "Synthesis", href: "/learn/synthesis" },
      { label: "Physical Design", href: "/learn/physical-design" },
      { label: "Static Timing Analysis", href: "/learn/static-timing-analysis" },
      { label: "Physical Verification", href: "/learn/physical-verification" },
      { label: "Low Power", href: "/learn/low-power" },
      { label: "Design for Test", href: "/learn/design-for-test" },
    ],
  },
  {
    title: "Tools & Career",
    links: [
      { label: "TCL for EDA", href: "/learn/tcl-for-eda" },
      { label: "Linux for VLSI", href: "/learn/linux-for-vlsi" },
      { label: "Interview Q&A", href: "/learn/interview" },
      { label: "STA Interview Q&A", href: "/sta-interview-questions" },
      { label: "Career Roadmap", href: "/learn/career-roadmap" },
    ],
  },
];

const navLinks = [
  { href: "/academy", label: "Academy" },
  { href: "/engineering-lab", label: "Engineering Lab" },
  { href: "/courses", label: "Resources" },
  { href: "/sta-interview-questions", label: "STA Interview Q&A" },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [learnOpen, setLearnOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setLearnOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <CircuitBoard className="w-4.5 h-4.5 text-white stroke-[2]" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
            Silicon<span className="text-blue-600">Path</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {/* Learn dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setLearnOpen(!learnOpen)}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                learnOpen
                  ? "bg-blue-50 text-blue-600"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              Learn
              <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", learnOpen && "rotate-180")} />
            </button>

            {learnOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg p-4 grid grid-cols-3 gap-6 min-w-[560px]">
                {learnDropdown.map((group) => (
                  <div key={group.title}>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{group.title}</h4>
                    <div className="space-y-1">
                      {group.links.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setLearnOpen(false)}
                          className={cn(
                            "block text-sm px-2 py-1.5 rounded-md transition-colors",
                            isActive(link.href)
                              ? "bg-blue-50 text-blue-600 font-semibold"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          )}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                isActive(href)
                  ? "bg-blue-50 text-blue-600"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Mobile toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="lg:hidden p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="lg:hidden border-t border-slate-100 bg-white px-4 pb-4 pt-2 space-y-1">
          {/* Learn section */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 pt-2 pb-1">Learn</p>
            {learnDropdown.map((group) => (
              <div key={group.title}>
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider px-3 pt-3 pb-1">{group.title}</p>
                {group.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "block px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive(link.href)
                        ? "bg-blue-50 text-blue-600"
                        : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 mt-2 pt-2">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive(href)
                    ? "bg-blue-50 text-blue-600"
                    : "text-slate-600 hover:bg-slate-50"
                )}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
