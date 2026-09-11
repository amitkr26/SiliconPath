import React from "react";
import {
  Building2,
  MapPin,
  GraduationCap,
  Banknote,
  Calendar,
  ExternalLink,
  ShieldCheck,
  Bookmark,
  BookmarkCheck,
  Clock,
  Sparkles,
} from "lucide-react";
import { GroundedRecord } from "@/lib/ai/grounding";

interface OpportunityCardProps {
  opportunity: GroundedRecord;
  isSaved?: boolean;
  onToggleSave?: (id: string) => void;
}

export function OpportunityCard({
  opportunity,
  isSaved = false,
  onToggleSave,
}: OpportunityCardProps) {
  const badge = opportunity.badgeColor || {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  };

  const statusLabel =
    opportunity.status === "EXPIRING_SOON"
      ? "Expiring Soon"
      : opportunity.status === "EXPIRED"
      ? "Expired"
      : opportunity.status === "ACTIVE"
      ? "Active"
      : "Unverified";

  return (
    <div className="bg-white border border-slate-200/90 hover:border-blue-400/80 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
      <div>
        {/* Top Badges Row */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${badge.bg} ${badge.text} ${badge.border}`}
            >
              {statusLabel}
            </span>
            {opportunity.verification_status === "verified" || opportunity.organization ? (
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-blue-600" />
                Verified Source
              </span>
            ) : null}
            {opportunity.category && (
              <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md uppercase">
                {opportunity.category}
              </span>
            )}
          </div>

          {onToggleSave && (
            <button
              onClick={() => opportunity.id && onToggleSave(opportunity.id)}
              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
              title={isSaved ? "Remove from Saved" : "Save Opportunity"}
              aria-label="Save opportunity"
            >
              {isSaved ? (
                <BookmarkCheck className="w-4 h-4 text-blue-600" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* Opportunity Title & Organization */}
        <h3 className="font-bold text-sm text-slate-900 leading-snug group-hover:text-blue-600 transition">
          {opportunity.title}
        </h3>

        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold mt-1">
          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{opportunity.organization || "Official Research Institution"}</span>
        </div>

        {/* Meta Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-xs text-slate-600 border-t border-slate-100 pt-3">
          {opportunity.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{opportunity.location}</span>
            </div>
          )}
          {opportunity.stipend && (
            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
              <Banknote className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">{opportunity.stipend}</span>
            </div>
          )}
          {opportunity.eligibility && (
            <div className="flex items-center gap-1.5 sm:col-span-2">
              <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="line-clamp-1">{opportunity.eligibility}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 sm:col-span-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-medium">
              Deadline:{" "}
              <strong className="text-slate-900">
                {opportunity.formattedDeadline || opportunity.deadline || "Open / Rolling"}
              </strong>
              {opportunity.daysRemaining !== null && opportunity.daysRemaining !== undefined && (
                <span
                  className={`ml-1.5 font-bold ${
                    opportunity.daysRemaining < 0
                      ? "text-rose-600"
                      : opportunity.daysRemaining <= 7
                      ? "text-amber-600"
                      : "text-emerald-600"
                  }`}
                >
                  ({opportunity.daysRemaining < 0 ? "Expired" : `${opportunity.daysRemaining}d left`})
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Short Description */}
        {opportunity.description && (
          <p className="text-xs text-slate-500 mt-2.5 line-clamp-2 leading-relaxed">
            {opportunity.description}
          </p>
        )}
      </div>

      {/* Footer Actions */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
          <Clock className="w-3 h-3 text-slate-300" />
          {opportunity.freshnessLabel || "Verified"}
        </span>

        <div className="flex items-center gap-2">
          {opportunity.source_url && (
            <a
              href={opportunity.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-slate-700 hover:text-blue-600 bg-slate-100 hover:bg-slate-200/70 px-3 py-1.5 rounded-xl transition flex items-center gap-1"
            >
              <span>Official Notification</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          {opportunity.apply_url && (
            <a
              href={opportunity.apply_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3.5 py-1.5 rounded-xl shadow-xs transition flex items-center gap-1"
            >
              <span>Apply</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
