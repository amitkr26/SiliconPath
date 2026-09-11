"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Sparkles, Play, Lock, Zap, CheckCircle2, ExternalLink } from "lucide-react";
import { api } from "@/lib/api-client";
import { FALLBACK_TRACKS } from "@/lib/academy/fallback";
import type { LearningTrack, TrackSlug } from "@/lib/academy/types";
import { getCompletedDaysLocal, getPassedTracksLocal } from "@/lib/academy/progress-local";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { cn } from "@/lib/utils";

const TRUSTED_SOURCES = [
  {
    category: "Digital Design & RTL (Track 1)",
    color: "bg-blue-600",
    resources: [
      { name: "NPTEL - Digital Circuits (IIT Kharagpur, Prof. Santanu Chattopadhyay)", url: "https://onlinecourses.nptel.ac.in/", type: "Course", tag: "NPTEL / IIT" },
      { name: "NPTEL - Hardware Modeling using Verilog (IIT Kharagpur, Prof. Indranil Sengupta)", url: "https://onlinecourses.nptel.ac.in/", type: "Course", tag: "NPTEL / IIT" },
      { name: "HDLBits (01xz) Interactive Practice", url: "https://hdlbits.01xz.net/", type: "Interactive Practice", tag: "Auto-graded" },
      { name: "ChipVerify - Verilog & Digital Design", url: "https://chipverify.com/", type: "Tutorial & Lab", tag: "Self-Paced" },
      { name: "ARM Education Media", url: "https://www.arm.com/resources/education", type: "Official Reference", tag: "ARM Architecture" },
    ]
  },
  {
    category: "Verification SV & UVM (Track 2)",
    color: "bg-indigo-600",
    resources: [
      { name: "Verification Academy (Siemens EDA)", url: "https://verificationacademy.com/", type: "Course & Reference", tag: "Industry Standard" },
      { name: "ChipVerify - SystemVerilog & UVM Tutorials", url: "https://chipverify.com/systemverilog", type: "Tutorial & Code", tag: "Hands-on" },
      { name: "Verification Guide - UVM Masterclass", url: "https://verificationguide.com/uvm/uvm-tutorial/", type: "Tutorial", tag: "UVM Library" },
      { name: "Doulos Knowhow - UVM Verification Primer", url: "https://www.doulos.com/knowhow/systemverilog/uvm/", type: "Article & Code", tag: "Advanced" },
    ]
  },
  {
    category: "Physical Design & Backend (Track 3)",
    color: "bg-purple-600",
    resources: [
      { name: "NPTEL - VLSI Design Flow: RTL to GDS (IIIT Delhi, Prof. Sneh Saurabh)", url: "https://nptel.ac.in/courses/108106191", type: "Course", tag: "RTL to GDSII" },
      { name: "OpenLane - Open-Source RTL-to-GDSII Flow", url: "https://github.com/The-OpenROAD-Project/OpenLane", type: "Tool & Docs", tag: "OpenROAD" },
      { name: "SkyWater Sky130 PDK Documentation", url: "https://skywater-pdk.readthedocs.io/", type: "Process Reference", tag: "130nm PDK" },
      { name: "OpenROAD Project Documentation", url: "https://openroad.readthedocs.io/", type: "EDA Docs", tag: "Place & Route" },
    ]
  }
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
      setTracks((prev) => prev.length > 0 ? prev : FALLBACK_TRACKS);
      setLoading(false);
    }, 2500);

    try {
      let tracksData: LearningTrack[] = [];
      try {
        const res = await Promise.race([
          api.get<any>("/api/academy/tracks"),
          new Promise<any>((_, rej) => setTimeout(() => rej(new Error("timeout")), 2000)),
        ]);
        tracksData = Array.isArray(res) ? res : (res?.tracks || []);
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

  useEffect(() => { loadData(); }, [loadData]);

  return (
    <div className="min-h-screen bg-[#FAF9F6] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">

        {/* ACADEMY HERO */}
        <Card tone="accent" className="p-8 sm:p-12 shadow-brutal-lg relative overflow-hidden">
          <div className="max-w-3xl space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white text-slate-900 text-xs font-black border-2 border-slate-900 shadow-brutal-sm">
              <Sparkles className="w-4 h-4 text-blue-600 stroke-[2.5]" />
              <span>SELF-PACED HARDWARE &amp; VLSI CURRICULUM</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              VLSI &amp; Microelectronics Learning Paths
            </h1>
            <p className="text-blue-50 text-sm sm:text-base font-medium leading-relaxed">
              Structured learning paths with verified NPTEL lectures, ChipVerify tutorials, SystemVerilog/UVM masterclasses, OpenLANE Physical Design labs, and auto-graded assessments.
            </p>
          </div>
        </Card>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-10 h-10 border-4 border-slate-900 border-t-blue-600 rounded-full animate-spin" />
            <p className="mt-4 text-slate-900 font-black text-sm">Loading VLSI Academy Tracks &amp; Trusted Resources...</p>
          </div>
        ) : (
        <>
        {/* CURRICULUM TRACKS */}
        <div>
          <SectionHeader
            eyebrow="Curriculum"
            title="Structured Curriculum Tracks"
            description="Complete each daily module and pass the track checkpoint exam to unlock advanced tracks."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tracks.map((t, idx) => {
              const isPassed = passedTracks.includes(t.slug);
              const isLocked = idx > 0 && !passedTracks.includes(tracks[idx - 1]?.slug) && !passedTracks.includes(t.slug);

              return (
                <Card
                  key={t.id}
                  hover={!isLocked}
                  className={cn("p-6 flex flex-col justify-between", isLocked && "bg-slate-50 border-slate-300")}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <Badge tone="inverse">Track {idx + 1}</Badge>
                      {isPassed ? (
                        <Badge tone="success">
                          <CheckCircle2 className="w-3 h-3" /> Completed
                        </Badge>
                      ) : isLocked ? (
                        <Badge tone="neutral">
                          <Lock className="w-3 h-3" /> Locked
                        </Badge>
                      ) : (
                        <Badge tone="accent">
                          <Zap className="w-3 h-3" /> In Progress
                        </Badge>
                      )}
                    </div>

                    <h3 className="font-black text-slate-900 text-lg mb-2">{t.title || t.name}</h3>
                    <p className="text-slate-600 text-xs leading-relaxed font-medium mb-4">
                      {t.description}
                    </p>

                    {isLocked && (
                      <div className="mb-4 p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                        <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-amber-900 font-semibold leading-tight">
                          Prerequisite: Pass Track {idx} ({tracks[idx - 1]?.title || tracks[idx - 1]?.name || "Previous Track"}) checkpoint to unlock.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t-2 border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">{t.estimated_days} Days Curriculum</span>
                    <Button
                      href={`/academy/${t.slug}`}
                      size="sm"
                      variant={isLocked ? "ghost" : isPassed ? "secondary" : "primary"}
                      disabled={isLocked}
                      className={cn(isLocked && "cursor-not-allowed text-slate-400 border-slate-300")}
                    >
                      {isPassed ? "Review Track" : isLocked ? "Locked" : "Start Track"}
                      {!isLocked && <Play className="w-3 h-3 fill-current ml-1" />}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* TRUSTED RESOURCES HUB */}
        <div>
          <SectionHeader
            eyebrow="Curated Reference Library"
            title="Trusted Resources & Lecture Sources"
            description="Official learning resources from NPTEL IITs, Siemens EDA Verification Academy, ChipVerify, Doulos Knowhow, and OpenROAD."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TRUSTED_SOURCES.map((sec, i) => (
              <Card key={i} className="p-5">
                <h3 className="font-black text-slate-900 text-sm mb-4 pb-3 border-b-2 border-slate-100 flex items-center gap-2">
                  <span className={cn("w-3 h-3 rounded-full border-2 border-slate-900", sec.color)} />
                  {sec.category}
                </h3>
                <div className="space-y-3">
                  {sec.resources.map((r, rIdx) => (
                    <a
                      key={rIdx}
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-xl transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                          {r.name}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0 stroke-[2.5]" />
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                          {r.type}
                        </span>
                        <span className="text-[9px] font-bold text-slate-500">{r.tag}</span>
                      </div>
                    </a>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* FREE EDA TOOLS & SIMULATORS */}
        <div>
          <SectionHeader
            eyebrow="Interactive Hands-On Practice"
            title="Embedded Open-Source EDA Tools"
            description="Free browser-based and local simulators to write, test, synthesize, and view waveforms."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {EDA_TOOLS.map((tool, idx) => (
              <a key={idx} href={tool.url} target="_blank" rel="noopener noreferrer" className="block group">
                <Card hover className="p-6 h-full">
                  <div className="flex items-center justify-between mb-3">
                    <Badge tone="accent">{tool.badge}</Badge>
                    <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors stroke-[2.5]" />
                  </div>
                  <h3 className="font-black text-slate-900 text-base group-hover:text-blue-600 transition-colors mb-1.5">
                    {tool.name}
                  </h3>
                  <p className="text-slate-600 text-xs leading-relaxed font-medium">
                    {tool.description}
                  </p>
                </Card>
              </a>
            ))}
          </div>
        </div>

        </>
        )}

      </div>
    </div>
  );
}
