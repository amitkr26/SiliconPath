"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Cpu, Code2, Shield, TestTube, Layers, Trophy, Lock, Zap, Play, Check, AlertCircle, RefreshCw } from "lucide-react";
import { Toaster, toast } from "sonner";
import { useUser } from "@/hooks/useUser";
import { api } from "@/lib/api-client";

import type { LearningTrack, TrackSlug } from "@/lib/academy/types";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Cpu, Code2, Shield, TestTube, Layers, Layers3: Layers, Trophy,
};

export default function AcademyDashboard() {
  const { user } = useUser();
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
      let tracksData: LearningTrack[];
      try {
        tracksData = await Promise.race([
          api.get<LearningTrack[]>("/api/academy/tracks"),
          new Promise<LearningTrack[]>((_, rej) => setTimeout(() => rej(new Error("timeout")), 8000)),
        ]);
      } catch {
        tracksData = (await import("@/lib/academy/queries")).FALLBACK_TRACKS;
      }
      setTracks(tracksData);

      try {
        const userId = user?.id || null;
        const [cd, pt] = await Promise.all([
          api.get<string[]>("/api/academy/progress/completed-days", { params: { userId: userId || "" } }).catch(() => [] as string[]),
          api.get<TrackSlug[]>("/api/academy/progress/passed-tracks", { params: { userId: userId || "" } }).catch(() => [] as TrackSlug[]),
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
        // Progress fetch failed entirely; tracks still show
      }
    } catch (err) {
      console.error("Academy load failed:", err);
      setError("Could not load the academy. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg-primary px-4">
        <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
        <p className="mt-4 text-text-secondary font-medium">Loading VLSI Academy...</p>
      </div>
    );
  }

  if (error && tracks.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg-primary px-4 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-text-primary mb-1">Something went wrong</h2>
        <p className="text-text-secondary max-w-sm mb-6">{error}</p>
        <button onClick={loadData} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-white font-semibold">
          <RefreshCw className="w-4 h-4" /> Try again
        </button>
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg-primary px-4 text-center">
        <Cpu className="w-12 h-12 text-text-muted mb-4" />
        <h2 className="text-xl font-bold text-text-primary mb-1">No tracks yet</h2>
        <p className="text-text-secondary max-w-sm">The curriculum is being set up. Check back soon.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 border border-accent/30 text-xs font-semibold text-accent uppercase tracking-wide mb-4">
            <Zap className="w-3.5 h-3.5" /> 100% Free - Self-Paced
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-text-primary mb-3">
            Your Roadmap to <span className="text-accent">VLSI Careers</span>
          </h1>
          <p className="max-w-xl mx-auto text-base text-text-secondary">
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
              <div key={track.id} className={`rounded-2xl border p-5 sm:p-6 transition-all ${isUnlocked ? "bg-bg-secondary border-border hover:border-accent/30" : "bg-bg-secondary/50 border-border/50 opacity-60"}`}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="p-3 rounded-xl flex-shrink-0" style={{ backgroundColor: `${track.color}15`, color: track.color }}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-bold text-text-primary">{track.title}</h3>
                        {isTrackPassed && <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20"><Check className="w-3 h-3" /> Passed</span>}
                        {!isUnlocked && <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-bg-primary text-text-muted border border-border"><Lock className="w-3 h-3" /> Locked</span>}
                      </div>
                      <p className="text-sm text-text-secondary mt-1">{track.description}</p>
                      <div className="flex items-center gap-3 text-xs font-medium text-text-muted mt-2">
                        <span>{track.estimated_days} days</span>
                        <span>{track.estimated_hours} hours</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-full sm:w-52 flex-shrink-0">
                    {isUnlocked ? (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-semibold text-text-muted">
                          <span>Progress</span><span>{progressPercent}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-bg-primary rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progressPercent}%`, backgroundColor: track.color }} />
                        </div>
                        {allDaysCompleted && !isTrackPassed ? (
                          <Link href={`/academy/${track.slug}/assessment`} className="mt-2 w-full py-2 rounded-lg text-center text-sm font-bold bg-yellow-500 text-gray-900 hover:bg-yellow-400 transition-colors flex items-center justify-center gap-1.5">
                            Take Assessment <Trophy className="w-4 h-4" />
                          </Link>
                        ) : (
                          <Link href={`/academy/${track.slug}`} className="mt-2 w-full py-2 rounded-lg text-center text-sm font-bold bg-accent text-white hover:bg-accent/90 transition-colors flex items-center justify-center gap-1.5">
                            {completedCount > 0 ? "Continue" : "Start"} <Play className="w-3.5 h-3.5 fill-current" />
                          </Link>
                        )}
                      </div>
                    ) : (
                      <div className="text-center sm:text-right text-xs text-text-muted">
                        <Lock className="w-6 h-6 mx-auto sm:ml-auto sm:mr-0 mb-1 text-text-muted/50" />
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
