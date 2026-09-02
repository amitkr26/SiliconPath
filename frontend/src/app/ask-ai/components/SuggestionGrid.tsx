import React from "react";
import { Cpu, BookOpen, GraduationCap, CircuitBoard, Code, Zap } from "lucide-react";

export const SUGGESTIONS = [
  {
    icon: Cpu,
    label: "Fresher VLSI Jobs",
    query: "Find fresher VLSI and physical design job opportunities across Indian semiconductor companies.",
  },
  {
    icon: BookOpen,
    label: "Latest JRF & PhD Openings",
    query: "What are the latest JRF/SRF and PhD research openings in microelectronics and semiconductor research?",
  },
  {
    icon: GraduationCap,
    label: "DRDO & ISRO Eligibility",
    query: "Explain GATE score and degree eligibility for DRDO Scientist B & ISRO ICRB electronics recruitment.",
  },
  {
    icon: CircuitBoard,
    label: "RTL Design Roadmap",
    query: "What is the complete roadmap and prerequisite skillset to become an RTL Design Engineer from scratch?",
  },
  {
    icon: Code,
    label: "Learn SystemVerilog & UVM",
    query: "How should a fresher start learning SystemVerilog and UVM for digital verification?",
  },
  {
    icon: Zap,
    label: "GATE ECE Strategy",
    query: "What is the recommended 6-month preparation strategy for GATE ECE focusing on EDA and Digital Circuits?",
  },
];

interface SuggestionGridProps {
  onSelectSuggestion: (query: string) => void;
}

export function SuggestionGrid({ onSelectSuggestion }: SuggestionGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {SUGGESTIONS.map((s, i) => {
        const Icon = s.icon;
        return (
          <button
            key={i}
            onClick={() => onSelectSuggestion(s.query)}
            className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200/90 bg-white hover:bg-blue-50/50 hover:border-blue-300 hover:shadow-sm transition-all text-left group"
          >
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                {s.label}
              </p>
              <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                {s.query}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
