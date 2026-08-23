"use client";

import { X, Check } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface FilterBarProps {
  selectedCategory: string;
  selectedEligibility: string;
  selectedLocation: string;
  selectedDeadline: string;
  selectedExperience?: string;
  onCategoryChange: (value: string) => void;
  onEligibilityChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onDeadlineChange: (value: string) => void;
  onExperienceChange?: (value: string) => void;
}

const JOB_TYPES = [
  { label: "Junior Research Fellow (JRF)", value: "jrf" },
  { label: "Senior Research Fellow (SRF)", value: "srf" },
  { label: "PhD & Doctoral Admissions", value: "phd" },
  { label: "Government Research Jobs", value: "government" },
  { label: "Private VLSI Engineering Jobs", value: "job" },
  { label: "Internships & Fellowships", value: "internship" },
];

const EXPERIENCE_LEVELS = [
  { label: "Fresher / Entry-Level", value: "Fresher" },
  { label: "0–1 Years Experience", value: "0–1 Years" },
  { label: "0–2 Years Experience", value: "0–2 Years" },
  { label: "2+ Years / Experienced", value: "2+ Years" },
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
  selectedExperience = "All",
  onCategoryChange,
  onEligibilityChange,
  onLocationChange,
  onDeadlineChange,
  onExperienceChange,
}: FilterBarProps) {
  const hasFilters =
    selectedCategory !== "All" ||
    selectedEligibility !== "All" ||
    selectedLocation !== "All" ||
    selectedDeadline !== "All" ||
    selectedExperience !== "All";

  const handleClearAll = () => {
    onCategoryChange("All");
    onEligibilityChange("All");
    onLocationChange("All");
    onDeadlineChange("All");
    if (onExperienceChange) onExperienceChange("All");
  };

  const filterButton = (active: boolean) =>
    `w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
      active
        ? "bg-blue-600 text-white border-slate-900 shadow-brutal-sm"
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

      {/* 1. EXPERIENCE / FRESHER FILTER (Phase 2 Requirement) */}
      {onExperienceChange && (
        <div>
          <h4 className="text-xs font-bold text-slate-900 mb-2.5 flex items-center justify-between">
            <span>Experience Level</span>
            {selectedExperience !== "All" && (
              <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded font-bold">Active</span>
            )}
          </h4>
          <div className="space-y-1.5">
            <button
              onClick={() => onExperienceChange("All")}
              className={filterButton(selectedExperience === "All")}
            >
              <span>All Experience Levels</span>
              {selectedExperience === "All" && <Check className="w-3.5 h-3.5" />}
            </button>
            {EXPERIENCE_LEVELS.map((item) => {
              const active = selectedExperience === item.value;
              return (
                <button
                  key={item.value}
                  onClick={() => onExperienceChange(active ? "All" : item.value)}
                  className={filterButton(active)}
                >
                  <span className="truncate">{item.label}</span>
                  {active && <Check className="w-3.5 h-3.5" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. JOB CATEGORY FILTER */}
      <div>
        <h4 className="text-xs font-bold text-slate-900 mb-2.5 flex items-center justify-between">
          <span>Job Category</span>
          {selectedCategory !== "All" && (
            <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded font-bold">Active</span>
          )}
        </h4>
        <div className="space-y-1.5">
          <button
            onClick={() => onCategoryChange("All")}
            className={filterButton(selectedCategory === "All")}
          >
            <span>All Categories</span>
            {selectedCategory === "All" && <Check className="w-3.5 h-3.5" />}
          </button>
          {JOB_TYPES.map((item) => {
            const active = selectedCategory === item.value;
            return (
              <button
                key={item.value}
                onClick={() => onCategoryChange(active ? "All" : item.value)}
                className={filterButton(active)}
              >
                <span className="truncate">{item.label}</span>
                {active && <Check className="w-3.5 h-3.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. DEGREE / ELIGIBILITY */}
      <div>
        <h4 className="text-xs font-bold text-slate-900 mb-2.5 flex items-center justify-between">
          <span>Degree Required</span>
          {selectedEligibility !== "All" && (
            <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded font-bold">Active</span>
          )}
        </h4>
        <div className="space-y-1.5">
          <button
            onClick={() => onEligibilityChange("All")}
            className={filterButton(selectedEligibility === "All")}
          >
            <span>All Degrees</span>
            {selectedEligibility === "All" && <Check className="w-3.5 h-3.5" />}
          </button>
          {DEGREES.map((item) => {
            const active = selectedEligibility === item.value;
            return (
              <button
                key={item.value}
                onClick={() => onEligibilityChange(active ? "All" : item.value)}
                className={filterButton(active)}
              >
                <span>{item.label}</span>
                {active && <Check className="w-3.5 h-3.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. DEADLINE WINDOW */}
      <div>
        <h4 className="text-xs font-bold text-slate-900 mb-2.5 flex items-center justify-between">
          <span>Closing Deadline</span>
          {selectedDeadline !== "All" && (
            <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded font-bold">Active</span>
          )}
        </h4>
        <div className="space-y-1.5">
          {[
            { label: "All Active Deadlines", value: "All" },
            { label: "Closing This Week (≤ 7 Days)", value: "This Week" },
            { label: "Closing This Month (≤ 30 Days)", value: "This Month" },
          ].map((d) => {
            const active = selectedDeadline === d.value;
            return (
              <button
                key={d.value}
                onClick={() => onDeadlineChange(d.value)}
                className={filterButton(active)}
              >
                <span>{d.label}</span>
                {active && <Check className="w-3.5 h-3.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. LOCATION */}
      <div>
        <h4 className="text-xs font-bold text-slate-900 mb-2.5 flex items-center justify-between">
          <span>Location</span>
          {selectedLocation !== "All" && (
            <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded font-bold">Active</span>
          )}
        </h4>
        <div className="space-y-1.5">
          {FILTER_LOCATIONS.map((loc) => {
            const active = (loc === "All India" && selectedLocation === "All") || selectedLocation === loc;
            return (
              <button
                key={loc}
                onClick={() => onLocationChange(loc === "All India" ? "All" : loc)}
                className={filterButton(active)}
              >
                <span>{loc}</span>
                {active && <Check className="w-3.5 h-3.5" />}
              </button>
            );
          })}
        </div>
      </div>

    </Card>
  );
}