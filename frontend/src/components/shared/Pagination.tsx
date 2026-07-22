"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function Pagination({
  page,
  totalPages,
  onPageChange,
  className = "",
}: PaginationProps) {
  if (totalPages <= 1) return null;

  // Build page window: always show first, last, current ±1, with ellipsis
  const pages: (number | "…")[] = [];
  const range = new Set([1, totalPages, page - 1, page, page + 1].filter((p) => p >= 1 && p <= totalPages));
  let prev = 0;
  for (const p of [...range].sort((a, b) => a - b)) {
    if (prev && p - prev > 1) pages.push("…");
    pages.push(p);
    prev = p;
  }

  return (
    <nav
      aria-label="Pagination"
      className={`flex items-center justify-center gap-1 ${className}`}
    >
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className="flex items-center justify-center w-9 h-9 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-raised)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft size={16} />
      </button>

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`ellipsis-${i}`} className="w-9 text-center text-sm text-[var(--text-tertiary)]">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            aria-current={p === page ? "page" : undefined}
            className={[
              "w-9 h-9 rounded-lg text-sm font-medium transition-colors",
              p === page
                ? "bg-[var(--primary)] text-white"
                : "border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-raised)]",
            ].join(" ")}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
        className="flex items-center justify-center w-9 h-9 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-raised)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}
