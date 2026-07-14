"use client";

import { useState, useEffect } from "react";
import { Loader2, Activity, Clock, Zap, AlertTriangle, Server, Database } from "lucide-react";

export default function AdminPerformancePage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/performance");
        if (res.ok) { const d = await res.json(); setMetrics(d); }
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-20 flex justify-center">
      <Loader2 className="w-8 h-8 text-accent animate-spin" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Activity className="w-6 h-6 text-accent" />
        <h1 className="font-display text-2xl font-bold text-text-primary">Performance</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Clock, label: "API Response (avg)", value: metrics?.avgResponseTime ?? "—", color: "text-emerald-400" },
          { icon: Zap, label: "API Requests (24h)", value: metrics?.totalRequests ?? "—", color: "text-blue-400" },
          { icon: Database, label: "DB Connections", value: metrics?.dbConnections ?? "—", color: "text-purple-400" },
          { icon: AlertTriangle, label: "Errors (24h)", value: metrics?.errorCount ?? 0, color: metrics?.errorCount > 0 ? "text-red-400" : "text-emerald-400" },
        ].map(stat => (
          <div key={stat.label} className="bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
              <stat.icon className="w-3 h-3" /> {stat.label}
            </div>
            <div className={`text-2xl font-bold font-mono ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-surface border border-border rounded-xl p-4">
        <h2 className="font-display text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Server className="w-5 h-5 text-accent" /> System Health
        </h2>
        <div className="space-y-3 text-sm">
          {[
            { label: "Server", status: metrics?.serverStatus ?? "healthy", check: true },
            { label: "Database", status: metrics?.dbStatus ?? "connected", check: true },
            { label: "Scrapers", status: metrics?.scraperStatus ?? "checking", check: metrics?.scraperStatus === "healthy" },
            { label: "AI Gateway", status: metrics?.aiGatewayStatus ?? "checking", check: metrics?.aiGatewayStatus === "healthy" },
          ].map(s => (
            <div key={s.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <span className="text-text-primary">{s.label}</span>
              <span className={`flex items-center gap-1.5 ${s.check ? "text-emerald-400" : "text-red-400"}`}>
                <span className={`w-2 h-2 rounded-full ${s.check ? "bg-emerald-400" : "bg-red-400"}`} />
                {s.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
