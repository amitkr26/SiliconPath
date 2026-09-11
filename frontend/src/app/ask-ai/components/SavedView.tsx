import React, { useState, useEffect } from "react";
import { Bookmark, Search, Trash2, ExternalLink, Sparkles } from "lucide-react";
import { OpportunityCard } from "./OpportunityCard";
import { GroundedRecord } from "@/lib/ai/grounding";

interface SavedViewProps {
  savedIds: string[];
  onToggleSave: (id: string) => void;
  onSelectForAI: (query: string) => void;
}

export function SavedView({
  savedIds,
  onToggleSave,
  onSelectForAI,
}: SavedViewProps) {
  const [savedOpportunities, setSavedOpportunities] = useState<GroundedRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSaved = async () => {
      if (savedIds.length === 0) {
        setSavedOpportunities([]);
        return;
      }
      setLoading(true);
      try {
        // Query /api/ai/chat or search to retrieve saved ids
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content: "all recent JRF semiconductor opportunities" }],
          }),
        });
        const data = await res.json();
        const records: GroundedRecord[] = data.opportunities || [];
        setSavedOpportunities(records.filter((r) => r.id && savedIds.includes(r.id)));
      } catch {}
      setLoading(false);
    };
    fetchSaved();
  }, [savedIds]);

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 flex items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md text-xs font-bold mb-2">
            <Bookmark className="w-3.5 h-3.5" />
            Bookmarked Opportunities
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Saved Opportunities ({savedIds.length})
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mt-1">
            Track and prepare application dossiers for your shortlisted positions.
          </p>
        </div>
      </div>

      {savedIds.length === 0 ? (
        <div className="p-12 bg-white border border-slate-200/90 rounded-3xl text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Bookmark className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-sm text-slate-900">No saved opportunities yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Click the bookmark icon on any opportunity card in the Discover or Ask AI tab to save it here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savedOpportunities.map((opp) => (
            <OpportunityCard
              key={opp.id}
              opportunity={opp}
              isSaved={true}
              onToggleSave={onToggleSave}
            />
          ))}
        </div>
      )}
    </div>
  );
}
