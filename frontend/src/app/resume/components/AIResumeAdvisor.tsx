import React, { useState } from "react";
import { Sparkles, CheckCircle2, AlertTriangle, ArrowRight, Loader2, Target } from "lucide-react";
import { ResumeData } from "../types";

export type TargetRole =
  | "rtl-design"
  | "verification"
  | "physical-design"
  | "embedded"
  | "jrf-research";

interface AIResumeAdvisorProps {
  data: ResumeData;
  targetRole: TargetRole;
  onTargetRoleChange: (role: TargetRole) => void;
  onRequestImprovement: (type: "summary" | "experience" | "skills", context: any) => void;
  isAiLoading: boolean;
}

const ROLE_CRITERIA: Record<
  TargetRole,
  {
    title: string;
    mustHaveSkills: string[];
    actionVerbs: string[];
    description: string;
  }
> = {
  "rtl-design": {
    title: "RTL Design Engineer",
    mustHaveSkills: ["Verilog", "SystemVerilog", "RTL Design", "Digital Design", "FPGA", "Logic Synthesis"],
    actionVerbs: ["Designed", "Architected", "Synthesized", "Optimized", "Implemented", "Integrated"],
    description: "Focus on microarchitecture, FSM design, timing closure, and synthesis reports.",
  },
  verification: {
    title: "ASIC Verification Engineer",
    mustHaveSkills: ["SystemVerilog", "UVM", "Assertions (SVA)", "Coverage Driven Verification", "ModelSim"],
    actionVerbs: ["Verified", "Benchmarked", "Tested", "Developed testbench", "Achieved 100% coverage"],
    description: "Focus on UVM testbench architecture, functional coverage, and random stimulus generation.",
  },
  "physical-design": {
    title: "Physical Design (PnR / STA)",
    mustHaveSkills: ["Physical Design", "STA", "Static Timing Analysis", "Innovus", "DRC/LVS", "IR Drop"],
    actionVerbs: ["Floorplanned", "Routed", "Closed timing", "Analyzed IR drop", "Reduced power"],
    description: "Focus on clock tree synthesis (CTS), timing closure, sign-off DRC/LVS, and power grids.",
  },
  embedded: {
    title: "Embedded & Firmware Engineer",
    mustHaveSkills: ["C", "C++", "Microcontroller", "ARM Cortex", "RTOS", "Linux", "SPI", "I2C"],
    actionVerbs: ["Programmed", "Interfaced", "Debugged", "Ported", "Configured drivers"],
    description: "Focus on bare-metal firmware, driver development, RTOS tasks, and hardware debugging.",
  },
  "jrf-research": {
    title: "JRF / PhD Research Fellow",
    mustHaveSkills: ["Publications", "MATLAB", "SPICE", "Research", "Semiconductor", "CMOS"],
    actionVerbs: ["Published", "Investigated", "Formulated", "Fabricated", "Characterized"],
    description: "Focus on research novelty, published papers, experimental methodology, and grant projects.",
  },
};

export function AIResumeAdvisor({
  data,
  targetRole,
  onTargetRoleChange,
  onRequestImprovement,
  isAiLoading,
}: AIResumeAdvisorProps) {
  const criteria = ROLE_CRITERIA[targetRole];

  // Calculate real ATS score based on target role
  let score = 40;
  const strengths: string[] = [];
  const missingSkills: string[] = [];
  const fixes: string[] = [];

  // Contact completeness
  if (data.fullName && data.fullName.length > 2) score += 5;
  if (data.email && data.email.includes("@")) score += 5;
  if (data.phone && data.phone.length >= 8) score += 5;
  if (data.location) score += 5;

  // Summary
  if (data.summary && data.summary.length > 30) {
    score += 10;
    strengths.push("Comprehensive professional profile summary.");
  } else {
    fixes.push("Add a targeted 2-3 sentence summary highlighting your semiconductor specialty.");
  }

  // Domain skills match
  const resumeSkillsLower = (data.skills || []).map((s) => s.toLowerCase());
  let matchedDomainSkills = 0;

  for (const mustSkill of criteria.mustHaveSkills) {
    if (resumeSkillsLower.some((s) => s.includes(mustSkill.toLowerCase()))) {
      matchedDomainSkills += 1;
    } else {
      missingSkills.push(mustSkill);
    }
  }

  const skillScore = Math.min(20, Math.round((matchedDomainSkills / criteria.mustHaveSkills.length) * 20));
  score += skillScore;

  if (matchedDomainSkills >= 3) {
    strengths.push(`Matches ${matchedDomainSkills} core keywords for ${criteria.title}.`);
  }

  // Experience and Projects
  const expCount = data.experience?.length || 0;
  const projCount = data.projects?.length || 0;

  if (expCount >= 1) {
    score += 10;
    strengths.push(`${expCount} relevant engineering work/internship records.`);
  } else {
    fixes.push("Add detailed internship, research lab, or project experience.");
  }

  if (projCount >= 2) {
    score += 10;
    strengths.push(`${projCount} technical hardware/silicon projects.`);
  } else if (projCount === 1) {
    score += 5;
  } else {
    fixes.push("Include at least 2 hands-on technical or thesis projects.");
  }

  const finalScore = Math.min(100, Math.max(30, score));

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <h3 className="font-bold text-sm text-slate-900">AI ATS Analyzer</h3>
        </div>
        <div className="flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200/60">
          <span className="text-xs font-bold text-blue-700">{finalScore}/100</span>
        </div>
      </div>

      {/* Target Role Selector */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-blue-600" /> Target Role
        </label>
        <select
          value={targetRole}
          onChange={(e) => onTargetRoleChange(e.target.value as TargetRole)}
          className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
        >
          {Object.entries(ROLE_CRITERIA).map(([key, item]) => (
            <option key={key} value={key}>
              {item.title}
            </option>
          ))}
        </select>
        <p className="text-[11px] text-slate-500">{criteria.description}</p>
      </div>

      {/* Strengths List */}
      {strengths.length > 0 && (
        <div className="space-y-1.5 text-xs">
          <p className="font-bold text-emerald-700 flex items-center gap-1 text-[11px] uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5" /> Strengths
          </p>
          <ul className="space-y-1 text-slate-600 pl-4 list-disc">
            {strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Missing Domain Skills */}
      {missingSkills.length > 0 && (
        <div className="space-y-1.5 text-xs">
          <p className="font-bold text-amber-700 flex items-center gap-1 text-[11px] uppercase tracking-wider">
            <AlertTriangle className="w-3.5 h-3.5" /> Recommended Keywords
          </p>
          <div className="flex flex-wrap gap-1">
            {missingSkills.map((sk, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-900 text-[10px] font-semibold rounded"
              >
                + {sk}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actionable Fixes */}
      {fixes.length > 0 && (
        <div className="space-y-1.5 text-xs">
          <p className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">
            Priority Improvements
          </p>
          <ul className="space-y-1 text-slate-600 pl-4 list-disc">
            {fixes.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 1-Click AI Enhancement CTAs */}
      <div className="pt-2 border-t border-slate-100 space-y-2">
        <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
          1-Click AI Enhancements
        </p>
        <div className="flex flex-col gap-1.5">
          <button
            onClick={() =>
              onRequestImprovement("summary", {
                name: data.fullName,
                headline: criteria.title,
                skills: data.skills,
                location: data.location,
              })
            }
            disabled={isAiLoading}
            className="w-full py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition flex items-center justify-between border border-blue-200"
          >
            <span>Tailor Summary for {criteria.title}</span>
            {isAiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
