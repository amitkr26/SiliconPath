"use client";

import { ReactNode } from "react";

interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
  badge?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export default function Tabs({ tabs, activeTab, onChange, className = "" }: TabsProps) {
  return (
    <div
      className={`flex gap-1 border-b border-[var(--border)] ${className}`}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            id={`tab-${tab.id}`}
            aria-controls={`tabpanel-${tab.id}`}
            onClick={() => onChange(tab.id)}
            className={[
              "relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors",
              "focus-visible:outline-2 focus-visible:outline-[var(--primary)] rounded-t-md",
              "whitespace-nowrap min-h-[44px]",
              isActive
                ? "text-[var(--primary)] after:absolute after:bottom-0 after:inset-x-0 after:h-0.5 after:bg-[var(--primary)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-raised)]",
            ].join(" ")}
          >
            {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
            {tab.label}
            {tab.badge != null && tab.badge > 0 && (
              <span className="ml-1 rounded-full bg-[var(--primary)] text-white text-xs px-1.5 py-0.5 leading-none">
                {tab.badge > 99 ? "99+" : tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
