"use client";

import { useState, useEffect } from "react";
import { Sparkles, Loader2, Lightbulb, Target, GraduationCap, FileText, Activity } from "lucide-react";

interface AISummary {
  what_you_will_do: string;
  why_apply: string;
  typical_documents: string[];
  tips: string;
  difficulty_level: string;
  career_stage: string;
}

export default function AIOpportunitySummary({ slug }: { slug: string }) {
  const [summary, setSummary] = useState<AISummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchSummary = async () => {
      try {
        const res = await fetch(`/api/ai/opportunity-summary/${slug}`);
        if (res.ok) {
          const data = await res.json();
          if (mounted) setSummary(data);
        } else {
          if (mounted) setError(true);
        }
      } catch {
        if (mounted) setError(true);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchSummary();
    return () => { mounted = false; };
  }, [slug]);

  if (error && !summary) return null; // Hide completely if it fails or there's no info to show

  const difficultyColor =
    summary?.difficulty_level === "High"
      ? "text-danger bg-danger/10 border-danger/20"
      : summary?.difficulty_level === "Medium"
        ? "text-warning bg-warning/10 border-warning/20"
        : "text-success bg-success/10 border-success/20";

  return (
    <div className="mt-8 bg-surface-elevated border border-accent/20 rounded-xl relative shadow-lg shadow-accent/5 overflow-hidden">
      {/* Decorative top border glow */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent/20 via-accent to-accent/20" />
      
      <div className="p-5 border-b border-border flex items-center justify-between bg-surface/50">
        <h3 className="font-display text-lg font-bold text-text-primary flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent" />
          AI Analysis & Insights
        </h3>
        {loading && (
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Loader2 className="w-4 h-4 text-accent animate-spin" />
            Analyzing...
          </div>
        )}
      </div>

      <div className="p-5">
        {loading && !summary ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-4 bg-border/50 rounded w-1/4"></div>
            <div className="h-4 bg-border/50 rounded w-full"></div>
            <div className="h-4 bg-border/50 rounded w-3/4"></div>
          </div>
        ) : summary ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              <div>
                <h4 className="flex items-center gap-1.5 text-accent text-sm font-semibold mb-2">
                  <Target className="w-4 h-4" /> What You&apos;ll Do
                </h4>
                <p className="text-text-secondary text-sm leading-relaxed">{summary.what_you_will_do}</p>
              </div>

              <div>
                <h4 className="flex items-center gap-1.5 text-accent text-sm font-semibold mb-2">
                  <Lightbulb className="w-4 h-4" /> Why Apply
                </h4>
                <p className="text-text-secondary text-sm leading-relaxed">{summary.why_apply}</p>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {summary.typical_documents && summary.typical_documents.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-1.5 text-accent text-sm font-semibold mb-2">
                    <FileText className="w-4 h-4" /> Required Documents
                  </h4>
                  <ul className="space-y-1.5">
                    {summary.typical_documents.map((doc, i) => (
                      <li key={i} className="flex items-start gap-2 text-text-secondary text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent/60 flex-shrink-0 mt-1.5" />
                        {doc}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {summary.tips && (
                <div className="bg-accent/5 border border-accent/10 rounded-lg p-3">
                  <h4 className="text-accent text-xs font-semibold mb-1 uppercase tracking-wider">Expert Tip</h4>
                  <p className="text-text-secondary text-sm">{summary.tips}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-3 pt-2 border-t border-border/50">
                <div className="flex flex-col">
                  <span className="text-text-muted text-xs uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Activity className="w-3 h-3" /> Difficulty
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${difficultyColor}`}>
                    {summary.difficulty_level}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-text-muted text-xs uppercase tracking-wider mb-1 flex items-center gap-1">
                    <GraduationCap className="w-3 h-3" /> Career Stage
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium border border-border bg-surface text-text-primary">
                    {summary.career_stage}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
