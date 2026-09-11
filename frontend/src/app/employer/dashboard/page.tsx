"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Briefcase, Users, LayoutDashboard, Plus, Search,
  Loader2, User, Building, Mail, Award, Check, X, Sparkles,
  ArrowRight, ExternalLink, Clock, ChevronRight, FileText, CheckCircle2
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface StatsData {
  activeJobs: number;
  totalApplications: number;
  shortlistedApplications: number;
  totalTalentPool: number;
}

export default function EmployerDashboard() {
  const router = useRouter();
  const { user, isEmployer, isAdmin, loading: authLoading } = useUser();
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [stats, setStats] = useState<StatsData>({
    activeJobs: 0,
    totalApplications: 0,
    shortlistedApplications: 0,
    totalTalentPool: 0,
  });
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirectTo=/employer/dashboard");
      return;
    }
    if (!authLoading && user && !isEmployer && !isAdmin) {
      router.push("/dashboard");
    }
  }, [user, isEmployer, isAdmin, authLoading, router]);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [statsRes, jobsRes, appsRes, talentRes] = await Promise.all([
        api.get<StatsData>("/api/employer/stats").catch(() => ({
          activeJobs: 0,
          totalApplications: 0,
          shortlistedApplications: 0,
          totalTalentPool: 0,
        })),
        api.get<{ opportunities: any[] }>("/api/employer/jobs").catch(() => ({ opportunities: [] })),
        api.get<{ applications: any[] }>("/api/employer/applicants").catch(() => ({ applications: [] })),
        api.get<{ candidates: any[] }>("/api/employer/talent").catch(() => ({ candidates: [] })),
      ]);

      setStats(statsRes);
      setJobs(jobsRes.opportunities || []);
      setApplications(appsRes.applications || []);
      setRecommendations((talentRes.candidates || []).slice(0, 4));
    } catch (err: any) {
      toast.error("Failed to load employer dashboard");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStageChange = async (appId: string, newStatus: string) => {
    try {
      await api.patch(`/api/employer/applicants`, { id: appId, status: newStatus });
      toast.success(`Application updated to ${newStatus}`);
      loadData();
    } catch {
      toast.error("Failed to update status");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-bg-primary">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loading Recruiter Cockpit...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary py-8 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {/* RECRUITER WELCOME HERO */}
        <div className="bg-white border-2 border-slate-900 rounded-2xl p-6 sm:p-8 shadow-brutal flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-600 text-blue-700 text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Employer &amp; Lab Suite
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
              Recruiter Cockpit
            </h1>
            <p className="text-slate-600 text-sm font-medium max-w-2xl">
              Post research fellowships &amp; VLSI engineering openings, manage candidate pipelines, and source top semiconductor talent.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/employer/talent"
              className="px-4 py-2.5 rounded-xl bg-white border-2 border-slate-900 text-slate-900 text-xs font-bold shadow-brutal-sm hover:shadow-brutal hover:bg-slate-50 transition-all flex items-center gap-2"
            >
              <Search className="w-4 h-4 text-slate-700" /> Sourcing Pool
            </Link>
            <Link
              href="/employer/post-job"
              className="px-5 py-2.5 rounded-xl bg-blue-600 border-2 border-slate-900 text-white text-xs font-black shadow-brutal hover:shadow-brutal-lg hover:bg-blue-700 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Post New Position
            </Link>
          </div>
        </div>

        {/* 4 STAT CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card className="p-5 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Postings</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-slate-900 flex items-center justify-center shadow-brutal-sm">
                <Briefcase className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <div>
              <span className="text-3xl font-black text-slate-900 tracking-tight">{stats.activeJobs}</span>
              <p className="text-[11px] font-semibold text-slate-500 mt-1">Live in candidate feeds</p>
            </div>
          </Card>

          <Card className="p-5 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Applicants</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-slate-900 flex items-center justify-center shadow-brutal-sm">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <div>
              <span className="text-3xl font-black text-slate-900 tracking-tight">{stats.totalApplications}</span>
              <p className="text-[11px] font-semibold text-slate-500 mt-1">Direct submissions</p>
            </div>
          </Card>

          <Card className="p-5 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">In Pipeline</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-slate-900 flex items-center justify-center shadow-brutal-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
            <div>
              <span className="text-3xl font-black text-emerald-700 tracking-tight">{stats.shortlistedApplications}</span>
              <p className="text-[11px] font-semibold text-slate-500 mt-1">Shortlisted / Interview</p>
            </div>
          </Card>

          <Card className="p-5 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Talent Pool</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 border border-slate-900 flex items-center justify-center shadow-brutal-sm">
                <Award className="w-4 h-4 text-purple-600" />
              </div>
            </div>
            <div>
              <span className="text-3xl font-black text-slate-900 tracking-tight">{stats.totalTalentPool}</span>
              <p className="text-[11px] font-semibold text-slate-500 mt-1">Verified scholars &amp; engineers</p>
            </div>
          </Card>
        </div>

        {/* QUICK NAVIGATION ACTION STRIP */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/employer/jobs"
            className="p-4 bg-white border-2 border-slate-900 rounded-xl shadow-brutal-sm hover:shadow-brutal hover:border-blue-600 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 border border-slate-900 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Briefcase className="w-5 h-5 text-blue-600 group-hover:text-white" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900">Manage Job Postings</h2>
                <p className="text-[11px] text-slate-500 font-medium">Edit, pause, or view metrics</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
          </Link>

          <Link
            href="/employer/applicants"
            className="p-4 bg-white border-2 border-slate-900 rounded-xl shadow-brutal-sm hover:shadow-brutal hover:border-blue-600 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-slate-900 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Users className="w-5 h-5 text-emerald-600 group-hover:text-white" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900">Applicant Pipeline (ATS)</h2>
                <p className="text-[11px] text-slate-500 font-medium">Screen, shortlist, &amp; advance candidates</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
          </Link>

          <Link
            href="/employer/company"
            className="p-4 bg-white border-2 border-slate-900 rounded-xl shadow-brutal-sm hover:shadow-brutal hover:border-blue-600 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 border border-slate-900 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <Building className="w-5 h-5 text-purple-600 group-hover:text-white" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900">Company &amp; Lab Profile</h2>
                <p className="text-[11px] text-slate-500 font-medium">Branding, lab specs &amp; claims</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all" />
          </Link>
        </div>

        {/* 2 COLUMN GRID: INCOMING APPLICANTS STREAM & LIVE POSTINGS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT: INCOMING APPLICANTS FUNNEL (2 COLS) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" /> Recent Applicant Stream
                </h2>
                <p className="text-xs text-slate-500 font-medium">Latest submissions across your active positions</p>
              </div>
              <Link
                href="/employer/applicants"
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
              >
                View Complete ATS Pipeline <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {applications.length === 0 ? (
              <Card className="p-8 text-center space-y-3">
                <Users className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-900">No applicants yet</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  When candidates apply to your posted opportunities, their profiles and resumes will appear here in real-time.
                </p>
                <Link
                  href="/employer/post-job"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-brutal-sm hover:shadow-brutal"
                >
                  <Plus className="w-3.5 h-3.5" /> Post Another Position
                </Link>
              </Card>
            ) : (
              <div className="space-y-3">
                {applications.slice(0, 5).map((app) => {
                  const candidate = app.user_profile || {};
                  return (
                    <div
                      key={app.id}
                      className="p-4 bg-white border-2 border-slate-900 rounded-xl shadow-brutal-sm hover:shadow-brutal transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-blue-100 text-blue-700 flex items-center justify-center font-black text-sm shrink-0 shadow-brutal-sm">
                          {candidate.avatar_url ? (
                            <img src={candidate.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            (candidate.display_name?.[0] || "C").toUpperCase()
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-slate-900">
                              {candidate.display_name || "Applicant"}
                            </span>
                            {candidate.username && (
                              <span className="text-[11px] font-bold text-slate-500">@{candidate.username}</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 font-medium line-clamp-1">
                            Applied for: <span className="font-bold text-slate-900">{app.opportunity?.title || "Semiconductor Position"}</span>
                          </p>
                          {candidate.skills && candidate.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {candidate.skills.slice(0, 3).map((sk: string) => (
                                <span key={sk} className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 text-[9px] font-bold text-slate-700">
                                  {sk}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <select
                          value={app.status || "applied"}
                          onChange={(e) => handleStageChange(app.id, e.target.value)}
                          className="px-2.5 py-1.5 bg-slate-50 border-2 border-slate-900 rounded-lg text-xs font-bold text-slate-900 shadow-brutal-sm focus:outline-none"
                        >
                          <option value="applied">Applied</option>
                          <option value="screening">Screening</option>
                          <option value="shortlisted">Shortlisted</option>
                          <option value="interview">Interview</option>
                          <option value="accepted">Accepted</option>
                          <option value="rejected">Rejected</option>
                        </select>

                        {candidate.username && (
                          <Link
                            href={`/profile/${candidate.username}`}
                            className="p-1.5 rounded-lg border border-slate-900 hover:bg-slate-100 text-slate-700"
                            title="View Public Profile"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT: ACTIVE POSITIONS SNAPSHOT (1 COL) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-600" /> Active Jobs
              </h2>
              <Link href="/employer/jobs" className="text-xs font-bold text-blue-600 hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {jobs.slice(0, 4).map((job) => (
                <div
                  key={job.id}
                  className="p-4 bg-white border-2 border-slate-900 rounded-xl shadow-brutal-sm hover:shadow-brutal transition-all space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xs font-black text-slate-900 line-clamp-1">{job.title}</h3>
                    <Badge tone={job.is_active ? "accent" : "neutral"}>
                      {job.is_active ? "Active" : "Paused"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                    <span>{job.location || "India"}</span>
                    <span>•</span>
                    <span className="capitalize">{job.category || "JRF"}</span>
                  </div>
                  <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-xs">
                    <Link
                      href={`/employer/applicants?jobId=${job.id}`}
                      className="text-blue-600 font-bold hover:underline"
                    >
                      View Applicants
                    </Link>
                    <Link
                      href={`/opportunities/${job.slug || job.id}`}
                      className="text-slate-400 hover:text-slate-700"
                      title="View live posting"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* AI MATCHING TEASER */}
            <div className="p-4 bg-blue-50 border-2 border-slate-900 rounded-xl shadow-brutal-sm space-y-2">
              <div className="flex items-center gap-2 text-xs font-black text-blue-900 uppercase">
                <Sparkles className="w-4 h-4 text-blue-600" /> Verified Talent Pool
              </div>
              <p className="text-xs text-blue-800 font-medium">
                Looking for RTL or UVM verification talent immediately? Search {stats.totalTalentPool}+ verified scholars.
              </p>
              <Link
                href="/employer/talent"
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:underline pt-1"
              >
                Browse Sourcing Pool <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
