"use client";

import { useState, useEffect } from "react";
import { Loader2, TrendingUp, Users, Briefcase, FileText, Newspaper, Eye, Search, BarChart3 } from "lucide-react";

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics").then(r => r.json()).then(d => {
      setData(d); setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-20 flex justify-center">
      <Loader2 className="w-8 h-8 text-accent animate-spin" />
    </div>
  );

  const cards = [
    { icon: Briefcase, label: "Opportunities", value: data?.opportunities ?? 0, color: "text-accent" },
    { icon: Newspaper, label: "News Articles", value: data?.newsArticles ?? 0, color: "text-blue-400" },
    { icon: Users, label: "Users", value: data?.users ?? 0, color: "text-purple-400" },
    { icon: FileText, label: "Applications", value: data?.applications ?? 0, color: "text-emerald-400" },
  ];

  const week = data?.newThisWeek;
  const events = data?.events;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="w-6 h-6 text-accent" />
        <h1 className="font-display text-2xl font-bold text-text-primary">Analytics</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map(c => (
          <div key={c.label} className="bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
              <c.icon className="w-3 h-3" /> {c.label}
            </div>
            <div className={`text-2xl font-bold font-mono ${c.color}`}>{c.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {week && (
          <div className="bg-surface border border-border rounded-xl p-4">
            <h3 className="text-text-primary font-medium text-sm mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-accent" /> This Week
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div><div className="text-text-muted text-xs">New Opps</div><div className="text-lg font-bold text-text-primary">{week.opportunities}</div></div>
              <div><div className="text-text-muted text-xs">New Users</div><div className="text-lg font-bold text-text-primary">{week.users}</div></div>
            </div>
          </div>
        )}
        {events && (
          <div className="bg-surface border border-border rounded-xl p-4">
            <h3 className="text-text-primary font-medium text-sm mb-3 flex items-center gap-2">
              <Eye className="w-4 h-4 text-accent" /> Events (30 days)
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div><div className="text-text-muted text-xs">Page Views</div><div className="text-lg font-bold text-text-primary">{events.pageViews}</div></div>
              <div><div className="text-text-muted text-xs">Searches</div><div className="text-lg font-bold text-text-primary">{events.searches}</div></div>
              <div><div className="text-text-muted text-xs">Applications</div><div className="text-lg font-bold text-text-primary">{events.applications}</div></div>
            </div>
          </div>
        )}
      </div>

      {data?.categories && Object.keys(data.categories).length > 0 && (
        <div className="bg-surface border border-border rounded-xl p-4">
          <h3 className="text-text-primary font-medium text-sm mb-3">Categories</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(data.categories as Record<string, number>)
              .sort(([, a], [, b]) => b - a).map(([cat, count]) => (
              <span key={cat} className="px-3 py-1 bg-navy border border-border rounded-full text-text-secondary text-xs">
                {cat}: {count}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
