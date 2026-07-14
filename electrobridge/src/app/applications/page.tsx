"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { Loader2, FileText, ExternalLink, Clock, Calendar, MapPin } from "lucide-react";
import { toast } from "sonner";

const STATUS_STYLES: Record<string, string> = {
  submitted: "bg-yellow-400/10 text-yellow-400 border-yellow-400/30",
  reviewed: "bg-blue-400/10 text-blue-400 border-blue-400/30",
  shortlisted: "bg-purple-400/10 text-purple-400 border-purple-400/30",
  accepted: "bg-green-400/10 text-green-400 border-green-400/30",
  rejected: "bg-red-400/10 text-red-400 border-red-400/30",
};

export default function ApplicationsPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userLoading) return;
    if (!user) { router.push("/login?redirectTo=/applications"); return; }
    const load = async () => {
      const res = await fetch("/api/applications");
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
      }
      setLoading(false);
    };
    load();
  }, [user, userLoading, router]);

  const handleWithdraw = async (id: string) => {
    if (!confirm("Withdraw this application?")) return;
    try {
      await fetch("/api/applications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setApplications(prev => prev.filter(a => a.id !== id));
      toast.success("Application withdrawn");
    } catch { toast.error("Failed to withdraw"); }
  };

  if (userLoading || loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 flex justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-6 h-6 text-accent" />
        <h1 className="font-display text-2xl font-bold text-text-primary">My Applications</h1>
      </div>

      {applications.length === 0 ? (
        <div className="text-center py-16 bg-surface border border-border rounded-xl">
          <FileText className="w-12 h-12 text-text-muted mx-auto mb-3" />
          <p className="text-text-secondary">No applications yet</p>
          <Link href="/opportunities" className="text-accent text-sm mt-2 inline-block hover:underline">
            Browse opportunities
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map(app => (
            <div key={app.id} className="bg-surface border border-border rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <Link href={`/opportunities/${app.opportunity?.slug || app.opportunity_id}`}
                    className="text-text-primary font-medium hover:text-accent">
                    {app.opportunity?.title || "Opportunity"}
                  </Link>
                  <div className="flex items-center gap-3 text-text-muted text-xs mt-1">
                    {app.opportunity?.organization && (
                      <span>{app.opportunity.organization}</span>
                    )}
                    {app.opportunity?.location && (
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{app.opportunity.location}</span>
                    )}
                    {app.opportunity?.deadline && (
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(app.opportunity.deadline).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${STATUS_STYLES[app.status] || "bg-surface text-text-secondary border-border"}`}>
                  {app.status}
                </span>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                <span className="text-text-muted text-xs flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Applied {new Date(app.applied_at || app.created_at).toLocaleDateString()}
                </span>
                <div className="flex gap-2">
                  <button onClick={() => handleWithdraw(app.id)}
                    className="text-xs text-text-muted hover:text-danger px-2 py-1">
                    Withdraw
                  </button>
                  {app.opportunity?.slug && (
                    <Link href={`/opportunities/${app.opportunity.slug}`}
                      className="text-xs text-accent hover:underline flex items-center gap-1">
                      View <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
