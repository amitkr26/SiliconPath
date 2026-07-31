// src/app/academy/[track]/day/[day]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, 
  Cpu, FileText, Play, Check, HelpCircle, GraduationCap, ExternalLink 
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { api } from "@/lib/api-client";
import { LearningTrack, LearningDay, LearningResource, LearningQuestion } from "@/lib/academy/types";
import { YoutubeEmbed } from "@/components/academy/YoutubeEmbed";
import { PracticeQuiz } from "@/components/academy/PracticeQuiz";
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

        const completedList = await api.get<string[]>("/api/academy/progress/completed-days", { params: { userId: user?.id || "" } });
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
        <p className="mt-4 text-slate-600 text-sm font-semibold">Opening today&apos;s lessons...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] text-slate-900 flex flex-col items-center justify-center px-4">
        <div className="max-w-md text-center space-y-4 bg-white p-8 border-3 border-slate-900 rounded-2xl shadow-[6px_6px_0px_0px_#0F172A]">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-100 border-2 border-slate-900 flex items-center justify-center">
            <HelpCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Failed to Load Lesson</h2>
          <p className="text-slate-600 text-sm font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-sm border-2 border-slate-900 shadow-[3px_3px_0px_0px_#0F172A] hover:bg-blue-700 transition-all"
          >
            Retry
          </button>
        </div>
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
      const success = await api.post<boolean>("/api/academy/progress", {
        userId,
        trackId: track.id,
        dayId: day.id,
        completed: true,
      });
      
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
      } else {
        toast.error("Failed to update progress");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-900 py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="max-w-4xl mx-auto relative z-10 space-y-8">
        
        {/* Header Breadcrumbs */}
        <div className="flex items-center justify-between gap-4 flex-wrap bg-white p-6 rounded-2xl border-3 border-slate-900 shadow-[6px_6px_0px_0px_#0F172A]">
          <div className="space-y-1.5">
            <Link 
              href={`/academy/${track.slug}`}
              className="inline-flex items-center gap-1.5 text-xs font-extrabold text-blue-600 hover:underline uppercase tracking-wider transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {track.title}
            </Link>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 flex items-center gap-2">
              <span className="text-blue-600 font-bold">Day {day.day_number}:</span>
              <span>{day.title}</span>
            </h1>
          </div>

          {/* Top Status */}
          {isCompleted && (
            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-900 border-2 border-slate-900 px-3 py-1 rounded-xl text-xs font-extrabold shadow-[2px_2px_0px_0px_#0F172A]">
              <Check className="w-4 h-4 text-emerald-700 stroke-[3]" /> Completed
            </span>
          )}
        </div>

        {/* Video Lectures */}
        {resources.length > 0 && (
          <div className="space-y-5 bg-white p-6 rounded-2xl border-3 border-slate-900 shadow-[6px_6px_0px_0px_#0F172A]">
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
          </div>
        )}

        {/* Theory Summary */}
        {day.theory_summary && (
          <div className="p-6 md:p-8 bg-white border-3 border-slate-900 rounded-2xl shadow-[6px_6px_0px_0px_#0F172A] space-y-6">
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
                    <pre key={bIdx} className="bg-slate-950 border-2 border-slate-900 rounded-xl p-4 overflow-x-auto font-mono text-xs text-blue-300 shadow-[3px_3px_0px_0px_#0F172A]">
                      {lines.join("\n")}
                    </pre>
                  );
                }
                if (block.startsWith("|")) {
                  const rows = block.split("\n").filter(r => r.trim().length > 0);
                  return (
                    <div key={bIdx} className="overflow-x-auto my-4 border-2 border-slate-900 rounded-xl shadow-[3px_3px_0px_0px_#0F172A]">
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
          </div>
        )}

        {/* Practice Links (HDLBits, EDA Playground, etc.) */}
        {day.practice_links && day.practice_links.length > 0 && (
          <div className="p-6 bg-blue-50 border-3 border-slate-900 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[6px_6px_0px_0px_#0F172A]">
            <div className="space-y-1 flex-1">
              <h4 className="text-sm font-black text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                <GraduationCap className="w-5 h-5 text-blue-600" />
                Hands-on Practice Tools & Interactive Simulators
              </h4>
              <p className="text-xs text-slate-700 font-semibold">
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
                  className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-xs font-black border-2 border-slate-900 shadow-[3px_3px_0px_0px_#0F172A] hover:bg-blue-700 transition-all"
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
          <div className="p-6 md:p-8 bg-white border-3 border-slate-900 rounded-2xl shadow-[6px_6px_0px_0px_#0F172A]">
            <PracticeQuiz 
              questions={questions} 
              onQuizCompleted={() => setQuizCompleted(true)} 
            />
          </div>
        )}

        {/* Daily Completion Actions / Next Navigation Panel */}
        <div className="p-6 bg-white border-3 border-slate-900 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6 shadow-[6px_6px_0px_0px_#0F172A]">
          {/* Day switching links */}
          <div className="flex items-center gap-4">
            {prevDayNum ? (
              <Link
                href={`/academy/${track.slug}/day/${prevDayNum}`}
                className="p-3 bg-white border-2 border-slate-900 rounded-xl hover:bg-blue-50 transition-all text-slate-900 font-bold shadow-[2px_2px_0px_0px_#0F172A]"
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
              <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wider">
                Roadmap Progress
              </span>
              <p className="text-sm font-black text-slate-900">
                Day {day.day_number} of {track.estimated_days}
              </p>
            </div>

            {nextDayNum ? (
              <Link
                href={`/academy/${track.slug}/day/${nextDayNum}`}
                className="p-3 bg-white border-2 border-slate-900 rounded-xl hover:bg-blue-50 transition-all text-slate-900 font-bold shadow-[2px_2px_0px_0px_#0F172A]"
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
              <button
                type="button"
                disabled
                className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-black bg-emerald-100 text-emerald-900 border-2 border-slate-900 shadow-[3px_3px_0px_0px_#0F172A] flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4 text-emerald-700 stroke-[3]" />
                Completed & Unlocked
              </button>
            ) : (
              <button
                type="button"
                onClick={handleMarkComplete}
                disabled={submitting}
                className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-black bg-blue-600 text-white border-2 border-slate-900 shadow-[4px_4px_0px_0px_#0F172A] hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {submitting ? "Saving Progress..." : "Mark Day Complete"}
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>
      </div>
      <Toaster position="bottom-right" theme="light" />
    </div>
  );
}
