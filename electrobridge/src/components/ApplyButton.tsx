"use client";

import { useState, useEffect } from "react";
import { ExternalLink, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ApplyButtonProps {
  applyLink: string;
  opportunityId: string;
  verificationStatus?: string;
  officialPageUrl?: string | null;
}

export default function ApplyButton({ applyLink, opportunityId, verificationStatus, officialPageUrl }: ApplyButtonProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const isUnavailable = verificationStatus === "link_unavailable" || verificationStatus === "expired";

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setUserId(data.user.id);
    });
  }, []);

  const handleClick = async () => {
    try {
      await fetch("/api/track-click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunity_id: opportunityId }),
      });
      if (userId) {
        const supabase = createClient();
        const { data: existing } = await supabase
          .from("applications")
          .select("id")
          .eq("user_id", userId)
          .eq("opportunity_id", opportunityId)
          .maybeSingle();
        if (!existing) {
          await supabase.from("applications").insert({
            user_id: userId,
            opportunity_id: opportunityId,
            status: "applied",
          });
        }
      }
    } catch {}
    if (!isUnavailable) {
      window.open(applyLink, "_blank", "noopener noreferrer");
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

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan to-cyan/80 text-navy font-semibold rounded-lg px-6 py-3 hover:from-cyan/90 hover:to-cyan/70 transition-all"
    >
      Apply Now
      <ExternalLink className="w-4 h-4" />
    </button>
  );
}
