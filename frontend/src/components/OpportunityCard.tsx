"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Clock,
  Calendar,
  Briefcase,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import type { Opportunity } from "@/types";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import CategoryBadge from "./CategoryBadge";
import { cn, formatPostedDate, formatDeadlineTelemetry } from "@/lib/utils";
import { getOpportunityAvailability } from "@/lib/availability";
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

interface BookmarksApiResponse {
  bookmarks: BookmarkResponse[];
  count: number;
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
  const oppId = opportunity.id || "";
  const { user, loading: userLoading } = useUser();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkId, setBookmarkId] = useState<string | null>(null);

  const availability = getOpportunityAvailability(opportunity);
  const isAvailable = availability.status === "AVAILABLE" || availability.status === "EXPIRING_SOON";
  const postedDateFormatted = formatPostedDate(opportunity.posted_date || opportunity.posted_at || opportunity.created_at);
  const deadlineTelemetry = formatDeadlineTelemetry(opportunity.deadline);

  const isVerified = opportunity.verification_status === "verified" || !opportunity.verification_status;
  const isIntern = /intern|co-op|apprentice|student|trainee/i.test(opportunity.title) || opportunity.category?.toLowerCase() === "internship";
  const isFresher = isIntern || /fresher|entry|junior|graduate|associate|0-1|0-2/i.test(
    `${opportunity.title} ${opportunity.eligibility || ""} ${opportunity.experience_required || ""}`
  );

  const applyUrl = opportunity.apply_url || opportunity.apply_link || opportunity.source_url || `/opportunities/${opportunity.slug || oppId}`;
  const isExternal = !!(opportunity.apply_url || opportunity.apply_link || opportunity.source_url);

  useEffect(() => {
    if (!oppId || userLoading) return;
    if (user) {
      api
        .get<BookmarksApiResponse>("/api/bookmarks", { params: { opportunityId: oppId } })
        .then((res) => {
          const bookmarks = res.bookmarks || [];
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
    if (user && oppId) {
      if (isBookmarked && bookmarkId) {
        await api.delete(`/api/bookmarks/${bookmarkId}`);
        setIsBookmarked(false);
        setBookmarkId(null);
        toast.info("Opportunity removed from bookmarks");
      } else {
        const res = await api.post<{ bookmark: BookmarkResponse }>("/api/bookmarks", { opportunityId: oppId });
        setIsBookmarked(true);
        setBookmarkId(res.bookmark?.id || null);
        toast.success("Opportunity bookmarked");
      }
    } else if (oppId) {
      const bookmarks = getLocalBookmarks();
      const idx = bookmarks.indexOf(oppId);
      if (idx === -1) {
        bookmarks.push(oppId);
        setLocalBookmarks(bookmarks);
        setIsBookmarked(true);
        toast.success("Opportunity saved to device bookmarks");
      } else {
        bookmarks.splice(idx, 1);
        setLocalBookmarks(bookmarks);
        setIsBookmarked(false);
        toast.info("Opportunity removed from bookmarks");
      }
    }
  };

  const handleCardClick = () => {
    router.push(`/opportunities/${opportunity.slug || oppId}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        "group cursor-pointer rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between relative",
        !isAvailable && "opacity-75 bg-slate-50/70",
        compact ? "p-4" : "p-5",
        className
      )}
    >
      <div>
        {/* Top Row: Organization, Verified Badge, Domain/Category Pill, Bookmark */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <ImageWithFallback
              src={opportunity.organization_logo_url}
              alt={`${opportunity.organization || "Organization"} logo`}
              name={opportunity.organization || "BDW"}
              variant="logo"
              width={32}
              height={32}
              className="w-8 h-8 rounded-lg object-contain p-0.5 border border-slate-200 shrink-0"
            />
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs font-bold text-slate-900 truncate">
                {opportunity.organization || "Hardware Employer"}
              </span>
              {isVerified && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                  Verified
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleBookmark}
            aria-label={isBookmarked ? "Remove bookmark" : "Bookmark opportunity"}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-50 transition-colors shrink-0"
          >
            {isBookmarked ? (
              <BookmarkCheck className="w-4 h-4 text-blue-600 fill-current" />
            ) : (
              <Bookmark className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Badges: Category & Fresher Highlights */}
        <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
          <CategoryBadge category={opportunity.category} />
          {isFresher && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-purple-50 text-purple-700 border border-purple-200">
              <Sparkles className="w-2.5 h-2.5" />
              Fresher / Student
            </span>
          )}
          {opportunity.experience_required && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
              {opportunity.experience_required}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-slate-900 font-bold text-base leading-snug group-hover:text-blue-600 transition-colors line-clamp-2 mb-3">
          <Link href={`/opportunities/${opportunity.slug || oppId}`} onClick={(e) => e.stopPropagation()}>
            {opportunity.title}
          </Link>
        </h3>

        {/* Telemetry & Dates Block */}
        <div className="space-y-1.5 text-xs text-slate-500 font-normal mb-3">
          {/* Posted Date */}
          <div className="flex items-center gap-1.5 text-slate-600">
            <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="font-semibold text-slate-700">{postedDateFormatted}</span>
          </div>

          {/* Deadline / Availability */}
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span
              className={cn(
                "font-medium",
                deadlineTelemetry.isUrgent
                  ? "text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200"
                  : deadlineTelemetry.isRolling
                  ? "text-teal-700 font-medium bg-teal-50 px-1.5 py-0.5 rounded"
                  : "text-slate-600"
              )}
            >
              {deadlineTelemetry.text}
            </span>
          </div>

          {/* Location */}
          {opportunity.location && (
            <div className="flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{opportunity.location}</span>
            </div>
          )}

          {/* Compensation / Stipend */}
          {(opportunity.stipend || opportunity.salary_range) && (
            <div className="flex items-center gap-1.5 text-emerald-700 font-semibold truncate">
              <Briefcase className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{opportunity.stipend || opportunity.salary_range}</span>
            </div>
          )}
        </div>

        {/* Eligibility Pill */}
        {opportunity.eligibility && !compact && (
          <div className="mt-2 text-[11px] text-slate-500 line-clamp-1 bg-slate-50 rounded px-2 py-1 border border-slate-100">
            <span className="font-semibold text-slate-600">Eligibility: </span>
            <span>{opportunity.eligibility}</span>
          </div>
        )}
      </div>

      {/* Bottom Action Row: Details + Direct Apply */}
      <div className="pt-3.5 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <Link
          href={`/opportunities/${opportunity.slug || oppId}`}
          onClick={(e) => e.stopPropagation()}
          className="text-xs font-bold text-slate-600 hover:text-blue-600 inline-flex items-center gap-1 group/btn transition-colors"
        >
          <span>View Details</span>
          <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
        </Link>

        {isAvailable ? (
          isExternal ? (
            <a
              href={applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs hover:shadow-sm transition-all active:scale-[0.98]"
            >
              <span>Apply</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          ) : (
            <Link
              href={`/opportunities/${opportunity.slug || oppId}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs hover:shadow-sm transition-all"
            >
              <span>Apply</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          )
        ) : (
          <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md">
            Closed
          </span>
        )}
      </div>
    </div>
  );
}
