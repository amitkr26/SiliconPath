"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MapPin, IndianRupee, ExternalLink, Heart } from "lucide-react";
import type { Opportunity } from "@/types";
import CategoryBadge from "./CategoryBadge";
import DeadlineCountdown from "./DeadlineCountdown";
import { cn, getDaysAgo, isNew } from "@/lib/utils";
import ShareButtons from "./ShareButtons";
import VerificationBadge from "./VerificationBadge";
import { useUser } from "@/hooks/useUser";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

interface OpportunityCardProps {
  opportunity: Opportunity;
}

interface BookmarkResponse {
  id: string;
}

const ORG_COLORS: Record<string, string> = {
  isro: "bg-org-isro",
  intel: "bg-org-intel",
  tifr: "bg-org-tifr",
  tata: "bg-org-tata",
  drdo: "bg-org-drdo",
};

function getOrgColor(org?: string): string {
  if (!org) return "bg-accent/20";
  const key = org.toLowerCase().replace(/[^a-z]/g, "");
  for (const [k, v] of Object.entries(ORG_COLORS)) {
    if (key.includes(k)) return v;
  }
  return "bg-accent/20";
}

function getInitials(name?: string): string {
  if (!name) return "?";
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
    const stored = localStorage.getItem("BerojgarDegreeWala_bookmarks");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function setLocalBookmarks(ids: string[]) {
  localStorage.setItem("BerojgarDegreeWala_bookmarks", JSON.stringify(ids));
}

export default function OpportunityCard({ opportunity }: OpportunityCardProps) {
  const router = useRouter();
  const oppId = opportunity.id!;
  const { user, loading: userLoading } = useUser();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkId, setBookmarkId] = useState<string | null>(null);
  const linkUnavailable = opportunity.verification_status === "link_unavailable" || opportunity.verification_status === "expired";

  useEffect(() => {
    if (userLoading) return;
    if (user) {
      api
        .get<BookmarkResponse[]>("/api/bookmarks", { params: { opportunityId: oppId } })
        .then((bookmarks) => {
          if (bookmarks.length > 0) {
            setIsBookmarked(true);
            setBookmarkId(bookmarks[0].id);
          } else {
            setIsBookmarked(false);
            setBookmarkId(null);
          }
        })
        .catch(() => {
          setIsBookmarked(false);
          setBookmarkId(null);
        });
    } else {
      setIsBookmarked(getLocalBookmarks().includes(oppId));
    }
  }, [oppId, user, userLoading]);

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (user) {
      if (isBookmarked && bookmarkId) {
        await api.delete(`/api/bookmarks/${bookmarkId}`);
        setIsBookmarked(false);
        setBookmarkId(null);
      } else {
        const res = await api.post<BookmarkResponse>("/api/bookmarks", { opportunityId: oppId });
        setIsBookmarked(true);
        setBookmarkId(res.id);
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

  const handleCardClick = () => {
    router.push(`/opportunities/${opportunity.slug}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`block group cursor-pointer ${linkUnavailable ? "opacity-70" : ""}`}
    >
      <div className="glass-premium rounded-xl p-6 hover:-translate-y-1 transition-all duration-300 h-full">
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
                  <span className="text-xs text-text-secondary font-medium">
                    {opportunity.organization}
                  </span>
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
                  <IndianRupee className="w-3 h-3" />
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
            <div className="mt-3 pt-3 border-t border-border/50" onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
              <ShareButtons
                title={opportunity.title}
                organization={opportunity.organization}
                deadline={opportunity.deadline}
                opportunityUrl={`https://berojgardegreewala.vercel.app/opportunities/${opportunity.slug}`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
