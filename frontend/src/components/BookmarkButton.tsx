"use client";

import { Bookmark } from "lucide-react";
import { useState, useTransition } from "react";
import Tooltip from "./shared/Tooltip";

interface BookmarkButtonProps {
  opportunityId: string;
  initialSaved?: boolean;
  className?: string;
}

export default function BookmarkButton({
  opportunityId,
  initialSaved = false,
  className = "",
}: BookmarkButtonProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, startTransition] = useTransition();

  const toggle = () => {
    startTransition(async () => {
      const method = saved ? "DELETE" : "POST";
      const url = saved
        ? `/api/bookmarks/${opportunityId}`
        : "/api/bookmarks";

      try {
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: method === "POST" ? JSON.stringify({ opportunity_id: opportunityId }) : undefined,
        });

        if (res.status === 401) {
          // Not logged in — redirect to login
          window.location.href = "/login?redirect=" + encodeURIComponent(window.location.pathname);
          return;
        }

        if (res.ok) setSaved((s) => !s);
      } catch {
        // Silent fail — don't break UI
      }
    });
  };

  return (
    <Tooltip content={saved ? "Remove bookmark" : "Save opportunity"}>
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-label={saved ? "Remove bookmark" : "Bookmark this opportunity"}
        aria-pressed={saved}
        className={[
          "flex items-center justify-center w-9 h-9 rounded-lg border transition-all min-h-[44px] min-w-[44px]",
          saved
            ? "border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]"
            : "border-[var(--border)] bg-transparent text-[var(--text-tertiary)] hover:border-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--primary-light)]",
          pending ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
          className,
        ].join(" ")}
      >
        <Bookmark size={16} className={saved ? "fill-current" : ""} />
      </button>
    </Tooltip>
  );
}
