"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft, Play, CheckCircle2, BookOpen, Clock, ChevronRight
} from "lucide-react";
import { LEARNING_PATHS } from "@/lib/academy/all-paths";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { cn } from "@/lib/utils";

const LEVEL_TONE: Record<string, "accent" | "success" | "warning" | "purple" | "neutral"> = {
  "Beginner": "accent",
  "Intermediate": "success",
  "Advanced": "warning",
  "All levels": "purple",
};

function getCompletedModules(pathSlug: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(`learn-${pathSlug}-completed`) || "[]");
  } catch {
    return [];
  }
}

export default function LearningPathPage() {
  const params = useParams();
  const pathSlug = params.path as string;

  const path = useMemo(() => LEARNING_PATHS.find((p) => p.slug === pathSlug), [pathSlug]);

  const completedModules = useMemo(() => {
    if (typeof window === "undefined") return [] as string[];
    return getCompletedModules(pathSlug);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathSlug]);

  if (!path) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center px-4">
        <Card className="max-w-md text-center space-y-4 p-8">
          <h2 className="text-xl font-black text-slate-900">Path Not Found</h2>
          <p className="text-slate-600 text-sm font-medium">No learning path matches &quot;{pathSlug}&quot;.</p>
          <div className="flex justify-center pt-2">
            <Button href="/learn" variant="primary">Browse Learning Paths</Button>
          </div>
        </Card>
      </div>
    );
  }

  const totalModules = path.modules.length;
  const completedCount = completedModules.length;
  const progressPercent = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;
  const totalMinutes = path.modules.reduce((acc, m) => {
    const num = parseInt(m.duration);
    return acc + (isNaN(num) ? 0 : num);
  }, 0);

  return (
    <div className="min-h-screen bg-[#FAF9F6] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Back Link */}
        <Link
          href="/learn"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Learning Paths
        </Link>

        {/* Path Title Panel */}
        <Card className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge tone={LEVEL_TONE[path.level] || "neutral"}>{path.level}</Badge>
              {progressPercent === 100 && (
                <Badge tone="success">
                  <CheckCircle2 className="w-3 h-3" /> Completed
                </Badge>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              {path.title}
            </h1>
            <p className="text-sm md:text-base text-slate-600 font-medium leading-relaxed max-w-xl">
              {path.description}
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 flex-wrap">
              <span className="bg-slate-100 rounded-full px-3 py-1 flex items-center gap-1">
                <BookOpen className="w-3 h-3" /> {totalModules} modules
              </span>
              <span className="bg-slate-100 rounded-full px-3 py-1 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {totalMinutes} min
              </span>
              {path.tools.length > 0 && path.tools.map((t) => (
                <span key={t} className="bg-slate-100 rounded-full px-3 py-1">{t}</span>
              ))}
            </div>
          </div>

          {/* Progress Card */}
          <div className="w-full md:w-48 bg-slate-50 border-2 border-slate-900 rounded-2xl p-4 space-y-3 shadow-brutal-sm">
            <div className="flex justify-between text-xs font-black text-slate-700">
              <span>Progress</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 text-center font-medium">
              {completedCount} of {totalModules} finished
            </p>
          </div>
        </Card>

        {/* Modules List */}
        <div className="space-y-4">
          <SectionHeader
            eyebrow="Curriculum"
            title="Modules"
            description={`Work through all ${totalModules} modules to complete this path.`}
          />

          <div className="grid grid-cols-1 gap-4">
            {path.modules.map((mod, index) => {
              const isCompleted = completedModules.includes(mod.slug);
              let isUnlocked = index === 0;
              if (index > 0) {
                isUnlocked = completedModules.includes(path.modules[index - 1].slug);
              }

              return (
                <Link
                  key={mod.slug}
                  href={isUnlocked ? `/learn/${path.slug}/${mod.slug}` : "#"}
                  className={cn(
                    "block group",
                    !isUnlocked && "pointer-events-none"
                  )}
                >
                  <Card
                    hover={isUnlocked}
                    className={cn(
                      "p-5 transition-colors duration-300",
                      isUnlocked
                        ? isCompleted
                          ? "bg-emerald-50 border-emerald-600"
                          : "bg-white"
                        : "bg-slate-100 opacity-60"
                    )}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4 min-w-0">
                        <div
                          className={cn(
                            "w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center font-black text-lg border-2 border-slate-900 shadow-brutal-sm",
                            isUnlocked
                              ? isCompleted
                                ? "bg-emerald-500 text-white"
                                : "bg-blue-600 text-white"
                              : "bg-slate-200 text-slate-500 border-slate-300 shadow-none"
                          )}
                        >
                          {index + 1}
                        </div>

                        <div className="space-y-1.5 min-w-0">
                          <h4 className={cn("text-base font-bold", isUnlocked ? "text-slate-900" : "text-slate-500")}>
                            {mod.title}
                          </h4>
                          <p className="text-xs text-slate-500 font-medium line-clamp-2">{mod.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 sm:self-center shrink-0">
                        <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {mod.duration}
                        </span>

                        {isUnlocked ? (
                          isCompleted ? (
                            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-100 border-2 border-emerald-600">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Done
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 border-2 border-slate-900 shadow-brutal-sm group-hover:bg-blue-700 transition-colors">
                              <Play className="w-3 h-3 fill-current" />
                              Start
                              <ChevronRight className="w-3 h-3" />
                            </span>
                          )
                        ) : (
                          <span className="text-xs font-bold text-slate-400">
                            {index > 0 ? "Complete previous" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        {completedCount === 0 && (
          <div className="text-center">
            <Button
              href={`/learn/${path.slug}/${path.modules[0].slug}`}
              size="lg"
              variant="primary"
            >
              <Play className="w-4 h-4 fill-current" />
              Start Learning
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
