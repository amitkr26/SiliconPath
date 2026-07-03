"use client";

import { useState } from "react";
import { Info, ExternalLink, Flag } from "lucide-react";
import ReportIssueModal from "./ReportIssueModal";

interface OpportunityDisclaimerProps {
  opportunityId: string;
  officialPageUrl?: string | null;
}

export default function OpportunityDisclaimer({ opportunityId, officialPageUrl }: OpportunityDisclaimerProps) {
  const [showReport, setShowReport] = useState(false);

  return (
    <>
      <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-cyan mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="text-text-primary text-sm font-semibold mb-2">Before you apply</h3>
            <ul className="space-y-1.5 text-xs text-text-muted">
              <li>• Always verify details on the official website</li>
              <li>• Check for any updates or changes to the advertisement</li>
              <li>• Deadlines and eligibility criteria may have changed</li>
              <li>• ElectroBridge aggregates publicly available information</li>
            </ul>
            <div className="flex items-center gap-3 mt-4 flex-wrap">
              {officialPageUrl && (
                <a
                  href={officialPageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-cyan text-xs font-medium hover:underline"
                >
                  Visit Official Website
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              <button
                onClick={() => setShowReport(true)}
                className="inline-flex items-center gap-1.5 text-text-muted text-xs hover:text-amber-400 transition-colors"
              >
                <Flag className="w-3 h-3" />
                Report an Issue
              </button>
            </div>
          </div>
        </div>
      </div>
      <ReportIssueModal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        opportunityId={opportunityId}
      />
    </>
  );
}
