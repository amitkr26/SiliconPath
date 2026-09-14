"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, FileText, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import AdminNav from "../_components/AdminNav";

const STATUS_FLOW = ["submitted", "reviewed", "shortlisted", "accepted", "rejected"];

const STATUS_COLORS: Record<string, string> = {
  submitted: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  reviewed: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  shortlisted: "text-purple-400 bg-purple-400/10 border-purple-400/30",
  accepted: "text-green-400 bg-green-400/10 border-green-400/30",
  rejected: "text-red-400 bg-red-400/10 border-red-400/30",
};

export default function AdminApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
    const pw = typeof window !== "undefined" ? sessionStorage.getItem("admin_password") : null;
    if (!token && !pw) {
      router.push("/admin");
      return;
    }
    setAuthed(true);
  }, [router]);

  const load = useCallback(async () => {
    if (!authed) return;
    setLoading(true);
    try {
      const data = await api.get<{ applications?: any[] }>(`/api/admin/applications${filter ? `?opportunity_id=${filter}` : ""}`);
      setApplications(data?.applications || []);
    } catch {
      setApplications([]);
    }
    setLoading(false);
  }, [authed, filter]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/api/admin/applications/${id}`, { status });
      setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    }
  };

  const grouped = applications.reduce((acc: Record<string, any>, app: any) => {
    const key = app.opportunity?.id || "unknown";
    if (!acc[key]) acc[key] = { opportunity: app.opportunity, apps: [] };
    acc[key].apps.push(app);
    return acc;
  }, {} as Record<string, any>);

  if (!authed) return (
    <div className="max-w-5xl mx-auto px-4 py-20 flex justify-center">
      <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <AdminNav title="Candidate Applications" subtitle="Review incoming opportunity applications" icon={FileText} />
      <div className="max-w-5xl mx-auto px-4 py-8">

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-blue-400 animate-spin" /></div>
      ) : Object.entries(grouped).length === 0 ? (
        <div className="text-center py-12 text-slate-400">No applications yet</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([oppId, group]: [string, any]) => (
            <div key={oppId} className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <Link href={`/opportunities/${group.opportunity?.slug || oppId}`} className="text-slate-100 font-medium text-sm hover:text-blue-400 flex items-center gap-1">
                  {group.opportunity?.title || "Unknown Opportunity"} <ExternalLink className="w-3 h-3" />
                </Link>
                <span className="text-slate-400 text-xs">{group.apps.length} applicant{group.apps.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="space-y-2">
                {group.apps.map((app: any) => (
                  <div key={app.id} className="flex items-center justify-between bg-slate-950 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center">
                        <span className="text-xs font-bold text-blue-400">
                          {(app.user?.display_name || "?").split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <div className="text-slate-100 text-sm font-medium">{app.user?.display_name || "Anonymous"}</div>
                        {app.user?.headline && <div className="text-slate-400 text-xs">{app.user.headline}</div>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <select value={app.status} onChange={e => updateStatus(app.id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded border bg-slate-950 ${STATUS_COLORS[app.status] || "text-slate-400"}`}>
                        {STATUS_FLOW.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      {app.resume_url && (
                        <a href={app.resume_url} target="_blank" className="text-blue-400 text-xs hover:underline">Resume</a>
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
    </div>
  );
}
