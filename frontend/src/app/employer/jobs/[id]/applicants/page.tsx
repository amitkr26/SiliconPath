"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  Users, ArrowLeft, Loader2, ExternalLink, Mail,
  CheckCircle2, Clock, XCircle, FileText, Download, MessageSquare
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";

export default function EmployerJobApplicantsPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.id as string;

  const { user, isEmployer, isAdmin, loading: authLoading } = useUser();
  const [job, setJob] = useState<any | null>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirectTo=/employer/jobs/${jobId}/applicants`);
      return;
    }
    if (!authLoading && user && !isEmployer && !isAdmin) {
      router.push("/dashboard");
    }
  }, [user, isEmployer, isAdmin, authLoading, router, jobId]);

  const loadData = useCallback(async () => {
    if (!jobId || !user) return;
    try {
      setLoading(true);
      const [jobRes, appsRes] = await Promise.all([
        api.get<{ job: any }>(`/api/employer/jobs/${jobId}`),
        api.get<{ applications: any[] }>(`/api/employer/applicants?jobId=${jobId}`),
      ]);
      setJob(jobRes.job);
      setApplications(appsRes.applications || []);
    } catch {
      toast.error("Failed to load applicants");
    } finally {
      setLoading(false);
    }
  }, [jobId, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStageChange = async (appId: string, newStatus: string) => {
    try {
      await api.patch(`/api/employer/applicants`, { id: appId, status: newStatus });
      toast.success(`Applicant moved to ${newStatus}`);
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
      );
    } catch {
      toast.error("Failed to update status");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-bg-primary">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-xs font-bold text-slate-500 uppercase">Loading Applicants...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary py-8 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* HEADER */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href={`/employer/jobs/${jobId}`} className="text-xs font-bold text-slate-500 hover:text-blue-600">
              ← Back to Job Details
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-blue-600" /> Applicants for &quot;{job?.title}&quot;
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm font-medium">
            Review and screen all candidate applications submitted specifically for this position.
          </p>
        </div>

        {/* APPLICANTS LIST */}
        {applications.length === 0 ? (
          <Card className="p-12 text-center space-y-3">
            <Users className="w-12 h-12 text-slate-300 mx-auto" />
            <h2 className="text-base font-black text-slate-900">No applicants yet for this position</h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              When candidates apply to this opening, they will appear here with full profiles, verified skills, and resume details.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => {
              const candidate = app.user_profile || {};
              return (
                <div
                  key={app.id}
                  className="p-5 bg-white border-2 border-slate-900 rounded-2xl shadow-brutal hover:shadow-brutal-lg transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full border-2 border-slate-900 flex items-center justify-center font-black text-base shrink-0 shadow-brutal-sm overflow-hidden relative">
                        <ImageWithFallback
                          src={candidate.avatar_url}
                          alt={candidate.display_name || "Applicant"}
                          fallbackType="avatar"
                          fallbackName={candidate.display_name || "Applicant"}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/employer/applicants/${app.id}`}
                            className="text-base font-black text-slate-900 hover:text-blue-600 transition-colors"
                          >
                            {candidate.display_name || "Applicant"}
                          </Link>
                          {candidate.username && (
                            <span className="text-xs font-bold text-slate-500">@{candidate.username}</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 font-medium line-clamp-1">{candidate.headline || "Hardware Engineer"}</p>
                      </div>
                    </div>

                    {candidate.skills && candidate.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {candidate.skills.slice(0, 5).map((sk: string) => (
                          <span key={sk} className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-[10px] font-bold text-blue-700">
                            {sk}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 shrink-0 self-end md:self-center">
                    <select
                      value={app.status || "applied"}
                      onChange={(e) => handleStageChange(app.id, e.target.value)}
                      className="px-3 py-2 bg-slate-50 border-2 border-slate-900 rounded-xl text-xs font-black text-slate-900 shadow-brutal-sm focus:outline-none"
                    >
                      <option value="applied">Applied</option>
                      <option value="screening">Screening</option>
                      <option value="shortlisted">Shortlisted</option>
                      <option value="interview">Interview</option>
                      <option value="accepted">Accepted / Hired</option>
                      <option value="rejected">Rejected</option>
                    </select>

                    <Link
                      href={`/employer/applicants/${app.id}`}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-brutal hover:shadow-brutal-lg transition-all"
                    >
                      Review Application
                    </Link>
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
