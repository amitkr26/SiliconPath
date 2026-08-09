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

  // Fire-and-forget tracking so navigation is never blocked by it.
  const trackClick = () => {
    fetch("/api/track-click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ opportunity_id: opportunityId }),
    }).catch(() => {});
    if (user) {
      api
        .get<{ id: string }[] | null>("/api/applications", {
          params: { user_id: user.id, opportunity_id: opportunityId },
        })
        .then((existing) => {
          if (!existing || existing.length === 0) {
            return api.post("/api/applications", {
              user_id: user.id,
              opportunity_id: opportunityId,
              status: "applied",
            });
          }
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
          className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold rounded-lg px-6 py-3 hover:bg-amber-500/30 transition-colors"
        >
          <ShieldAlert className="w-4 h-4" />
          Visit Official Site →
        </a>
        <p className="text-amber-400/60 text-[10px]">Direct link unavailable. Visit organization&apos;s official website.</p>
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
      className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-cyan to-cyan/80 text-navy font-semibold rounded-lg px-6 py-3 hover:from-cyan/90 hover:to-cyan/70 transition-all w-full"
    >
      Apply Now
      <ExternalLink className="w-4 h-4" />
    </a>
  );
}
