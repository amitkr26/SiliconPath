"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Play,
  Lock,
  Zap,
  CheckCircle2,
  ExternalLink,
  BookOpen,
  Terminal,
  Layers,
  GraduationCap,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { FALLBACK_TRACKS } from "@/lib/academy/fallback";
import type { LearningTrack, TrackSlug } from "@/lib/academy/types";
import { getCompletedDaysLocal, getPassedTracksLocal } from "@/lib/academy/progress-local";
import { Badge } from "@/components/ui/Badge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { cn } from "@/lib/utils";

const TRUSTED_SOURCES = [
  {
    category: "Digital Design & RTL (Track 1)",
    resources: [
      { name: "NPTEL - Digital Circuits (IIT Kharagpur, Prof. Santanu Chattopadhyay)", url: "https://nptel.ac.in/courses/108105113", type: "Course", tag: "NPTEL / IIT" },
      { name: "NPTEL - Hardware Modeling using Verilog (IIT Kharagpur, Prof. Indranil Sengupta)", url: "https://nptel.ac.in/courses/106105165", type: "Course", tag: "NPTEL / IIT" },
      { name: "HDLBits Interactive Practice (01xz)", url: "https://hdlbits.01xz.net/", type: "Interactive Practice", tag: "Auto-graded" },
      { name: "ChipVerify - Verilog & Digital Design Tutorials", url: "https://chipverify.com/", type: "Tutorial & Lab", tag: "Self-Paced" },
      { name: "ARM Education Media Architecture References", url: "https://www.arm.com/resources/education", type: "Official Reference", tag: "ARM Architecture" },
    ],
  },
  {
    category: "Verification SV & UVM (Track 2)",
    resources: [
      { name: "Verification Academy (Siemens EDA)", url: "https://verificationacademy.com/", type: "Course & Reference", tag: "Industry Standard" },
      { name: "ChipVerify - SystemVerilog & UVM Masterclass", url: "https://chipverify.com/systemverilog", type: "Tutorial & Code", tag: "Hands-on" },
      { name: "Verification Guide - UVM Architecture", url: "https://verificationguide.com/uvm/uvm-tutorial/", type: "Tutorial", tag: "UVM Library" },
      { name: "Doulos Knowhow - UVM Verification Primer", url: "https://www.doulos.com/knowhow/systemverilog/uvm/", type: "Article & Code", tag: "Advanced" },
    ],
  },
  {
    category: "Physical Design & Backend (Track 3)",
    resources: [
      { name: "NPTEL - VLSI Design Flow: RTL to GDS (IIIT Delhi, Prof. Sneh Saurabh)", url: "https://nptel.ac.in/courses/108106191", type: "Course", tag: "RTL to GDSII" },
      { name: "OpenLane - Open-Source RTL-to-GDSII Flow", url: "https://github.com/The-OpenROAD-Project/OpenLane", type: "Tool & Docs", tag: "OpenROAD" },
      { name: "SkyWater Sky130 PDK Documentation", url: "https://skywater-pdk.readthedocs.io/", type: "Process Reference", tag: "130nm PDK" },
      { name: "OpenROAD Project Documentation", url: "https://openroad.readthedocs.io/", type: "EDA Docs", tag: "Place & Route" },
    ],
  },
];

const EDA_TOOLS = [
  { name: "EDA Playground", description: "Browser-based SystemVerilog/Verilog simulator with Aldec & Riviera-PRO engines.", url: "https://www.edaplayground.com/", badge: "Browser Simulator" },
  { name: "ChipVerify In-Browser Lab", description: "Synthesize Verilog code with Yosys & Sky130 PDK directly in your web browser.", url: "https://chipverify.com/", badge: "Yosys + Sky130" },
  { name: "Icarus Verilog + GTKWave", description: "Industry standard open-source simulation & waveform analysis suite.", url: "http://iverilog.icarus.com/", badge: "Open Source CLI" },
  { name: "Verilator", description: "High-performance open-source Verilog/SystemVerilog cycle-accurate simulator.", url: "https://www.veripool.org/verilator/", badge: "High Speed C++" },
  { name: "Surfer Waveform Viewer", description: "Modern, fast waveform viewer alternative/complement to GTKWave.", url: "https://surfer-project.org/", badge: "Rust Waveform" },
];

