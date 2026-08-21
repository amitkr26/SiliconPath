"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Users, Search, Filter, Loader2, ExternalLink, Mail,
  CheckCircle2, Clock, XCircle, ChevronRight, FileText,
  Download, Sparkles, MessageSquare, Briefcase
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const STAGES = [
  { id: "all", label: "All Applicants" },
  { id: "applied", label: "New (Applied)", color: "text-blue-600" },
  { id: "screening", label: "Screening", color: "text-purple-600" },
  { id: "shortlisted", label: "Shortlisted", color: "text-emerald-600" },
  { id: "interview", label: "Interview", color: "text-amber-600" },
  { id: "accepted", label: "Offered / Hired", color: "text-emerald-700" },
  { id: "rejected", label: "Rejected", color: "text-red-600" },
];

export default function EmployerApplicantsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialJobId = searchParams.get("jobId") || "all";

  const { user, isEmployer, isAdmin, loading: authLoading } = useUser();
  const [applications, setApplications] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>(initialJobId);
  const [selectedStage, setSelectedStage] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<any | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirectTo=/employer/applicants");
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
      const [appsRes, jobsRes] = await Promise.all([
        api.get<{ applications: any[] }>("/api/employer/applicants"),
        api.get<{ opportunities: any[] }>("/api/employer/jobs"),
      ]);

      setApplications(appsRes.applications || []);
      setJobs(jobsRes.opportunities || []);
    } catch {
      toast.error("Failed to load applicants");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStageChange = async (appId: string, newStatus: string) => {
    try {
      await api.patch("/api/employer/applicants", { id: appId, status: newStatus });
      toast.success(`Applicant moved to ${newStatus}`);
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
      );
      if (selectedApp?.id === appId) {
        setSelectedApp((prev: any) => ({ ...prev, status: newStatus }));
      }
    } catch {
      toast.error("Failed to update status");
    }
  };

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const candidate = app.user_profile || {};
      const matchesJob = selectedJobId === "all" || app.opportunity_id === selectedJobId;
      const matchesStage = selectedStage === "all" || app.status === selectedStage;
      const matchesSearch =
        (candidate.display_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (candidate.headline || "").toLowerCase().includes(search.toLowerCase()) ||
        (candidate.skills || []).some((s: string) => s.toLowerCase().includes(search.toLowerCase())) ||
        (app.opportunity?.title || "").toLowerCase().includes(search.toLowerCase());

      return matchesJob && matchesStage && matchesSearch;
    });
  }, [applications, selectedJobId, selectedStage, search]);

  if (authLoading || loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-bg-primary">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loading ATS Pipeline...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary py-8 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* PAGE HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/employer/dashboard" className="text-xs font-bold text-slate-500 hover:text-blue-600">
                ← Back to Dashboard
              </Link>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <Users className="w-7 h-7 text-blue-600" /> Applicant Tracking System (ATS)
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm font-medium">
              Review incoming candidates, inspect resumes, match skills, and advance candidates through hiring stages.
            </p>
          </div>

          <Link
            href="/employer/talent"
            className="px-4 py-2.5 rounded-xl bg-white border-2 border-slate-900 text-slate-900 text-xs font-black shadow-brutal hover:shadow-brutal-lg hover:bg-slate-50 transition-all flex items-center gap-2 shrink-0 self-start sm:self-center"
          >
            <Search className="w-4 h-4 text-blue-600" /> Sourcing Pool
          </Link>
        </div>

        {/* JOB SELECTOR & SEARCH BAR */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3 border-2 border-slate-900 rounded-2xl shadow-brutal-sm">
          {/* JOB FILTER */}
          <div className="sm:col-span-1">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
              Filter by Position
            </label>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-900 rounded-lg text-xs font-bold text-slate-900 focus:outline-none"
            >
              <option value="all">All Positions ({jobs.length})</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>
          </div>

          {/* SEARCH CANDIDATES */}
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
              Search Candidates &amp; Skills
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by candidate name, SystemVerilog, UVM, Physical Design..."
                className="w-full pl-9 pr-3 py-2 text-xs font-bold bg-slate-50 border border-slate-900 rounded-lg focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* STAGE TABS BAR */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {STAGES.map((s) => {
            const count = s.id === "all"
              ? applications.length
              : applications.filter((a) => a.status === s.id).length;

            return (
              <button
                key={s.id}
                onClick={() => setSelectedStage(s.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all border-2 ${
                  selectedStage === s.id
                    ? "bg-slate-900 text-white border-slate-900 shadow-brutal-sm"
                    : "bg-white text-slate-700 border-slate-900 hover:bg-slate-100"
                }`}
              >
                {s.label} ({count})
              </button>
            );
          })}
        </div>

        {/* ATS PIPELINE LIST */}
        {filteredApplications.length === 0 ? (
          <Card className="p-12 text-center space-y-3">
            <Users className="w-12 h-12 text-slate-300 mx-auto" />
            <h2 className="text-base font-black text-slate-900">No applicants in this stage</h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No candidate submissions match your current stage or position filter.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* LEFT: CANDIDATE CARDS (2 COLS) */}
            <div className="lg:col-span-2 space-y-4">
              {filteredApplications.map((app) => {
                const candidate = app.user_profile || {};
                const isSelected = selectedApp?.id === app.id;

                return (
                  <div
                    key={app.id}
                    onClick={() => setSelectedApp(app)}
                    className={`p-5 bg-white border-2 rounded-2xl transition-all cursor-pointer space-y-3 ${
                      isSelected
                        ? "border-blue-600 shadow-brutal-lg ring-2 ring-blue-600/20"
                        : "border-slate-900 shadow-brutal hover:shadow-brutal-lg"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full border-2 border-slate-900 bg-blue-100 text-blue-700 flex items-center justify-center font-black text-base shrink-0 shadow-brutal-sm">
                          {candidate.avatar_url ? (
                            <img src={candidate.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            (candidate.display_name?.[0] || "C").toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-black text-slate-900">{candidate.display_name || "Applicant"}</h3>
                            {candidate.username && (
                              <span className="text-xs font-bold text-slate-500">@{candidate.username}</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 font-medium line-clamp-1">{candidate.headline || "Hardware Engineer"}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={app.status || "applied"}
                          onChange={(e) => handleStageChange(app.id, e.target.value)}
                          className="px-3 py-1.5 bg-slate-50 border-2 border-slate-900 rounded-xl text-xs font-black text-slate-900 shadow-brutal-sm focus:outline-none"
                        >
                          <option value="applied">Applied</option>
                          <option value="screening">Screening</option>
                          <option value="shortlisted">Shortlisted</option>
                          <option value="interview">Interview</option>
                          <option value="accepted">Accepted / Hired</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 text-slate-600 font-medium">
                        <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                        <span>Position: <strong className="text-slate-900">{app.opportunity?.title || "Semiconductor Position"}</strong></span>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-400">
                        Applied {app.applied_at ? new Date(app.applied_at).toLocaleDateString() : "recently"}
                      </span>
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
                );
              })}
            </div>

            {/* RIGHT: CANDIDATE DETAIL DRAWER / INSPECTOR (1 COL) */}
            <div className="lg:col-span-1">
              {selectedApp ? (
                <div className="p-6 bg-white border-2 border-slate-900 rounded-2xl shadow-brutal space-y-5 sticky top-24">
                  <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-900">
                        {selectedApp.user_profile?.display_name || "Applicant Details"}
                      </h3>
                      {selectedApp.user_profile?.username && (
                        <p className="text-xs font-bold text-slate-500">@{selectedApp.user_profile.username}</p>
                      )}
                    </div>
                    <Badge tone="accent">{selectedApp.status || "applied"}</Badge>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block">Applied Position</span>
                      <p className="font-bold text-slate-900 mt-0.5">{selectedApp.opportunity?.title}</p>
                    </div>

                    {selectedApp.user_profile?.headline && (
                      <div>
                        <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block">Headline</span>
                        <p className="text-slate-700 mt-0.5 font-medium">{selectedApp.user_profile.headline}</p>
                      </div>
                    )}

                    {selectedApp.user_profile?.bio && (
                      <div>
                        <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block">About</span>
                        <p className="text-slate-600 mt-0.5 leading-relaxed">{selectedApp.user_profile.bio}</p>
                      </div>
                    )}

                    {selectedApp.user_profile?.skills && (
                      <div>
                        <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block">Skills</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedApp.user_profile.skills.map((s: string) => (
                            <span key={s} className="px-2 py-0.5 rounded bg-slate-100 border border-slate-300 text-[10px] font-bold text-slate-800">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    {selectedApp.user_profile?.username && (
                      <Link
                        href={`/profile/${selectedApp.user_profile.username}`}
                        className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border-2 border-slate-900 text-slate-900 text-xs font-black shadow-brutal-sm hover:shadow-brutal transition-all flex items-center justify-center gap-2"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> View Full Candidate Profile
                      </Link>
                    )}

                    <Link
                      href={`/messages`}
                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 border-2 border-slate-900 text-white text-xs font-black shadow-brutal hover:shadow-brutal-lg transition-all flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Message Candidate
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-8 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl text-center space-y-2 text-slate-500">
                  <FileText className="w-8 h-8 mx-auto text-slate-400" />
                  <p className="text-xs font-bold text-slate-700">Select an applicant to view detailed background &amp; profile.</p>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
