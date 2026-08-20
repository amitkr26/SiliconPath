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
      <div className="bg-white border-2 border-slate-900 rounded-2xl p-5 shadow-brutal hover:shadow-brutal-lg hover:-translate-y-1 transition-all h-full flex flex-col justify-between">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-600 border-2 border-slate-900 flex items-center justify-center flex-shrink-0 text-white font-black text-sm shadow-brutal-sm">
            {getInitials(opportunity.organization)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-slate-900 font-bold text-sm sm:text-base leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                  {opportunity.title}
                </h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs text-slate-600 font-semibold">
                    {opportunity.organization}
                  </span>
                  {opportunity.verification_status && (
                    <VerificationBadge status={opportunity.verification_status} compact />
                  )}
                </div>
              </div>
              <button
                onClick={handleBookmark}
                className={`transition-colors flex-shrink-0 p-1.5 rounded-lg border border-slate-900 ${
                  isBookmarked ? "bg-red-500 text-white" : "bg-slate-100 text-slate-600 hover:text-red-500"
                }`}
                title={isBookmarked ? "Remove bookmark" : "Bookmark"}
              >
                <Heart className={`w-4 h-4 ${isBookmarked ? "fill-white" : ""}`} />
              </button>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <CategoryBadge category={opportunity.category} />
              {opportunity.location && (
                <span className="flex items-center gap-1 text-slate-700 text-xs font-semibold bg-slate-100 px-2 py-0.5 rounded border border-slate-900">
                  <MapPin className="w-3 h-3" />
                  {opportunity.location}
                </span>
              )}
              {opportunity.stipend && (
                <span className="flex items-center gap-1 text-slate-900 text-xs font-bold bg-blue-100 px-2 py-0.5 rounded border border-slate-900">
                  <IndianRupee className="w-3 h-3 text-blue-700" />
                  {opportunity.stipend}
                </span>
              )}
            </div>

            {opportunity.eligibility && (
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {opportunity.eligibility.split(",").map((e) => (
                  <span
                    key={e.trim()}
                    className="px-2 py-0.5 bg-slate-50 border border-slate-300 rounded text-slate-600 text-[10px] font-bold"
                  >
                    {e.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t-2 border-slate-100 flex items-center justify-between">
          {opportunity.deadline ? (
            <DeadlineCountdown deadline={opportunity.deadline} />
          ) : (
            <span className="text-[10px] font-semibold text-slate-400">Regular Listing</span>
          )}
          <span className="text-blue-600 text-xs font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            Apply <ExternalLink className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
}
