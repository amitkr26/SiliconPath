"use client";

import { useRouter } from "next/navigation";
import { MapPin, IndianRupee } from "lucide-react";
import type { Opportunity } from "@/types";
import CategoryBadge from "./CategoryBadge";
import DeadlineCountdown from "./DeadlineCountdown";
import { useUser } from "@/hooks/useUser";
import { useBookmarks, useAddBookmark, useRemoveBookmark } from "@/hooks/useBookmarks";
import { toast } from "sonner";

interface OpportunityRowProps {
  opportunity: Opportunity;
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

function getInitials(name?: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

export default function OpportunityRow({ opportunity }: OpportunityRowProps) {
  const router = useRouter();
  const oppId = opportunity.id!;
  const { user } = useUser();
  const { data: bookmarksData } = useBookmarks(100, 0);
  const addBookmark = useAddBookmark();
  const removeBookmark = useRemoveBookmark();

  const bookmarkEntry = bookmarksData?.bookmarks.find(
    (b) => b.opportunity_id === oppId,
  );

  const isBookmarked = user
    ? !!bookmarkEntry
    : getLocalBookmarks().includes(oppId);

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (user) {
      if (isBookmarked && bookmarkEntry) {
        await removeBookmark.mutateAsync(bookmarkEntry.id);
      } else {
        await addBookmark.mutateAsync(oppId);
      }
    } else {
      const bookmarks = getLocalBookmarks();
      const idx = bookmarks.indexOf(oppId);
      if (idx === -1) {
        bookmarks.push(oppId);
        setLocalBookmarks(bookmarks);
      } else {
        bookmarks.splice(idx, 1);
        setLocalBookmarks(bookmarks);
      }
      toast.info("Sign in to sync your saved opportunities across devices");
    }
  };

  const handleRowClick = () => {
    router.push(`/opportunities/${opportunity.slug}`);
  };

  return (
    <div
      onClick={handleRowClick}
      className="block group cursor-pointer"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3.5 rounded-xl border border-slate-200 bg-white shadow-xs hover:border-slate-300 hover:shadow-sm transition-all duration-150">
        {/* Left: Organization Avatar + Title & Org */}
        <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0">
            <span className="text-xs font-bold text-blue-600">
              {getInitials(opportunity.organization)}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-slate-900 text-sm font-bold leading-snug line-clamp-1 group-hover:text-blue-600 transition-colors">
              {opportunity.title}
            </h3>
            {opportunity.organization ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  router.push(`/opportunities?search=${encodeURIComponent(opportunity.organization!)}`);
                }}
                className="text-[11px] text-slate-600 hover:text-blue-600 font-bold truncate block text-left hover:underline"
              >
                {opportunity.organization}
              </button>
            ) : null}
          </div>
        </div>

        {/* Right: Metadata Pills & Action */}
        <div className="flex items-center flex-wrap sm:flex-nowrap gap-2.5 sm:gap-4 justify-between sm:justify-end text-xs shrink-0">
          <CategoryBadge category={opportunity.category} />

          {opportunity.location && (
            <div className="flex items-center gap-1 text-slate-600 font-medium">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
              <span className="truncate max-w-[120px]">{opportunity.location}</span>
            </div>
          )}

          <div className="flex items-center gap-1 font-bold text-slate-900">
            {opportunity.stipend ? (
              <>
                <IndianRupee className="w-3.5 h-3.5 flex-shrink-0 text-emerald-600" />
                <span className="truncate">{opportunity.stipend}</span>
              </>
            ) : (
              <span className="text-slate-400 font-normal">—</span>
            )}
          </div>

          <div>
            {opportunity.deadline ? (
              <DeadlineCountdown deadline={opportunity.deadline} />
            ) : (
              <span className="text-slate-400 font-medium text-[11px]">Regular</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
