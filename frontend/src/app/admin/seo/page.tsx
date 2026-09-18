"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import AdminNav from "@/app/admin/_components/AdminNav";
import type { SeoPageReport, SiteSeoSummary, CannibalizationCluster, Severity } from "@/lib/seo/types";
import { SEVERITY_META } from "@/lib/seo/types";
import {
  ExternalLink, ChevronDown, Loader2, ShieldAlert, TrendingUp, BarChart3, Layers, Sparkles,
} from "lucide-react";

interface SeoApiResponse {
  summary: SiteSeoSummary;
  reports: SeoPageReport[];
  cannibalizationClusters: CannibalizationCluster[];
  dataQuality: {
    totalActive: number; missingDeadline: number; missingStipend: number;
    missingLink: number; missingDescription: number; pending: number;
  };
}

function severityBadge(sev: Severity) {
  const meta = SEVERITY_META[sev];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${
      sev === "critical" ? "text-red-300 border-red-500/40 bg-red-500/10"
      : sev === "warning" ? "text-amber-300 border-amber-500/40 bg-amber-500/10"
      : sev === "improvement" ? "text-yellow-300 border-yellow-500/40 bg-yellow-500/10"
      : "text-emerald-300 border-emerald-500/40 bg-emerald-500/10"
    }`}>
      {meta.emoji} {meta.label}
    </span>
  );
}

function GateRow({ report }: { report: SeoPageReport }) {
  const gate = report.gate;
  const decisionColor =
    report.indexable ? "text-emerald-300 border-emerald-500/40 bg-emerald-500/10"
    : gate?.directive === "omit" ? "text-slate-300 border-slate-600/60 bg-slate-700/20"
    : "text-amber-300 border-amber-500/40 bg-amber-500/10";
  return (
    <tr className="border-b border-slate-800/60 text-sm">
      <td className="py-2 px-2 text-slate-300 font-mono text-xs break-all">
        <Link href={report.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-white">
          {report.url.replace("https://berojgardegreewala.vercel.app", "")}
          <ExternalLink className="w-3 h-3" />
        </Link>
      </td>
      <td className="py-2 px-2 text-slate-400">{report.pageType}</td>
      <td className="py-2 px-2 text-slate-300">{gate ? gate.activeVerifiedCount : "—"}</td>
      <td className="py-2 px-2">
        <span className={`inline-flex px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${decisionColor}`}>
          {report.indexable ? "INDEXED" : gate?.directive === "omit" ? "OMIT (0 listings)" : "NOINDEX"}
        </span>
      </td>
      <td className="py-2 px-2 text-right">
        <span className={`font-mono font-bold ${report.score >= 75 ? "text-emerald-300" : report.score >= 50 ? "text-amber-300" : "text-red-300"}`}>
          {report.score}
        </span>
      </td>
    </tr>
  );
}

function PageRow({ report }: { report: SeoPageReport }) {
  const [open, setOpen] = useState(false);
  const fails = report.checks.filter((c) => c.severity !== "pass");
  return (
    <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-800/50 transition-colors">
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
        <span className="font-mono text-xs text-slate-200 truncate flex-1">{report.url.replace("https://berojgardegreewala.vercel.app", "")}</span>
        {!report.indexable && <span className="text-[10px] font-bold text-amber-300 border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 rounded-md">GATED</span>}
        <span className="flex gap-1.5">{( ["critical", "warning", "improvement"] as Severity[]).map((s) => (
          report.summary[s] > 0 && (
            <span key={s} className="text-[10px] font-bold text-slate-300">
              {SEVERITY_META[s].emoji}{report.summary[s]}
            </span>
          )
        ))}</span>
        <span className={`font-mono font-bold text-sm ${report.score >= 75 ? "text-emerald-300" : report.score >= 50 ? "text-amber-300" : "text-red-300"}`}>{report.score}</span>
      </button>
      {open && (
        <div className="px-4 pb-3 border-t border-slate-800 pt-2 space-y-1.5">
          {fails.length === 0 && (
            <p className="text-xs text-emerald-300 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" /> No deductions on applicable checks.
            </p>
          )}
          {fails.map((c) => (
            <div key={c.id} className="text-xs text-slate-300 flex items-start gap-2">
              {severityBadge(c.severity)}
              <div className="min-w-0">
                <p className="text-slate-200">{c.title}</p>
                {c.detail && <p className="text-slate-400">{c.detail}</p>}
                {c.recommendation && <p className="text-slate-500 italic">→ {c.recommendation}</p>}
              </div>
            </div>
          ))}
          <p className="text-[10px] text-slate-500 pt-1">
            {report.appliedChecks}/{report.totalChecks} applicable checks evaluated ({report.skippedChecks} not-applicable skipped).
            Score = 100 − penalties: 🔴8 · 🟠5 · 🟡2.
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, accent }: { label: string; value: React.ReactNode; sub?: string; accent?: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">{label}</p>
      <p className={`mt-1 font-mono text-3xl font-black ${accent || "text-white"}`}>{value}</p>
      {sub && <p className="text-[11px] text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

export default function AdminSeoPage() {
  const [data, setData] = useState<SeoApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "gated" | "failing">("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const adminPw = typeof window !== "undefined" ? sessionStorage.getItem("admin_password") : null;
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
    try {
      const res = await fetch("/api/admin/seo", {
        headers: {
          ...(adminPw ? { "x-admin-password": adminPw } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load SEO audit");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const reports = data?.reports || [];
  const shownReports = filter === "gated" ? reports.filter((r) => !r.indexable) : filter === "failing" ? reports.filter((r) => r.summary.critical > 0 || r.summary.warning > 0) : reports;
  const programmatic = reports.filter((r) => r.pageType === "category" || r.pageType === "location");

  return (
    <div className="min-h-screen bg-slate-950">
      <AdminNav title="SEO Intelligence" subtitle="Programmatic quality gate + 17-group content & meta audit" icon={BarChart3} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {loading && (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Auditing indexable route graph and programmatic combinations…
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" /> {error}
          </div>
        )}
        {!data && !loading && !error && (
          <div className="text-sm text-slate-400">No audit data — is the admin session active?</div>
        )}

        {data && (
          <>
            {/* Score + headline stats */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <StatCard label="Site SEO score" value={<span className={data.summary.averageScore >= 75 ? "text-emerald-400" : data.summary.averageScore >= 50 ? "text-amber-400" : "text-red-400"}>{data.summary.averageScore}<span className="text-lg text-slate-500">/100</span></span>} sub={`mean across ${data.summary.auditedPages} pages`} accent="text-emerald-400" />
              <StatCard label="Indexable pages" value={data.summary.indexablePages} sub="pass quality gate / noindex-free" />
              <StatCard label="Gated pages" value={<span className={data.summary.gatedPages > 0 ? "text-amber-400" : "text-emerald-400"}>{data.summary.gatedPages}</span>} sub="noindex,follow or omitted" />
              <StatCard label="Critical findings" value={<span className={data.summary.gateViolations.length > 0 ? "text-red-400" : "text-emerald-400"}>{data.summary.worstPages.reduce((s, p) => s + p.critical, 0)}</span>} sub="across audited pages" />
              <StatCard label="Cannibalization" value={data.cannibalizationClusters.length} sub="overlap clusters (advisory)" />
            </div>

            <div className="flex flex-wrap gap-2">
              {(["all", "gated", "failing"] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filter === f ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:text-slate-200"}`}>
                  {f === "all" ? "All pages" : f === "gated" ? "Gated (noindex)" : "With failures"}
                </button>
              ))}
            </div>

            {/* Programmatic quality gate */}
            <section className="space-y-3">
              <h2 className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wide">
                <Layers className="w-4 h-4 text-blue-400" /> Programmatic quality gate <span className="text-slate-500 normal-case font-normal">(threshold ≥3 active verified)</span>
              </h2>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-x-auto">
                <table className="w-full min-w-[560px]">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wide text-slate-500 border-b border-slate-800">
                      <th className="text-left py-2 px-2 font-semibold">Route</th>
                      <th className="text-left py-2 px-2 font-semibold">Type</th>
                      <th className="text-left py-2 px-2 font-semibold">Count</th>
                      <th className="text-left py-2 px-2 font-semibold">Decision</th>
                      <th className="text-right py-2 px-2 font-semibold">Score</th>
                    </tr>
                  </thead>
                  <tbody>{programmatic.map((r) => <GateRow key={r.url} report={r} />)}</tbody>
                </table>
              </div>
              <p className="text-[11px] text-slate-500">
                Fail-closed rule: <span className="text-slate-300">≥3 → index,follow</span> · <span className="text-slate-300">1–2 → noindex,follow</span> · <span className="text-slate-300">0 → omit</span>. Applied in sitemap.xml and generateMetadata.
              </p>
            </section>

            {/* Cannibalization + data quality */}
            <section className="grid lg:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 space-y-2">
                <h2 className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wide"><Sparkles className="w-4 h-4 text-purple-400" /> Cannibalization clusters</h2>
                {data.cannibalizationClusters.length === 0 && <p className="text-xs text-slate-500">No overlapping-intent clusters detected across audited page titles.</p>}
                {data.cannibalizationClusters.map((cl) => (
                  <div key={cl.key} className="text-xs text-slate-300">
                    <p className="font-semibold text-amber-300">{cl.count} pages · “{cl.key}”</p>
                    <ul className="list-disc pl-5 text-slate-400 space-y-0.5">{cl.urls.map((u) => <li key={u} className="font-mono break-all">{u.replace("https://berojgardegreewala.vercel.app", "")}</li>)}</ul>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 space-y-2">
                <h2 className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wide"><TrendingUp className="w-4 h-4 text-emerald-400" /> Opportunity data quality <span className="text-slate-500 normal-case font-normal">(active rows)</span></h2>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    ["Total active", data.dataQuality.totalActive],
                    ["Missing deadline (deadline-based)", data.dataQuality.missingDeadline],
                    ["Missing stipend", data.dataQuality.missingStipend],
                    ["Missing application link", data.dataQuality.missingLink],
                    ["Thin description (<60 chars)", data.dataQuality.missingDescription],
                    ["Pending verification", data.dataQuality.pending],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="flex justify-between rounded-lg bg-slate-800/60 px-3 py-2">
                      <span className="text-slate-400">{label}</span>
                      <span className="font-mono font-bold text-slate-100">{value}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500">Backfill gaps in the Opportunities admin panel; staleness sees deadline-dependent visibility.</p>
              </div>
            </section>

            {/* Per-page reports */}
            <section className="space-y-2">
              <h2 className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wide">
                <BarChart3 className="w-4 h-4 text-blue-400" /> Page SEO reports <span className="text-slate-500 normal-case font-normal">({shownReports.length} shown)</span>
              </h2>
              <div className="space-y-2">{shownReports.map((r) => <PageRow key={r.url} report={r} />)}</div>
            </section>

            <p className="text-[11px] text-slate-600 leading-relaxed border-t border-slate-800 pt-3">
              Anti-gaming contract: scores are penalty-only (🔴 −8, 🟠 −5, 🟡 −2, 🟢 ±0). Adding keywords, filler text, meaningless FAQs,
              redundant schema or extra internal links can never raise a score — the only way up is to stop failing real checks.
              A lean page can be excellent at &lt;100/100 when its applicable checks all pass.
            </p>
          </>
        )}
      </main>
    </div>
  );
}