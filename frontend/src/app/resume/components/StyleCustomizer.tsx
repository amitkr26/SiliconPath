import React from "react";
import { ResumeStyleConfig } from "../types";
import { Palette, Type, Layout, Eye } from "lucide-react";

interface StyleCustomizerProps {
  style: ResumeStyleConfig;
  onChange: (updated: ResumeStyleConfig) => void;
}

const COLOR_PRESETS = [
  { label: "Royal Blue", hex: "#2563EB" },
  { label: "Indigo", hex: "#4F46E5" },
  { label: "Cyan", hex: "#0891B2" },
  { label: "Emerald", hex: "#059669" },
  { label: "Amber", hex: "#D97706" },
  { label: "Crimson", hex: "#DC2626" },
  { label: "Purple", hex: "#7C3AED" },
  { label: "Slate", hex: "#334155" },
];

export function StyleCustomizer({ style, onChange }: StyleCustomizerProps) {
  const setAccentColor = (color: string) => {
    onChange({ ...style, accentColor: color });
  };

  const setFontFamily = (font: string) => {
    onChange({ ...style, fontFamily: font });
  };

  const setMarginSize = (margin: "compact" | "normal" | "relaxed") => {
    onChange({ ...style, marginSize: margin });
  };

  const toggleSection = (sectionKey: keyof ResumeStyleConfig["visibleSections"]) => {
    onChange({
      ...style,
      visibleSections: {
        ...style.visibleSections,
        [sectionKey]: !style.visibleSections[sectionKey],
      },
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-5 shadow-sm">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
        <Palette className="w-4 h-4 text-blue-600" />
        <h3 className="font-bold text-sm text-slate-900">Styling &amp; Formatting</h3>
      </div>

      {/* 1. Accent Color */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
          Accent Color
        </label>
        <div className="flex items-center gap-2 flex-wrap">
          {COLOR_PRESETS.map((p) => (
            <button
              key={p.hex}
              onClick={() => setAccentColor(p.hex)}
              className={`w-6 h-6 rounded-full border-2 transition-transform ${
                style.accentColor === p.hex
                  ? "scale-125 border-slate-900 shadow-sm"
                  : "border-white hover:scale-110"
              }`}
              style={{ backgroundColor: p.hex }}
              title={p.label}
              aria-label={`Select ${p.label}`}
            />
          ))}
          <input
            type="color"
            value={style.accentColor}
            onChange={(e) => setAccentColor(e.target.value)}
            className="w-7 h-7 rounded-lg cursor-pointer border border-slate-300 p-0.5"
            title="Custom Hex Color"
            aria-label="Custom color picker"
          />
        </div>
      </div>

      {/* 2. Typography */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <Type className="w-3.5 h-3.5 text-slate-400" /> Typography
        </label>
        <div className="grid grid-cols-3 gap-1.5 text-xs">
          {[
            { id: "font-sans", label: "Modern Sans" },
            { id: "font-serif", label: "Classic Serif" },
            { id: "font-mono", label: "Technical Mono" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFontFamily(f.id)}
              className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition ${
                style.fontFamily === f.id
                  ? "bg-blue-50 border-blue-500 text-blue-700"
                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Margins & Spacing */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <Layout className="w-3.5 h-3.5 text-slate-400" /> Page Density
        </label>
        <div className="grid grid-cols-3 gap-1.5 text-xs">
          {[
            { id: "compact", label: "Compact" },
            { id: "normal", label: "Standard" },
            { id: "relaxed", label: "Spacious" },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setMarginSize(m.id as any)}
              className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition ${
                style.marginSize === m.id
                  ? "bg-blue-50 border-blue-500 text-blue-700"
                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Section Visibility Toggles */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5 text-slate-400" /> Toggle Sections
        </label>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {Object.entries(style.visibleSections).map(([key, visible]) => (
            <label
              key={key}
              className="flex items-center gap-2 text-slate-700 cursor-pointer text-[11px] font-medium"
            >
              <input
                type="checkbox"
                checked={visible}
                onChange={() => toggleSection(key as any)}
                className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <span className="capitalize">{key}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
