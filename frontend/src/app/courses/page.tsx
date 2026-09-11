"use client";

import React from "react";
import {
  GraduationCap,
  Star,
  CheckCircle2,
  ArrowRight,
  Zap,
  BookOpen,
  FileText,
  Package,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

interface Course {
  id: string;
  title: string;
  price: string;
  originalPrice: string | null;
  level: "Beginner" | "Intermediate" | "All levels";
  levelTone: "success" | "accent" | "neutral";
  icon: React.ReactNode;
  features: string[];
  desc: string;
  popular?: boolean;
}

const COURSES: Course[] = [
  {
    id: "openlane",
    title: "OpenLane RTL-to-GDS",
    price: "₹999",
    originalPrice: "₹1,999",
    level: "Intermediate",
    levelTone: "accent",
    icon: <Zap className="w-5 h-5" />,
    desc: "Full RTL to GDSII flow using OpenLane on a real design, step by step.",
    features: [
      "Complete open-source flow walkthrough",
      "Synthesis, P&R, CTS, and signoff",
      "Real SkyWater Sky130 PDK labs",
      " hands-on with OpenROAD tools",
      "Certificate of completion",
    ],
  },
  {
    id: "bootcamp",
    title: "Interview Bootcamp",
    price: "₹299",
    originalPrice: "₹499",
    level: "All levels",
    levelTone: "neutral",
    icon: <BookOpen className="w-5 h-5" />,
    desc: "90+ real interview questions with detailed answers across PD, Synthesis, STA, and PV.",
    features: [
      "90+ interview Q&A with answers",
      "PD, Synthesis, STA, and PV topics",
      "Real-world scenario-based questions",
      "Expandable detailed explanations",
      "Regular content updates",
    ],
    popular: true,
  },
  {
    id: "fresher-pack",
    title: "Fresher Pack",
    price: "₹199",
    originalPrice: "₹299",
    level: "Beginner",
    levelTone: "success",
    icon: <GraduationCap className="w-5 h-5" />,
    desc: "Complete beginner roadmap for VLSI freshers, with an 8-week structured study plan.",
    features: [
      "8-week structured study plan",
      "VLSI career roadmap",
      "Tool setup guides",
      "Beginner-friendly explanations",
      "Community access",
    ],
  },
  {
    id: "resume-tips",
    title: "Resume Tips",
    price: "₹99",
    originalPrice: "₹199",
    level: "All levels",
    levelTone: "neutral",
    icon: <FileText className="w-5 h-5" />,
    desc: "VLSI-specific resume templates and tips that get you shortlisted.",
    features: [
      "VLSI-specific resume templates",
      "Keyword optimization guide",
      "Portfolio project ideas",
      "LinkedIn profile tips",
      "ATS-friendly formatting",
    ],
  },
];

const BUNDLE = {
  title: "Career Starter Bundle",
  price: "₹499",
  savings: "₹98",
  desc: "Get Interview Bootcamp + Fresher Pack + Resume Tips in one bundle.",
  features: [
    "Interview Bootcamp (₹299 value)",
    "Fresher Pack (₹199 value)",
    "Resume Tips (₹99 value)",
    "Save ₹98 vs buying separately",
    "Instant access to all three",
  ],
};

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
              <span>COURSES & BUNDLES</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Structured programs,<br />focused outcomes
            </h1>
            <p className="text-blue-50 text-sm sm:text-base font-medium leading-relaxed">
              Practical VLSI courses built by working engineers. Real content, no fluff.
            </p>
          </div>
        </Card>

        {/* INDIVIDUAL COURSES */}
        <div>
          <SectionHeader
            eyebrow="Individual Courses"
            title="Pick a course"
            description="Each course is focused on a specific outcome — pick what you need."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {COURSES.map((course) => (
              <Card key={course.id} hover className="p-6 flex flex-col justify-between relative">
                {course.popular && (
                  <div className="absolute -top-3 right-4">
                    <Badge tone="warning">
                      <Star className="w-3 h-3" /> POPULAR
                    </Badge>
                  </div>
                )}

                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border-2 border-slate-900 flex items-center justify-center text-blue-600">
                      {course.icon}
                    </div>
                    <Badge tone={course.levelTone}>{course.level}</Badge>
                  </div>

                  <h3 className="font-black text-slate-900 text-lg mb-1">{course.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed mb-4">{course.desc}</p>

                  <ul className="space-y-2">
                    {course.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-200 flex items-center justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-black text-slate-900">{course.price}</span>
                    {course.originalPrice && (
                      <span className="text-sm text-slate-400 line-through">{course.originalPrice}</span>
                    )}
                  </div>
                  <Button variant="primary" size="sm">
                    View Course <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* BUNDLE */}
        <div>
          <SectionHeader
            eyebrow="Best Value"
            title="Bundle & save"
            description="Get multiple courses at a discounted price."
          />

          <Card tone="inverse" className="p-8 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 border-2 border-white/20 flex items-center justify-center text-white shrink-0">
                <Package className="w-7 h-7" />
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-black text-white text-xl">{BUNDLE.title}</h3>
                  <Badge tone="warning">SAVE {BUNDLE.savings}</Badge>
                </div>
                <p className="text-slate-300 text-sm font-medium mb-4">{BUNDLE.desc}</p>

                <ul className="space-y-2 mb-5">
                  {BUNDLE.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex items-center gap-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-white">{BUNDLE.price}</span>
                    <span className="text-sm text-slate-400 line-through">₹597</span>
                  </div>
                  <Button variant="secondary" size="lg" className="bg-white text-slate-900 border-white hover:bg-slate-100">
                    Get Bundle <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* BOTTOM CTA */}
        <Card className="p-8 text-center border-2 border-slate-200">
          <h2 className="text-xl font-black text-slate-900 mb-2">
            Not sure which course?
          </h2>
          <p className="text-slate-500 text-sm font-medium mb-5 max-w-lg mx-auto">
            Start with the free content on the learning paths. When you are ready for structured practice, the courses are here.
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
