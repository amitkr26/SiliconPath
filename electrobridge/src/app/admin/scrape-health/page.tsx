import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

interface SourceRow {
  id: string;
  name: string;
  adapter: string;
  is_active: boolean;
  last_success_at: string | null;
  last_error: string | null;
  consecutive_failures: number | null;
  total_results: number | null;
}

interface RunRow {
  id: string;
  status: string;
  results_count: number | null;
  error: string | null;
  started_at: string | null;
  completed_at: string | null;
}

interface OppRow {
  id: string;
  title: string;
  category: string;
  created_at: string;
  organizations: { name: string } | null;
}

function fmt(ts: string | null): string {
  if (!ts) return "never";
  return new Date(ts).toLocaleString();
}

export default async function ScrapeHealthPage() {
  if (!isAdminConfigured || !supabaseAdmin) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <p className="text-text-secondary">Database not configured.</p>
      </div>
    );
  }

  const [{ data: sources }, { data: runs }, { data: opps }] = await Promise.all([
    supabaseAdmin
      .from("scrape_sources")
      .select("id, name, adapter, is_active, last_success_at, last_error, consecutive_failures, total_results")
      .order("consecutive_failures", { ascending: false })
      .limit(100),
    supabaseAdmin
      .from("scrape_runs")
      .select("id, status, results_count, error, started_at, completed_at")
      .order("started_at", { ascending: false })
      .limit(20),
    supabaseAdmin
      .from("opportunities")
      .select("id, title, category, created_at, organizations(name)")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const srcList = (sources || []) as SourceRow[];
  const runList = (runs || []) as RunRow[];
  const oppList = (opps || []) as unknown as OppRow[];

  const active = srcList.filter((s) => s.is_active).length;
  const failing = srcList.filter((s) => (s.consecutive_failures || 0) > 0).length;
  const lastRun = runList[0];

  return (
    <div className="min-h-screen bg-bg-primary py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-text-primary mb-1">Scrape Health Monitor</h1>
        <p className="text-sm text-text-secondary mb-6">
          Source status, recent runs, and a sample of the latest inserted opportunities for data-quality checks.
        </p>

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="bg-bg-secondary border border-border rounded-xl p-4">
            <div className="text-2xl font-bold text-text-primary">{srcList.length}</div>
            <div className="text-xs text-text-muted">Sources</div>
          </div>
          <div className="bg-bg-secondary border border-border rounded-xl p-4">
            <div className="text-2xl font-bold text-text-primary">{active}</div>
            <div className="text-xs text-text-muted">Active</div>
          </div>
          <div className="bg-bg-secondary border border-border rounded-xl p-4">
            <div className="text-2xl font-bold text-text-primary">{failing}</div>
            <div className="text-xs text-text-muted">Failing</div>
          </div>
          <div className="bg-bg-secondary border border-border rounded-xl p-4">
            <div className="text-sm font-semibold text-text-primary">{lastRun ? fmt(lastRun.started_at) : "never"}</div>
            <div className="text-xs text-text-muted">Last run</div>
          </div>
        </div>

        {/* Recent runs */}
        <h2 className="text-sm font-semibold text-text-primary mb-2">Recent runs</h2>
        <div className="bg-bg-secondary border border-border rounded-xl overflow-x-auto mb-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-text-muted border-b border-border">
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Results</th>
                <th className="px-4 py-2">Started</th>
                <th className="px-4 py-2">Error</th>
              </tr>
            </thead>
            <tbody>
              {runList.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-text-muted">No runs recorded yet.</td></tr>
              )}
              {runList.map((r) => (
                <tr key={r.id} className="border-b border-border/50">
                  <td className="px-4 py-2">
                    <span className={r.status === "success" ? "text-success" : r.status === "failed" ? "text-danger" : "text-text-secondary"}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-text-secondary">{r.results_count ?? 0}</td>
                  <td className="px-4 py-2 text-text-muted">{fmt(r.started_at)}</td>
                  <td className="px-4 py-2 text-danger text-xs max-w-xs truncate">{r.error || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Sources */}
        <h2 className="text-sm font-semibold text-text-primary mb-2">Sources (worst first)</h2>
        <div className="bg-bg-secondary border border-border rounded-xl overflow-x-auto mb-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-text-muted border-b border-border">
                <th className="px-4 py-2">Source</th>
                <th className="px-4 py-2">Adapter</th>
                <th className="px-4 py-2">Fails</th>
                <th className="px-4 py-2">Last success</th>
              </tr>
            </thead>
            <tbody>
              {srcList.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-text-muted">No sources configured.</td></tr>
              )}
              {srcList.map((s) => (
                <tr key={s.id} className="border-b border-border/50">
                  <td className="px-4 py-2 text-text-primary">{s.name}</td>
                  <td className="px-4 py-2 text-text-secondary">{s.adapter}</td>
                  <td className={`px-4 py-2 ${(s.consecutive_failures || 0) > 0 ? "text-danger" : "text-text-secondary"}`}>
                    {s.consecutive_failures || 0}
                  </td>
                  <td className="px-4 py-2 text-text-muted">{fmt(s.last_success_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Latest opportunities (data quality) */}
        <h2 className="text-sm font-semibold text-text-primary mb-2">
          Last 20 inserted opportunities (eyeball for bad org/title/category)
        </h2>
        <div className="bg-bg-secondary border border-border rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-text-muted border-b border-border">
                <th className="px-4 py-2">Title</th>
                <th className="px-4 py-2">Organization</th>
                <th className="px-4 py-2">Category</th>
                <th className="px-4 py-2">Inserted</th>
              </tr>
            </thead>
            <tbody>
              {oppList.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-text-muted">No opportunities yet.</td></tr>
              )}
              {oppList.map((o) => (
                <tr key={o.id} className="border-b border-border/50">
                  <td className="px-4 py-2 text-text-primary max-w-xs truncate">{o.title}</td>
                  <td className="px-4 py-2 text-text-secondary">{o.organizations?.name || "—"}</td>
                  <td className="px-4 py-2 text-text-secondary">{o.category}</td>
                  <td className="px-4 py-2 text-text-muted">{fmt(o.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
