"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { Loader2, FileText, ExternalLink, Clock, Calendar, MapPin } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";

type BadgeTone = "accent" | "neutral" | "warning" | "purple" | "success" | "danger";

const STATUS_TONES: Record<string, BadgeTone> = {
  applied: "accent",
  submitted: "neutral",
  reviewed: "accent",
  shortlisted: "purple",
  interview: "warning",
  accepted: "success",
  rejected: "danger",
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
      <div className="min-h-[calc(100vh-4rem)] bg-bg-primary flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-bg-primary py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <SectionHeader
          eyebrow="Application Tracking"
          title="My Applications"
          description="Track the status of every opportunity you have applied to."
        />

        {applications.length === 0 ? (
          <Card tone="flat" className="text-center py-16 p-8">
            <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-900 font-bold text-lg mb-1">No applications yet</p>
            <p className="text-slate-500 text-sm mb-6">Browse verified opportunities and start applying.</p>
            <Button href="/opportunities">Browse opportunities</Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {applications.map(app => (
              <Card key={app.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <Link
                      href={`/opportunities/${app.opportunity?.slug || app.opportunity_id}`}
                      className="text-slate-900 font-bold hover:text-blue-600"
                    >
                      {app.opportunity?.title || "Opportunity"}
                    </Link>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-slate-500 mt-1">
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
                  <Badge tone={STATUS_TONES[app.status] || "neutral"} className="shrink-0 capitalize">
                    {app.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t-2 border-slate-900">
                  <span className="text-slate-500 text-xs font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Applied {new Date(app.applied_at || app.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex gap-3">
                    <button onClick={() => handleWithdraw(app.id)}
                      className="text-xs font-semibold text-slate-500 hover:text-red-600 px-2 py-1">
                      Withdraw
                    </button>
                    {app.opportunity?.slug && (
                      <Link href={`/opportunities/${app.opportunity.slug}`}
                        className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                        View <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}