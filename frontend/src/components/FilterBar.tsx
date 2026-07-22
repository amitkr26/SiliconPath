"use client";

import { useState } from "react";
import { CATEGORIES, ELIGIBILITY_OPTIONS, LOCATIONS, DEADLINE_FILTERS } from "@/lib/utils";
import { X } from "lucide-react";

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

const JOB_TYPES = ["Internship", "Full-time", "Research Fellowship", "PhD Scholarship", "Trainee"];
const DEGREES = ["B.Tech", "M.Tech", "PhD"];

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
  const hasFilters = selectedCategory !== "All" || selectedEligibility !== "All" || selectedLocation !== "All" || selectedDeadline !== "All";

  const handleClearAll = () => {
    onCategoryChange("All");
    onEligibilityChange("All");
    onLocationChange("All");
    onDeadlineChange("All");
  };

  const toggleFilter = (current: string, value: string, onChange: (v: string) => void) => {
    onChange(current === value ? "All" : value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">Filters</h3>
        {hasFilters && (
          <button
            onClick={handleClearAll}
            className="text-xs text-accent hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      <div>
        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Job Type</h4>
        <div className="space-y-1.5">
          {JOB_TYPES.map((type) => (
            <label
              key={type}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-elevated/50 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedCategory === type}
                onChange={() => toggleFilter(selectedCategory, type, onCategoryChange)}
                className="w-4 h-4 rounded border-border bg-surface-elevated text-accent focus:ring-accent focus:ring-offset-0"
              />
              <span className="text-sm text-text-secondary">{type}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Degree</h4>
        <div className="space-y-1.5">
          {DEGREES.map((degree) => (
            <label
              key={degree}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-elevated/50 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedEligibility === degree}
                onChange={() => toggleFilter(selectedEligibility, degree, onEligibilityChange)}
                className="w-4 h-4 rounded border-border bg-surface-elevated text-accent focus:ring-accent focus:ring-offset-0"
              />
              <span className="text-sm text-text-secondary">{degree}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Location</h4>
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-elevated/50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={selectedLocation === "India"}
              onChange={() => toggleFilter(selectedLocation, "India", onLocationChange)}
              className="w-4 h-4 rounded border-border bg-surface-elevated text-accent focus:ring-accent focus:ring-offset-0"
            />
            <span className="text-sm text-text-secondary">India</span>
          </label>
          <label className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-elevated/50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={selectedLocation === "International"}
              onChange={() => toggleFilter(selectedLocation, "International", onLocationChange)}
              className="w-4 h-4 rounded border-border bg-surface-elevated text-accent focus:ring-accent focus:ring-offset-0"
            />
            <span className="text-sm text-text-secondary">International</span>
          </label>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Deadline</h4>
        <select
          value={selectedDeadline}
          onChange={(e) => onDeadlineChange(e.target.value)}
          className="w-full bg-surface-elevated border border-border text-text-primary text-sm rounded-lg px-3 py-2 focus:ring-accent focus:border-accent outline-none"
        >
          {DEADLINE_FILTERS.map((df) => (
            <option key={df} value={df}>
              {df}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
