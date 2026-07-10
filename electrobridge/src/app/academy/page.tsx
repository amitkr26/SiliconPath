// src/app/academy/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Cpu, Code2, Shield, TestTube, Layers, Trophy, Lock, Zap, Play, Check, AlertCircle, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getTracks, getCompletedDays, getPassedTracks, getDaysForTrack } from "@/lib/academy/queries";
import { LearningTrack, TrackSlug } from "@/lib/academy/types";
import { Toaster, toast } from "sonner";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Cpu, Code2, Shield, TestTube, Layers, Layers3: Layers, Trophy,
};

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)),
  ]);
}

export default function AcademyDashboard() {
  const [tracks, setTracks] = useState<LearningTrack[]>([]);
  const [completedDays, setCompletedDays] = useState<string[]>([]);
  const [passedTracks, setPassedTracks] = useState<TrackSlug[]>([]);
  const [trackDaysMap, setTrackDaysMap] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const supabaseClient = createClient();
      const { data: { user } } = await supabaseClient.auth.getUser();
      const userId = user?.id || null;

      const tracksData = await withTimeout(getTracks(), 10000, "getTracks");
      setTracks(tracksData);

      const [completedList, passedList] = await Promise.all([
        getCompletedDays(userId).catch(() => [] as string[]),
        getPassedTracks(userId).catch(() => [] as TrackSlug[]),
      ]);
      setCompletedDays(completedList);
      setPassedTracks(passedList);

      const daysResults = await Promise.all(
        tracksData.map((t) =>
          getDaysForTrack(t.id)
            .then((days) => ({ id: t.id, days: days.map((d) => d.id) }))
            .catch(() => ({ id: t.id, days: [] as string[] }))
        )
      );
      const daysMap: Record<string, string[]> = {};
      for (const res of daysResults) daysMap[res.id] = res.days;
      setTrackDaysMap(daysMap);
    } catch (err) {
      console.error("Failed to load academy data:", err);
      setError("We couldn't load the academy right now.");
      toast.error("Couldn't load academy data. Please retry.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-gray-900 flex flex-col items-center justify-center px-4">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="mt-4 text-gray-500 font-medium">Loading your VLSI roadmap...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white text-gray-900 flex flex-col items-center justify-center px-4 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold mb-1">Something went wrong</h2>
        <p className="text-gray-500 max-w-sm mb-6">{error}</p>
        <button onClick={loadData} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors">
          <RefreshCw className="w-4 h-4" /> Try again
        </button>
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="min-h-screen bg-white text-gray-900 flex flex-col items-center justify-center px-4 text-center">
        <Cpu className="w-12 h-12 text-gray-300 mb-4" />
        <h2 className="text-xl font-bold mb-1">No tracks yet</h2>
        <p className="text-gray-500 max-w-sm">The curriculum is being set up. Check back soon.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-4">
            <Zap className="w-3.5 h-3.5" /> 100% Free - Self-Paced
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">
            Your Roadmap to <span className="text-indigo-600">VLSI Careers</span>
          </h1>
          <p className="max-w-xl mx-auto text-base text-gray-500">
            Learn digital logic, Verilog, SystemVerilog, UVM, RTL, and physical design with curated free lectures and day-wise plans.
          </p>
        </div>

        <div className="space-y-4">
          {tracks.map((track) => {
            const Icon = ICON_MAP[track.icon] || Cpu;
            const isUnlocked = track.prerequisites.length === 0 || track.prerequisites.every((p) => passedTracks.includes(p));
            const dayIds = trackDaysMap[track.id] || [];
            const totalDays = dayIds.length || track.estimated_days;
            const completedCount = dayIds.filter((id) => completedDays.includes(id)).length;
            const progressPercent = totalDays > 0 ? Math.round((completedCount / totalDays) * 100) : 0;
            const isTrackPassed = passedTracks.includes(track.slug);
            const allDaysCompleted = completedCount === totalDays && totalDays > 0;

            return (
              <div key={track.id} className={`rounded-2xl border p-5 sm:p-6 transition-all ${isUnlocked ? "bg-white border-gray-200 hover:border-gray-300 hover:shadow-md" : "bg-gray-50 border-gray-100 opacity-60"}`}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="p-3 rounded-xl flex-shrink-0" style={{ backgroundColor: `${track.color}15`, color: track.color }}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-bold">{track.title}</h3>
                        {isTrackPassed && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Check className="w-3 h-3" /> Passed
                          </span>
                        )}
                        {!isUnlocked && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                            <Lock className="w-3 h-3" /> Locked
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{track.description}</p>
                      <div className="flex items-center gap-3 text-xs font-medium text-gray-400 mt-2">
                        <span>{track.estimated_days} days</span>
                        <span>{track.estimated_hours} hours</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-full sm:w-52 flex-shrink-0">
                    {isUnlocked ? (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-semibold text-gray-500">
                          <span>Progress</span><span>{progressPercent}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progressPercent}%`, backgroundColor: track.color }} />
                        </div>
                        {allDaysCompleted && !isTrackPassed ? (
                          <Link href={`/academy/${track.slug}/assessment`} className="mt-2 w-full py-2 rounded-lg text-center text-sm font-bold bg-amber-400 text-gray-900 hover:bg-amber-300 transition-colors flex items-center justify-center gap-1.5">
                            Take Assessment <Trophy className="w-4 h-4" />
                          </Link>
                        ) : (
                          <Link href={`/academy/${track.slug}`} className="mt-2 w-full py-2 rounded-lg text-center text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1.5">
                            {completedCount > 0 ? "Continue" : "Start"} <Play className="w-3.5 h-3.5 fill-current" />
                          </Link>
                        )}
                      </div>
                    ) : (
                      <div className="text-center sm:text-right text-xs text-gray-400">
                        <Lock className="w-6 h-6 mx-auto sm:ml-auto sm:mr-0 mb-1 text-gray-300" />
                        Complete prior tracks to unlock
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <Toaster position="bottom-right" />
    </div>
  );
}
