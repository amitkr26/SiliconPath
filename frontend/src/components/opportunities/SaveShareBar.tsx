"use client";

import { useState, useEffect } from "react";
import { Bookmark, Share2, CalendarDays, Check, Copy, MessageCircle, Linkedin, Twitter } from "lucide-react";
import { toast } from "sonner";

interface SaveShareBarProps {
  opportunityId: string;
  title: string;
  organization: string;
  deadline?: string | null;
  slug: string;
}

export default function SaveShareBar({
  opportunityId,
  title,
  organization,
  deadline,
  slug,
}: SaveShareBarProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const fullUrl = typeof window !== "undefined"
    ? `${window.location.origin}/opportunities/${slug}`
    : `https://berojgardegreewala.vercel.app/opportunities/${slug}`;

  // Check initial bookmark status
  useEffect(() => {
    let isMounted = true;
    async function checkBookmark() {
      try {
        const res = await fetch(`/api/bookmarks?opportunityId=${opportunityId}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.bookmarks && data.bookmarks.length > 0) {
            setIsSaved(true);
          }
        }
      } catch {
        /* silent fail if not logged in */
      }
    }
    if (opportunityId) checkBookmark();
    return () => {
      isMounted = false;
    };
  }, [opportunityId]);

  // Toggle Save / Bookmark
  const handleSaveToggle = async () => {
    setSaving(true);
    try {
      if (isSaved) {
        const res = await fetch(`/api/bookmarks/${opportunityId}`, { method: "DELETE" });
        if (res.ok) {
          setIsSaved(false);
          toast.info("Removed from saved opportunities");
        } else if (res.status === 401) {
          toast.error("Please login to save opportunities");
          window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        } else {
          toast.error("Failed to update bookmark");
        }
      } else {
        const res = await fetch("/api/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ opportunity_id: opportunityId }),
        });
        if (res.ok) {
          setIsSaved(true);
          toast.success("Opportunity saved to your bookmarks!");
        } else if (res.status === 401) {
          toast.error("Please login to save opportunities");
          window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        } else {
          toast.error("Failed to save opportunity");
        }
      }
    } catch {
      toast.error("Network error while updating bookmark");
    } finally {
      setSaving(false);
    }
  };

  // Handle Native Share / Menu
  const handleShareClick = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${title} | ${organization}`,
          text: `Check out this opening for ${title} at ${organization} on BerojgarDegreeWala!`,
          url: fullUrl,
        });
        return;
      } catch {
        /* user cancelled or fallback */
      }
    }
    setShowShareMenu((prev) => !prev);
  };

  // Copy Link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Add to Google Calendar
  const handleAddToCalendar = () => {
    if (!deadline) {
      toast.error("No deadline set for this opportunity");
      return;
    }
    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime())) {
      toast.error("Invalid deadline date format");
      return;
    }

    const startDateStr = deadlineDate.toISOString().replace(/-|:|\.\d\d\d/g, "");
    const endDate = new Date(deadlineDate.getTime() + 60 * 60 * 1000);
    const endDateStr = endDate.toISOString().replace(/-|:|\.\d\d\d/g, "");

    const calTitle = encodeURIComponent(`APPLICATION DEADLINE: ${title} (${organization})`);
    const calDetails = encodeURIComponent(`Application deadline for ${title} at ${organization}.\n\nApply link: ${fullUrl}`);
    const calLocation = encodeURIComponent("BerojgarDegreeWala Portal");

    const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${calTitle}&dates=${startDateStr}/${endDateStr}&details=${calDetails}&location=${calLocation}`;

    window.open(googleCalUrl, "_blank", "noopener,noreferrer");
    toast.success("Opening Google Calendar to add deadline reminder!");
  };

  const shareText = `Check out this opening for ${title} at ${organization} on BerojgarDegreeWala!`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${fullUrl}`)}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullUrl)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(fullUrl)}`;

  return (
    <div className="space-y-3 relative">
      {/* Save & Share Row */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSaveToggle}
          disabled={saving}
          className={`flex-1 inline-flex items-center justify-center gap-2 border font-semibold rounded-xl px-4 py-2.5 text-sm transition-all shadow-xs ${
            isSaved
              ? "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
          }`}
        >
          <Bookmark className={`w-4 h-4 ${isSaved ? "fill-blue-600 text-blue-600" : "text-slate-600"}`} />
          {saving ? "Updating..." : isSaved ? "Saved" : "Save"}
        </button>

        <button
          type="button"
          onClick={handleShareClick}
          className="flex-1 inline-flex items-center justify-center gap-2 border border-slate-200 bg-white text-slate-700 font-semibold rounded-xl px-4 py-2.5 text-sm hover:bg-slate-50 hover:border-slate-300 transition-all shadow-xs"
        >
          <Share2 className="w-4 h-4 text-slate-600" />
          Share
        </button>
      </div>

      {/* Share Modal / Dropdown */}
      {showShareMenu && (
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-card space-y-2 animate-in fade-in slide-in-from-top-2">
          <div className="text-xs font-bold text-slate-900 mb-1 uppercase tracking-wider">Share this opportunity</div>
          <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" /> WhatsApp
            </a>
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
            >
              <Linkedin className="w-4 h-4 text-blue-600" /> LinkedIn
            </a>
            <a
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-2 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 transition-colors"
            >
              <Twitter className="w-4 h-4 text-sky-600" /> Twitter / X
            </a>
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-2 p-2 rounded-lg bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200 transition-colors text-left font-semibold"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
              {copied ? "Copied!" : "Copy Link"}
            </button>
          </div>
        </div>
      )}

      {/* Add to Calendar Button */}
      {deadline && (
        <button
          type="button"
          onClick={handleAddToCalendar}
          className="w-full inline-flex items-center justify-center gap-2 border border-slate-200 bg-white text-slate-700 font-semibold rounded-xl px-4 py-2.5 text-xs hover:border-blue-500 hover:bg-slate-50 transition-all shadow-xs"
        >
          <CalendarDays className="w-4 h-4 text-blue-600" />
          Add Deadline to Calendar
        </button>
      )}

      {/* Quick Copy Link pill */}
      <button
        type="button"
        onClick={handleCopyLink}
        className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg py-2 transition-colors"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
        {copied ? "Copied to Clipboard!" : "Copy Opportunity Link"}
      </button>
    </div>
  );
}
