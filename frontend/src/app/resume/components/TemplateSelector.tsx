import React, { useState } from "react";
import { X, Check, LayoutTemplate, Sparkles } from "lucide-react";
import { TemplateId } from "../types";

interface TemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTemplateId: string;
  onSelectTemplate: (id: TemplateId) => void;
}

interface TemplateOption {
  id: TemplateId;
  name: string;
  category: "professional" | "technical" | "academic" | "minimal";
  description: string;
  badge?: string;
}

export const TEMPLATE_OPTIONS: TemplateOption[] = [
  {
    id: "modern-professional",
    name: "Modern Professional",
    category: "professional",
    description: "Sleek top accent bar, clean 2-column header, balanced hierarchy.",
    badge: "Most Popular",
  },
  {
    id: "minimalist",
    name: "Minimalist",
    category: "minimal",
    description: "Typographic purity, generous whitespace, single-column elegance.",
  },
  {
    id: "compact-technical",
    name: "Compact Technical",
    category: "technical",
    description: "High-density 1-page layout optimized for ASIC & VLSI engineers.",
    badge: "Hardware Pro",
  },
  {
    id: "academic-research",
    name: "Academic & Research",
    category: "academic",
    description: "Prioritizes research publications, JRF grants, advisor, & labs.",
    badge: "JRF / PhD",
  },
  {
    id: "modern-sidebar",
    name: "Modern Sidebar",
    category: "professional",
    description: "30/70 split layout with left tinted rail for contact & skills.",
  },
  {
    id: "classic-corporate",
    name: "Classic Corporate",
    category: "professional",
    description: "Traditional serif styling, formal dividers, Ivy League format.",
  },
  {
    id: "two-column",
    name: "Two-Column Grid",
    category: "minimal",
    description: "Balanced grid displaying experience and projects side-by-side.",
  },
  {
    id: "executive",
    name: "Executive Leader",
    category: "professional",
    description: "Bold dark header banner with strategic career trajectory focus.",
  },
  {
    id: "fresher-campus",
    name: "Fresher / Campus",
    category: "academic",
    description: "Prioritizes degree credentials, coursework, GATE scores & projects.",
    badge: "Entry Level",
  },
  {
    id: "silicon-tech",
    name: "Silicon Tech",
    category: "technical",
    description: "Monospace code styling, tapeout badges, & EDA tool tables.",
    badge: "EDA / ASIC",
  },
];

export function TemplateSelector({
  isOpen,
  onClose,
  selectedTemplateId,
  onSelectTemplate,
}: TemplateSelectorProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all");

  if (!isOpen) return null;

  const filtered =
    activeCategory === "all"
      ? TEMPLATE_OPTIONS
      : TEMPLATE_OPTIONS.filter((t) => t.category === activeCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <LayoutTemplate className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900">
                Choose a Resume Template
              </h2>
              <p className="text-xs text-slate-500">
                10 distinct professional layouts tailored for semiconductor, research, &amp; hardware careers.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
            aria-label="Close template selector"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Filters */}
        <div className="px-6 py-2.5 border-b border-slate-100 flex items-center gap-2 overflow-x-auto bg-slate-50/50">
          {[
            { id: "all", label: "All Templates (10)" },
            { id: "professional", label: "Professional" },
            { id: "technical", label: "Technical & VLSI" },
            { id: "academic", label: "Academic & Research" },
            { id: "minimal", label: "Minimalist" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition whitespace-nowrap ${
                activeCategory === cat.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map((t) => {
            const isSelected = selectedTemplateId === t.id;
            return (
              <div
                key={t.id}
                onClick={() => {
                  onSelectTemplate(t.id);
                  onClose();
                }}
                className={`group relative rounded-2xl border-2 p-4 cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? "border-blue-600 bg-blue-50/30 shadow-md ring-2 ring-blue-500/20"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition">
                      {t.name}
                    </h3>
                    {t.badge && (
                      <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full shrink-0">
                        {t.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {t.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-semibold text-slate-400 capitalize">
                    {t.category}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTemplate(t.id);
                      onClose();
                    }}
                    className={`px-3 py-1 rounded-lg font-bold text-xs transition flex items-center gap-1 ${
                      isSelected
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-700 group-hover:bg-blue-600 group-hover:text-white"
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Selected
                      </>
                    ) : (
                      "Apply"
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
