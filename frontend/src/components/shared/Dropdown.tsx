"use client";

import { ChevronDown } from "lucide-react";
import { ReactNode, useEffect, useRef, useState } from "react";

interface DropdownItem {
  label: string;
  value: string;
  icon?: ReactNode;
  disabled?: boolean;
  danger?: boolean;
}

interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  onSelect: (value: string) => void;
  align?: "left" | "right";
  className?: string;
}

export default function Dropdown({
  trigger,
  items,
  onSelect,
  align = "left",
  className = "",
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        className="flex items-center gap-1"
      >
        {trigger}
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className={[
            "absolute z-50 mt-2 min-w-[160px] rounded-xl border border-[var(--border)] bg-[var(--surface)]",
            "shadow-[var(--shadow-lg)] py-1 animate-in fade-in slide-in-from-top-2 duration-150",
            align === "right" ? "right-0" : "left-0",
          ].join(" ")}
        >
          {items.map((item) => (
            <button
              key={item.value}
              role="menuitem"
              disabled={item.disabled}
              onClick={() => { onSelect(item.value); setOpen(false); }}
              className={[
                "w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-left transition-colors",
                "disabled:opacity-40 disabled:cursor-not-allowed",
                item.danger
                  ? "text-[var(--error)] hover:bg-red-50"
                  : "text-[var(--text)] hover:bg-[var(--surface-raised)]",
              ].join(" ")}
            >
              {item.icon && <span className="flex-shrink-0 text-[var(--text-tertiary)]">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
