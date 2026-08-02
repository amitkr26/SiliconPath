"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { 
  Cpu, Code2, Shield, TestTube, Layers, Trophy, Lock, Zap, Play, Check, 
  AlertCircle, RefreshCw, Sparkles, ExternalLink, BookOpen, Terminal, CheckCircle2 
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { api } from "@/lib/api-client";
import type { LearningTrack, TrackSlug } from "@/lib/academy/types";

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
  const { user } = useUser();
  const [tracks, setTracks] = useState<LearningTrack[]>([]);
  const [completedDays, setCompletedDays] = useState<string[]>([]);
  const [passedTracks, setPassedTracks] = useState<TrackSlug[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const timeout = setTimeout(() => {
      setTracks((prev) => prev.length > 0 ? prev : (require("@/lib/academy/queries").FALLBACK_TRACKS || []));
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
        tracksData = (await import("@/lib/academy/queries")).FALLBACK_TRACKS;
      }
      if (!tracksData || tracksData.length === 0) {
        tracksData = (await import("@/lib/academy/queries")).FALLBACK_TRACKS;
      }
      setTracks(tracksData);

      const userId = user?.id || null;
      const [cd, pt] = await Promise.all([
        api.get<string[]>("/api/academy/progress/completed-days", { params: { userId: userId || "" } }).catch(() => []),
        api.get<TrackSlug[]>("/api/academy/progress/passed-tracks", { params: { userId: userId || "" } }).catch(() => []),
      ]);
      setCompletedDays(cd || []);
      setPassedTracks(pt || []);
    } catch (err) {
      console.error("Academy load failed:", err);
      setTracks((await import("@/lib/academy/queries")).FALLBACK_TRACKS);
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF9F6] px-4">
        <div className="w-10 h-10 border-4 border-slate-900 border-t-blue-600 rounded-full animate-spin" />
        <p className="mt-4 text-slate-900 font-black text-sm">Loading VLSI Academy Tracks &amp; Trusted Resources...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* ACADEMY HERO */}
        <div className="p-8 sm:p-12 rounded-2xl bg-blue-600 border-3 border-slate-900 text-white shadow-[6px_6px_0px_0px_#0F172A] relative overflow-hidden">
          <div className="max-w-3xl space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white text-slate-900 text-xs font-black border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0F172A]">
              <Sparkles className="w-4 h-4 text-blue-600 stroke-[2.5]" />
              <span>SELF-PACED HARDWARE &amp; VLSI CURRICULUM</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              VLSI &amp; Microelectronics Courses
            </h1>
            <p className="text-blue-50 text-sm sm:text-base font-semibold leading-relaxed">
              Structured learning paths with verified NPTEL lectures, ChipVerify tutorials, SystemVerilog/UVM masterclasses, OpenLANE Physical Design labs, and auto-graded assessments.
            </p>
          </div>
        </div>

        {/* CURRICULUM TRACKS */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Structured Curriculum Tracks
            </h2>
            <p className="text-slate-600 text-sm mt-1 font-semibold">
              Complete each daily module and pass the track checkpoint exam to unlock advanced tracks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tracks.map((t, idx) => {
              const isPassed = passedTracks.includes(t.slug);
              const isLocked = idx > 0 && !passedTracks.includes(tracks[idx - 1]?.slug) && !passedTracks.includes(t.slug);

              return (
                <div
                  key={t.id}
                  className={`bg-white border-3 border-slate-900 rounded-2xl p-6 shadow-[5px_5px_0px_0px_#0F172A] flex flex-col justify-between transition-all ${
                    isLocked ? "opacity-70 bg-slate-100" : "hover:-translate-y-1"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-md bg-blue-100 text-blue-800 border-2 border-slate-900 shadow-[1.5px_1.5px_0px_0px_#0F172A]">
                        Track {t.order_index || idx + 1}
                      </span>
                      {isPassed ? (
                        <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" /> Passed
                        </span>
                      ) : isLocked ? (
                        <span className="inline-flex items-center gap-1 text-xs font-black text-slate-500 bg-slate-200 px-2.5 py-1 rounded-md border border-slate-400">
                          <Lock className="w-3.5 h-3.5 stroke-[2.5]" /> Locked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                          <Zap className="w-3.5 h-3.5 stroke-[2.5]" /> Active
                        </span>
                      )}
                    </div>

                    <h3 className="font-extrabold text-slate-900 text-lg mb-2">{t.title || t.name}</h3>
                    <p className="text-slate-600 text-xs leading-relaxed font-semibold mb-6">
                      {t.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t-2 border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">{t.estimated_days} Days Curriculum</span>
                    <Link
                      href={`/academy/${t.slug}`}
                      className={`px-4 py-2 rounded-xl text-xs font-black border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0F172A] transition-all inline-flex items-center gap-1.5 ${
                        isLocked
                          ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-[3px_3px_0px_0px_#0F172A]"
                      }`}
                    >
                      <span>{isPassed ? "Review Track" : "Start Track"}</span>
                      <Play className="w-3 h-3 fill-white stroke-none" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* TRUSTED RESOURCES HUB */}
        <div className="bg-white border-3 border-slate-900 rounded-2xl p-6 sm:p-10 shadow-[6px_6px_0px_0px_#0F172A]">
          <div className="mb-8">
            <div className="flex items-center gap-2 text-xs font-black uppercase text-blue-600 mb-1">
              <BookOpen className="w-4 h-4 stroke-[3]" />
              <span>Curated Reference Library</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Trusted Resources &amp; Lecture Sources
            </h2>
            <p className="text-slate-600 text-sm mt-1 font-semibold">
              Official courses from NPTEL IITs, Siemens EDA Verification Academy, ChipVerify, Doulos Knowhow, and OpenROAD.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TRUSTED_SOURCES.map((sec, i) => (
              <div key={i} className="border-2 border-slate-900 rounded-xl p-5 bg-slate-50 shadow-[3px_3px_0px_0px_#0F172A]">
                <h3 className="font-extrabold text-slate-900 text-sm mb-4 pb-2 border-b-2 border-slate-200 flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${sec.color} border border-slate-900`} />
                  {sec.category}
                </h3>
                <div className="space-y-3">
                  {sec.resources.map((r, rIdx) => (
                    <a
                      key={rIdx}
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block p-3 bg-white border-2 border-slate-900 rounded-lg hover:bg-blue-50 transition-all shadow-[2px_2px_0px_0px_#0F172A]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                          {r.name}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0 stroke-[2.5]" />
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-slate-900">
                          {r.type}
                        </span>
                        <span className="text-[9px] font-bold text-slate-500">{r.tag}</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FREE EDA TOOLS & SIMULATORS */}
        <div className="bg-white border-3 border-slate-900 rounded-2xl p-6 sm:p-10 shadow-[6px_6px_0px_0px_#0F172A]">
          <div className="mb-8">
            <div className="flex items-center gap-2 text-xs font-black uppercase text-blue-600 mb-1">
              <Terminal className="w-4 h-4 stroke-[3]" />
              <span>Interactive Hands-On Practice</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Embedded Open-Source EDA Tools
            </h2>
            <p className="text-slate-600 text-sm mt-1 font-semibold">
              Free browser-based and local simulators to write, test, synthesize, and view waveforms.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {EDA_TOOLS.map((tool, idx) => (
              <a
                key={idx}
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-slate-50 border-2 border-slate-900 rounded-xl p-6 shadow-[3.5px_3.5px_0px_0px_#0F172A] hover:shadow-[5px_5px_0px_0px_#0F172A] hover:-translate-y-1 transition-all group block"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded bg-blue-600 text-white border border-slate-900 shadow-[1px_1px_0px_0px_#0F172A]">
                    {tool.badge}
                  </span>
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors stroke-[2.5]" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-base group-hover:text-blue-600 transition-colors mb-1.5">
                  {tool.name}
                </h3>
                <p className="text-slate-600 text-xs leading-relaxed font-semibold">
                  {tool.description}
                </p>
              </a>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
