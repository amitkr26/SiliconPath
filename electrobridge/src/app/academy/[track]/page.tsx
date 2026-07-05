// src/app/academy/[track]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, Cpu, Play, CheckCircle2, Lock, 
  Sparkles, Award, BookOpen, AlertCircle, HelpCircle, Trophy 
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getTrackBySlug, getDaysForTrack, getCompletedDays, getPassedTracks } from "@/lib/academy/queries";
import { LearningTrack, LearningDay, TrackSlug } from "@/lib/academy/types";
import { Toaster, toast } from "sonner";

export default function TrackOverview() {
  const params = useParams();
  const router = useRouter();
  const trackSlug = params.track as string;

  const [track, setTrack] = useState<LearningTrack | null>(null);
  const [days, setDays] = useState<LearningDay[]>([]);
  const [completedDays, setCompletedDays] = useState<string[]>([]);
  const [passedTracks, setPassedTracks] = useState<TrackSlug[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function loadTrackData() {
      try {
        const t = await getTrackBySlug(trackSlug);
        if (!t) {
          toast.error("Track not found");
          router.push("/academy");
          return;
        }
        setTrack(t);

        const supabaseClient = createClient();
        const { data: { user } } = await supabaseClient.auth.getUser();
        setUser(user);

        // Fetch days
        const daysList = await getDaysForTrack(t.id);
        setDays(daysList);

        // Fetch user progress
        const userId = user?.id || null;
        const [completedList, passedList] = await Promise.all([
          getCompletedDays(userId),
          getPassedTracks(userId)
        ]);
        setCompletedDays(completedList);
        setPassedTracks(passedList);
      } catch (err) {
        console.error("Failed to load track details:", err);
      } finally {
        setLoading(false);
      }
    }
    if (trackSlug) {
      loadTrackData();
    }
  }, [trackSlug, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] text-gray-100 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-cyan/20 border-t-cyan rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-400 text-sm">Loading curriculum tracks...</p>
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
    <div className="min-h-screen bg-[#030712] text-gray-100 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Dynamic background glow matching track color */}
      <div 
        className="absolute top-0 right-1/4 w-96 h-96 rounded-full filter blur-[120px] pointer-events-none opacity-20"
        style={{ backgroundColor: track.color }}
      ></div>

      <div className="max-w-4xl mx-auto relative z-10 space-y-12">
        {/* Back Link */}
        <Link 
          href="/academy" 
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-cyan transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Academy Dashboard
        </Link>

        {/* Track Title Panel */}
        <div className="p-6 md:p-8 bg-[#111827]/40 border border-[#374151]/50 rounded-3xl backdrop-blur-sm shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 flex-1">
            <h1 className="text-3xl md:text-4xl font-extrabold text-white flex items-center gap-3">
              <span style={{ color: track.color }}>{track.title}</span>
            </h1>
            <p className="text-sm md:text-base text-gray-400 leading-relaxed max-w-xl">
              {track.description}
            </p>
            <div className="flex items-center gap-4 text-xs font-semibold text-gray-400 flex-wrap">
              <span className="bg-[#1F2937]/50 px-3 py-1 rounded-lg">{days.length} Days</span>
              <span className="bg-[#1F2937]/50 px-3 py-1 rounded-lg">{track.estimated_hours} Hours</span>
              {isTrackPassed && (
                <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Track Passed
                </span>
              )}
            </div>
          </div>

          {/* Track Level Progress Card */}
          <div className="w-full md:w-48 bg-[#1F2937]/30 border border-[#374151]/30 rounded-2xl p-4 space-y-3">
            <div className="flex justify-between text-xs font-bold text-gray-400">
              <span>Progress</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%`, backgroundColor: track.color }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 text-center font-medium">
              {completedCount} of {totalDays} days finished
            </p>
          </div>
        </div>

        {/* Days List */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan" />
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
                <div
                  key={day.id}
                  className={`p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                    isDayUnlocked
                      ? isCompleted
                        ? "bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40"
                        : "bg-[#111827]/40 border-[#374151]/50 hover:border-gray-700 shadow-md"
                      : "bg-[#111827]/10 border-gray-900/60 opacity-60 cursor-not-allowed select-none"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Day details */}
                    <div className="flex items-start gap-4 min-w-0">
                      <div 
                        className={`w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center font-black text-lg ${
                          isDayUnlocked
                            ? isCompleted
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-[#1F2937] text-gray-200"
                            : "bg-[#111827] text-gray-600"
                        }`}
                        style={isDayUnlocked && !isCompleted ? { color: track.color, backgroundColor: `${track.color}10` } : {}}
                      >
                        {day.day_number}
                      </div>

                      <div className="space-y-1.5 min-w-0">
                        <h4 className="text-base font-bold text-gray-200 truncate">
                          {day.title}
                        </h4>
                        
                        {/* Key Concepts Tags */}
                        {day.key_concepts && day.key_concepts.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {day.key_concepts.slice(0, 3).map((concept, cIdx) => (
                              <span key={cIdx} className="text-[10px] font-medium bg-[#1F2937]/50 text-gray-400 px-2 py-0.5 rounded-md border border-[#374151]/20">
                                {concept}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action buttons or Locked states */}
                    <div className="flex items-center gap-3 sm:self-center">
                      <span className="text-xs text-gray-400 font-medium">
                        {day.estimated_minutes} mins
                      </span>

                      {isDayUnlocked ? (
                        isCompleted ? (
                          <Link
                            href={`/academy/${track.slug}/day/${day.day_number}`}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-emerald-500/30 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Completed
                          </Link>
                        ) : (
                          <Link
                            href={`/academy/${track.slug}/day/${day.day_number}`}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white text-gray-950 hover:bg-gray-200 transition-colors"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            Start Day
                          </Link>
                        )
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 bg-gray-900 border border-gray-900">
                          <Lock className="w-3.5 h-3.5" />
                          Locked
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* End of Track Gating Assessment CTA */}
        {allDaysCompleted && (
          <div className="p-6 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-3xl backdrop-blur-sm flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-amber-500/5">
            <div className="space-y-2 flex-1">
              <h3 className="text-xl font-bold text-amber-400 flex items-center gap-2">
                <Trophy className="w-6 h-6 animate-bounce" />
                Track Assessment Unlocked!
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed max-w-xl">
                Congratulations on completing all daily lessons in this track! To pass this track and permanently unlock the next stage, you must score 70% or higher on the comprehensive gating assessment.
              </p>
            </div>
            
            <Link
              href={`/academy/${track.slug}/assessment`}
              className="px-6 py-3 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-400 text-gray-950 transition-colors shadow-lg shadow-amber-500/20 flex items-center gap-1.5 flex-shrink-0"
            >
              Start Gating Assessment
              <Award className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
      <Toaster position="bottom-right" theme="dark" />
    </div>
  );
}
