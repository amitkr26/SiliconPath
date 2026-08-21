"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  Briefcase, ArrowLeft, Users, Eye, Edit, Trash2,
  ExternalLink, PauseCircle, PlayCircle, Clock, MapPin,
  DollarSign, CheckCircle2, Loader2, Sparkles
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function EmployerJobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.id as string;

  const { user, isEmployer, isAdmin, loading: authLoading } = useUser();
  const [job, setJob] = useState<any | null>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirectTo=/employer/jobs/${jobId}`);
      return;
    }
    if (!authLoading && user && !isEmployer && !isAdmin) {
      router.push("/dashboard");
    }
  }, [user, isEmployer, isAdmin, authLoading, router, jobId]);

  const loadJobDetails = useCallback(async () => {
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
      toast.error("Failed to load job details");
    } finally {
      setLoading(false);
    }
  }, [jobId, user]);

  useEffect(() => {
    loadJobDetails();
  }, [loadJobDetails]);

  const handleToggleActive = async () => {
    if (!job) return;
    const nextState = !job.is_active;
    try {
      await api.patch(`/api/employer/jobs/${job.id}`, { is_active: nextState });
      toast.success(nextState ? "Job activated and live!" : "Job paused.");
      setJob({ ...job, is_active: nextState });
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this position?")) return;
    try {
      await api.delete(`/api/employer/jobs/${jobId}`);
      toast.success("Job deleted");
      router.push("/employer/jobs");
    } catch {
      toast.error("Failed to delete job");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-bg-primary">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-xs font-bold text-slate-500 uppercase">Loading Job Details...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-bg-primary text-center p-4">
        <h2 className="text-lg font-black text-slate-900">Job Not Found</h2>
        <Link href="/employer/jobs" className="mt-4 text-xs font-bold text-blue-600 hover:underline">
          ← Return to Job Postings
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary py-8 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/employer/jobs" className="text-xs font-bold text-slate-500 hover:text-blue-600">
                ← Back to All Postings
              </Link>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {job.title}
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm font-medium">
              {job.location || "India"} • Category: <strong className="uppercase">{job.category}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link
              href={`/employer/applicants?jobId=${job.id}`}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-brutal hover:shadow-brutal-lg transition-all flex items-center gap-1.5"
            >
              <Users className="w-4 h-4" /> View Applicants ({applications.length})
            </Link>

            <Link
              href={`/employer/jobs/${job.id}/edit`}
              className="p-2 bg-white border-2 border-slate-900 rounded-xl text-slate-700 hover:bg-slate-50 shadow-brutal-sm"
              title="Edit Position"
            >
              <Edit className="w-4 h-4" />
            </Link>

            <button
              onClick={handleToggleActive}
              className="p-2 bg-white border-2 border-slate-900 rounded-xl text-slate-700 hover:bg-slate-50 shadow-brutal-sm"
              title={job.is_active ? "Pause Posting" : "Resume Posting"}
            >
              {job.is_active ? <PauseCircle className="w-4 h-4 text-amber-600" /> : <PlayCircle className="w-4 h-4 text-emerald-600" />}
            </button>

            <button
              onClick={handleDelete}
              className="p-2 bg-white border-2 border-slate-900 rounded-xl text-red-600 hover:bg-red-50 shadow-brutal-sm"
              title="Delete Position"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* METRICS STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4 space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-400">Total Applicants</span>
            <p className="text-2xl font-black text-slate-900">{applications.length}</p>
          </Card>
          <Card className="p-4 space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-400">Shortlisted</span>
            <p className="text-2xl font-black text-emerald-700">
              {applications.filter((a) => a.status === "shortlisted" || a.status === "interview" || a.status === "accepted").length}
            </p>
          </Card>
          <Card className="p-4 space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-400">Status</span>
            <Badge tone={job.is_active ? "accent" : "neutral"}>
              {job.is_active ? "Active" : "Paused"}
            </Badge>
          </Card>
          <Card className="p-4 space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-400">Public Link</span>
            <Link
              href={`/opportunities/${job.slug || job.id}`}
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
            >
              Preview Live <ExternalLink className="w-3 h-3" />
            </Link>
          </Card>
        </div>

        {/* DETAILS CARD */}
        <Card className="p-6 sm:p-8 space-y-5">
          <h2 className="text-lg font-black text-slate-900 border-b-2 border-slate-900 pb-3">
            Position Scope &amp; Requirements
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="font-bold text-slate-400 uppercase text-[10px] block">Compensation / Stipend</span>
              <p className="font-bold text-slate-900 mt-0.5">{job.salary_range || "Standard Fellowship Norms"}</p>
            </div>
            <div>
              <span className="font-bold text-slate-400 uppercase text-[10px] block">Application Deadline</span>
              <p className="font-bold text-slate-900 mt-0.5">{job.deadline || "Open until filled"}</p>
            </div>
            <div className="sm:col-span-2">
              <span className="font-bold text-slate-400 uppercase text-[10px] block">Eligibility Criteria</span>
              <p className="font-medium text-slate-700 mt-0.5">{job.eligibility || "B.Tech/M.Tech in ECE/VLSI"}</p>
            </div>
            {job.description && (
              <div className="sm:col-span-2">
                <span className="font-bold text-slate-400 uppercase text-[10px] block">Scope of Work</span>
                <p className="font-medium text-slate-700 mt-1 leading-relaxed whitespace-pre-line">{job.description}</p>
              </div>
            )}
            {job.tags && job.tags.length > 0 && (
              <div className="sm:col-span-2">
                <span className="font-bold text-slate-400 uppercase text-[10px] block">Required Skills</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {job.tags.map((tag: string) => (
                    <span key={tag} className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

      </div>
    </div>
  );
}
