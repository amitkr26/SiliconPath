"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Menu,
  X,
  ChevronDown,
  CircuitBoard,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileCode2,
  Terminal,
  Compass,
  FileText,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Nav Data with User Mental Models                                   */
/* ------------------------------------------------------------------ */

interface NavItem {
  label: string;
  description: string;
  href: string;
  icon: React.ElementType;
}

interface QuickLink {
  label: string;
  href: string;
}

const learnMainSurfaces: NavItem[] = [
  {
    label: "Learning Paths",
    description: "15 structured paths from Digital Logic to Physical Verification",
    href: "/learn",
    icon: Layers,
  },
  {
    label: "VLSI Academy",
    description: "7 self-paced tracks with verified video lectures & quizzes",
    href: "/academy",
    icon: BookOpen,
  },
  {
    label: "Engineering Lab",
    description: "Diagnose real setup, hold, congestion & skew violations",
    href: "/engineering-lab",
    icon: Terminal,
  },
];

const learnHighlights: QuickLink[] = [
  { label: "Digital Electronics", href: "/learn/digital-electronics" },
  { label: "Verilog HDL", href: "/learn/verilog" },
  { label: "Design Verification", href: "/learn/design-verification" },
  { label: "ASIC Physical Design", href: "/learn/physical-design" },
  { label: "Static Timing Analysis (STA)", href: "/learn/static-timing-analysis" },
  { label: "Physical Verification (DRC/LVS)", href: "/learn/physical-verification" },
];

const practiceDropdown = [
  {
    label: "128 STA Interview Questions",
    description: "Categorized questions with expandable detailed solutions",
    href: "/sta-interview-questions",
    icon: CheckCircle2,
  },
  {
    label: "Interview Preparation Path",
    description: "Synthesis, PD & STA role preparation questions",
    href: "/learn/interview-qa",
    icon: Compass,
  },
  {
    label: "Debugging Signoff Labs",
    description: "Analyze real EDA report excerpts and timing slack",
    href: "/engineering-lab",
    icon: Terminal,
  },
];

const resourcesDropdown = [
  {
    label: "Free Resources Hub",
    description: "Curated open-source guides, tool setups and roadmaps",
    href: "/courses",
    icon: BookOpen,
  },
  {
    label: "OpenLane RTL-to-GDSII Guide",
    description: "Step-by-step complete tapeout flow with Sky130 PDK",
    href: "/courses/openlane-rtl-to-gds",
    icon: FileCode2,
  },
  {
    label: "VLSI Career Roadmap",
    description: "8-week structured study roadmap for aspiring engineers",
    href: "/learn/career-roadmap",
    icon: Compass,
  },
  {
    label: "Semiconductor Resume Guide",
    description: "Resume templates & ATS keywords for silicon roles",
    href: "/courses/resume-tips",
    icon: FileText,
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<"learn" | "practice" | "resources" | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMenuOpen(false);
    setOpenDropdown(null);
  }, [pathname]);

  const toggleDropdown = (key: "learn" | "practice" | "resources") => {
    setOpenDropdown((prev) => (prev === key ? null : key));
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200/90 shadow-sm" ref={navRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center transition-transform group-hover:scale-105">
            <CircuitBoard className="w-4.5 h-4.5 text-white stroke-[2]" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
            Silicon<span className="text-blue-600">Path</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {/* Learn Dropdown */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown("learn")}
              className={cn(
                "flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                openDropdown === "learn"
                  ? "bg-slate-100 text-blue-600"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              Learn
              <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-150", openDropdown === "learn" && "rotate-180")} />
            </button>

            {openDropdown === "learn" && (
              <div className="absolute top-full left-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg p-5 grid grid-cols-2 gap-6 min-w-[580px] z-50">
                {/* Column 1: Main surfaces */}
                <div>
                  <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Curriculum &amp; Paths
                  </h4>
                  <div className="space-y-2">
                    {learnMainSurfaces.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                              {item.label}
                            </p>
                            <p className="text-xs text-slate-500 leading-tight mt-0.5">
                              {item.description}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* Column 2: Highlights */}
                <div className="border-l border-slate-100 pl-6">
                  <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Flow Highlights
                  </h4>
                  <div className="space-y-1.5">
                    {learnHighlights.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-50 px-2.5 py-1.5 rounded-md transition-colors"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <Link
                      href="/learn"
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                    >
                      View all 15 paths <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Practice Dropdown */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown("practice")}
              className={cn(
                "flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                openDropdown === "practice"
                  ? "bg-slate-100 text-blue-600"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              Practice
              <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-150", openDropdown === "practice" && "rotate-180")} />
            </button>

            {openDropdown === "practice" && (
              <div className="absolute top-full left-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg p-4 w-[340px] z-50 space-y-1">
                {practiceDropdown.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors group"
                    >
                      <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {item.label}
                        </p>
                        <p className="text-xs text-slate-500 leading-tight mt-0.5">
                          {item.description}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Resources Dropdown */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown("resources")}
              className={cn(
                "flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                openDropdown === "resources"
                  ? "bg-slate-100 text-blue-600"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              Guides &amp; Resources
              <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-150", openDropdown === "resources" && "rotate-180")} />
            </button>

            {openDropdown === "resources" && (
              <div className="absolute top-full left-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg p-4 w-[360px] z-50 space-y-1">
                {resourcesDropdown.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors group"
                    >
                      <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {item.label}
                        </p>
                        <p className="text-xs text-slate-500 leading-tight mt-0.5">
                          {item.description}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* About */}
          <Link
            href="/about"
            className={cn(
              "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              pathname === "/about"
                ? "text-blue-600 bg-blue-50"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            About
          </Link>
        </nav>

        {/* Desktop CTA */}
        <div className="hidden lg:flex items-center">
          <Link
            href="/learn"
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm shadow-sm"
          >
            Start Learning Free <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-5 space-y-4 max-h-[85vh] overflow-y-auto">
          {/* Learn section */}
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1.5">
              Learn
            </p>
            <div className="space-y-1">
              <Link
                href="/learn"
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Learning Paths (15 Paths)
              </Link>
              <Link
                href="/academy"
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                VLSI Academy (7 Tracks)
              </Link>
              <Link
                href="/engineering-lab"
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Engineering Lab
              </Link>
            </div>
          </div>

          {/* Practice section */}
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1.5">
              Practice
            </p>
            <div className="space-y-1">
              <Link
                href="/sta-interview-questions"
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                128 STA Interview Questions
              </Link>
              <Link
                href="/learn/interview-qa"
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Interview Q&amp;A Path
              </Link>
            </div>
          </div>

          {/* Resources section */}
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1.5">
              Guides &amp; Resources
            </p>
            <div className="space-y-1">
              <Link
                href="/courses"
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                All Free Resources
              </Link>
              <Link
                href="/courses/openlane-rtl-to-gds"
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                OpenLane RTL-to-GDS Guide
              </Link>
              <Link
                href="/learn/career-roadmap"
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                VLSI Career Roadmap
              </Link>
              <Link
                href="/courses/resume-tips"
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Resume Tips
              </Link>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3">
            <Link
              href="/about"
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              About SiliconPath
            </Link>
          </div>

          <div className="pt-2">
            <Link
              href="/learn"
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-lg transition-colors text-sm w-full shadow-sm"
            >
              Start Learning Free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
