"use client";

import { ExternalLink, ShieldAlert, Clock, AlertTriangle } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { api } from "@/lib/api-client";
import { isExpired, formatDate } from "@/lib/utils";

interface ApplyButtonProps {
  applyLink: string;
  opportunityId: string;
  verificationStatus?: string;
  officialPageUrl?: string | null;
  deadline?: string | null;
}

export default function ApplyButton({
  applyLink,
  opportunityId,
  verificationStatus,
  officialPageUrl,
  deadline,
}: ApplyButtonProps) {
  const { user } = useUser();
  const expired = isExpired(deadline) || verificationStatus === "expired";
  const isUnavailable = verificationStatus === "link_unavailable";

  // Fire-and-forget tracking so navigation is never blocked by it. The
  // applications route is idempotent per (user, opportunity), so no pre-check.
  const trackClick = () => {
    fetch("/api/track-click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ opportunity_id: opportunityId }),
    }).catch(() => {});
    if (user) {
      api
        .post("/api/applications", {
          opportunity_id: opportunityId,
          status: "applied",
        })
        .catch(() => {});
    }
  };

  // 1. EXPIRED STATE
  if (expired) {
    return (
      <div className="w-full">
        <button
          disabled
          className="inline-flex items-center justify-center gap-2 bg-slate-100 text-slate-500 font-semibold rounded-xl px-6 py-3 border border-slate-200 shadow-none cursor-not-allowed w-full text-sm"
        >
          <Clock className="w-4 h-4 text-slate-400" />
          Application Closed
        </button>
        {deadline && (
          <p className="text-slate-500 text-[11px] font-medium text-center mt-1.5">
            Deadline was {formatDate(deadline)}
          </p>
        )}
      </div>
    );
  }

  // 2. LINK UNAVAILABLE WITH OFFICIAL PAGE FALLBACK
  if (isUnavailable && officialPageUrl) {
    return (
      <div className="flex flex-col gap-2 w-full">
        <a
          href={officialPageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl px-6 py-3 shadow-xs hover:shadow transition-all w-full text-sm"
        >
          <ShieldAlert className="w-4 h-4" />
          Visit Official Site →
        </a>
        <p className="text-amber-700 text-[10px] font-semibold text-center">Direct application link unavailable. Check organization&apos;s career portal.</p>
      </div>
    );
  }

  // 3. LINK UNAVAILABLE WITHOUT FALLBACK
  if (isUnavailable) {
    return (
      <div className="w-full">
        <button
          disabled
          className="inline-flex items-center justify-center gap-2 bg-amber-50 text-amber-800 font-semibold rounded-xl px-6 py-3 border border-amber-200 shadow-none cursor-not-allowed w-full text-sm"
        >
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          Application Link Unavailable
        </button>
      </div>
    );
  }

  // 4. ACTIVE APPLY BUTTON
  return (
    <a
      href={applyLink}
      target="_blank"
      rel="noopener noreferrer"
      onClick={trackClick}
      className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl px-6 py-3 shadow-xs hover:shadow-sm transition-all w-full text-sm"
    >
      Apply Now
      <ExternalLink className="w-4 h-4" />
    </a>
  );
}
