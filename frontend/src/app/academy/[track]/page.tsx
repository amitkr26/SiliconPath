// src/app/academy/[track]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Play, CheckCircle2, Lock,
  BookOpen, AlertCircle, Trophy, Award
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { api } from "@/lib/api-client";
import { LearningTrack, LearningDay, TrackSlug } from "@/lib/academy/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Toaster, toast } from "sonner";

export default function TrackOverview() {
  const params = useParams();
  const router = useRouter();
  const trackSlug = params.track as string;
  const { user } = useUser();

  const [track, setTrack] = useState<LearningTrack | null>(null);
  const [days, setDays] = useState<LearningDay[]>([]);
  const [completedDays, setCompletedDays] = useState<string[]>([]);
  const [passedTracks, setPassedTracks] = useState<TrackSlug[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setLoading(false);
      setError("Loading timed out. Please check your connection and refresh.");
    }, 15000);

    async function loadTrackData() {
      try {
        const t = await api.get<LearningTrack>(`/api/academy/tracks/${trackSlug}`);
        if (!t) {
          toast.error("Track not found");
          router.push("/academy");
          return;
        }
        setTrack(t);

        const daysList = await api.get<LearningDay[]>(`/api/academy/tracks/${t.id}/days`);
        setDays(daysList);

        const userId = user?.id || null;
        const [completedList, passedList] = await Promise.all([
          api.get<string[]>("/api/academy/progress/completed-days", { params: { userId: userId || "" } }),
          api.get<TrackSlug[]>("/api/academy/progress/passed-tracks", { params: { userId: userId || "" } })
        ]);
        setCompletedDays(completedList);
        setPassedTracks(passedList);
      } catch (err) {
        console.error("Failed to load track details:", err);
        setError("Something went wrong loading this track. Please refresh.");
      } finally {
        setLoading(false);
        clearTimeout(timeoutId);
      }
    }
    loadTrackData();
    return () => clearTimeout(timeoutId);
  }, [trackSlug, router, user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-slate-900 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-600 text-sm font-medium">Loading curriculum tracks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center px-4">
        <Card className="max-w-md text-center space-y-4 p-8">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-100 border-2 border-slate-900 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Failed to Load Track</h2>
          <p className="text-slate-600 text-sm font-medium">{error}</p>
          <div className="flex justify-center pt-2">
            <Button variant="danger" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!track) return null;

  // Calculate overall track completion
  const totalDays = days.length;
  const completedCount = days.filter(d => completedDays.includes(d.id)).length;
  const progressPercent = totalDays > 0 ? Math.round((completedCount / totalDays) * 100) : 0;
  const isTrackPassed = passedTracks.includes(track.slug);
  const allDaysCompleted = completedCount === totalDays && totalDays > 0;

  return (
    <div className="min-h-screen bg-[#FAF9F6] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Back Link */}
        <Link
          href="/academy"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Academy Dashboard
        </Link>

        {/* Track Title Panel */}
        <Card className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 flex-1">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              {track.title}
            </h1>
            <p className="text-sm md:text-base text-slate-600 font-medium leading-relaxed max-w-xl">
              {track.description}
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 flex-wrap">
              <span className="bg-slate-100 rounded-full px-3 py-1">{days.length} Days</span>
              <span className="bg-slate-100 rounded-full px-3 py-1">{track.estimated_hours} Hours</span>
              {isTrackPassed && (
                <Badge tone="success">
                  <CheckCircle2 className="w-3 h-3" /> Track Passed
                </Badge>
              )}
            </div>
          </div>

          {/* Track Level Progress Card */}
          <div className="w-full md:w-48 bg-slate-50 border-2 border-slate-900 rounded-2xl p-4 space-y-3 shadow-brutal-sm">
            <div className="flex justify-between text-xs font-black text-slate-700">
              <span>Progress</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%`, backgroundColor: track.color }}
              ></div>
            </div>
            <p className="text-xs text-slate-500 text-center font-medium">
              {completedCount} of {totalDays} days finished
            </p>
          </div>
        </Card>

        {/* Days List */}
        <div className="space-y-4">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Curriculum Path & Day-wise Outline
          </h2>

          <div className="grid grid-cols-1 gap-4">
            {days.map((day, index) => {
              const isCompleted = completedDays.includes(day.id);

              // Gating Logic: Unlocked if it is Day 1 OR the prior day is completed
              let isDayUnlocked = index === 0;
              if (index > 0) {
                const prevDay = days[index - 1];
                isDayUnlocked = completedDays.includes(prevDay.id);
              }

              return (
                <Card
                  key={day.id}
                  hover={isDayUnlocked}
                  className={cn(
                    "p-5 transition-colors duration-300",
                    isDayUnlocked
                      ? isCompleted
                        ? "bg-emerald-50 border-emerald-600"
                        : "bg-white"
                      : "bg-slate-100 opacity-60"
                  )}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Day details */}
                    <div className="flex items-start gap-4 min-w-0">
                      <div
                        className={cn(
                          "w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center font-black text-lg border-2 border-slate-900 shadow-brutal-sm",
                          isDayUnlocked
                            ? isCompleted
                              ? "bg-emerald-500 text-white"
                              : "bg-white"
                            : "bg-slate-200 text-slate-500 border-slate-300 shadow-none"
                        )}
                        style={isDayUnlocked && !isCompleted ? { backgroundColor: track.color, color: "#fff" } : {}}
                      >
                        {day.day_number}
                      </div>

                      <div className="space-y-1.5 min-w-0">
                        <h4 className={cn("text-base font-bold truncate", isDayUnlocked ? "text-slate-900" : "text-slate-500")}>
                          {day.title}
                        </h4>

                        {/* Key Concepts Tags */}
                        {day.key_concepts && day.key_concepts.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {day.key_concepts.slice(0, 3).map((concept, cIdx) => (
                              <span key={cIdx} className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                                {concept}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action buttons or Locked states */}
                    <div className="flex items-center gap-3 sm:self-center">
                      <span className="text-xs text-slate-500 font-medium">
                        {day.estimated_minutes} mins
                      </span>

                      {isDayUnlocked ? (
                        isCompleted ? (
                          <Button
                            variant="success"
                            size="sm"
                            href={`/academy/${track.slug}/day/${day.day_number}`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Completed
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            href={`/academy/${track.slug}/day/${day.day_number}`}
                          >
                            <Play className="w-3 h-3 fill-current" />
                            Start Day
                          </Button>
                        )
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-400 bg-slate-200 border-2 border-slate-300">
                          <Lock className="w-3.5 h-3.5" />
                          Locked
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* End of Track Gating Assessment CTA */}
        {allDaysCompleted && (
          <Card className="p-6 bg-emerald-50 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 flex-1">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-emerald-600" />
                Track Assessment Unlocked!
              </h3>
              <p className="text-sm text-slate-600 font-medium leading-relaxed max-w-xl">
                Congratulations on completing all daily lessons in this track! To pass this track and permanently unlock the next stage, you must score 70% or higher on the comprehensive gating assessment.
              </p>
            </div>

            <Button
              variant="success"
              size="lg"
              href={`/academy/${track.slug}/assessment`}
              className="flex-shrink-0"
            >
              Start Gating Assessment
              <Award className="w-4 h-4" />
            </Button>
          </Card>
        )}
      </div>
      <Toaster position="bottom-right" theme="light" />
    </div>
  );
}