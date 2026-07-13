"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, IndianRupee, Heart, Calendar, ExternalLink } from "lucide-react";
import type { Opportunity } from "@/types";
import CategoryBadge from "./CategoryBadge";
import DeadlineCountdown from "./DeadlineCountdown";
import { cn, getDaysAgo, isNew } from "@/lib/utils";
import { useUser } from "@/hooks/useUser";
import { useBookmarks, useAddBookmark, useRemoveBookmark } from "@/hooks/useBookmarks";
import { toast } from "sonner";

interface OpportunityRowProps {
  opportunity: Opportunity;
}

function getLocalBookmarks(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem("SiliconPath_bookmarks");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function setLocalBookmarks(ids: string[]) {
  localStorage.setItem("SiliconPath_bookmarks", JSON.stringify(ids));
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

function orgSlug(name?: string): string {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function OpportunityRow({ opportunity }: OpportunityRowProps) {
  const oppId = opportunity.id!;
  const { user, loading: userLoading } = useUser();
  const { data: bookmarksData } = useBookmarks(100, 0);
  const addBookmark = useAddBookmark();
  const removeBookmark = useRemoveBookmark();

  const bookmarkEntry = bookmarksData?.bookmarks.find(
    (b) => b.opportunity_id === oppId,
  );

  const isBookmarked = user
    ? !!bookmarkEntry
    : getLocalBookmarks().includes(oppId);

  const isDeadlineSoon = opportunity.deadline
    ? new Date(opportunity.deadline).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000
    : false;

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

  return (
    <Link
      href={`/opportunities/${opportunity.slug}`}
      className="block group"
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
            <Link
              href={`/organizations/${orgSlug(opportunity.organization)}`}
              className="text-[11px] text-text-muted hover:text-accent truncate block"
              onClick={(e) => e.stopPropagation()}
            >
              {opportunity.organization}
            </Link>
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
              <span className="text-text-muted/50 text-xs">No deadline</span>
            )}
          </div>

          <div className="col-span-1 flex items-center justify-end gap-1">
            {opportunity.posted_at && isNew(opportunity.posted_at) && (
              <span className="px-1 py-0.5 bg-success/20 text-success rounded text-[9px] font-semibold leading-none">
                NEW
              </span>
            )}
            {opportunity.posted_at && !isNew(opportunity.posted_at) && (
              <span className="text-[10px] text-text-muted/60">
                {getDaysAgo(opportunity.posted_at)}
              </span>
            )}
            <button
              onClick={handleBookmark}
              className={`transition-colors flex-shrink-0 p-1 ${
                isBookmarked ? "text-accent" : "text-text-muted/40 hover:text-accent"
              }`}
              title={isBookmarked ? "Remove bookmark" : "Bookmark"}
            >
              <Heart className={`w-3.5 h-3.5 ${isBookmarked ? "fill-accent" : ""}`} />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
