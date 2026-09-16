"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ExternalLink, Search, GraduationCap, PlaySquare, ArrowLeft } from "lucide-react";
import { VIDEO_COURSES, VIDEO_COURSE_GROUPS, type VideoCourseReference } from "@/lib/video-references";
import { Badge } from "@/components/ui/Badge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { cn } from "@/lib/utils";

const GROUP_TONE: Record<string, "accent" | "success" | "warning" | "purple" | "neutral"> = {
  "Digital Logic & RTL Design": "accent",
  "Verification, DFT & Formal": "purple",
  "Synthesis, Physical Design & Timing": "success",
  "Low Power & VLSI Subsystems": "warning",
  "Analog & Mixed-Signal ICs": "neutral",
  "Semiconductor Devices & Fabrication": "warning",
  "Embedded, Computer Architecture & Programming": "purple",
  "Core ECE Fundamentals": "neutral",
};

export default function VideoCoursesPage() {
  const [query, setQuery] = useState("");
  const [activeGroup, setActiveGroup] = useState<string>("all");

  const filtered = VIDEO_COURSES.filter((c) => {
    const q = query.toLowerCase();
    const matchesQuery =
      !q ||
      c.title.toLowerCase().includes(q) ||
      c.instructor.toLowerCase().includes(q) ||
      c.institute.toLowerCase().includes(q);
    const matchesGroup = activeGroup === "all" || c.group === activeGroup;
    return matchesQuery && matchesGroup;
  });

  const nptelCount = VIDEO_COURSES.filter((c) => c.source === "nptel").length;
  const playlistCount = VIDEO_COURSES.length - nptelCount;

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-8">
        <Link
          href="/learn"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Learning Paths
        </Link>
        <div className="max-w-3xl space-y-3">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
            Free Video Course Library
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            NPTEL &amp; YouTube Video Courses
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            {nptelCount} curated NPTEL university courses plus {playlistCount} full YouTube
            playlists — every one free and public. Filter by topic or search by title,
            instructor, or institute.
          </p>
        </div>

        {/* Filter / Search Bar */}
        <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveGroup("all")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap",
                activeGroup === "all"
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              )}
            >
              All ({VIDEO_COURSES.length})
            </button>
            {VIDEO_COURSE_GROUPS.map((g) => {
              const count = VIDEO_COURSES.filter((c) => c.group === g).length;
              return (
                <button
                  key={g}
                  onClick={() => setActiveGroup(g)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap",
                    activeGroup === g
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  )}
                >
                  {g} ({count})
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search courses, instructors, institutes..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 placeholder:text-slate-400 shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Grouped Listings */}
      {VIDEO_COURSE_GROUPS.map((group) => {
        const items = filtered.filter((c) => c.group === group && (activeGroup === "all" || activeGroup === group));
        if (items.length === 0) return null;
        return (
          <div key={group} className="space-y-4">
            <SectionHeader eyebrow={group} title={group} description={`${items.length} free course${items.length === 1 ? "" : "s"}`} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map((c) => (
                <CourseCard key={`${c.source}-${c.id}`} course={c} />
              ))}
            </div>
          </div>
        );
      })}

      {filtered.length === 0 && (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-xl p-8 space-y-3">
          <p className="text-sm font-semibold text-slate-900">No matching video courses</p>
          <p className="text-xs text-slate-500">
            Nothing matched &quot;{query}&quot;. Try &quot;Verilog&quot;, &quot;VLSI&quot;, or &quot;IIT Madras&quot;.
          </p>
          <button
            onClick={() => {
              setQuery("");
              setActiveGroup("all");
            }}
            className="text-xs font-semibold text-blue-600 hover:underline"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}

function CourseCard({ course }: { course: VideoCourseReference }) {
  const SourceIcon = course.source === "nptel" ? GraduationCap : PlaySquare;
  return (
    <a
      href={course.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display font-semibold text-sm text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
            {course.title}
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {course.instructor} · {course.institute}
          </p>
        </div>
        <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
          <SourceIcon className="w-4 h-4" />
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <Badge tone={GROUP_TONE[course.group] || "neutral"}>{course.source === "nptel" ? "NPTEL" : "YouTube Playlist"}</Badge>
        {course.companion && <Badge tone="neutral">Companion</Badge>}
        {course.paths.map((p) => (
          <Link
            key={p}
            href={`/learn/${p}`}
            onClick={(e) => e.stopPropagation()}
            className="text-[10px] font-mono text-slate-600 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 px-2 py-0.5 rounded border border-slate-200/60 transition-colors"
          >
            {p}
          </Link>
        ))}
        <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-600 ml-auto shrink-0" />
      </div>
    </a>
  );
}