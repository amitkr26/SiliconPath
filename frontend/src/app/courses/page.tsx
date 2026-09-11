"use client";

import React from "react";
import {
  GraduationCap,
  CheckCircle2,
  ArrowRight,
  Zap,
  BookOpen,
  FileText,
  Map,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

interface Resource {
  id: string;
  title: string;
  level: "Beginner" | "Intermediate" | "All levels";
  levelTone: "success" | "accent" | "neutral";
  icon: React.ReactNode;
  features: string[];
  desc: string;
  href: string;
}

const RESOURCES: Resource[] = [
  {
    id: "openlane",
    title: "OpenLane RTL-to-GDS Guide",
    level: "Intermediate",
    levelTone: "accent",
    icon: <Zap className="w-5 h-5" />,
    desc: "Full RTL to GDSII flow using OpenLane on a real design, step by step. 100% free.",
    features: [
      "Complete open-source flow walkthrough",
      "Synthesis, P&R, CTS, and signoff",
      "Real SkyWater Sky130 PDK labs",
      "Hands-on with OpenROAD tools",
    ],
    href: "/courses/openlane-rtl-to-gds",
  },
  {
    id: "interview",
    title: "Interview Q&A Collection",
    level: "All levels",
    levelTone: "neutral",
    icon: <BookOpen className="w-5 h-5" />,
    desc: "90+ real interview questions with detailed answers across PD, Synthesis, STA, and PV. 100% free.",
    features: [
      "90+ interview Q&A with answers",
      "PD, Synthesis, STA, and PV topics",
      "Real-world scenario-based questions",
      "Expandable detailed explanations",
    ],
    href: "/sta-interview-questions",
  },
  {
    id: "roadmap",
    title: "Career Roadmap",
    level: "Beginner",
    levelTone: "success",
    icon: <Map className="w-5 h-5" />,
    desc: "Complete beginner roadmap for VLSI freshers, with an 8-week structured study plan. 100% free.",
    features: [
      "8-week structured study plan",
      "VLSI career roadmap",
      "Tool setup guides",
      "Beginner-friendly explanations",
    ],
    href: "/learn/career-roadmap",
  },
  {
    id: "resume",
    title: "Resume Tips",
    level: "All levels",
    levelTone: "neutral",
    icon: <FileText className="w-5 h-5" />,
    desc: "VLSI-specific resume templates and tips that get you shortlisted. 100% free.",
    features: [
      "VLSI-specific resume templates",
      "Keyword optimization guide",
      "Portfolio project ideas",
      "LinkedIn profile tips",
    ],
    href: "/courses/resume-tips",
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function CoursesPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-12">

        {/* HERO */}
        <Card tone="accent" className="p-8 sm:p-12 shadow-brutal-lg relative overflow-hidden">
          <div className="max-w-3xl space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white text-slate-900 text-xs font-black border-2 border-slate-900 shadow-brutal-sm">
              <GraduationCap className="w-4 h-4 text-blue-600 stroke-[2.5]" />
              <span>100% FREE RESOURCES</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Free VLSI resources
            </h1>
            <p className="text-blue-50 text-sm sm:text-base font-medium leading-relaxed">
              Everything you need to learn VLSI — guides, interview prep, career roadmaps, and resume tips. No paywall, no login required.
            </p>
          </div>
        </Card>

        {/* RESOURCES */}
        <div>
          <SectionHeader
            eyebrow="All Free"
            title="Free resources"
            description="Every resource is free. Pick what you need."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {RESOURCES.map((resource) => (
              <Card key={resource.id} hover className="p-6 flex flex-col justify-between relative">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border-2 border-slate-900 flex items-center justify-center text-blue-600">
                      {resource.icon}
                    </div>
                    <Badge tone={resource.levelTone}>{resource.level}</Badge>
                  </div>

                  <h3 className="font-black text-slate-900 text-lg mb-1">{resource.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed mb-4">{resource.desc}</p>

                  <ul className="space-y-2">
                    {resource.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-200">
                  <Button variant="primary" size="sm" href={resource.href}>
                    Access Free <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* BOTTOM CTA */}
        <Card className="p-8 text-center border-2 border-slate-200">
          <h2 className="text-xl font-black text-slate-900 mb-2">
            Not sure where to start?
          </h2>
          <p className="text-slate-500 text-sm font-medium mb-5 max-w-lg mx-auto">
            Start with the free learning paths. 15 structured paths covering the full VLSI flow — from Digital Electronics to Physical Verification.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button href="/learn" variant="primary" size="lg">
              Start Learning Free <ArrowRight className="w-4 h-4" />
            </Button>
            <Button href="/sta-interview-questions" variant="ghost" size="lg">
              Try STA Q&A Free
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
