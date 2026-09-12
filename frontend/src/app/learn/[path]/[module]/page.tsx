"use client";

import React, { useMemo, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Terminal,
  AlertCircle,
  HelpCircle,
  Cpu,
} from "lucide-react";
import { LEARNING_PATHS } from "@/lib/academy/all-paths";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

function getCompletedModules(pathSlug: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(`learn-${pathSlug}-completed`) || "[]");
  } catch {
    return [];
  }
}

function toggleModuleComplete(pathSlug: string, moduleSlug: string): boolean {
  const key = `learn-${pathSlug}-completed`;
  const current = getCompletedModules(pathSlug);
  const exists = current.includes(moduleSlug);
  let updated: string[];
  if (exists) {
    updated = current.filter((s) => s !== moduleSlug);
  } else {
    updated = [...current, moduleSlug];
  }
  localStorage.setItem(key, JSON.stringify(updated));
  return !exists;
}

export default function ModulePage() {
  const params = useParams();
  const router = useRouter();
  const pathSlug = params.path as string;
  const moduleSlug = params.module as string;

  const path = useMemo(() => LEARNING_PATHS.find((p) => p.slug === pathSlug), [pathSlug]);
  const moduleIndex = useMemo(
    () => (path ? path.modules.findIndex((m) => m.slug === moduleSlug) : -1),
    [path, moduleSlug]
  );
  const mod = useMemo(() => path?.modules[moduleIndex], [path, moduleIndex]);

  const completedModules = useMemo(() => {
    if (typeof window === "undefined") return [] as string[];
    return getCompletedModules(pathSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathSlug, moduleSlug]);

  const isCompleted = completedModules.includes(moduleSlug);

  const handleToggleComplete = useCallback(() => {
    toggleModuleComplete(pathSlug, moduleSlug);
    router.refresh();
  }, [pathSlug, moduleSlug, router]);

  if (!path || !mod || moduleIndex === -1) {
    return (
      <div className="py-20 px-4 max-w-md mx-auto text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Module Not Found</h2>
        <p className="text-slate-600 text-sm">
          No module matches &quot;{moduleSlug}&quot; in path &quot;{pathSlug}&quot;.
        </p>
        <div className="pt-2">
          <Button href={path ? `/learn/${path.slug}` : "/learn"} variant="primary">
            {path ? `Back to ${path.title}` : "Browse All Paths"}
          </Button>
        </div>
      </div>
    );
  }

  const prevModule = moduleIndex > 0 ? path.modules[moduleIndex - 1] : null;
  const nextModule = moduleIndex < path.modules.length - 1 ? path.modules[moduleIndex + 1] : null;

  const totalModules = path.modules.length;
  const completedCount = completedModules.length;
  const progressPercent = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs font-medium text-slate-500 flex-wrap">
        <Link href="/learn" className="hover:text-blue-600 transition-colors">
          Learning Paths
        </Link>
        <span>/</span>
        <Link href={`/learn/${path.slug}`} className="hover:text-blue-600 transition-colors">
          {path.title}
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-semibold truncate max-w-xs">
          Module {moduleIndex + 1}: {mod.title}
        </span>
      </nav>

      {/* Module Header Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge tone="accent">
                Module {moduleIndex + 1} of {totalModules}
              </Badge>
              {isCompleted ? (
                <Badge tone="success">
                  <CheckCircle2 className="w-3 h-3" /> Completed
                </Badge>
              ) : (
                <Badge tone="neutral">In Progress</Badge>
              )}
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {mod.title}
            </h1>

            <p className="text-sm text-slate-600 leading-relaxed">
              {mod.description}
            </p>

            <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
              <span className="flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> {mod.duration} read
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-slate-400" /> {path.title}
              </span>
            </div>
          </div>

          {/* Progress Mini Card */}
          <div className="w-full sm:w-44 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5 shrink-0">
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <span>Path Progress</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 text-center">
              {completedCount}/{totalModules} finished
            </p>
          </div>
        </div>
      </div>

      {/* Lesson Technical Content */}
      <div className="space-y-8">
        {/* Section 1: Concept & Fundamentals */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-display font-bold text-lg">
            <Cpu className="w-5 h-5 text-blue-600" />
            <h2>Technical Concept &amp; Silicon Architecture</h2>
          </div>
          <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
            <p>
              In digital ASIC and FPGA design, <strong>{mod.title}</strong> is a critical engineering milestone within the {path.title} flow. Understanding the physical tradeoffs between timing margin (setup/hold slack), silicon die area, routing congestion, and dynamic/leakage power is fundamental to signing off working silicon.
            </p>
            <p>
              When implementing this stage in standard EDA environments, engineers must balance architectural intent with cell library characterization files (.lib / Liberty models), technology LEF files, and design constraints specified via Synopsys Design Constraints (SDC).
            </p>
          </div>
        </div>

        {/* Section 2: Industry EDA Command & Syntax */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-display font-bold text-lg">
            <Terminal className="w-5 h-5 text-emerald-600" />
            <h2>EDA Tooling &amp; Scripting Reference</h2>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Standard EDA tools (Synopsys PrimeTime/Design Compiler, Cadence Innovus/Tempus, and open-source OpenROAD/OpenLane) expose TCL interfaces for automation. Below is an example command configuration for this design domain:
          </p>

          <div className="bg-[#0B1120] text-slate-300 font-mono text-xs p-4 rounded-xl border border-slate-800 space-y-1.5 overflow-x-auto">
            <p className="text-slate-500"># SiliconPath :: Technical Verification Script</p>
            <p><span className="text-blue-400">set_operating_conditions</span> -analysis_type on_chip_variation</p>
            <p><span className="text-blue-400">set_clock_uncertainty</span> -setup 0.080 [get_clocks core_clk]</p>
            <p><span className="text-blue-400">set_clock_uncertainty</span> -hold 0.040 [get_clocks core_clk]</p>
            <p className="text-slate-500"># Inspect timing slack across critical endpoints:</p>
            <p><span className="text-emerald-400">report_timing</span> -delay_type max -max_paths 5 -nworst 1 \</p>
            <p className="pl-4 text-slate-300">-path_type full_clock_expanded -significant_digits 3</p>
          </div>
        </div>

        {/* Section 3: Signoff Checklist & Common Pitfalls */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-display font-bold text-lg">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <h2>Signoff Verification Checklist</h2>
          </div>
          <ul className="space-y-2.5 text-sm text-slate-600">
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Multi-Corner PVT Validation:</strong> Always ensure constraints are met across all fast-fast (0°C/1.1V) and slow-slow (125°C/0.9V) process corners simultaneously.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Clock Tree Reconvergence (CRPR):</strong> Enable Common Path Pessimism Removal to prevent artificial setup/hold timing violations on shared clock tree branches.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>DRC/LVS Cleanliness:</strong> Prove standard cell placement and signal metal wires do not create antenna ratio violations or design rule checks.
              </span>
            </li>
          </ul>
        </div>

        {/* Section 4: Interview Question Spotlight */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 sm:p-8 space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
            <HelpCircle className="w-4 h-4 text-blue-600" />
            <span>Interview Question on {mod.title}</span>
          </div>
          <p className="text-sm font-medium text-slate-900 leading-relaxed italic">
            &ldquo;In the context of {mod.title.toLowerCase()}, what is the primary cause of hold violations, and why are hold violations considered frequency-independent during silicon testing?&rdquo;
          </p>
          <div className="pt-2">
            <Link
              href="/sta-interview-questions"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
            >
              Search corresponding STA Interview Q&amp;A <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Completion Action */}
      <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200">
        <button
          onClick={handleToggleComplete}
          className={cn(
            "inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold transition-colors shadow-sm w-full sm:w-auto justify-center",
            isCompleted
              ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
              : "bg-emerald-600 hover:bg-emerald-700 text-white"
          )}
        >
          <CheckCircle2 className="w-4 h-4" />
          {isCompleted ? "Mark as Incomplete" : "Mark Module as Complete"}
        </button>

        {/* Prev / Next Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {prevModule ? (
            <Link
              href={`/learn/${path.slug}/${prevModule.slug}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Prev:</span> {prevModule.title.split(":")[0]}
            </Link>
          ) : (
            <div />
          )}

          {nextModule ? (
            <Link
              href={`/learn/${path.slug}/${nextModule.slug}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
            >
              <span className="hidden sm:inline">Next:</span> {nextModule.title.split(":")[0]}
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <Link
              href={`/learn/${path.slug}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-sm"
            >
              Path Complete <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
