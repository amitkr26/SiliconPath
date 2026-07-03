"use client";

import { useState } from "react";
import { Sparkles, Loader2, ChevronDown, ChevronUp } from "lucide-react";

interface AISummary {
  what_you_will_do: string;
  why_apply: string;
  typical_documents: string[];
  tips: string;
  difficulty_level: string;
  career_stage: string;
}

export default function AIOpportunitySummary({ slug }: { slug: string }) {
  const [expanded, setExpanded] = useState(false);
  const [summary, setSummary] = useState<AISummary | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchSummary = async () => {
    if (summary) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/ai/opportunity-summary/${slug}`);
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    if (!expanded) {
      fetchSummary();
    }
    setExpanded(!expanded);
  };

  const difficultyColor =
    summary?.difficulty_level === "High"
      ? "text-red-400"
      : summary?.difficulty_level === "Medium"
        ? "text-yellow-400"
        : "text-green-400";

  return (
    <div className="mt-6 bg-navy-light border border-gray-800 rounded-lg overflow-hidden">
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-800/30 transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-text-primary">
          <Sparkles className="w-4 h-4 text-purple-400" />
          AI Insights
        </span>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-text-muted" />
        ) : (
          <ChevronDown className="w-4 h-4 text-text-muted" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-800">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 text-cyan animate-spin" />
            </div>
          ) : summary ? (
            <div className="space-y-4 pt-4">
              <div>
                <h4 className="text-cyan text-xs font-semibold mb-1">What You&apos;ll Do</h4>
                <p className="text-text-muted text-sm">{summary.what_you_will_do}</p>
              </div>
              <div>
                <h4 className="text-cyan text-xs font-semibold mb-1">Why Apply</h4>
                <p className="text-text-muted text-sm">{summary.why_apply}</p>
              </div>
              {summary.typical_documents.length > 0 && (
                <div>
                  <h4 className="text-cyan text-xs font-semibold mb-1">Typical Documents</h4>
                  <ul className="list-disc list-inside text-text-muted text-sm space-y-0.5">
                    {summary.typical_documents.map((doc, i) => (
                      <li key={i}>{doc}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <h4 className="text-cyan text-xs font-semibold mb-1">Tips</h4>
                <p className="text-text-muted text-sm">{summary.tips}</p>
              </div>
              <div className="flex gap-4 text-xs">
                <span>
                  Difficulty: <span className={difficultyColor}>{summary.difficulty_level}</span>
                </span>
                <span>
                  Career Stage: <span className="text-text-primary">{summary.career_stage}</span>
                </span>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center text-text-muted text-sm">
              Could not load AI insights. Try again later.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
