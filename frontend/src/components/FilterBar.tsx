"use client";

import { X, Check } from "lucide-react";
import { Card } from "@/components/ui/Card";

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

  const filterButton = (active: boolean) =>
    `w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
      active
        ? "bg-accent text-white border-slate-900 shadow-brutal-sm"
        : "bg-white text-slate-800 border-slate-300 hover:border-slate-900 hover:bg-blue-50"
    }`;

  return (
    <Card className="p-5 space-y-6">
      
      {/* FILTER HEADER */}
      <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900">
        <h3 className="text-sm font-bold text-slate-900">Search Filters</h3>
        {hasFilters && (
          <button
            onClick={handleClearAll}
            className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg border-2 border-red-300 transition-colors"
          >
            <X className="w-3 h-3 stroke-[3]" /> Clear All
          </button>
        )}
      </div>

      {/* 1. JOB CATEGORY FILTER */}
      <div>
        <h4 className="text-xs font-bold text-slate-900 mb-2.5 flex items-center justify-between">
          <span>Job Category</span>
          {selectedCategory !== "All" && (
            <span className="text-[10px] bg-accent text-white px-2 py-0.5 rounded font-bold">Active</span>
          )}
        </h4>
        <div className="space-y-1.5">
          {JOB_TYPES.map((item) => {
            const active = selectedCategory === item.value;
            return (
              <button
                key={item.value}
                onClick={() => onCategoryChange(active ? "All" : item.value)}
                className={filterButton(active)}
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
        <h4 className="text-xs font-bold text-slate-900 mb-2.5 flex items-center justify-between">
          <span>Required Qualification</span>
          {selectedEligibility !== "All" && (
            <span className="text-[10px] bg-accent text-white px-2 py-0.5 rounded font-bold">Active</span>
          )}
        </h4>
        <div className="space-y-1.5">
          {DEGREES.map((item) => {
            const active = selectedEligibility === item.value;
            return (
              <button
                key={item.value}
                onClick={() => onEligibilityChange(active ? "All" : item.value)}
                className={filterButton(active)}
              >
                <span>{item.label}</span>
                {active && <Check className="w-3.5 h-3.5 stroke-[3] text-white" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. LOCATION FILTER */}
      <div>
        <h4 className="text-xs font-bold text-slate-900 mb-2.5 flex items-center justify-between">
          <span>Location</span>
          {selectedLocation !== "All" && (
            <span className="text-[10px] bg-accent text-white px-2 py-0.5 rounded font-bold">Active</span>
          )}
        </h4>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {FILTER_LOCATIONS.map((loc) => {
            const active = selectedLocation === loc;
            return (
              <button
                key={loc}
                onClick={() => onLocationChange(active ? "All" : loc)}
                className={filterButton(active)}
              >
                <span>{loc}</span>
                {active && <Check className="w-3.5 h-3.5 stroke-[3] text-white" />}
              </button>
            );
          })}
        </div>
      </div>

    </Card>
  );
}