"use client";

import { useEffect, useState } from "react";
import { Loader2, Activity, AlertTriangle, CheckCircle2, Lock } from "lucide-react";

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

  const load = async (pw: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/scrape-health", {
        headers: { "x-admin-password": pw },
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
      setError("Failed to load.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const saved = sessionStorage.getItem("sp_admin_pw");
    if (saved) {
      setPassword(saved);
      load(saved);
    }
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    sessionStorage.setItem("sp_admin_pw", password);
    load(password);
  };

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary px-4">
        <form onSubmit={submit} className="w-full max-w-sm bg-bg-secondary border border-border rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-accent" />
            <h1 className="text-lg font-bold text-text-primary">Scrape Health Monitor</h1>
          </div>
          <p className="text-sm text-text-secondary">Admin access required.</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin password"
            className="w-full bg-bg-primary border border-border text-text-primary text-sm rounded-lg px-3 py-2.5 outline-none"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-accent text-white text-sm font-semibold rounded-lg py-2.5 disabled:opacity-60">
            {loading ? "Checking..." : "Unlock"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <Activity className="w-6 h-6 text-accent" />
          <h1 className="text-2xl font-bold text-text-primary">Scrape Health Monitor</h1>
        </div>

        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-bg-secondary border border-border rounded-xl p-4">
              <p className="text-2xl font-bold text-text-primary">{summary.total_sources}</p>
              <p className="text-xs text-text-muted">Total sources</p>
            </div>
            <div className="bg-bg-secondary border border-border rounded-xl p-4">
              <p className="text-2xl font-bold text-text-primary">{summary.active_sources}</p>
              <p className="text-xs text-text-muted">Active</p>
            </div>
            <div className="bg-bg-secondary border border-border rounded-xl p-4">
              <p className="text-2xl font-bold text-amber-500">{summary.failing_sources}</p>
              <p className="text-xs text-text-muted">Failing</p>
            </div>
            <div className="bg-bg-secondary border border-border rounded-xl p-4">
              <p className="text-sm font-medium text-text-primary">
                {summary.last_run_at ? new Date(summary.last_run_at).toLocaleString() : "Never"}
              </p>
              <p className="text-xs text-text-muted">Last run</p>
            </div>
          </div>
        )}

        {/* Recent opportunities (data-quality eyeball) */}
        <div className="bg-bg-secondary border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-3">Last 20 inserted opportunities (check title / org / category)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-text-muted text-xs border-b border-border">
                  <th className="py-2 pr-4">Title</th>
                  <th className="py-2 pr-4">Organization</th>
                  <th className="py-2 pr-4">Category</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {opps.map((o) => (
                  <tr key={o.id} className="border-b border-border/50">
                    <td className="py-2 pr-4 text-text-primary">{o.title}</td>
                    <td className="py-2 pr-4 text-text-secondary">{o.organizations?.name || "—"}</td>
                    <td className="py-2 pr-4 text-text-secondary">{o.category}</td>
                    <td className="py-2 text-text-secondary">{o.verification_status}</td>
                  </tr>
                ))}
                {opps.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-text-muted">No opportunities yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sources */}
        <div className="bg-bg-secondary border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-3">Sources ({sources.length})</h2>
          <div className="space-y-2">
            {sources.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 text-sm py-1.5 border-b border-border/40">
                <div className="min-w-0">
                  <span className="text-text-primary">{s.name}</span>
                  <span className="text-text-muted ml-2 text-xs">{s.adapter}</span>
                  {s.last_error && <span className="block text-xs text-red-500 truncate">{s.last_error}</span>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {(s.consecutive_failures || 0) > 0 ? (
                    <span className="flex items-center gap-1 text-amber-500 text-xs">
                      <AlertTriangle className="w-3.5 h-3.5" /> {s.consecutive_failures}
                    </span>
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  )}
                </div>
              </div>
            ))}
            {sources.length === 0 && <p className="text-text-muted text-sm">No scrape sources configured yet.</p>}
          </div>
        </div>

        {/* Recent runs */}
        <div className="bg-bg-secondary border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-3">Recent runs</h2>
          <div className="space-y-1.5">
            {runs.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-xs py-1.5 border-b border-border/40">
                <span className="text-text-secondary">{r.started_at ? new Date(r.started_at).toLocaleString() : ""}</span>
                <span className={r.status === "success" ? "text-emerald-500" : r.status === "failed" ? "text-red-500" : "text-text-muted"}>
                  {r.status} · {r.results_count || 0} results
                </span>
              </div>
            ))}
            {runs.length === 0 && <p className="text-text-muted text-sm">No runs recorded yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