export default function AcademyDashboard() {
  const [tracks, setTracks] = useState<LearningTrack[]>([]);
  const [completedDays, setCompletedDays] = useState<string[]>([]);
  const [passedTracks, setPassedTracks] = useState<TrackSlug[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const timeout = setTimeout(() => {
      setTracks((prev) => (prev.length > 0 ? prev : FALLBACK_TRACKS));
      setLoading(false);
    }, 2500);

    try {
      let tracksData: LearningTrack[] = [];
      try {
        const res = await Promise.race([
          api.get<any>("/api/academy/tracks"),
          new Promise<any>((_, rej) => setTimeout(() => rej(new Error("timeout")), 2000)),
        ]);
        tracksData = Array.isArray(res) ? res : res?.tracks || [];
      } catch {
        tracksData = FALLBACK_TRACKS;
      }
      if (!tracksData || tracksData.length === 0) {
        tracksData = FALLBACK_TRACKS;
      }
      setTracks(tracksData);

      const localCd: string[] = [];
      const tracksToCheck = tracksData.length > 0 ? tracksData : FALLBACK_TRACKS;
      for (const t of tracksToCheck) {
        localCd.push(...getCompletedDaysLocal(t.slug));
      }
      setCompletedDays(localCd);
      setPassedTracks(getPassedTracksLocal() as TrackSlug[]);
    } catch (err) {
      console.error("Academy load failed:", err);
      setTracks(FALLBACK_TRACKS);
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-8">
        <div className="max-w-3xl space-y-3">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
            Curriculum Academy
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            VLSI Learning Academy
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            7 structured curriculum tracks with verified NPTEL university lectures, Siemens EDA tutorials, hands-on lab cases, and auto-graded assessments.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="mt-4 text-xs font-medium text-slate-500">Loading curriculum tracks...</p>
        </div>
      ) : (
        <>
          {/* TRACKS */}
          <div className="space-y-6">
            <SectionHeader
              eyebrow="Structured Tracks"
              title="7 Core Curriculum Tracks"
              description="Progress through day-by-day lesson curricula, practice quizzes, and checkpoint assessments."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tracks.map((t, idx) => {
                const isPassed = passedTracks.includes(t.slug);
                const isLocked =
                  idx > 0 &&
                  !passedTracks.includes(tracks[idx - 1]?.slug) &&
                  !passedTracks.includes(t.slug);

                return (
                  <div
                    key={t.id}
                    className={cn(
                      "bg-white border rounded-xl p-6 shadow-sm flex flex-col justify-between transition-all",
                      isLocked
                        ? "border-slate-200/60 opacity-80"
                        : "border-slate-200 hover:border-slate-300 hover:shadow-md"
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          Track 0{idx + 1}
                        </span>
                        {isPassed ? (
                          <Badge tone="success">
                            <CheckCircle2 className="w-3 h-3" /> Passed
                          </Badge>
                        ) : isLocked ? (
                          <Badge tone="neutral">
                            <Lock className="w-3 h-3" /> Locked
                          </Badge>
                        ) : (
                          <Badge tone="accent">
                            <Zap className="w-3 h-3" /> Active
                          </Badge>
                        )}
                      </div>

                      <h3 className="font-display font-bold text-base text-slate-900 mb-2">
                        {t.title || t.name}
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed mb-4">
                        {t.description}
                      </p>

                      {isLocked && (
                        <div className="mb-4 p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-lg flex items-start gap-2 text-xs text-amber-800">
                          <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                          <span>
                            Complete Track {idx} ({tracks[idx - 1]?.title || "Previous"}) checkpoint to unlock.
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-mono">
                        {t.estimated_days} Days Curriculum
                      </span>
                      <Link
                        href={`/academy/${t.slug}`}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-sm",
                          isLocked
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                            : isPassed
                            ? "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                        )}
                      >
                        {isPassed ? "Review Track" : isLocked ? "Locked" : "Open Track"}
                        {!isLocked && <Play className="w-3 h-3 fill-current ml-0.5" />}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CURATED SOURCES */}
          <div className="space-y-6">
            <SectionHeader
              eyebrow="Reference Library"
              title="Curated External Lecture Sources"
              description="Official references from NPTEL IIT Kharagpur, Siemens EDA Verification Academy, ChipVerify, and OpenROAD."
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {TRUSTED_SOURCES.map((sec, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
                  <h3 className="font-display font-semibold text-sm text-slate-900 pb-2 border-b border-slate-100">
                    {sec.category}
                  </h3>
                  <div className="space-y-2">
                    {sec.resources.map((r, rIdx) => (
                      <a
                        key={rIdx}
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group block p-2.5 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-medium text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                            {r.name}
                          </span>
                          <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-600 shrink-0 mt-0.5" />
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] font-mono font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                            {r.type}
                          </span>
                          <span className="text-[10px] text-slate-400">{r.tag}</span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* EDA TOOLS */}
          <div className="space-y-6">
            <SectionHeader
              eyebrow="Simulators & Tooling"
              title="Open-Source EDA Tools & Simulators"
              description="Free browser-based and local simulators to write, test, synthesize, and inspect digital waveforms."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {EDA_TOOLS.map((tool, idx) => (
                <a
                  key={idx}
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {tool.badge}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <h3 className="font-display font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                      {tool.name}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {tool.description}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
