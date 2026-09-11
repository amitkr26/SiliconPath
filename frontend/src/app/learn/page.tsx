"use client";

import React from "react";
import { BookOpen, Zap, Layers, ArrowRight } from "lucide-react";
import { LEARNING_PATHS } from "@/lib/academy/all-paths";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { key: "foundations" as const, label: "Foundations", description: "Master the fundamentals of digital design and verification.", icon: Layers },
  { key: "backend" as const, label: "Backend (RTL to GDSII)", description: "From synthesis to tapeout — physical implementation of digital chips.", icon: Zap },
  { key: "tools-career" as const, label: "Tools & Career", description: "Scripting, Linux, interview prep, and career guidance.", icon: BookOpen },
];

const LEVEL_TONE: Record<string, "accent" | "success" | "warning" | "purple" | "neutral"> = {
  "Beginner": "accent",
  "Intermediate": "success",
  "Advanced": "warning",
  "All levels": "purple",
};

export default function LearnIndex() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">

        {/* HERO */}
        <Card tone="accent" className="p-8 sm:p-12 shadow-brutal-lg relative overflow-hidden">
          <div className="max-w-3xl space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white text-slate-900 text-xs font-black border-2 border-slate-900 shadow-brutal-sm">
              <Layers className="w-4 h-4 text-blue-600 stroke-[2.5]" />
              <span>SELF-PACED VLSI LEARNING PATHS</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Learning Paths
            </h1>
            <p className="text-blue-50 text-sm sm:text-base font-medium leading-relaxed">
              {LEARNING_PATHS.length} structured paths across digital design, verification, physical design, EDA tools, and career preparation. Pick a path or follow the sequence from foundations to advanced.
            </p>
          </div>
        </Card>

        {/* PATHS BY CATEGORY */}
        {CATEGORIES.map((cat) => {
          const paths = LEARNING_PATHS.filter((p) => p.category === cat.key);
          const Icon = cat.icon;
          return (
            <div key={cat.key}>
              <SectionHeader
                eyebrow={cat.label}
                eyebrowTone={cat.key === "foundations" ? "accent" : cat.key === "backend" ? "success" : "neutral"}
                title={cat.label}
                description={cat.description}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paths.map((path) => {
                  const levelTone = LEVEL_TONE[path.level] || "neutral";
                  return (
                    <Card key={path.slug} hover className="p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <Badge tone={levelTone}>{path.level}</Badge>
                          <Badge tone="neutral">{path.moduleCount} modules</Badge>
                        </div>

                        <h3 className="font-black text-slate-900 text-lg mb-2">{path.title}</h3>
                        <p className="text-slate-600 text-xs leading-relaxed font-medium mb-4">
                          {path.description}
                        </p>

                        {path.tools.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {path.tools.map((t) => (
                              <span key={t} className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t-2 border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500">
                          {path.modules.reduce((acc, m) => {
                            const num = parseInt(m.duration);
                            return acc + (isNaN(num) ? 0 : num);
                          }, 0)} min total
                        </span>
                        <Button
                          href={`/learn/${path.slug}`}
                          size="sm"
                          variant="primary"
                        >
                          Start Path
                          <ArrowRight className="w-3 h-3" />
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
