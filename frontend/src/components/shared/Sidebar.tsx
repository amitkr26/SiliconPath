"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

interface SidebarItem {
  label: string;
  href: string;
  icon?: ReactNode;
  badge?: number;
}

interface SidebarSection {
  title?: string;
  items: SidebarItem[];
}

interface SidebarProps {
  sections: SidebarSection[];
  className?: string;
}

export default function Sidebar({ sections, className = "" }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`w-60 shrink-0 flex flex-col gap-6 ${className}`}
      aria-label="Sidebar navigation"
    >
      {sections.map((section, si) => (
        <div key={si} className="flex flex-col gap-0.5">
          {section.title && (
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)] px-3 mb-1">
              {section.title}
            </p>
          )}
          {section.items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={[
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px]",
                  isActive
                    ? "bg-[var(--primary-light)] text-[var(--primary)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--surface-raised)] hover:text-[var(--text)]",
                ].join(" ")}
              >
                {item.icon && (
                  <span className={`flex-shrink-0 ${isActive ? "text-[var(--primary)]" : "text-[var(--text-tertiary)]"}`}>
                    {item.icon}
                  </span>
                )}
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge != null && item.badge > 0 && (
                  <span className="ml-auto rounded-full bg-[var(--primary)] text-white text-[10px] font-semibold px-1.5 py-0.5 leading-none">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </aside>
  );
}
