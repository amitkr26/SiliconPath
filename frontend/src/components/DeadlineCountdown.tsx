"use client";

import { useEffect, useState } from "react";
import { getDaysUntilDeadline, isExpired, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Clock, Calendar } from "lucide-react";

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
    setDays(getDaysUntilDeadline(deadline));
    const timer = setInterval(() => {
      setDays(getDaysUntilDeadline(deadline));
    }, 60000);
    return () => clearInterval(timer);
  }, [deadline]);

  const expired = isExpired(deadline);
  const formattedDate = formatDate(deadline);

  if (variant === "progress") {
    const maxDays = 30;
    const progress = Math.max(0, Math.min(100, ((maxDays - days) / maxDays) * 100));

    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            {expired ? `Application Closed (${formattedDate})` : `Apply by ${formattedDate}`}
          </span>
          {!expired && days <= 3 && (
            <span className="text-xs font-black text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
              {days === 0 ? "Last day" : days < 0 ? "Expired" : `Last ${days} days`}
            </span>
          )}
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              expired
                ? "bg-slate-400"
                : days <= 3
                ? "bg-red-500"
                : days <= 7
                ? "bg-amber-500"
                : "bg-blue-600"
            )}
            style={{ width: `${expired ? 100 : Math.max(5, progress)}%` }}
          />
        </div>
        {expired && (
          <span className="text-xs font-bold text-red-600 mt-1 block">Closed</span>
        )}
      </div>
    );
  }

  // BADGE VARIANT
  if (expired) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-bold border border-slate-300">
        <Clock className="w-3 h-3 text-slate-500" />
        <span>Expired</span>
        <span className="text-slate-400 font-normal">({formattedDate})</span>
      </span>
    );
  }

  if (days <= 3) {
    return (
      <span className="danger inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-100 text-red-700 text-xs font-black border border-red-300 animate-pulse">
        <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
        {days === 0 ? "Last day" : days < 0 ? "Expired" : `Last ${days} days`} ({formattedDate})
      </span>
    );
  }

  if (days <= 7) {
    return (
      <span className="warning inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-100 text-amber-800 text-xs font-bold border border-amber-300">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
        Closes in {days} days ({formattedDate})
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700">
      <Calendar className="w-3.5 h-3.5 text-slate-500" />
      {days} days left ({formattedDate})
    </span>
  );
}
