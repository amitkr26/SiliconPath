// src/app/academy/[track]/day/[day]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, ChevronLeft, ChevronRight,
  FileText, Play, Check, CheckCircle2, HelpCircle, GraduationCap, ExternalLink
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { api } from "@/lib/api-client";
import { LearningTrack, LearningDay, LearningResource, LearningQuestion } from "@/lib/academy/types";
import { getCompletedDaysLocal, markDayCompleteLocal } from "@/lib/academy/progress-local";
import { YoutubeEmbed } from "@/components/academy/YoutubeEmbed";
import { PracticeQuiz } from "@/components/academy/PracticeQuiz";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Toaster, toast } from "sonner";

export default function DayDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();

  const trackSlug = params.track as string;
  const dayNumberStr = params.day as string;
  const dayNumber = parseInt(dayNumberStr, 10);

  const [track, setTrack] = useState<LearningTrack | null>(null);
  const [day, setDay] = useState<LearningDay | null>(null);
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [questions, setQuestions] = useState<LearningQuestion[]>([]);

  const [completedDays, setCompletedDays] = useState<string[]>([]);
  const [quizCompleted, setQuizCompleted] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setLoading(false);
      setError("Loading timed out. Please check your connection and refresh.");
    }, 15000);

    async function loadDayData() {
      if (isNaN(dayNumber)) return;
      try {
        setLoading(true);
        const data = await api.get<{ track: LearningTrack; day: LearningDay; resources: LearningResource[]; questions: LearningQuestion[] }>(`/api/academy/tracks/${trackSlug}/days/${dayNumber}`);
        if (!data) {
          toast.error("Day details not found");
          router.push(`/academy/${trackSlug}`);
          return;
        }

        setTrack(data.track);
        setDay(data.day);
        setResources(data.resources);
        setQuestions(data.questions);

        const completedList = user?.id
          ? await api.get<string[]>("/api/academy/progress/completed-days", { params: { userId: user.id } }).catch(() => [])
          : getCompletedDaysLocal(trackSlug);
        setCompletedDays(Array.isArray(completedList) ? completedList : []);

        if (data.questions.length === 0) {
          setQuizCompleted(true);
        }
      } catch (err) {
        console.error("Failed to load day details:", err);
        setError("Something went wrong loading this lesson. Please refresh.");
      } finally {
        setLoading(false);
        clearTimeout(timeoutId);
      }
    }
    if (trackSlug && dayNumberStr) {
      loadDayData();
    }
    return () => clearTimeout(timeoutId);
  }, [trackSlug, dayNumberStr, dayNumber, router, user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] text-slate-900 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-600 text-sm font-medium">Opening today&apos;s lessons...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] text-slate-900 flex flex-col items-center justify-center px-4">
        <Card className="max-w-md text-center space-y-4 p-8">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-100 border-2 border-slate-900 flex items-center justify-center">
            <HelpCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Failed to Load Lesson</h2>
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

  if (!track || !day) return null;

  const isCompleted = completedDays.includes(day.id);
  const prevDayNum = dayNumber > 1 ? dayNumber - 1 : null;
  const nextDayNum = dayNumber < track.estimated_days ? dayNumber + 1 : null;

  const handleMarkComplete = async () => {
    if (questions.length > 0 && !quizCompleted && !isCompleted) {
      toast.warning("Please complete the practice questions before marking the day complete.");
      return;
    }

    try {
      setSubmitting(true);
      const userId = user?.id || null;
      let success = false;
      if (userId) {
        success = await api.post<boolean>("/api/academy/progress", {
          userId,
          trackId: track.id,
          dayId: day.id,
          completed: true,
        });

        if (!success) {
          toast.error("Failed to update progress");
          return;
        }
      } else {
        markDayCompleteLocal(trackSlug, day.id);
        success = true;
      }

      if (success) {
        setCompletedDays((prev) => [...prev, day.id]);
        toast.success(`Day ${day.day_number} completed!`);
        setTimeout(() => {
          if (nextDayNum) {
            router.push(`/academy/${track.slug}/day/${nextDayNum}`);
          } else {
            router.push(`/academy/${track.slug}`);
          }
        }, 1500);
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header Breadcrumbs */}
        <Card className="p-6 flex items-center justify-between gap-4 flex-wrap">
          <div className="space-y-1.5">
            <Link
              href={`/academy/${track.slug}`}
              className="inline-flex items-center gap-1.5 text-xs font-black text-blue-600 hover:underline uppercase tracking-wider transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {track.title}
            </Link>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 flex items-center gap-2">
              <span className="text-blue-600 font-black">Day {day.day_number}:</span>
              <span>{day.title}</span>
            </h1>
          </div>

          {/* Top Status */}
          {isCompleted && (
            <Badge tone="success">
              <Check className="w-4 h-4 stroke-[3]" /> Completed
            </Badge>
          )}
        </Card>

        {/* Video Lectures */}
        {resources.length > 0 && (
          <Card className="p-6 space-y-5">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Play className="w-5 h-5 text-blue-600 fill-current" />
              Video Lectures & Tutorials
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {resources
                .filter((r) => r.resource_type === "youtube_video")
                .map((res) => (
                  <YoutubeEmbed
                    key={res.id}
                    videoId={res.youtube_video_id || ""}
                    title={res.title}
                    channelName={res.channel_name}
                    channelUrl={res.channel_url}
                    notes={res.notes}
                    watchFromSeconds={res.watch_from_seconds}
                  />
                ))}
            </div>
          </Card>
        )}

        {/* Theory Summary */}
        {day.theory_summary && (
          <Card className="p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-2 border-b-2 border-slate-900 pb-4">
              <FileText className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-black text-slate-900">Core Theory & Design Manual</h3>
            </div>

            {/* Custom Simple Markdown Renderer */}
            <div className="prose max-w-none text-sm md:text-base text-slate-800 space-y-4 leading-relaxed font-medium">
              {day.theory_summary.split("\n\n").map((block, bIdx) => {
                if (block.startsWith("## ")) {
                  return (
                    <h4 key={bIdx} className="text-lg font-black text-slate-900 mt-6 mb-2 border-l-4 border-blue-600 pl-3">
                      {block.replace("## ", "")}
                    </h4>
                  );
                }
                if (block.startsWith("### ")) {
                  return (
                    <h5 key={bIdx} className="text-base font-bold text-slate-900 mt-4 mb-2">
                      {block.replace("### ", "")}
                    </h5>
                  );
                }
                if (block.startsWith("```")) {
                  const lines = block.split("\n").filter(l => !l.startsWith("```"));
                  return (
                    <pre key={bIdx} className="bg-slate-950 border-2 border-slate-900 rounded-xl p-4 overflow-x-auto font-mono text-xs text-blue-300 shadow-brutal-sm">
                      {lines.join("\n")}
                    </pre>
                  );
                }
                if (block.startsWith("|")) {
                  const rows = block.split("\n").filter(r => r.trim().length > 0);
                  return (
                    <div key={bIdx} className="overflow-x-auto my-4 border-2 border-slate-900 rounded-xl shadow-brutal-sm">
                      <table className="min-w-full divide-y-2 divide-slate-900 text-xs font-bold">
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {rows.map((row, rIdx) => {
                            const cells = row.split("|").filter((c, cIdx) => cIdx > 0 && cIdx < row.split("|").length - 1);
                            if (row.includes("---")) return null;
                            return (
                              <tr key={rIdx} className={rIdx === 0 ? "bg-blue-600 text-white font-extrabold" : "text-slate-800"}>
                                {cells.map((cell, cIdx) => (
                                  <td key={cIdx} className="px-4 py-2.5 whitespace-nowrap text-left border-r border-slate-200 last:border-r-0">
                                    {cell.trim()}
                                  </td>
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                }
                if (block.startsWith("- ")) {
                  const items = block.split("\n").map(i => i.replace("- ", ""));
                  return (
                    <ul key={bIdx} className="list-disc list-inside space-y-1.5 pl-2 text-slate-800 font-semibold">
                      {items.map((it, itIdx) => (
                        <li key={itIdx}>{it}</li>
                      ))}
                    </ul>
                  );
                }
                return (
                  <p key={bIdx} className="text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
                    {block}
                  </p>
                );
              })}
            </div>
          </Card>
        )}

        {/* Practice Links (HDLBits, EDA Playground, etc.) */}
        {day.practice_links && day.practice_links.length > 0 && (
          <div className="p-6 bg-blue-50 border-2 border-slate-900 rounded-2xl shadow-brutal flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1 flex-1">
              <h4 className="text-sm font-black text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                <GraduationCap className="w-5 h-5 text-blue-600" />
                Hands-on Practice Tools & Interactive Simulators
              </h4>
              <p className="text-xs text-slate-700 font-medium">
                Put theory into practice by solving Verilog/SystemVerilog exercises and synthesizing design blocks.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {day.practice_links.map((link, lIdx) => (
                <a
                  key={lIdx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-xs font-black border-2 border-slate-900 shadow-brutal-sm hover:bg-blue-700 hover:shadow-brutal transition-all"
                >
                  <span>{link.label}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Practice Quiz */}
        {questions.length > 0 && (
          <Card className="p-6 md:p-8">
            <PracticeQuiz
              questions={questions}
              onQuizCompleted={() => setQuizCompleted(true)}
            />
          </Card>
        )}

        {/* Daily Completion Actions / Next Navigation Panel */}
        <Card className="p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Day switching links */}
          <div className="flex items-center gap-4">
            {prevDayNum ? (
              <Link
                href={`/academy/${track.slug}/day/${prevDayNum}`}
                className="p-3 bg-white border-2 border-slate-900 rounded-xl hover:bg-blue-50 transition-all text-slate-900 font-bold shadow-brutal-sm"
                title={`Back to Day ${prevDayNum}`}
              >
                <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
              </Link>
            ) : (
              <div className="p-3 bg-slate-100 border-2 border-slate-300 opacity-40 rounded-xl cursor-not-allowed">
                <ChevronLeft className="w-5 h-5" />
              </div>
            )}

            <div className="text-center sm:text-left">
              <span className="text-xs font-black text-blue-600 uppercase tracking-wider">
                Roadmap Progress
              </span>
              <p className="text-sm font-black text-slate-900">
                Day {day.day_number} of {track.estimated_days}
              </p>
            </div>

            {nextDayNum ? (
              <Link
                href={`/academy/${track.slug}/day/${nextDayNum}`}
                className="p-3 bg-white border-2 border-slate-900 rounded-xl hover:bg-blue-50 transition-all text-slate-900 font-bold shadow-brutal-sm"
                title={`Go to Day ${nextDayNum}`}
              >
                <ChevronRight className="w-5 h-5 stroke-[2.5]" />
              </Link>
            ) : (
              <div className="p-3 bg-slate-100 border-2 border-slate-300 opacity-40 rounded-xl cursor-not-allowed">
                <ChevronRight className="w-5 h-5" />
              </div>
            )}
          </div>

          {/* Mark Complete Action Trigger */}
          <div className="w-full sm:w-auto">
            {isCompleted ? (
              <Badge tone="success" className="px-6 py-3 text-sm gap-1.5">
                <Check className="w-4 h-4 stroke-[3]" />
                Completed & Unlocked
              </Badge>
            ) : (
              <Button
                onClick={handleMarkComplete}
                disabled={submitting}
                className="w-full sm:w-auto"
              >
                {submitting ? "Saving Progress..." : "Mark Day Complete"}
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              </Button>
            )}
          </div>
        </Card>
      </div>
      <Toaster position="bottom-right" theme="light" />
    </div>
  );
}