"use client";

import React, { useMemo, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, ArrowRight, CheckCircle2, Clock, ChevronLeft,
  ChevronRight, BookOpen
} from "lucide-react";
import { LEARNING_PATHS } from "@/lib/academy/all-paths";
import { Card } from "@/components/ui/Card";
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

function markModuleComplete(pathSlug: string, moduleSlug: string): void {
  const key = `learn-${pathSlug}-completed`;
  const current = getCompletedModules(pathSlug);
  if (!current.includes(moduleSlug)) {
    current.push(moduleSlug);
    localStorage.setItem(key, JSON.stringify(current));
  }
}

export default function ModulePage() {
  const params = useParams();
  const router = useRouter();
  const pathSlug = params.path as string;
  const moduleSlug = params.module as string;

  const path = useMemo(() => LEARNING_PATHS.find((p) => p.slug === pathSlug), [pathSlug]);
  const moduleIndex = useMemo(
    () => path ? path.modules.findIndex((m) => m.slug === moduleSlug) : -1,
    [path, moduleSlug]
  );
  const mod = useMemo(() => path?.modules[moduleIndex], [path, moduleIndex]);

  const completedModules = useMemo(() => {
    if (typeof window === "undefined") return [] as string[];
    return getCompletedModules(pathSlug);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathSlug]);

  const isCompleted = completedModules.includes(moduleSlug);

  const handleMarkComplete = useCallback(() => {
    markModuleComplete(pathSlug, moduleSlug);
    // Force re-render by reloading the page state
    router.refresh();
  }, [pathSlug, moduleSlug, router]);

  if (!path || !mod || moduleIndex === -1) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center px-4">
        <Card className="max-w-md text-center space-y-4 p-8">
          <h2 className="text-xl font-black text-slate-900">Module Not Found</h2>
          <p className="text-slate-600 text-sm font-medium">
            No module matches &quot;{moduleSlug}&quot; in path &quot;{pathSlug}&quot;.
          </p>
          <div className="flex justify-center pt-2">
            <Button href={path ? `/learn/${path.slug}` : "/learn"} variant="primary">
              {path ? "Back to Path" : "Browse Paths"}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const prevModule = moduleIndex > 0 ? path.modules[moduleIndex - 1] : null;
  const nextModule = moduleIndex < path.modules.length - 1 ? path.modules[moduleIndex + 1] : null;

  const totalModules = path.modules.length;
  const completedCount = completedModules.length;
  const progressPercent = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#FAF9F6] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm font-bold text-slate-500 flex-wrap">
          <Link href="/learn" className="hover:text-blue-600 transition-colors">Learning Paths</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href={`/learn/${path.slug}`} className="hover:text-blue-600 transition-colors">{path.title}</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900">Module {moduleIndex + 1}</span>
        </div>

        {/* Module Header */}
        <Card className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge tone="accent">Module {moduleIndex + 1} of {totalModules}</Badge>
                {isCompleted && (
                  <Badge tone="success">
                    <CheckCircle2 className="w-3 h-3" /> Completed
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                {mod.title}
              </h1>
              <p className="text-sm text-slate-600 font-medium leading-relaxed max-w-xl">
                {mod.description}
              </p>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                <span className="bg-slate-100 rounded-full px-3 py-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {mod.duration}
                </span>
                <span className="bg-slate-100 rounded-full px-3 py-1 flex items-center gap-1">
                  <BookOpen className="w-3 h-3" /> {path.title}
                </span>
              </div>
            </div>

            {/* Progress mini-card */}
            <div className="w-full md:w-40 bg-slate-50 border-2 border-slate-900 rounded-2xl p-4 space-y-3 shadow-brutal-sm shrink-0">
              <div className="flex justify-between text-xs font-black text-slate-700">
                <span>Path</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500 text-center font-medium">
                {completedCount}/{totalModules} modules
              </p>
            </div>
          </div>
        </Card>

        {/* Module Content Placeholder */}
        <Card className="p-6 md:p-8">
          <div className="space-y-4">
            <h2 className="text-lg font-black text-slate-900">Module Content</h2>
            <div className="min-h-[200px] bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center">
              <p className="text-sm text-slate-400 font-medium">
                Module content for &quot;{mod.title}&quot; will be rendered here.
              </p>
            </div>
          </div>
        </Card>

        {/* Mark Complete Button */}
        {!isCompleted && (
          <div className="flex justify-center">
            <Button variant="success" size="lg" onClick={handleMarkComplete}>
              <CheckCircle2 className="w-4 h-4" />
              Mark as Complete
            </Button>
          </div>
        )}

        {isCompleted && (
          <Card className="p-4 bg-emerald-50 border-emerald-600 text-center">
            <p className="text-sm font-bold text-emerald-700 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              You&apos;ve completed this module!
            </p>
          </Card>
        )}

        {/* Prev / Next Navigation */}
        <div className="flex items-center justify-between gap-4">
          {prevModule ? (
            <Button
              href={`/learn/${path.slug}/${prevModule.slug}`}
              variant="secondary"
              size="md"
            >
              <ChevronLeft className="w-4 h-4" />
              {prevModule.title}
            </Button>
          ) : (
            <div />
          )}

          {nextModule ? (
            <Button
              href={`/learn/${path.slug}/${nextModule.slug}`}
              variant="primary"
              size="md"
            >
              {nextModule.title}
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              href={`/learn/${path.slug}`}
              variant="success"
              size="md"
            >
              Path Complete
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
