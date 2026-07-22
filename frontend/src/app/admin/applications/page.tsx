"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, FileText, ExternalLink } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const STATUS_FLOW = ["submitted", "reviewed", "shortlisted", "accepted", "rejected"];

const STATUS_COLORS: Record<string, string> = {
  submitted: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  reviewed: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  shortlisted: "text-purple-400 bg-purple-400/10 border-purple-400/30",
  accepted: "text-green-400 bg-green-400/10 border-green-400/30",
  rejected: "text-red-400 bg-red-400/10 border-red-400/30",
};

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/applications${filter ? `?opportunity_id=${filter}` : ""}`);
      const data = await res.json();
      setApplications(data.applications || []);
    } catch { setApplications([]); }
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/admin/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) { toast.error("Failed to update status"); return; }
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    toast.success("Status updated");
  };

  const grouped = applications.reduce((acc: Record<string, any>, app: any) => {
    const key = app.opportunity?.id || "unknown";
    if (!acc[key]) acc[key] = { opportunity: app.opportunity, apps: [] };
    acc[key].apps.push(app);
    return acc;
  }, {} as Record<string, any>);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-6 h-6 text-accent" />
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">Applications</h1>
          <p className="text-text-muted text-sm">Review applications from candidates</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-accent animate-spin" /></div>
      ) : Object.entries(grouped).length === 0 ? (
        <div className="text-center py-12 text-text-secondary">No applications yet</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([oppId, group]: [string, any]) => (
            <div key={oppId} className="bg-surface border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <Link href={`/opportunities/${group.opportunity?.slug || oppId}`} className="text-text-primary font-medium text-sm hover:text-accent flex items-center gap-1">
                  {group.opportunity?.title || "Unknown Opportunity"} <ExternalLink className="w-3 h-3" />
                </Link>
                <span className="text-text-muted text-xs">{group.apps.length} applicant{group.apps.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="space-y-2">
                {group.apps.map((app: any) => (
                  <div key={app.id} className="flex items-center justify-between bg-bg-primary rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                        <span className="text-xs font-bold text-accent">
                          {(app.user?.full_name || "?").split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <div className="text-text-primary text-sm font-medium">{app.user?.full_name || "Anonymous"}</div>
                        {app.user?.headline && <div className="text-text-muted text-xs">{app.user.headline}</div>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <select value={app.status} onChange={e => updateStatus(app.id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded border bg-navy ${STATUS_COLORS[app.status] || "text-text-muted"}`}>
                        {STATUS_FLOW.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      {app.resume_url && (
                        <a href={app.resume_url} target="_blank" className="text-accent text-xs hover:underline">Resume</a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
