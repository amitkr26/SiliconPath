"use client";

import { X, Check } from "lucide-react";

interface FilterBarProps {
  selectedCategory: string;
  selectedEligibility: string;
  selectedLocation: string;
  selectedDeadline: string;
  onCategoryChange: (value: string) => void;
  onEligibilityChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onDeadlineChange: (value: string) => void;
}

const JOB_TYPES = [
  { label: "Junior Research Fellow (JRF)", value: "jrf" },
  { label: "Senior Research Fellow (SRF)", value: "srf" },
  { label: "PhD & Doctoral Admissions", value: "phd" },
  { label: "Government Research Jobs", value: "government" },
  { label: "Private VLSI Engineering Jobs", value: "job" },
  { label: "Internships & Fellowships", value: "internship" },
];

const DEGREES = [
  { label: "B.Tech / B.E / Graduate", value: "B.Tech" },
  { label: "M.Tech / M.E / Post Graduate", value: "M.Tech" },
  { label: "PhD / Doctorate", value: "PhD" },
];

const FILTER_LOCATIONS = [
  "All India",
  "Bangalore",
  "Hyderabad",
  "Pune",
  "Delhi / NCR",
  "Chennai",
  "Remote / WFH",
  "Abroad",
];

export default function FilterBar({
  selectedCategory,
  selectedEligibility,
  selectedLocation,
  selectedDeadline,
  onCategoryChange,
  onEligibilityChange,
  onLocationChange,
  onDeadlineChange,
}: FilterBarProps) {
  const hasFilters =
    selectedCategory !== "All" ||
    selectedEligibility !== "All" ||
    selectedLocation !== "All" ||
    selectedDeadline !== "All";

  const handleClearAll = () => {
    onCategoryChange("All");
    onEligibilityChange("All");
    onLocationChange("All");
    onDeadlineChange("All");
  };

  return (
    <div className="space-y-6 bg-white p-5 rounded-2xl border-3 border-slate-900 shadow-[5px_5px_0px_0px_#0F172A]">
      
      {/* FILTER HEADER */}
      <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Search Filters</h3>
        {hasFilters && (
          <button
            onClick={handleClearAll}
            className="inline-flex items-center gap-1 text-xs font-black text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg border border-red-300 transition-colors"
          >
            <X className="w-3 h-3 stroke-[3]" /> Clear All
          </button>
        )}
      </div>

      {/* 1. JOB CATEGORY FILTER */}
      <div>
        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2.5 flex items-center justify-between">
          <span>Job Category</span>
          {selectedCategory !== "All" && (
            <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded font-black">Active</span>
          )}
        </h4>
        <div className="space-y-1.5">
          {JOB_TYPES.map((item) => {
            const active = selectedCategory === item.value;
            return (
              <button
                key={item.value}
                onClick={() => onCategoryChange(active ? "All" : item.value)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-black border-2 transition-all ${
                  active
                    ? "bg-blue-600 text-white border-slate-900 shadow-[2px_2px_0px_0px_#0F172A]"
                    : "bg-white text-slate-800 border-slate-300 hover:border-slate-900 hover:bg-blue-50"
                }`}
              >
                <span>{item.label}</span>
                {active && <Check className="w-3.5 h-3.5 stroke-[3] text-white" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. REQUIRED QUALIFICATION FILTER */}
      <div>
        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2.5 flex items-center justify-between">
          <span>Required Qualification</span>
          {selectedEligibility !== "All" && (
            <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded font-black">Active</span>
          )}
        </h4>
        <div className="space-y-1.5">
          {DEGREES.map((item) => {
            const active = selectedEligibility === item.value;
            return (
              <button
                key={item.value}
                onClick={() => onEligibilityChange(active ? "All" : item.value)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-black border-2 transition-all ${
                  active
                    ? "bg-emerald-500 text-slate-900 border-slate-900 shadow-[2px_2px_0px_0px_#0F172A]"
                    : "bg-white text-slate-800 border-slate-300 hover:border-slate-900 hover:bg-emerald-50"
                }`}
              >
                <span>{item.label}</span>
                {active && <Check className="w-3.5 h-3.5 stroke-[3] text-slate-900" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. LOCATION FILTER */}
      <div>
        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2.5 flex items-center justify-between">
          <span>Location</span>
          {selectedLocation !== "All" && (
            <span className="text-[10px] bg-purple-600 text-white px-2 py-0.5 rounded font-black">Active</span>
          )}
        </h4>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {FILTER_LOCATIONS.map((loc) => {
            const active = selectedLocation === loc;
            return (
              <button
                key={loc}
                onClick={() => onLocationChange(active ? "All" : loc)}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-black border-2 transition-all ${
                  active
                    ? "bg-purple-600 text-white border-slate-900 shadow-[2px_2px_0px_0px_#0F172A]"
                    : "bg-white text-slate-800 border-slate-200 hover:border-slate-900 hover:bg-purple-50"
                }`}
              >
                <span>{loc}</span>
                {active && <Check className="w-3.5 h-3.5 stroke-[3] text-white" />}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
