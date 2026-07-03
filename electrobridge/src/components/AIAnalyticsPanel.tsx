"use client";

import { useEffect, useState } from "react";
import { Loader2, Zap, CheckCircle, XCircle, BarChart3 } from "lucide-react";

interface LogRow {
  id: string;
  feature: string;
  provider: string;
  success: boolean;
  prompt_length: number;
  response_length: number;
  created_at: string;
}

interface AIUsageStats {
  total: number;
  success: number;
  failed: number;
  byProvider: Record<string, number>;
  byFeature: Record<string, number>;
  today: number;
  thisWeek: number;
}

export default function AIAnalyticsPanel() {
  const [stats, setStats] = useState<AIUsageStats | null>(null);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/analytics/ai-usage", {
        headers: { "x-admin-password": process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "" },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();

      const allLogs: LogRow[] = data.recent || [];

      const byProvider: Record<string, number> = {};
      const byFeature: Record<string, number> = {};
      let success = 0;
      let failed = 0;
      const today = new Date().toDateString();
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const aggregated = data.aggregated || [];
      for (const row of aggregated) {
        byProvider[row.provider] = (byProvider[row.provider] || 0) + Number(row.total_calls);
        byFeature[row.feature] = (byFeature[row.feature] || 0) + Number(row.total_calls);
        success += Number(row.successful);
        failed += Number(row.failed);
      }

      const total = success + failed;
      const todayCount = allLogs.filter(
        (l: LogRow) => new Date(l.created_at).toDateString() === today
      ).length;
      const weekCount = allLogs.filter(
        (l: LogRow) => new Date(l.created_at) >= weekAgo
      ).length;

      setStats({
        total,
        success,
        failed,
        byProvider,
        byFeature,
        today: todayCount,
        thisWeek: weekCount,
      });
      setLogs(allLogs.slice(0, 20));
    } catch {
      setStats({
        total: 0,
        success: 0,
        failed: 0,
        byProvider: {},
        byFeature: {},
        today: 0,
        thisWeek: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-6 h-6 text-cyan animate-spin" />
      </div>
    );
  }

  if (!stats || stats.total === 0) {
    return (
      <div className="text-center py-10">
        <Zap className="w-12 h-12 text-cyan/30 mx-auto mb-3" />
        <p className="text-text-muted">No AI usage data yet.</p>
        <p className="text-text-muted text-sm">
          AI calls will appear here once features are used.
        </p>
      </div>
    );
  }

  const providerColors: Record<string, string> = {
    groq: "#06B6D4",
    gemini: "#8B5CF6",
    openrouter: "#F59E0B",
    cloudflare: "#F97316",
    huggingface: "#10B981",
  };

  const total = stats.total;
  const maxProvider = Math.max(...Object.values(stats.byProvider), 1);

  return (
    <div>
      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-navy-light border border-gray-800 rounded-lg p-4">
          <p className="text-text-muted text-xs">Total AI Calls</p>
          <p className="text-2xl font-bold text-text-primary">{stats.total}</p>
        </div>
        <div className="bg-navy-light border border-gray-800 rounded-lg p-4">
          <p className="text-text-muted text-xs">Today</p>
          <p className="text-2xl font-bold text-cyan">{stats.today}</p>
        </div>
        <div className="bg-navy-light border border-gray-800 rounded-lg p-4">
          <p className="text-text-muted text-xs">This Week</p>
          <p className="text-2xl font-bold text-cyan">{stats.thisWeek}</p>
        </div>
        <div className="bg-navy-light border border-gray-800 rounded-lg p-4">
          <p className="text-text-muted text-xs">Success Rate</p>
          <p className="text-2xl font-bold text-success">
            {total > 0 ? Math.round((stats.success / total) * 100) : 0}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Provider breakdown */}
        <div className="bg-navy-light border border-gray-800 rounded-lg p-4">
          <h3 className="text-text-primary font-semibold text-sm mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan" />
            Provider Usage
          </h3>
          <div className="space-y-2">
            {Object.entries(stats.byProvider)
              .sort(([, a], [, b]) => b - a)
              .map(([provider, count]) => (
                <div key={provider}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-text-primary capitalize">{provider}</span>
                    <span className="text-text-muted">
                      {count} ({Math.round((count / total) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${(count / maxProvider) * 100}%`,
                        backgroundColor: providerColors[provider] || "#06B6D4",
                      }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Feature breakdown */}
        <div className="bg-navy-light border border-gray-800 rounded-lg p-4">
          <h3 className="text-text-primary font-semibold text-sm mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan" />
            Feature Usage
          </h3>
          <div className="space-y-2">
            {Object.entries(stats.byFeature)
              .sort(([, a], [, b]) => b - a)
              .map(([feature, count]) => (
                <div key={feature}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-text-primary">{feature}</span>
                    <span className="text-text-muted">{count}</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-cyan transition-all"
                      style={{
                        width: `${(count / Math.max(...Object.values(stats.byFeature), 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Recent logs */}
      <div className="bg-navy-light border border-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-text-primary font-semibold text-sm">Recent AI Calls</h3>
          <button
            onClick={fetchStats}
            className="text-cyan text-xs hover:underline"
          >
            Refresh
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-800 text-text-muted">
                <th className="text-left py-2 px-1">Time</th>
                <th className="text-left py-2 px-1">Feature</th>
                <th className="text-left py-2 px-1">Provider</th>
                <th className="text-left py-2 px-1">Status</th>
                <th className="text-right py-2 px-1">Tokens</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log: LogRow) => (
                <tr key={log.id} className="border-b border-gray-800/50">
                  <td className="py-2 px-1 text-text-muted">
                    {new Date(log.created_at).toLocaleTimeString()}
                  </td>
                  <td className="py-2 px-1 text-text-primary">{log.feature}</td>
                  <td className="py-2 px-1 capitalize">{log.provider}</td>
                  <td className="py-2 px-1">
                    {log.success ? (
                      <CheckCircle className="w-3 h-3 text-success" />
                    ) : (
                      <XCircle className="w-3 h-3 text-red-400" />
                    )}
                  </td>
                  <td className="py-2 px-1 text-right text-text-muted">
                    {log.prompt_length + (log.response_length || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
