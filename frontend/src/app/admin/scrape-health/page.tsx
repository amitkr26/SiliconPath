"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Activity, AlertTriangle, CheckCircle2, Lock, ArrowLeft, Play, Pause, RefreshCw } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Summary {
  total_sources: number;
  active_sources: number;
  failing_sources: number;
  last_run_at: string | null;
}
interface Run {
  id: string;
  source_id: string | null;
  status: string;
  results_count: number | null;
  error: string | null;
  started_at: string | null;
}
interface Source {
  id: string;
  name: string;
  adapter: string;
  is_active: boolean;
  consecutive_failures: number | null;
  last_error: string | null;
  total_results: number | null;
}
interface Opp {
  id: string;
  title: string;
  category: string;
  verification_status: string;
  organizations: { name: string } | null;
}

export default function ScrapeHealthPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [opps, setOpps] = useState<Opp[]>([]);

  const load = async (pw?: string) => {
    setLoading(true);
    setError(null);
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
    const adminPw = pw || (typeof window !== "undefined" ? sessionStorage.getItem("admin_password") : null);

    try {
      const res = await fetch("/api/admin/scrape-health", {
        headers: {
          ...(adminPw ? { "x-admin-password": adminPw } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.status === 401) {
        setError("Wrong admin password.");
        setAuthed(false);
        return;
      }
      if (!res.ok) {
        setError("Failed to load.");
        return;
      }
      const data = await res.json();
      setSummary(data.summary);
      setRuns(data.runs || []);
      setSources(data.sources || []);
      setOpps(data.recent_opportunities || []);
      setAuthed(true);
    } catch {
      setAuthed(false);
      setError("Failed to load.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const saved = sessionStorage.getItem("admin_password") || sessionStorage.getItem("sp_admin_pw");
    const token = localStorage.getItem("admin_token");
    if (saved || token) {
      if (saved) setPassword(saved);
      load(saved || undefined);
    }
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    sessionStorage.setItem("admin_password", password);
    load(password);
  };

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem("admin_token");
    const adminPw = sessionStorage.getItem("admin_password");
    return {
      "Content-Type": "application/json",
      ...(adminPw ? { "x-admin-password": adminPw } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, []);

  const toggleSource = async (sourceId: string, isActive: boolean) => {
    try {
      const res = await fetch("/api/admin/scrape", {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ sourceId, isActive }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(`Source ${isActive ? "activated" : "deactivated"}`);
      setSources((prev) => prev.map((s) => s.id === sourceId ? { ...s, is_active: isActive } : s));
    } catch {
      toast.error("Failed to update source");
    }
  };

  const runNow = async (sourceIds?: string[]) => {
    try {
      const res = await fetch("/api/admin/scrape", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ sourceIds }),
      });
      const data = await res.json();
      toast.success(data.message || "Scrape triggered");
    } catch {
      toast.error("Failed to trigger scrape");
    }
  };

  if (!authed) {
    return (
      <div className="max-w-md mx-auto px-4 py-20">
        <form onSubmit={submit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Link href="/admin" className="text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <Lock className="w-5 h-5 text-blue-400" />
            <h1 className="font-display text-lg font-bold text-white">Scrape Health &amp; Telemetry</h1>
          </div>
          <p className="text-sm text-slate-400">Admin access required.</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin password"
            className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder:text-slate-500 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg py-2.5 disabled:opacity-60 transition-colors">
            {loading ? "Checking..." : "Unlock"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <Activity className="w-6 h-6 text-blue-400" />
          <h1 className="text-2xl font-bold text-white">Scrape Health Monitor</h1>
        </div>

        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <p className="text-2xl font-bold text-white">{summary.total_sources}</p>
              <p className="text-xs text-slate-400">Total sources</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <p className="text-2xl font-bold text-white">{summary.active_sources}</p>
              <p className="text-xs text-slate-400">Active</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <p className="text-2xl font-bold text-amber-400">{summary.failing_sources}</p>
              <p className="text-xs text-slate-400">Failing</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <p className="text-sm font-medium text-white">
                {summary.last_run_at ? new Date(summary.last_run_at).toLocaleString() : "Never"}
              </p>
              <p className="text-xs text-slate-400">Last run</p>
            </div>
          </div>
        )}

        {/* Recent opportunities (data-quality eyeball) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-3">Last 20 inserted opportunities (check title / org / category)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 text-xs border-b border-slate-700">
                  <th className="py-2 pr-4">Title</th>
                  <th className="py-2 pr-4">Organization</th>
                  <th className="py-2 pr-4">Category</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {opps.map((o) => (
                  <tr key={o.id} className="border-b border-slate-800/60">
                    <td className="py-2 pr-4 text-slate-100">{o.title}</td>
                    <td className="py-2 pr-4 text-slate-300">{o.organizations?.name || "—"}</td>
                    <td className="py-2 pr-4 text-slate-300">{o.category}</td>
                    <td className="py-2 text-slate-300">{o.verification_status}</td>
                  </tr>
                ))}
                {opps.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">No opportunities yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sources */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white">Sources ({sources.length})</h2>
            <button
              onClick={() => runNow()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <Play className="w-3.5 h-3.5" /> Run All Active
            </button>
          </div>
          <div className="space-y-2">
            {sources.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 text-sm py-1.5 border-b border-slate-800/60">
                <div className="min-w-0 flex-1">
                  <span className="text-slate-100">{s.name}</span>
                  <span className="text-slate-400 ml-2 text-xs">{s.adapter}</span>
                  {s.last_error && <span className="block text-xs text-red-400 truncate">{s.last_error}</span>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {(s.consecutive_failures || 0) > 0 ? (
                    <span className="flex items-center gap-1 text-amber-400 text-xs">
                      <AlertTriangle className="w-3.5 h-3.5" /> {s.consecutive_failures}
                    </span>
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <button
                    onClick={() => runNow([s.id])}
                    className="p-1 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded transition-colors"
                    title="Run now"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => toggleSource(s.id, !s.is_active)}
                    className={`p-1 rounded transition-colors ${s.is_active ? "text-emerald-400 hover:text-amber-400 hover:bg-slate-800" : "text-slate-500 hover:text-emerald-400 hover:bg-slate-800"}`}
                    title={s.is_active ? "Deactivate" : "Activate"}
                  >
                    {s.is_active ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ))}
            {sources.length === 0 && <p className="text-slate-400 text-sm">No scrape sources configured yet.</p>}
          </div>
        </div>

        {/* Recent runs */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-3">Recent runs</h2>
          <div className="space-y-1.5">
            {runs.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/60">
                <span className="text-slate-300">{r.started_at ? new Date(r.started_at).toLocaleString() : ""}</span>
                <span className={r.status === "success" ? "text-emerald-400" : r.status === "failed" ? "text-red-400" : "text-slate-400"}>
                  {r.status} · {r.results_count || 0} results
                </span>
              </div>
            ))}
            {runs.length === 0 && <p className="text-slate-400 text-sm">No runs recorded yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
