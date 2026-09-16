"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Play,
  CheckCircle2,
  Clock,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { LEARNING_PATHS } from "@/lib/academy/all-paths";
import { videoCoursesForPath } from "@/lib/video-references";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const LEVEL_TONE: Record<string, "accent" | "success" | "warning" | "purple" | "neutral"> = {
  Beginner: "accent",
  Intermediate: "success",
  Advanced: "warning",
  "All levels": "neutral",
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
      <div className="py-20 px-4 max-w-md mx-auto text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Path Not Found</h2>
        <p className="text-slate-600 text-sm">No learning path matches &quot;{pathSlug}&quot;.</p>
        <div className="pt-2">
          <Button href="/learn" variant="primary">Browse All Learning Paths</Button>
        </div>
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
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
      {/* Back Link */}
      <Link
        href="/learn"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Learning Paths
      </Link>

      {/* Path Header Panel */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge tone={LEVEL_TONE[path.level] || "neutral"}>{path.level}</Badge>
              {progressPercent === 100 && (
                <Badge tone="success">
                  <CheckCircle2 className="w-3 h-3" /> Path Completed
                </Badge>
              )}
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {path.title}
            </h1>

            <p className="text-sm text-slate-600 leading-relaxed">
              {path.description}
            </p>

            <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap pt-1">
              <span className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-md font-medium text-slate-700">
                <BookOpen className="w-3.5 h-3.5 text-slate-500" /> {totalModules} modules
              </span>
              <span className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-md font-medium text-slate-700">
                <Clock className="w-3.5 h-3.5 text-slate-500" /> ~{totalMinutes} min total
              </span>
              {path.tools.map((t) => (
                <span
                  key={t}
                  className="font-mono text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200/60"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Progress Box */}
          <div className="w-full sm:w-44 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5 shrink-0">
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <span>Your Progress</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 text-center">
              {completedCount} of {totalModules} completed
            </p>
          </div>
        </div>
      </div>

      {/* Modules Syllabus */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">
              Curriculum Syllabus
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              All modules are open and public. Jump directly into what you need or follow in sequence.
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 shadow-sm overflow-hidden">
          {path.modules.map((mod, index) => {
            const isCompleted = completedModules.includes(mod.slug);

            return (
              <Link
                key={mod.slug}
                href={`/learn/${path.slug}/${mod.slug}`}
                className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50 transition-colors group"
              >
                <div className="flex items-start gap-3 min-w-0 pr-4">
                  <span
                    className={cn(
                      "w-6 h-6 rounded-md flex items-center justify-center text-xs font-mono font-medium shrink-0 mt-0.5",
                      isCompleted
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600"
                    )}
                  >
                    {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : index + 1}
                  </span>

                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                      {mod.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                      {mod.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                    {mod.duration}
                  </span>
                  <div className="w-7 h-7 rounded-md bg-slate-50 border border-slate-200 group-hover:border-blue-300 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center text-slate-400 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    {/* Companion Video Courses */}
      {videoCoursesForPath(path.slug).length > 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">
              Companion Video Courses
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Free NPTEL university lectures and full YouTube playlists that deepen this path.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {videoCoursesForPath(path.slug).map((course) => (
              <a
                key={`${course.source}-${course.id}`}
                href={course.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Badge tone={course.source === "nptel" ? "accent" : "success"}>
                        {course.source === "nptel" ? "NPTEL" : "YouTube"}
                      </Badge>
                      {course.companion && <Badge tone="neutral">Companion</Badge>}
                    </div>
                    <h3 className="font-display font-semibold text-sm text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                      {course.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {course.instructor} · {course.institute}
                    </p>
                  </div>
                  <Play className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0 mt-1" />
                </div>
                <span className="text-[10px] font-semibold text-blue-600 group-hover:text-blue-700 inline-flex items-center gap-1">
                  Watch free <ChevronRight className="w-3 h-3" />
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
