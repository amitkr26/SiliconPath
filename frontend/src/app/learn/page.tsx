"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Layers, Zap, BookOpen, Clock, Search } from "lucide-react";
import { LEARNING_PATHS } from "@/lib/academy/all-paths";
import { VIDEO_COURSES } from "@/lib/video-references";
import { Badge } from "@/components/ui/Badge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  {
    key: "foundations" as const,
    label: "Foundations",
    description: "Digital circuits, binary logic, HDL description, and functional verification.",
    icon: Layers,
  },
  {
    key: "backend" as const,
    label: "Backend & Signoff (RTL to GDSII)",
    description: "Physical implementation, clock tree synthesis, routing, STA, and signoff checks.",
    icon: Zap,
  },
  {
    key: "tools-career" as const,
    label: "Tools & Career",
    description: "EDA scripting automation, Linux fundamentals, roadmap planning, and interview prep.",
    icon: BookOpen,
  },
];

const LEVEL_TONE: Record<string, "accent" | "success" | "warning" | "purple" | "neutral"> = {
  Beginner: "accent",
  Intermediate: "success",
  Advanced: "warning",
  "All levels": "neutral",
};

export default function LearnIndex() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const filteredPaths = LEARNING_PATHS.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tools.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = activeCategory === "all" || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-8">
        <div className="max-w-3xl space-y-3">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
            Curriculum Directory
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            15 Structured Learning Paths
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            From digital logic foundations to advanced physical design and timing signoff. 150 self-paced modules, completely free and open.
          </p>
        </div>

        {/* Filter / Search Bar */}
        <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveCategory("all")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap",
                activeCategory === "all"
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              )}
            >
              All Paths ({LEARNING_PATHS.length})
            </button>
            {CATEGORIES.map((c) => {
              const count = LEARNING_PATHS.filter((p) => p.category === c.key).length;
              return (
                <button
                  key={c.key}
                  onClick={() => setActiveCategory(c.key)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap",
                    activeCategory === c.key
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  )}
                >
                  {c.label.split(" ")[0]} ({count})
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search paths or tools..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 placeholder:text-slate-400 shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Path Listings */}
      {CATEGORIES.map((cat) => {
        const pathsInCat = filteredPaths.filter((p) => p.category === cat.key);
        if (pathsInCat.length === 0) return null;

        return (
          <div key={cat.key} className="space-y-6">
            <SectionHeader
              eyebrow={cat.label}
              title={cat.label}
              description={cat.description}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pathsInCat.map((path) => {
                const totalMinutes = path.modules.reduce((acc, m) => {
                  const num = parseInt(m.duration);
                  return acc + (isNaN(num) ? 0 : num);
                }, 0);

                return (
                  <div
                    key={path.slug}
                    className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Badge tone={LEVEL_TONE[path.level] || "neutral"}>{path.level}</Badge>
                        <span className="text-xs text-slate-400 font-medium">
                          {path.moduleCount} modules
                        </span>
                      </div>

                      <h3 className="font-display font-bold text-base text-slate-900 group-hover:text-blue-600 transition-colors mb-2">
                        {path.title}
                      </h3>

                      <p className="text-xs text-slate-500 leading-relaxed mb-4">
                        {path.description}
                      </p>

                      {path.tools.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {path.tools.map((t) => (
                            <span
                              key={t}
                              className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200/60"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> ~{totalMinutes} min
                      </span>
                      <Link
                        href={`/learn/${path.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        Explore Path <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Video Course Library CTA */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="font-display font-bold text-lg text-white">
            NPTEL &amp; YouTube Video Course Library
          </h2>
          <p className="text-xs text-blue-100 leading-relaxed max-w-xl">
            {`${VIDEO_COURSES.length} curated free video courses from NPTEL IITs and Neso Academy / VLSI Academy playlists, mapped to these learning paths.`}
          </p>
        </div>
        <Link
          href="/learn/video-courses"
          className="inline-flex items-center gap-1.5 bg-white text-blue-700 font-semibold px-4 py-2 rounded-lg text-sm shadow-sm hover:bg-blue-50 transition-colors shrink-0 w-fit"
        >
          Browse Video Courses <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {filteredPaths.length === 0 && (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-xl p-8 space-y-3">
          <p className="text-sm font-semibold text-slate-900">No matching learning paths</p>
          <p className="text-xs text-slate-500">
            No paths matched &quot;{searchQuery}&quot;. Try searching for &quot;Verilog&quot;, &quot;STA&quot;, or &quot;TCL&quot;.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setActiveCategory("all");
            }}
            className="text-xs font-semibold text-blue-600 hover:underline"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
