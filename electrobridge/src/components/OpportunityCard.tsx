"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MapPin, Currency, Bookmark, ExternalLink, Heart } from "lucide-react";
import type { Opportunity } from "@/types";
import CategoryBadge from "./CategoryBadge";
import DeadlineCountdown from "./DeadlineCountdown";
import { cn, getDaysAgo, isNew } from "@/lib/utils";
import ShareButtons from "./ShareButtons";
import VerificationBadge from "./VerificationBadge";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface OpportunityCardProps {
  opportunity: Opportunity;
}

const ORG_COLORS: Record<string, string> = {
  isro: "bg-org-isro",
  intel: "bg-org-intel",
  tifr: "bg-org-tifr",
  tata: "bg-org-tata",
  drdo: "bg-org-drdo",
};

function getOrgColor(org: string): string {
  const key = org.toLowerCase().replace(/[^a-z]/g, "");
  for (const [k, v] of Object.entries(ORG_COLORS)) {
    if (key.includes(k)) return v;
  }
  return "bg-accent/20";
}

function orgSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

function getLocalBookmarks(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem("electrobridge_bookmarks");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function setLocalBookmarks(ids: string[]) {
  localStorage.setItem("electrobridge_bookmarks", JSON.stringify(ids));
}

export default function OpportunityCard({ opportunity }: OpportunityCardProps) {
  const oppId = opportunity.id!;
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const linkUnavailable = opportunity.verification_status === "link_unavailable" || opportunity.verification_status === "expired";

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (data?.user) {
        setUserId(data.user.id);
        const { data: saved } = await supabase
          .from("saved_opportunities")
          .select("id")
          .eq("user_id", data.user.id)
          .eq("opportunity_id", oppId)
          .maybeSingle();
        setIsBookmarked(!!saved);
      } else {
        setIsBookmarked(getLocalBookmarks().includes(oppId));
      }
    });
  }, [oppId]);

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const supabase = createClient();
    if (userId) {
      if (isBookmarked) {
        await supabase.from("saved_opportunities").delete().eq("user_id", userId).eq("opportunity_id", oppId);
        setIsBookmarked(false);
      } else {
        await supabase.from("saved_opportunities").insert({ user_id: userId, opportunity_id: oppId });
        setIsBookmarked(true);
      }
    } else {
      const bookmarks = getLocalBookmarks();
      const idx = bookmarks.indexOf(oppId);
      if (idx === -1) {
        bookmarks.push(oppId);
        setLocalBookmarks(bookmarks);
        setIsBookmarked(true);
      } else {
        bookmarks.splice(idx, 1);
        setLocalBookmarks(bookmarks);
        setIsBookmarked(false);
      }
      toast.info("Sign in to sync your saved opportunities across devices");
    }
  };

  return (
    <Link
      href={`/opportunities/${opportunity.slug}`}
      className={`block group ${linkUnavailable ? "opacity-70" : ""}`}
    >
      <div className="bg-surface border border-border rounded-card p-5 hover:border-accent/30 hover:shadow-glow-cyan hover:-translate-y-0.5 transition-all duration-200 h-full">
        <div className="flex items-start gap-4">
          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0", getOrgColor(opportunity.organization))}>
            <span className="text-text-primary text-sm font-bold">
              {getInitials(opportunity.organization)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-text-primary font-semibold text-sm leading-snug hover:text-accent line-clamp-2">
                  {opportunity.title}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <Link
                    href={`/organizations/${orgSlug(opportunity.organization)}`}
                    className="text-xs text-text-secondary hover:text-accent"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {opportunity.organization}
                  </Link>
                  {opportunity.verification_status && (
                    <VerificationBadge status={opportunity.verification_status} compact />
                  )}
                </div>
              </div>
              <button
                onClick={handleBookmark}
                className={`transition-colors flex-shrink-0 ${
                  isBookmarked ? "text-accent" : "text-text-muted hover:text-accent"
                }`}
                title={isBookmarked ? "Remove bookmark" : "Bookmark"}
              >
                <Heart className={`w-4 h-4 ${isBookmarked ? "fill-accent" : ""}`} />
              </button>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <CategoryBadge category={opportunity.category} />
              {opportunity.location && (
                <span className="flex items-center gap-1 text-text-muted text-xs">
                  <MapPin className="w-3 h-3" />
                  {opportunity.location}
                </span>
              )}
              {opportunity.stipend && (
                <span className="flex items-center gap-1 text-text-muted text-xs">
                  <Currency className="w-3 h-3" />
                  {opportunity.stipend}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              {opportunity.posted_at && (
                <span className="text-text-muted text-[10px]">
                  {getDaysAgo(opportunity.posted_at)}
                </span>
              )}
              {opportunity.posted_at && isNew(opportunity.posted_at) && (
                <span className="px-1.5 py-0.5 bg-success/20 text-success rounded text-[10px] font-semibold border border-success/30">
                  NEW
                </span>
              )}
            </div>
            {opportunity.eligibility && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {opportunity.eligibility.split(",").map((e) => (
                  <span
                    key={e.trim()}
                    className="px-2 py-0.5 bg-surface-elevated rounded text-text-muted text-[10px]"
                  >
                    {e.trim()}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between mt-3">
              {opportunity.deadline && <DeadlineCountdown deadline={opportunity.deadline} />}
              <span className="text-accent text-xs font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                View Details
                <ExternalLink className="w-3 h-3" />
              </span>
            </div>
            <div className="mt-3 pt-3 border-t border-border/50" onClick={(e) => e.preventDefault()}>
              <ShareButtons
                title={opportunity.title}
                organization={opportunity.organization}
                deadline={opportunity.deadline}
                opportunityUrl={`https://electrobridge.vercel.app/opportunities/${opportunity.slug}`}
              />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
