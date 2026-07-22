"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Briefcase, Users, LayoutDashboard, Plus, Search,
  Loader2, User, Building, Mail, Award, Check, X, Sparkles
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

export default function EmployerDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useUser();
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [recLoadingId, setRecLoadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirectTo=/employer/dashboard");
      return;
    }
    const role = user?.user_metadata?.role;
    if (user && role !== "employer" && role !== "admin") {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  const loadDashboardData = useCallback(async () => {
    if (!user) return;
    try {
      setLoadingJobs(true);
      // Fetch posted jobs
      const jobsRes = await api.get<{ opportunities: any[] }>("/api/employer/jobs");
      setJobs(jobsRes.opportunities || []);
      if (jobsRes.opportunities && jobsRes.opportunities.length > 0) {
        setSelectedJobId(jobsRes.opportunities[0].id);
      }

      // Fetch all applications
      // ponytail: fetch applications directly from endpoint; in a real env, join opportunity postings.
      const appsRes = await api.get<{ applications: any[] }>("/api/applications");
      setApplications(appsRes.applications || []);
    } catch (err: any) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoadingJobs(false);
    }
  }, [user]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const fetchRecommendations = useCallback(async (jobId: string) => {
    try {
      setLoadingRecs(true);
      setRecLoadingId(jobId);
      const res = await api.get<{ recommendations: any[] }>(
        `/api/employer/recommendations?opportunityId=${jobId}`
      );
      setRecommendations(res.recommendations || []);
    } catch {
      toast.error("Failed to load recommendations");
    } finally {
      setLoadingRecs(false);
      setRecLoadingId(null);
    }
  }, []);

  useEffect(() => {
    if (selectedJobId) {
      fetchRecommendations(selectedJobId);
    } else {
      setRecommendations([]);
    }
  }, [selectedJobId, fetchRecommendations]);

  const handleStatusChange = async (appId: string, newStatus: string) => {
    try {
      await api.patch(`/api/applications/${appId}`, { status: newStatus });
      toast.success(`Application marked as ${newStatus}`);
      loadDashboardData();
    } catch {
      toast.error("Failed to update application status");
    }
  };

  if (authLoading || loadingJobs) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary flex items-center gap-3">
              <LayoutDashboard className="w-8 h-8 text-accent" />
              Employer Portal
            </h1>
            <p className="text-text-secondary text-sm mt-1">
              Manage your jobs, view incoming applications, and source top VLSI talent.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/employer/company-claim"
              className="inline-flex items-center gap-2 border border-border bg-surface text-text-secondary hover:text-text-primary px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
            >
              <Building className="w-4 h-4" /> Claim Company
            </Link>
            <Link
              href="/employer/post-job"
              className="inline-flex items-center gap-2 bg-accent text-bg-primary hover:bg-accent-hover px-4 py-2.5 rounded-lg text-sm font-semibold shadow-glow-btn transition-colors"
            >
              <Plus className="w-4 h-4" /> Post a Job
            </Link>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Posted Jobs Section */}
          <div className="lg:col-span-1 bg-surface border border-border rounded-xl p-5">
            <h2 className="font-display font-bold text-text-primary text-lg mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-accent" /> Your Posted Jobs
            </h2>
            {jobs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-text-secondary text-sm">No jobs posted yet</p>
                <Link
                  href="/employer/post-job"
                  className="inline-block mt-4 text-accent text-sm font-semibold hover:underline"
                >
                  Create your first listing
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {jobs.map((job) => (
                  <button
                    key={job.id}
                    onClick={() => setSelectedJobId(job.id)}
                    className={`w-full text-left p-3.5 rounded-lg border transition-all ${
                      selectedJobId === job.id
                        ? "bg-accent/10 border-accent text-text-primary shadow-sm"
                        : "bg-bg-primary/50 border-border hover:border-accent/40 text-text-secondary"
                    }`}
                  >
                    <p className="font-semibold text-sm line-clamp-1">{job.title}</p>
                    <p className="text-xs text-text-muted mt-1">{job.location || "Remote"}</p>
                    <div className="flex items-center justify-between mt-2.5">
                      <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-surface border border-border">
                        {job.category}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        job.verification_status === "verified"
                          ? "bg-success/15 text-success"
                          : "bg-warning/15 text-warning"
                      }`}>
                        {job.verification_status === "verified" ? "Live" : "Pending Verification"}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sourcing & Application Pipeline */}
          <div className="lg:col-span-2 space-y-8">
            {/* AI Sourced Talent Panel */}
            {selectedJobId && (
              <div className="bg-surface border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display font-bold text-text-primary text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-accent animate-pulse" />
                    AI Sourced Candidates
                  </h2>
                  <span className="text-xs text-text-muted">Matched by tags & skills</span>
                </div>

                {loadingRecs ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-accent" />
                  </div>
                ) : recommendations.length === 0 ? (
                  <p className="text-text-secondary text-sm text-center py-8">
                    No matching candidates found for this job&apos;s tags.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {recommendations.map((rec) => (
                      <div
                        key={rec.id}
                        className="flex items-start gap-4 p-4 bg-bg-primary/50 border border-border/80 rounded-xl"
                      >
                        <div className="w-11 h-11 rounded-full bg-accent/15 text-accent flex items-center justify-center font-bold flex-shrink-0">
                          {rec.full_name ? rec.full_name[0].toUpperCase() : "C"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <Link
                                href={`/people/${rec.username || rec.id}`}
                                className="font-semibold text-text-primary text-sm hover:text-accent transition-colors"
                              >
                                {rec.full_name || "Anonymous Candidate"}
                              </Link>
                              <p className="text-xs text-text-secondary line-clamp-1 mt-0.5">{rec.headline}</p>
                            </div>
                            <span className="inline-flex px-2 py-0.5 bg-accent text-bg-primary text-[10px] font-bold rounded-full">
                              {rec.matchScore} matching skills
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-2.5">
                            {rec.matchingSkills.map((s: string) => (
                              <span
                                key={s}
                                className="px-2 py-0.5 bg-accent/10 border border-accent/20 text-accent text-[10px] font-semibold rounded"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Applications List */}
            <div className="bg-surface border border-border rounded-xl p-6">
              <h2 className="font-display font-bold text-text-primary text-lg mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-accent" /> Job Applications
              </h2>
              {applications.length === 0 ? (
                <p className="text-text-secondary text-sm text-center py-8">
                  No applications received yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {applications.map((app) => (
                    <div
                      key={app.id}
                      className="flex items-center justify-between gap-4 p-3 bg-bg-primary/50 border border-border/80 rounded-lg"
                    >
                      <div>
                        <p className="font-semibold text-sm text-text-primary">
                          {app.user_profile?.full_name || "Candidate"}
                        </p>
                        <p className="text-xs text-text-muted mt-0.5">Applied to: {app.opportunity_title}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleStatusChange(app.id, "shortlisted")}
                          className="p-1.5 bg-success/10 border border-success/20 text-success rounded-lg hover:bg-success/20 transition-colors"
                          title="Shortlist"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleStatusChange(app.id, "rejected")}
                          className="p-1.5 bg-danger/10 border border-danger/20 text-danger rounded-lg hover:bg-danger/20 transition-colors"
                          title="Reject"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
