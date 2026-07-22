"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, Loader2, MapPin, Building2 } from "lucide-react";

export default function RecommendationsSection() {
  const [recs, setRecs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/recommendations").then(r => r.json()).then(d => {
      setRecs(d.recommendations || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (recs.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-accent" />
        <h2 className="font-display text-xl font-bold text-text-primary">Recommended for You</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {recs.slice(0, 6).map(opp => (
          <Link key={opp.id} href={`/opportunities/${opp.slug || opp.id}`}
            className="bg-surface border border-border rounded-xl p-4 hover:border-accent/40 transition-colors">
            <h3 className="text-text-primary font-medium text-sm line-clamp-2">{opp.title}</h3>
            <div className="flex items-center gap-3 mt-2 text-text-muted text-xs">
              {opp.organization && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{opp.organization}</span>}
              {opp.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{opp.location}</span>}
            </div>
            {opp.deadline && (
              <span className="text-xs text-text-muted mt-1 block">
                Deadline: {new Date(opp.deadline).toLocaleDateString()}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
