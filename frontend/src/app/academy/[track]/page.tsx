// src/app/academy/[track]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, Cpu, Play, CheckCircle2, Lock, 
  Sparkles, Award, BookOpen, AlertCircle, HelpCircle, Trophy 
} from "lucide-react";
import { api } from "@/lib/api-client";
import { LearningTrack, LearningDay, TrackSlug } from "@/lib/academy/types";
import { getCompletedDays, getPassedTracks } from "@/lib/academy/progress";
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

        setCompletedDays(getCompletedDays());
        setPassedTracks(getPassedTracks());
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
  }, [trackSlug, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-accent/20 border-t-accent rounded-full animate-spin"></div>
        <p className="mt-4 text-text-secondary text-sm">Loading curriculum tracks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col items-center justify-center px-4">
        <div className="max-w-md text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-danger/10 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-danger" />
          </div>
          <h2 className="text-xl font-bold text-text-primary">Failed to Load Track</h2>
          <p className="text-text-secondary text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white font-semibold rounded-lg text-sm hover:bg-accent-hover transition-colors"
          >
            Retry
          </button>
        </div>
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
    <div className="min-h-screen bg-bg-primary text-text-primary py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Dynamic background glow matching track color */}
      <div 
        className="absolute top-0 right-1/4 w-96 h-96 rounded-full filter blur-[120px] pointer-events-none opacity-10"
        style={{ backgroundColor: track.color }}
      ></div>

      <div className="max-w-4xl mx-auto relative z-10 space-y-12">
        {/* Back Link */}
        <Link 
          href="/academy" 
          className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-accent transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Academy Dashboard
        </Link>

        {/* Track Title Panel */}
        <div className="p-6 md:p-8 bg-surface border border-border rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 flex-1">
            <h1 className="text-3xl md:text-4xl font-extrabold text-text-primary flex items-center gap-3">
              <span style={{ color: track.color }}>{track.title}</span>
            </h1>
            <p className="text-sm md:text-base text-text-secondary leading-relaxed max-w-xl">
              {track.description}
            </p>
            <div className="flex items-center gap-4 text-xs font-semibold text-text-muted flex-wrap">
              <span className="bg-bg-secondary px-3 py-1 rounded-lg">{days.length} Days</span>
              <span className="bg-bg-secondary px-3 py-1 rounded-lg">{track.estimated_hours} Hours</span>
              {isTrackPassed && (
                <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Track Passed
                </span>
              )}
            </div>
          </div>

          {/* Track Level Progress Card */}
          <div className="w-full md:w-48 bg-bg-secondary border border-border/80 rounded-2xl p-4 space-y-3">
            <div className="flex justify-between text-xs font-bold text-text-secondary">
              <span>Progress</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-border rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%`, backgroundColor: track.color }}
              ></div>
            </div>
            <p className="text-xs text-text-muted text-center font-medium">
              {completedCount} of {totalDays} days finished
            </p>
          </div>
        </div>

        {/* Days List */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-accent" />
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
                        ? "bg-success/5 border-success/20 hover:border-success/40"
                        : "bg-surface border-border hover:border-accent/40 shadow-sm"
                      : "bg-bg-secondary border-border/40 opacity-50 cursor-not-allowed select-none"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Day details */}
                    <div className="flex items-start gap-4 min-w-0">
                      <div 
                        className={`w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center font-black text-lg ${
                          isDayUnlocked
                            ? isCompleted
                              ? "bg-success/10 text-success"
                              : "bg-bg-secondary text-text-primary"
                            : "bg-bg-secondary text-text-muted"
                        }`}
                        style={isDayUnlocked && !isCompleted ? { color: track.color, backgroundColor: `${track.color}10` } : {}}
                      >
                        {day.day_number}
                      </div>

                      <div className="space-y-1.5 min-w-0">
                        <h4 className="text-base font-bold text-text-primary truncate">
                          {day.title}
                        </h4>
                        
                        {/* Key Concepts Tags */}
                        {day.key_concepts && day.key_concepts.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {day.key_concepts.slice(0, 3).map((concept, cIdx) => (
                              <span key={cIdx} className="text-[10px] font-medium bg-bg-secondary text-text-secondary px-2 py-0.5 rounded-md border border-border">
                                {concept}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action buttons or Locked states */}
                    <div className="flex items-center gap-3 sm:self-center">
                      <span className="text-xs text-text-muted font-medium">
                        {day.estimated_minutes} mins
                      </span>

                      {isDayUnlocked ? (
                        isCompleted ? (
                          <Link
                            href={`/academy/${track.slug}/day/${day.day_number}`}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-success/30 text-success bg-success/5 hover:bg-success/10 transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Completed
                          </Link>
                        ) : (
                          <Link
                            href={`/academy/${track.slug}/day/${day.day_number}`}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-accent text-white hover:bg-accent-hover transition-colors"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            Start Day
                          </Link>
                        )
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-text-muted bg-bg-secondary border border-border">
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
          <div className="p-6 bg-gradient-to-r from-warning/10 via-warning/5 to-transparent border border-warning/30 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
            <div className="space-y-2 flex-1">
              <h3 className="text-xl font-bold text-warning flex items-center gap-2">
                <Trophy className="w-6 h-6 animate-bounce" />
                Track Assessment Unlocked!
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed max-w-xl">
                Congratulations on completing all daily lessons in this track! To pass this track and permanently unlock the next stage, you must score 70% or higher on the comprehensive gating assessment.
              </p>
            </div>
            
            <Link
              href={`/academy/${track.slug}/assessment`}
              className="px-6 py-3 rounded-xl text-sm font-bold bg-warning hover:brightness-110 text-white transition-colors flex items-center gap-1.5 flex-shrink-0"
            >
              Start Gating Assessment
              <Award className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
      <Toaster position="bottom-right" theme="light" />
    </div>
  );
}
