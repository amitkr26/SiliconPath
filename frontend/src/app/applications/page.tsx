"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { Loader2, FileText, ExternalLink, Clock, Calendar, MapPin, CheckCircle2, AlertCircle, ArrowRight, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { cn } from "@/lib/utils";

type BadgeTone = "accent" | "neutral" | "warning" | "purple" | "success" | "danger";

const STATUS_TONES: Record<string, BadgeTone> = {
  applied: "accent",
  screening: "neutral",
  reviewed: "accent",
  shortlisted: "purple",
  interview: "warning",
  accepted: "success",
  rejected: "danger",
  withdrawn: "neutral",
};

const STAGES = [
  { id: "applied", label: "Applied" },
  { id: "screening", label: "Screening" },
  { id: "shortlisted", label: "Shortlisted" },
  { id: "interview", label: "Interview" },
  { id: "accepted", label: "Accepted" },
];

function getStageIndex(status: string): number {
  switch (status.toLowerCase()) {
    case "applied":
    case "submitted":
      return 0;
    case "screening":
    case "reviewed":
      return 1;
    case "shortlisted":
      return 2;
    case "interview":
      return 3;
    case "accepted":
    case "offer":
      return 4;
    default:
      return 0;
  }
}

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
    if (!confirm("Are you sure you want to withdraw this application?")) return;
    try {
      const res = await fetch("/api/applications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setApplications(prev => prev.filter(a => a.id !== id));
        toast.success("Application withdrawn");
      } else {
        toast.error("Failed to withdraw application");
      }
    } catch {
      toast.error("Failed to withdraw");
    }
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <SectionHeader
          eyebrow="Career Pipeline"
          title="My Applications"
          description="Track your application review stages, recruiter notes, and interview progress."
        />

        {applications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 text-center py-16 p-8 shadow-card">
            <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-slate-900 font-bold text-base mb-1">No active applications yet</p>
            <p className="text-slate-500 text-xs sm:text-sm mb-6 font-normal max-w-sm mx-auto">Browse verified semiconductor and research positions to apply.</p>
            <Button href="/opportunities" size="md" className="shadow-sm">Browse Opportunities</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map(app => {
              const isRejected = app.status?.toLowerCase() === "rejected";
              const isWithdrawn = app.status?.toLowerCase() === "withdrawn";
              const currentStageIdx = getStageIndex(app.status || "applied");

              return (
                <div key={app.id} className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-card hover:shadow-elevated transition-all space-y-4">
                  {/* Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/opportunities/${app.opportunity?.slug || app.opportunity_id}`}
                        className="text-slate-900 font-bold text-base hover:text-blue-600 transition-colors"
                      >
                        {app.opportunity?.title || "Semiconductor Position"}
                      </Link>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-slate-500 mt-1">
                        {app.opportunity?.organization && (
                          <span className="text-slate-700 font-semibold">{app.opportunity.organization}</span>
                        )}
                        {app.opportunity?.location && (
                          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" />{app.opportunity.location}</span>
                        )}
                        {app.opportunity?.deadline && (
                          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-400" />Deadline: {new Date(app.opportunity.deadline).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge tone={STATUS_TONES[app.status] || "neutral"} className="capitalize font-semibold text-xs px-2.5 py-0.5">
                        {app.status || "Applied"}
                      </Badge>
                    </div>
                  </div>

                  {/* Visual Stage Stepper */}
                  {!isRejected && !isWithdrawn && (
                    <div className="pt-2 pb-1">
                      <div className="grid grid-cols-5 gap-2 text-center">
                        {STAGES.map((stg, idx) => {
                          const isPassed = idx <= currentStageIdx;
                          const isCurrent = idx === currentStageIdx;

                          return (
                            <div key={stg.id} className="space-y-1.5">
                              <div
                                className={cn(
                                  "h-1.5 rounded-full transition-all",
                                  isPassed ? "bg-blue-600" : "bg-slate-100"
                                )}
                              />
                              <p
                                className={cn(
                                  "text-[10px] sm:text-[11px] truncate",
                                  isCurrent
                                    ? "text-blue-600 font-bold"
                                    : isPassed
                                    ? "text-slate-700 font-medium"
                                    : "text-slate-400 font-normal"
                                )}
                              >
                                {stg.label}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Recruiter Evaluation / Stage Note */}
                  {app.notes && (
                    <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 text-xs text-slate-700 font-normal flex items-start gap-2.5">
                      <MessageSquare className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-slate-900">Recruiter Note: </span>
                        <span>{app.notes}</span>
                      </div>
                    </div>
                  )}

                  {/* Status Banner for Rejected / Withdrawn */}
                  {isRejected && (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-700 font-medium flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Application not selected for this opening. You may explore other relevant hardware positions.</span>
                    </div>
                  )}

                  {/* Footer Timestamps & Actions */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
                    <span className="text-slate-500 font-medium flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> Applied on {new Date(app.applied_at || app.created_at).toLocaleDateString()}
                    </span>

                    <div className="flex items-center gap-4">
                      {!isWithdrawn && !isRejected && (
                        <button
                          onClick={() => handleWithdraw(app.id)}
                          className="font-medium text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          Withdraw Application
                        </button>
                      )}
                      {app.opportunity?.slug && (
                        <Link
                          href={`/opportunities/${app.opportunity.slug}`}
                          className="font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          View Job Details <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}