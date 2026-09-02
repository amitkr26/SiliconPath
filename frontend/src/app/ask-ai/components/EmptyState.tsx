import React from "react";
import { Sparkles } from "lucide-react";
import { SuggestionGrid } from "./SuggestionGrid";

interface EmptyStateProps {
  onSelectSuggestion: (query: string) => void;
}

export function EmptyState({ onSelectSuggestion }: EmptyStateProps) {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4 flex flex-col items-center text-center space-y-6">
      {/* Hero Icon & Title */}
      <div className="space-y-3 flex flex-col items-center">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md">
          <Sparkles className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            BerojgarDegreeWala AI Assistant
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md font-medium">
            Career intelligence &amp; research guidance for India&apos;s semiconductor, VLSI, and electronics ecosystem.
          </p>
        </div>
      </div>

      {/* Suggested Inquiries */}
      <div className="w-full text-left space-y-2.5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
          Explore Technical Guidance &amp; Opportunities
        </p>
        <SuggestionGrid onSelectSuggestion={onSelectSuggestion} />
      </div>
    </div>
  );
}
