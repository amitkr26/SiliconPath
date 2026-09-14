"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MapPin, IndianRupee, ExternalLink, Heart } from "lucide-react";
import type { Opportunity } from "@/types";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import CategoryBadge from "./CategoryBadge";
import DeadlineCountdown from "./DeadlineCountdown";
import { cn, getDaysAgo, isNew, isExpired } from "@/lib/utils";
import ShareButtons from "./ShareButtons";
import VerificationBadge from "./VerificationBadge";
import { useUser } from "@/hooks/useUser";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

interface OpportunityCardProps {
  opportunity: Opportunity;
  compact?: boolean;
  className?: string;
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

export default function OpportunityCard({ opportunity, compact = false, className }: OpportunityCardProps) {
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
      className={cn("block group cursor-pointer", linkUnavailable && "opacity-70", className)}
    >
      <div className={cn(
        "bg-white border border-slate-200 rounded-xl shadow-xs hover:border-slate-300 hover:shadow-sm transition-all h-full flex flex-col justify-between",
        compact ? "p-4" : "p-5"
      )}>
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
            <ImageWithFallback
              src={opportunity.organization_logo_url}
              alt={`${opportunity.organization || "Organization"} logo`}
              name={opportunity.organization}
              variant="logo"
              width={40}
              height={40}
              className="w-10 h-10 rounded-lg object-contain p-0.5"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-slate-900 font-bold text-sm sm:text-base leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                  {opportunity.title}
                </h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {opportunity.organization ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        router.push(`/opportunities?search=${encodeURIComponent(opportunity.organization!)}`);
                      }}
                      className="text-xs text-slate-600 hover:text-blue-600 font-semibold hover:underline transition-colors text-left"
                      title={`View all opportunities from ${opportunity.organization}`}
                    >
                      {opportunity.organization}
                    </button>
                  ) : null}
                  {opportunity.verification_status && (
                    <VerificationBadge status={opportunity.verification_status} compact />
                  )}
                </div>
              </div>
              <button
                onClick={handleBookmark}
                className={`transition-colors flex-shrink-0 p-1.5 rounded-lg border border-slate-200 ${
                  isBookmarked ? "bg-red-500 text-white border-red-500" : "bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-red-500"
                }`}
                title={isBookmarked ? "Remove bookmark" : "Bookmark"}
              >
                <Heart className={`w-4 h-4 ${isBookmarked ? "fill-white" : ""}`} />
              </button>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <CategoryBadge category={opportunity.category} />
              {opportunity.experience_required ? (
                <span className="flex items-center gap-1 text-amber-800 text-xs font-medium bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  {opportunity.experience_required}
                </span>
              ) : opportunity.category === "JRF" || opportunity.category === "Internship" || (opportunity.category as string) === "Trainee" ? (
                <span className="flex items-center gap-1 text-emerald-800 text-[11px] font-medium bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Fresher Eligible
                </span>
              ) : null}
              {opportunity.location && (
                <span className="flex items-center gap-1 text-slate-600 text-xs font-medium bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                  <MapPin className="w-3 h-3" />
                  {opportunity.location}
                </span>
              )}
              {opportunity.stipend && (
                <span className="flex items-center gap-1 text-blue-800 text-xs font-medium bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                  <IndianRupee className="w-3 h-3 text-blue-600" />
                  {opportunity.stipend}
                </span>
              )}
            </div>

            {opportunity.eligibility && !compact && (
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {opportunity.eligibility
                  .split(",")
                  .map((e) => e.trim())
                  .filter((e) => e.length > 0)
                  .slice(0, 3)
                  .map((e, i) => (
                    <span
                      key={`${e}-${i}`}
                      className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-slate-600 text-[10px] font-medium"
                    >
                      {e}
                    </span>
                  ))}
              </div>
            )}
          </div>
        </div>

        <div className={cn("border-t border-slate-100 flex items-center justify-between", compact ? "mt-3 pt-2.5" : "mt-4 pt-3")}>
          {opportunity.deadline ? (
            <DeadlineCountdown deadline={opportunity.deadline} />
          ) : (
            <span className="text-[11px] font-medium text-slate-500">Regular Active Listing</span>
          )}
          {isExpired(opportunity.deadline) || opportunity.verification_status === "expired" ? (
            <span className="text-slate-400 text-xs font-semibold flex items-center gap-1">
              Closed
            </span>
          ) : opportunity.apply_link ? (
            <a
              href={opportunity.apply_link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-blue-600 text-xs font-semibold flex items-center gap-1 hover:text-blue-700 group-hover:translate-x-0.5 transition-transform"
            >
              Apply <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : (
            <span className="text-blue-600 text-xs font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
              View <ExternalLink className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
