"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Cpu, Code2, Shield, TestTube, Layers, Trophy, Lock, Zap, Play, Check, AlertCircle, RefreshCw, Sparkles } from "lucide-react";
import { Toaster } from "sonner";
import { api } from "@/lib/api-client";
import type { LearningTrack, TrackSlug } from "@/lib/academy/types";
import { getCompletedDays, getPassedTracks } from "@/lib/academy/progress";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Cpu, Code2, Shield, TestTube, Layers, Layers3: Layers, Trophy,
};

export default function AcademyDashboard() {
  const [tracks, setTracks] = useState<LearningTrack[]>([]);
  const [completedDays, setCompletedDays] = useState<string[]>([]);
  const [passedTracks, setPassedTracks] = useState<TrackSlug[]>([]);
  const [trackDaysMap, setTrackDaysMap] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let tracksData: LearningTrack[] = [];
      try {
        const res = await Promise.race([
          api.get<any>("/api/academy/tracks"),
          new Promise<any>((_, rej) => setTimeout(() => rej(new Error("timeout")), 8000)),
        ]);
        tracksData = Array.isArray(res) ? res : (res?.tracks || []);
      } catch {
        tracksData = (await import("@/lib/academy/queries")).FALLBACK_TRACKS;
      }
      setTracks(tracksData);

      try {
        const [cd, pt] = await Promise.all([
          Promise.resolve(getCompletedDays()),
          Promise.resolve(getPassedTracks()),
        ]);
        setCompletedDays(cd);
        setPassedTracks(pt);

        const daysResults = await Promise.all(
          tracksData.map((t) =>
            api.get<{ id: string }[]>(`/api/academy/tracks/${t.id}/days`).then((days) => ({ id: t.id, days: days.map((d: any) => d.id) })).catch(() => ({ id: t.id, days: [] as string[] }))
          )
        );
        const daysMap: Record<string, string[]> = {};
        for (const res of daysResults) daysMap[res.id] = res.days;
        setTrackDaysMap(daysMap);
      } catch {
        // Fallback progress
      }
    } catch (err) {
      console.error("Academy load failed:", err);
      setError("Could not load the academy. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="mt-4 text-slate-600 font-medium text-sm">Loading VLSI Academy Tracks...</p>
      </div>
    );
  }

  if (error && tracks.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-1">Something went wrong</h2>
        <p className="text-slate-600 max-w-sm mb-6 text-sm">{error}</p>
        <button onClick={loadData} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full btn-glow font-semibold text-xs">
          <RefreshCw className="w-4 h-4" /> Try again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* ACADEMY HEADER */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700 uppercase tracking-wide mb-4 shadow-2xs">
            <Zap className="w-3.5 h-3.5 text-blue-600" /> 100% Free • Self-Paced Curated Roadmap
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-3">
            Your Roadmap to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">VLSI Careers</span>
          </h1>
          <p className="max-w-xl mx-auto text-sm sm:text-base text-slate-600">
            Master Digital Logic, Verilog, SystemVerilog, UVM, RTL, and Physical Design with day-wise structured plans and assessments.
          </p>
        </div>

        {/* TRACKS LIST */}
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
              <div key={track.id} className={`glass-premium rounded-2xl p-6 transition-all ${isUnlocked ? "opacity-100" : "opacity-60 bg-slate-100"}`}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="p-3.5 rounded-2xl flex-shrink-0 bg-blue-50 text-blue-600 border border-blue-100">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-bold text-slate-900">{track.title}</h3>
                        {isTrackPassed && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Check className="w-3.5 h-3.5" /> Passed
                          </span>
                        )}
                        {!isUnlocked && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                            <Lock className="w-3.5 h-3.5" /> Locked
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mt-1">{track.description}</p>
                      <div className="flex items-center gap-3 text-xs font-medium text-slate-500 mt-2">
                        <span>{track.estimated_days} days</span>
                        <span>•</span>
                        <span>{track.estimated_hours} hours</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-full sm:w-48 flex-shrink-0">
                    {isUnlocked ? (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-semibold text-slate-600">
                          <span>Progress</span><span>{progressPercent}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                          <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                        </div>
                        {allDaysCompleted && !isTrackPassed ? (
                          <Link href={`/academy/${track.slug}/assessment`} className="mt-3 w-full py-2.5 rounded-full text-center text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 transition-colors flex items-center justify-center gap-1.5 shadow-xs">
                            Take Assessment <Trophy className="w-4 h-4" />
                          </Link>
                        ) : (
                          <Link href={`/academy/${track.slug}`} className="mt-3 w-full py-2.5 rounded-full text-center text-xs font-bold btn-glow transition-colors flex items-center justify-center gap-1.5">
                            {completedCount > 0 ? "Continue Track" : "Start Track"} <Play className="w-3.5 h-3.5 fill-current" />
                          </Link>
                        )}
                      </div>
                    ) : (
                      <div className="text-center sm:text-right text-xs text-slate-400">
                        <Lock className="w-5 h-5 mx-auto sm:ml-auto sm:mr-0 mb-1" />
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
