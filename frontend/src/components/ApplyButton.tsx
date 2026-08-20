"use client";

import { ExternalLink, ShieldAlert } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { api } from "@/lib/api-client";

interface ApplyButtonProps {
  applyLink: string;
  opportunityId: string;
  verificationStatus?: string;
  officialPageUrl?: string | null;
}

export default function ApplyButton({ applyLink, opportunityId, verificationStatus, officialPageUrl }: ApplyButtonProps) {
  const { user } = useUser();
  const isUnavailable = verificationStatus === "link_unavailable" || verificationStatus === "expired";

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

  if (isUnavailable && officialPageUrl) {
    return (
      <div className="flex flex-col gap-2">
        <a
          href={officialPageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-amber-400 text-slate-900 border-2 border-slate-900 font-black rounded-xl px-6 py-3 hover:bg-amber-300 shadow-brutal-sm transition-all"
        >
          <ShieldAlert className="w-4 h-4" />
          Visit Official Site →
        </a>
        <p className="text-amber-700 text-[10px] font-semibold">Direct link unavailable. Visit organization&apos;s official website.</p>
      </div>
    );
  }

  // Real <a> so the external link always opens (a window.open after an await
  // fetch is treated as a non-user-gesture popup and silently blocked).
  return (
    <a
      href={applyLink}
      target="_blank"
      rel="noopener noreferrer"
      onClick={trackClick}
      className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl px-6 py-3 border-2 border-slate-900 shadow-brutal hover:shadow-brutal-lg hover:-translate-y-0.5 transition-all w-full"
    >
      Apply Now
      <ExternalLink className="w-4 h-4" />
    </a>
  );
}
