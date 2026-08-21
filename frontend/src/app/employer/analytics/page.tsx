"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BarChart3, ArrowLeft, Loader2, Users, Briefcase,
  TrendingUp, CheckCircle2, XCircle, Clock, Award
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function EmployerAnalyticsPage() {
  const router = useRouter();
  const { user, isEmployer, isAdmin, loading: authLoading } = useUser();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirectTo=/employer/analytics");
      return;
    }
    if (!authLoading && user && !isEmployer && !isAdmin) {
      router.push("/dashboard");
    }
  }, [user, isEmployer, isAdmin, authLoading, router]);

  const loadAnalytics = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await api.get<any>("/api/employer/analytics");
      setData(res);
    } catch {
      toast.error("Failed to load hiring analytics");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  if (authLoading || loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-bg-primary">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-xs font-bold text-slate-500 uppercase">Computing Recruitment Metrics...</p>
      </div>
    );
  }

  const funnel = data?.funnel || {
    applied: 0,
    screening: 0,
    shortlisted: 0,
    interview: 0,
    accepted: 0,
    rejected: 0,
  };

  const totalApps = data?.totalApplications || 0;

  return (
    <div className="min-h-screen bg-bg-primary py-8 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* HEADER */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/employer/dashboard" className="text-xs font-bold text-slate-500 hover:text-blue-600">
              ← Back to Dashboard
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-blue-600" /> Recruitment Pipeline Analytics
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm font-medium">
            Database-calculated applicant conversion, stage velocity, and per-job hiring performance.
          </p>
        </div>

        {/* TOP METRICS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-400">Total Positions</span>
            <p className="text-2xl font-black text-slate-900">{data?.totalJobs || 0}</p>
            <span className="text-[11px] font-bold text-blue-600">{data?.activeJobs || 0} active postings</span>
          </Card>

          <Card className="p-5 space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-400">Total Applicants</span>
            <p className="text-2xl font-black text-slate-900">{totalApps}</p>
            <span className="text-[11px] font-bold text-emerald-600">100% verified scholars</span>
          </Card>

          <Card className="p-5 space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-400">Interview Stage</span>
            <p className="text-2xl font-black text-blue-600">{funnel.interview}</p>
            <span className="text-[11px] font-bold text-slate-500">Technical assessments</span>
          </Card>

          <Card className="p-5 space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-400">Offers &amp; Hires</span>
            <p className="text-2xl font-black text-emerald-700">{funnel.accepted}</p>
            <span className="text-[11px] font-bold text-emerald-600">Successful matches</span>
          </Card>
        </div>

        {/* HIRING FUNNEL BREAKDOWN */}
        <Card className="p-6 sm:p-8 space-y-6">
          <h2 className="text-lg font-black text-slate-900 border-b-2 border-slate-900 pb-3">
            Hiring Funnel Progression
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-4 bg-slate-50 border-2 border-slate-900 rounded-xl space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-500">1. Applied</span>
              <p className="text-xl font-black text-slate-900">{funnel.applied}</p>
              <span className="text-[10px] font-bold text-slate-400">Top of funnel</span>
            </div>

            <div className="p-4 bg-blue-50/50 border-2 border-slate-900 rounded-xl space-y-1">
              <span className="text-[10px] font-black uppercase text-blue-700">2. Screening</span>
              <p className="text-xl font-black text-slate-900">{funnel.screening}</p>
              <span className="text-[10px] font-bold text-slate-400">Under review</span>
            </div>

            <div className="p-4 bg-amber-50/50 border-2 border-slate-900 rounded-xl space-y-1">
              <span className="text-[10px] font-black uppercase text-amber-700">3. Shortlisted</span>
              <p className="text-xl font-black text-slate-900">{funnel.shortlisted}</p>
              <span className="text-[10px] font-bold text-slate-400">Qualified match</span>
            </div>

            <div className="p-4 bg-indigo-50/50 border-2 border-slate-900 rounded-xl space-y-1">
              <span className="text-[10px] font-black uppercase text-indigo-700">4. Interview</span>
              <p className="text-xl font-black text-slate-900">{funnel.interview}</p>
              <span className="text-[10px] font-bold text-slate-400">Technical round</span>
            </div>

            <div className="p-4 bg-emerald-50/50 border-2 border-slate-900 rounded-xl space-y-1">
              <span className="text-[10px] font-black uppercase text-emerald-700">5. Hired</span>
              <p className="text-xl font-black text-emerald-700">{funnel.accepted}</p>
              <span className="text-[10px] font-bold text-emerald-600">Offer accepted</span>
            </div>

            <div className="p-4 bg-red-50/50 border-2 border-slate-900 rounded-xl space-y-1">
              <span className="text-[10px] font-black uppercase text-red-700">6. Rejected</span>
              <p className="text-xl font-black text-red-700">{funnel.rejected}</p>
              <span className="text-[10px] font-bold text-slate-400">Archived</span>
            </div>
          </div>
        </Card>

        {/* PER-JOB PERFORMANCE TABLE */}
        <Card className="p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-black text-slate-900 border-b-2 border-slate-900 pb-3">
            Position Performance Breakdown
          </h2>

          {!data?.jobs || data.jobs.length === 0 ? (
            <p className="text-xs text-slate-500">No active positions to report.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b-2 border-slate-900 font-black text-slate-900 uppercase">
                    <th className="pb-3">Position Title</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Total Applicants</th>
                    <th className="pb-3 text-right">Shortlisted</th>
                    <th className="pb-3 text-right">Hired</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold">
                  {data.jobs.map((job: any) => (
                    <tr key={job.id} className="hover:bg-slate-50">
                      <td className="py-3">
                        <Link href={`/employer/jobs/${job.id}`} className="text-slate-900 hover:text-blue-600">
                          {job.title}
                        </Link>
                      </td>
                      <td className="py-3 uppercase text-slate-600">{job.category}</td>
                      <td className="py-3">
                        <Badge tone={job.is_active ? "accent" : "neutral"}>
                          {job.is_active ? "Active" : "Paused"}
                        </Badge>
                      </td>
                      <td className="py-3 text-right font-black text-slate-900">{job.total_applications}</td>
                      <td className="py-3 text-right font-black text-emerald-700">{job.shortlisted}</td>
                      <td className="py-3 text-right font-black text-blue-600">{job.hired}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

      </div>
    </div>
  );
}
