"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Briefcase, Plus, Search, Loader2, ExternalLink,
  Edit, Trash2, Eye, PauseCircle, PlayCircle, Users, Copy, Check
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function EmployerJobsPage() {
  const router = useRouter();
  const { user, isEmployer, isAdmin, loading: authLoading } = useUser();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "paused">("all");
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirectTo=/employer/jobs");
      return;
    }
    if (!authLoading && user && !isEmployer && !isAdmin) {
      router.push("/dashboard");
    }
  }, [user, isEmployer, isAdmin, authLoading, router]);

  const loadJobs = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await api.get<{ opportunities: any[] }>("/api/employer/jobs");
      setJobs(res.opportunities || []);
    } catch {
      toast.error("Failed to load job postings");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handleToggleActive = async (job: any) => {
    const nextState = !job.is_active;
    try {
      await api.patch("/api/employer/jobs", { id: job.id, is_active: nextState });
      toast.success(nextState ? "Job activated and live!" : "Job paused.");
      loadJobs();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this job posting? This action cannot be undone.")) return;
    try {
      await api.delete(`/api/employer/jobs?id=${id}`);
      toast.success("Job posting deleted.");
      loadJobs();
    } catch {
      toast.error("Failed to delete posting");
    }
  };

  const handleCopyLink = (slug: string, id: string) => {
    const url = `${window.location.origin}/opportunities/${slug || id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success("Shareable link copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredJobs = jobs.filter((j) => {
    const matchesSearch =
      (j.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (j.location || "").toLowerCase().includes(search.toLowerCase()) ||
      (j.category || "").toLowerCase().includes(search.toLowerCase());

    if (filter === "active") return matchesSearch && j.is_active;
    if (filter === "paused") return matchesSearch && !j.is_active;
    return matchesSearch;
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-bg-primary">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loading Postings...</p>
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
              <Briefcase className="w-7 h-7 text-blue-600" /> Manage Job &amp; Fellowship Postings
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm font-medium">
              View, edit, toggle live status, and monitor incoming applicants for all your positions.
            </p>
          </div>

          <Link
            href="/employer/post-job"
            className="px-5 py-2.5 rounded-xl bg-blue-600 border-2 border-slate-900 text-white text-xs font-black shadow-brutal hover:shadow-brutal-lg hover:bg-blue-700 transition-all flex items-center gap-2 shrink-0 self-start sm:self-center"
          >
            <Plus className="w-4 h-4" /> Post New Position
          </Link>
        </div>

        {/* SEARCH & STATUS FILTER BAR */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 border-2 border-slate-900 rounded-xl shadow-brutal-sm">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, category, location..."
              className="w-full pl-9 pr-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-900 rounded-lg focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            {(["all", "active", "paused"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  filter === f
                    ? "bg-blue-600 text-white border-2 border-slate-900 shadow-brutal-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {f} ({f === "all" ? jobs.length : f === "active" ? jobs.filter((j) => j.is_active).length : jobs.filter((j) => !j.is_active).length})
              </button>
            ))}
          </div>
        </div>

        {/* JOB POSTINGS LIST */}
        {filteredJobs.length === 0 ? (
          <Card className="p-12 text-center space-y-4">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto" />
            <div>
              <h2 className="text-base font-black text-slate-900">No postings found</h2>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                {search ? "No openings match your search filter." : "You haven't posted any positions yet."}
              </p>
            </div>
            <Link
              href="/employer/post-job"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-brutal-sm hover:shadow-brutal"
            >
              <Plus className="w-3.5 h-3.5" /> Post Your First Position
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className="p-5 bg-white border-2 border-slate-900 rounded-2xl shadow-brutal hover:shadow-brutal-lg transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-2 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={job.is_active ? "accent" : "neutral"}>
                      {job.is_active ? "Live & Accepting" : "Paused"}
                    </Badge>
                    <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-300 text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                      {job.category || "JRF"}
                    </span>
                    {job.location && (
                      <span className="text-xs font-semibold text-slate-500">• {job.location}</span>
                    )}
                    {job.salary_range && (
                      <span className="text-xs font-bold text-emerald-700">• {job.salary_range}</span>
                    )}
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-slate-900 hover:text-blue-600 transition-colors">
                    {job.title}
                  </h3>

                  {job.tags && job.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {job.tags.slice(0, 5).map((tag: string) => (
                        <span key={tag} className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-[10px] font-bold text-blue-700">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* RIGHT ACTIONS */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 self-end md:self-center pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 w-full md:w-auto justify-end">
                  <Link
                    href={`/employer/applicants?jobId=${job.id}`}
                    className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-2 border-slate-900 text-xs font-black shadow-brutal-sm hover:shadow-brutal transition-all flex items-center gap-1.5"
                  >
                    <Users className="w-3.5 h-3.5 text-emerald-700" /> View Applicants
                  </Link>

                  <button
                    onClick={() => handleToggleActive(job)}
                    className="p-2 rounded-xl bg-white border-2 border-slate-900 hover:bg-slate-100 text-slate-700 shadow-brutal-sm"
                    title={job.is_active ? "Pause Job" : "Activate Job"}
                  >
                    {job.is_active ? (
                      <PauseCircle className="w-4 h-4 text-amber-600" />
                    ) : (
                      <PlayCircle className="w-4 h-4 text-emerald-600" />
                    )}
                  </button>

                  <button
                    onClick={() => handleCopyLink(job.slug, job.id)}
                    className="p-2 rounded-xl bg-white border-2 border-slate-900 hover:bg-slate-100 text-slate-700 shadow-brutal-sm"
                    title="Copy Public Link"
                  >
                    {copiedId === job.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>

                  <Link
                    href={`/opportunities/${job.slug || job.id}`}
                    className="p-2 rounded-xl bg-white border-2 border-slate-900 hover:bg-slate-100 text-slate-700 shadow-brutal-sm"
                    title="Preview Public Page"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>

                  <button
                    onClick={() => handleDelete(job.id)}
                    className="p-2 rounded-xl bg-white border-2 border-slate-900 hover:bg-red-50 text-red-600 shadow-brutal-sm"
                    title="Delete Job"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
