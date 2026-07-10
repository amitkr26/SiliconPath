// src/app/academy/[track]/day/[day]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, 
  Cpu, FileText, Play, Check, HelpCircle, GraduationCap, ExternalLink 
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getDayDetails, getCompletedDays, markDayComplete } from "@/lib/academy/queries";
import { LearningTrack, LearningDay, LearningResource, LearningQuestion } from "@/lib/academy/types";
import { YoutubeEmbed } from "@/components/academy/YoutubeEmbed";
import { PracticeQuiz } from "@/components/academy/PracticeQuiz";
import { Toaster, toast } from "sonner";

export default function DayDetailsPage() {
  const params = useParams();
  const router = useRouter();
  
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
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setLoading(false);
      setError("Loading timed out. Please check your connection and refresh.");
    }, 15000);

    async function loadDayData() {
      if (isNaN(dayNumber)) return;
      try {
        setLoading(true);
        const data = await getDayDetails(trackSlug, dayNumber);
        if (!data) {
          toast.error("Day details not found");
          router.push(`/academy/${trackSlug}`);
          return;
        }

        setTrack(data.track);
        setDay(data.day);
        setResources(data.resources);
        setQuestions(data.questions);

        const supabaseClient = createClient();
        const { data: { user } } = await supabaseClient.auth.getUser();
        setUser(user);

        const completedList = await getCompletedDays(user?.id || null);
        setCompletedDays(completedList);

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
  }, [trackSlug, dayNumberStr, dayNumber, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] text-gray-100 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-cyan/20 border-t-cyan rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-400 text-sm">Opening today&apos;s lessons...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#030712] text-gray-100 flex flex-col items-center justify-center px-4">
        <div className="max-w-md text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
            <HelpCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-100">Failed to Load Lesson</h2>
          <p className="text-gray-400 text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan text-navy font-semibold rounded-lg text-sm hover:bg-cyan/90 transition-colors"
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
      const success = await markDayComplete(userId, track.id, day.id, true);
      
      if (success) {
        setCompletedDays((prev) => [...prev, day.id]);
        toast.success(`Day ${day.day_number} completed!`);
        
        // Auto-navigate to next day if available after a brief delay
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
    <div className="min-h-screen bg-[#030712] text-gray-100 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative track blur background */}
      <div 
        className="absolute top-0 left-10 w-96 h-96 rounded-full filter blur-[150px] pointer-events-none opacity-10"
        style={{ backgroundColor: track.color }}
      ></div>

      <div className="max-w-4xl mx-auto relative z-10 space-y-10">
        {/* Header Breadcrumbs */}
        <div className="flex items-center justify-between gap-4 flex-wrap border-b border-[#374151]/40 pb-6">
          <div className="space-y-1.5">
            <Link 
              href={`/academy/${track.slug}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-cyan uppercase tracking-wider transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {track.title}
            </Link>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2">
              <span className="text-gray-400 font-medium">Day {day.day_number}:</span>
              <span>{day.title}</span>
            </h1>
          </div>

          {/* Top Status */}
          {isCompleted && (
            <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-bold">
              <Check className="w-3.5 h-3.5" /> Completed
            </span>
          )}
        </div>

        {/* Video Lectures (Attributed Embed Only) */}
        {resources.length > 0 && (
          <div className="space-y-5">
            <h3 className="text-lg font-bold text-gray-200 flex items-center gap-2">
              <Play className="w-5 h-5 text-red-500 fill-current" />
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
          <div className="p-6 md:p-8 bg-[#111827]/40 border border-[#374151]/50 rounded-3xl backdrop-blur-sm shadow-xl space-y-6">
            <div className="flex items-center gap-2 border-b border-[#374151]/30 pb-4">
              <FileText className="w-5 h-5 text-cyan" />
              <h3 className="text-lg font-bold text-gray-200">Core Theory Summary</h3>
            </div>
            
            {/* Custom Simple Markdown Renderer */}
            <div className="prose prose-invert max-w-none text-sm md:text-base text-gray-300 space-y-4 leading-relaxed">
              {day.theory_summary.split("\n\n").map((block, bIdx) => {
                if (block.startsWith("## ")) {
                  return (
                    <h4 key={bIdx} className="text-lg font-extrabold text-white mt-6 mb-2 border-l-2 border-cyan pl-2.5">
                      {block.replace("## ", "")}
                    </h4>
                  );
                }
                if (block.startsWith("### ")) {
                  return (
                    <h5 key={bIdx} className="text-base font-bold text-gray-200 mt-4 mb-2">
                      {block.replace("### ", "")}
                    </h5>
                  );
                }
                if (block.startsWith("```")) {
                  // Basic code block format
                  const lines = block.split("\n").filter(l => !l.startsWith("```"));
                  return (
                    <pre key={bIdx} className="bg-black/60 border border-[#374151]/40 rounded-xl p-4 overflow-x-auto font-mono text-xs text-emerald-400">
                      {lines.join("\n")}
                    </pre>
                  );
                }
                if (block.startsWith("|")) {
                  // Render basic tables
                  const rows = block.split("\n").filter(r => r.trim().length > 0);
                  return (
                    <div key={bIdx} className="overflow-x-auto my-4 border border-[#374151]/30 rounded-xl">
                      <table className="min-w-full divide-y divide-[#374151]/30 text-xs">
                        <tbody className="divide-y divide-[#374151]/20 bg-[#111827]/30">
                          {rows.map((row, rIdx) => {
                            const cells = row.split("|").filter((c, cIdx) => cIdx > 0 && cIdx < row.split("|").length - 1);
                            if (row.includes("---")) return null; // skip separator row
                            return (
                              <tr key={rIdx} className={rIdx === 0 ? "bg-[#1F2937]/50 font-bold text-gray-200" : ""}>
                                {cells.map((cell, cIdx) => (
                                  <td key={cIdx} className="px-4 py-2.5 whitespace-nowrap text-left border-r border-[#374151]/20 last:border-r-0">
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
                  // Render list items
                  const items = block.split("\n").map(i => i.replace("- ", ""));
                  return (
                    <ul key={bIdx} className="list-disc list-inside space-y-1.5 pl-2 text-gray-300">
                      {items.map((it, itIdx) => (
                        <li key={itIdx}>{it}</li>
                      ))}
                    </ul>
                  );
                }
                return (
                  <p key={bIdx} className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {block}
                  </p>
                );
              })}
            </div>
          </div>
        )}

        {/* Practice Links (HDLBits, EDA Playground, etc.) */}
        {day.practice_links && day.practice_links.length > 0 && (
          <div className="p-5 bg-cyan/5 border border-cyan/20 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1 flex-1">
              <h4 className="text-sm font-bold text-cyan uppercase tracking-wider flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4" />
                Hands-on Practice Tools & Labs
              </h4>
              <p className="text-xs text-gray-400">
                Put theory into practice by solving compiler/coding tasks on these recommended external platforms.
              </p>
            </div>
            
            <div className="flex items-center gap-3 flex-wrap">
              {day.practice_links.map((link, lIdx) => (
                <a
                  key={lIdx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 bg-cyan text-gray-950 px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#00E5FF]/80 transition-colors shadow-md shadow-cyan/15"
                >
                  <span>{link.label}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Practice Quiz */}
        {questions.length > 0 && (
          <div className="p-6 md:p-8 bg-[#111827]/40 border border-[#374151]/50 rounded-3xl backdrop-blur-sm shadow-xl">
            <PracticeQuiz 
              questions={questions} 
              onQuizCompleted={() => setQuizCompleted(true)} 
            />
          </div>
        )}

        {/* Daily Completion Actions / Next Navigation Panel */}
        <div className="p-6 bg-[#1F2937]/20 border border-[#374151]/40 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Day switching links */}
          <div className="flex items-center gap-4">
            {prevDayNum ? (
              <Link
                href={`/academy/${track.slug}/day/${prevDayNum}`}
                className="p-3 bg-gray-900 border border-gray-800 rounded-xl hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
                title={`Back to Day ${prevDayNum}`}
              >
                <ChevronLeft className="w-5 h-5" />
              </Link>
            ) : (
              <div className="p-3 bg-gray-950 border border-gray-900 opacity-25 rounded-xl cursor-not-allowed">
                <ChevronLeft className="w-5 h-5" />
              </div>
            )}

            <div className="text-center sm:text-left">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Current Roadmap Position
              </span>
              <p className="text-sm font-bold text-gray-300">
                Day {day.day_number} of {track.estimated_days}
              </p>
            </div>

            {nextDayNum ? (
              <Link
                href={`/academy/${track.slug}/day/${nextDayNum}`}
                className="p-3 bg-gray-900 border border-gray-800 rounded-xl hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
                title={`Go to Day ${nextDayNum}`}
              >
                <ChevronRight className="w-5 h-5" />
              </Link>
            ) : (
              <div className="p-3 bg-gray-950 border border-gray-900 opacity-25 rounded-xl cursor-not-allowed">
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
                className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Completed & Unlocked
              </button>
            ) : (
              <button
                type="button"
                onClick={handleMarkComplete}
                disabled={submitting}
                className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold bg-cyan text-gray-900 hover:bg-[#00E5FF]/80 disabled:opacity-50 transition-colors shadow-lg shadow-cyan/20 flex items-center justify-center gap-1.5"
              >
                {submitting ? "Saving Progress..." : "Mark Day Complete"}
                <CheckCircle2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
      <Toaster position="bottom-right" theme="dark" />
    </div>
  );
}
