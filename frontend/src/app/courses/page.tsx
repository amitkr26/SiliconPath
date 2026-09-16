"use client";

import React from "react";
import Link from "next/link";
import {
  GraduationCap,
  CheckCircle2,
  ArrowRight,
  Zap,
  BookOpen,
  FileText,
  Map,
  Layers,
  Terminal,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface Resource {
  id: string;
  title: string;
  category: string;
  level: "Beginner" | "Intermediate" | "All levels";
  levelTone: "success" | "accent" | "neutral";
  icon: React.ReactNode;
  features: string[];
  desc: string;
  href: string;
  ctaText: string;
}

const RESOURCES: Resource[] = [
  {
    id: "openlane",
    title: "OpenLane RTL-to-GDSII Complete Flow Guide",
    category: "Tapeout & EDA Tooling",
    level: "Intermediate",
    levelTone: "accent",
    icon: <Zap className="w-5 h-5 text-blue-600" />,
    desc: "Complete step-by-step physical implementation on the SkyWater Sky130 PDK using open-source tools: Yosys, OpenROAD, and Magic.",
    features: [
      "Full open-source ASIC flow walkthrough",
      "Synthesis, Floorplan, PDN, CTS, and Routing commands",
      "Verifiable Sky130 PDK configuration files",
      "DRC, LVS, and signoff troubleshooting guide",
    ],
    href: "/courses/openlane-rtl-to-gds",
    ctaText: "Read Tapeout Guide",
  },
  {
    id: "interview",
    title: "Static Timing Analysis (STA) Interview Question Bank",
    category: "Interview Preparation",
    level: "All levels",
    levelTone: "neutral",
    icon: <BookOpen className="w-5 h-5 text-indigo-600" />,
    desc: "55 curated interview questions with detailed engineering answers covering setup/hold, clock skew, jitter, OCV, crosstalk, and SDC constraints.",
    features: [
      "55 questions with expandable mathematical proofs & answers",
      "Setup, Hold, Clock Tree, and Signal Integrity topics",
      "Real-world scenario & timing report analysis questions",
      "Instant keyword search and topic filtering",
    ],
    href: "/sta-interview-questions",
    ctaText: "Practice 55 Questions",
  },
  {
    id: "roadmap",
    title: "8-Week VLSI Engineering Career Roadmap",
    category: "Career & Planning",
    level: "Beginner",
    levelTone: "success",
    icon: <Map className="w-5 h-5 text-emerald-600" />,
    desc: "Structured study blueprint for students and transitioning engineers: from digital logic fundamentals to tapeout-ready physical design.",
    features: [
      "Week-by-week structured curriculum guide",
      "Tool setup instructions for open-source EDA simulators",
      "Recommended textbook chapters and papers",
      "Clear milestone checkpoints and self-assessments",
    ],
    href: "/learn/career-roadmap",
    ctaText: "Explore 8-Week Roadmap",
  },
  {
    id: "resume",
    title: "Semiconductor Technical Resume & Portfolio Guide",
    category: "Career & Hiring",
    level: "All levels",
    levelTone: "neutral",
    icon: <FileText className="w-5 h-5 text-slate-700" />,
    desc: "How to craft an ATS-optimized semiconductor resume: bullet point formulas, EDA tool matrices, tapeout metric reporting, and portfolio ideas.",
    features: [
      "Before & after bullet point rewrite comparisons",
      "Categorized EDA skills matrix formatting",
      "Quantified QoR metrics guide (slack, power, area)",
      "3 high-credibility portfolio projects that hiring managers respect",
    ],
    href: "/courses/resume-tips",
    ctaText: "View Resume Guide",
  },
];

export default function CoursesPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-10">

        {/* BREADCRUMB */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="hover:text-slate-900 transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-medium">Free Resources</span>
        </nav>

        {/* HEADER */}
        <header className="border-b border-slate-200 pb-8 space-y-3">
          <div className="flex items-center gap-2">
            <Badge tone="accent">Editorial Guides</Badge>
            <Badge tone="neutral">100% Free Access</Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Curated VLSI Engineering Guides & Resources
          </h1>
          <p className="text-base text-slate-600 max-w-2xl leading-relaxed">
            Technical deep dives, interview question banks, career roadmaps, and tapeout walkthroughs. No paywalls, no signup gates, no marketing fluff.
          </p>
        </header>

        {/* RESOURCE CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {RESOURCES.map((resource) => (
            <div
              key={resource.id}
              className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between hover:border-slate-300 transition-all shadow-sm group"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
                    {resource.icon}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-500">{resource.category}</span>
                    <Badge tone={resource.levelTone}>{resource.level}</Badge>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {resource.title}
                  </h2>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1.5">
                    {resource.desc}
                  </p>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <ul className="space-y-2">
                    {resource.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <Button href={resource.href} variant="primary" size="sm" className="w-full justify-center">
                  {resource.ctaText} <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* SYSTEM CURRICULUM BANNER */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8 text-white space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Looking for the complete structured curriculum?</h3>
              <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                SiliconPath provides 15 structured learning paths covering 150 technical modules from Digital Logic and Verilog HDL to Clock Tree Synthesis and Physical Verification.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Button href="/learn" variant="primary" size="md">
                Browse All 15 Paths <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
              <Button href="/engineering-lab" variant="ghost" size="md" className="text-slate-300 hover:text-white border-slate-700">
                Engineering Lab
              </Button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
