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
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-surface/30 hover:bg-surface/70 hover:border-accent/30 transition-all duration-200">
        <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-accent">
            {getInitials(opportunity.organization)}
          </span>
        </div>

        <div className="flex-1 min-w-0 grid grid-cols-12 gap-2 items-center">
          <div className="col-span-4 min-w-0">
            <h3 className="text-text-primary text-sm font-medium leading-snug truncate group-hover:text-accent transition-colors">
              {opportunity.title}
            </h3>
            <span className="text-[11px] text-text-muted font-medium truncate block">
              {opportunity.organization}
            </span>
          </div>

          <div className="col-span-2">
            <CategoryBadge category={opportunity.category} />
          </div>

          <div className="col-span-2 flex items-center gap-1 text-text-muted text-xs truncate">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{opportunity.location || "—"}</span>
          </div>

          <div className="col-span-1 flex items-center gap-1 text-text-muted text-xs">
            {opportunity.stipend ? (
              <>
                <IndianRupee className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{opportunity.stipend}</span>
              </>
            ) : (
              <span className="text-text-muted/50">—</span>
            )}
          </div>

          <div className="col-span-2 flex items-center gap-1.5">
            {opportunity.deadline ? (
              <DeadlineCountdown deadline={opportunity.deadline} />
            ) : (
              <span className="text-text-muted text-xs">No deadline</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
