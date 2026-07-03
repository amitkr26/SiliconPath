"use client";

import { useEffect, useState } from "react";
import { getDaysUntilDeadline, isExpired } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface DeadlineCountdownProps {
  deadline: string;
  variant?: "badge" | "progress";
}

export default function DeadlineCountdown({
  deadline,
  variant = "badge",
}: DeadlineCountdownProps) {
  const [days, setDays] = useState(getDaysUntilDeadline(deadline));

  useEffect(() => {
    const timer = setInterval(() => {
      setDays(getDaysUntilDeadline(deadline));
    }, 60000);
    return () => clearInterval(timer);
  }, [deadline]);

  const expired = isExpired(deadline);

  if (variant === "progress") {
    const maxDays = 30;
    const progress = Math.max(0, Math.min(100, ((maxDays - days) / maxDays) * 100));

    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-text-secondary">
            {expired ? "Deadline passed" : `Deadline in ${days === 0 ? "today" : `${days} days`}`}
          </span>
          {!expired && days <= 3 && (
            <span className="text-xs font-medium text-danger">Urgent</span>
          )}
        </div>
        <div className="w-full h-2 bg-surface-elevated rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              expired
                ? "bg-danger"
                : days <= 3
                ? "bg-gradient-deadline"
                : days <= 7
                ? "bg-warning"
                : "bg-accent/50"
            )}
            style={{ width: `${expired ? 100 : Math.max(5, progress)}%` }}
          />
        </div>
        {expired && (
          <span className="text-xs text-danger mt-1 block">Expired</span>
        )}
      </div>
    );
  }

  if (expired) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-elevated text-text-muted text-xs font-medium border border-border">
        Expired
      </span>
    );
  }

  if (days <= 3) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-danger/30 text-danger text-xs font-medium border border-danger/30 animate-pulse">
        <span className="w-1.5 h-1.5 rounded-full bg-danger" />
        Last {days === 0 ? "day" : `${days} days`}!
      </span>
    );
  }

  if (days <= 7) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-warning/30 text-warning text-xs font-medium border border-warning/30">
        <span className="w-1.5 h-1.5 rounded-full bg-warning" />
        Closes in {days} days
      </span>
    );
  }

  return (
    <span className="text-xs font-medium text-text-secondary">
      {days === 0
        ? "Due today"
        : days === 1
        ? "1 day left"
        : `${days} days left`}
    </span>
  );
}
