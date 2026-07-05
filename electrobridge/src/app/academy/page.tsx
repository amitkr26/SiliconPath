// src/app/academy/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Cpu, Code2, Shield, TestTube, Layers, Trophy, 
  Lock, CheckCircle2, ChevronRight, Zap, Play, Check 
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getTracks, getCompletedDays, getPassedTracks, getDaysForTrack } from "@/lib/academy/queries";
import { LearningTrack, TrackSlug } from "@/lib/academy/types";
import { Toaster, toast } from "sonner";

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Cpu,
  Code2,
  Shield,
  TestTube,
  Layers,
  Layers3: Layers,
  Trophy
};

export default function AcademyDashboard() {
  const [tracks, setTracks] = useState<LearningTrack[]>([]);
  const [completedDays, setCompletedDays] = useState<string[]>([]);
  const [passedTracks, setPassedTracks] = useState<TrackSlug[]>([]);
  const [trackDaysMap, setTrackDaysMap] = useState<Record<string, string[]>>({}); // trackId -> dayIds
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const supabaseClient = createClient();
        const { data: { user } } = await supabaseClient.auth.getUser();
        setUser(user);

        // Fetch tracks
        const tracksData = await getTracks();
        setTracks(tracksData);

        // Fetch user progress
        const userId = user?.id || null;
        const [completedList, passedList] = await Promise.all([
          getCompletedDays(userId),
          getPassedTracks(userId)
        ]);
        setCompletedDays(completedList);
        setPassedTracks(passedList);

        // Fetch day structures for progress calculation
        const daysMap: Record<string, string[]> = {};
        for (const t of tracksData) {
          const days = await getDaysForTrack(t.id);
          daysMap[t.id] = days.map(d => d.id);
        }
        setTrackDaysMap(daysMap);
      } catch (err) {
        console.error("Failed to load academy data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] text-gray-100 flex flex-col items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-cyan/20 border-t-cyan rounded-full animate-spin"></div>
          <Zap className="w-6 h-6 text-cyan absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>
        <p className="mt-4 text-gray-400 font-medium animate-pulse">Designing your custom VLSI strategy...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-gray-100 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan/5 rounded-full filter blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full filter blur-[100px] pointer-events-none"></div>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan/10 border border-cyan/30 text-xs font-semibold text-cyan tracking-wider uppercase mb-2">
            <Zap className="w-3.5 h-3.5" />
            100% Free Self-Taught VLSI Academy
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-white via-gray-100 to-gray-400 bg-clip-text text-transparent">
            Your Roadmap to <span className="text-cyan">VLSI Core Jobs</span>
          </h1>
          <p className="max-w-2xl mx-auto text-base md:text-lg text-gray-400 leading-relaxed">
            No budget for expensive institutes? Learn digital logic, Verilog, SystemVerilog, UVM, RTL design, and physical design using curated free lectures, day-wise planning, and practice questions.
          </p>
        </div>

        {/* Tracks List */}
        <div className="space-y-6">
          {tracks.map((track) => {
            const IconComponent = ICON_MAP[track.icon] || Cpu;
            
            // Check lock status: locked if track has prerequisites and they are not all in passedTracks
            const isUnlocked = track.prerequisites.length === 0 || 
              track.prerequisites.every(p => passedTracks.includes(p));

            // Calculate progress
            const dayIds = trackDaysMap[track.id] || [];
            const totalDays = dayIds.length || track.estimated_days;
            const completedCount = dayIds.filter(id => completedDays.includes(id)).length;
            const progressPercent = totalDays > 0 ? Math.round((completedCount / totalDays) * 100) : 0;
            const isTrackPassed = passedTracks.includes(track.slug);
            const allDaysCompleted = completedCount === totalDays && totalDays > 0;

            return (
              <div
                key={track.id}
                className={`relative group rounded-3xl border transition-all duration-300 ${
                  isUnlocked
                    ? "bg-[#111827]/40 border-[#374151]/50 hover:border-gray-700 shadow-xl backdrop-blur-sm"
                    : "bg-gray-900/20 border-gray-900/60 opacity-60 pointer-events-none"
                }`}
              >
                {/* Visual Accent Glow on Hover */}
                {isUnlocked && (
                  <div
                    className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      background: `radial-gradient(circle at 10% 20%, ${track.color}05, transparent 40%)`
                    }}
                  ></div>
                )}

                <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                  {/* Left Side: Icon & Details */}
                  <div className="flex items-start gap-4 md:gap-6 min-w-0 flex-1">
                    <div
                      className="p-4 rounded-2xl flex-shrink-0"
                      style={{ backgroundColor: `${track.color}15`, color: track.color }}
                    >
                      <IconComponent className="w-8 h-8" />
                    </div>

                    <div className="space-y-2 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-xl md:text-2xl font-bold text-gray-100 group-hover:text-white transition-colors truncate">
                          {track.title}
                        </h3>
                        {isTrackPassed && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <Check className="w-3 h-3" /> Passed
                          </span>
                        )}
                        {!isUnlocked && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700">
                            <Lock className="w-3 h-3" /> Locked
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-400 leading-relaxed pr-4">
                        {track.description}
                      </p>

                      {/* Meta information tags */}
                      <div className="flex items-center gap-4 text-xs font-semibold text-gray-400 flex-wrap">
                        <span className="bg-[#1F2937]/50 px-3 py-1 rounded-lg">
                          {track.estimated_days} Days
                        </span>
                        <span className="bg-[#1F2937]/50 px-3 py-1 rounded-lg">
                          {track.estimated_hours} Hours
                        </span>
                        {track.prerequisites.length > 0 && (
                          <span className="text-gray-500">
                            Prereq: {track.prerequisites.join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Progress or Unlock CTA */}
                  <div className="flex flex-col items-stretch md:items-end justify-center w-full md:w-56 gap-4 border-t md:border-t-0 pt-4 md:pt-0 border-[#374151]/30">
                    {isUnlocked ? (
                      <div className="w-full space-y-3">
                        {/* Progress Bar */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-bold text-gray-400">
                            <span>Progress</span>
                            <span>{progressPercent}% ({completedCount}/{totalDays} Days)</span>
                          </div>
                          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${progressPercent}%`,
                                backgroundColor: track.color
                              }}
                            ></div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2">
                          {allDaysCompleted && !isTrackPassed ? (
                            <Link
                              href={`/academy/${track.slug}/assessment`}
                              className="w-full py-2.5 rounded-xl text-center text-sm font-bold bg-amber-500 text-gray-950 hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/10 flex items-center justify-center gap-1.5"
                            >
                              Take Gating Assessment
                              <Trophy className="w-4 h-4" />
                            </Link>
                          ) : (
                            <Link
                              href={`/academy/${track.slug}`}
                              className="w-full py-2.5 rounded-xl text-center text-sm font-bold bg-gray-800 hover:bg-gray-700 text-gray-200 transition-colors flex items-center justify-center gap-1.5"
                            >
                              {completedCount > 0 ? "Continue Roadmap" : "Start Track"}
                              <Play className="w-3.5 h-3.5 fill-current" />
                            </Link>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center md:text-right space-y-1.5">
                        <Lock className="w-8 h-8 text-gray-600 mx-auto md:mr-0" />
                        <p className="text-xs text-gray-500">
                          Complete prior tracks and pass the gating assessments to unlock.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <Toaster position="bottom-right" theme="dark" />
    </div>
  );
}
