"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  Briefcase, ArrowLeft, Loader2, Save, Plus
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function EmployerEditJobPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.id as string;

  const { user, isEmployer, isAdmin, loading: authLoading } = useUser();
  const [formData, setFormData] = useState({
    title: "",
    category: "JRF",
    location: "",
    stipend: "",
    deadline: "",
    eligibility: "",
    description: "",
    tagsInput: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirectTo=/employer/jobs/${jobId}/edit`);
      return;
    }
    if (!authLoading && user && !isEmployer && !isAdmin) {
      router.push("/dashboard");
    }
  }, [user, isEmployer, isAdmin, authLoading, router, jobId]);

  const loadJob = useCallback(async () => {
    if (!jobId || !user) return;
    try {
      setLoading(true);
      const res = await api.get<{ job: any }>(`/api/employer/jobs/${jobId}`);
      if (res.job) {
        setFormData({
          title: res.job.title || "",
          category: res.job.category || "JRF",
          location: res.job.location || "",
          stipend: res.job.salary_range || "",
          deadline: res.job.deadline || "",
          eligibility: res.job.eligibility || "",
          description: res.job.description || "",
          tagsInput: (res.job.tags || []).join(", "),
        });
      }
    } catch {
      toast.error("Failed to load job for editing");
    } finally {
      setLoading(false);
    }
  }, [jobId, user]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      toast.error("Title is required");
      return;
    }

    try {
      setSaving(true);
      const tags = formData.tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      await api.patch(`/api/employer/jobs/${jobId}`, {
        title: formData.title,
        category: formData.category,
        location: formData.location || null,
        stipend: formData.stipend || null,
        deadline: formData.deadline || null,
        eligibility: formData.eligibility || null,
        description: formData.description || null,
        tags,
      });

      toast.success("Position updated successfully!");
      router.push(`/employer/jobs/${jobId}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update position");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-bg-primary">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-xs font-bold text-slate-500 uppercase">Loading Editor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary py-8 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* HEADER */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href={`/employer/jobs/${jobId}`} className="text-xs font-bold text-slate-500 hover:text-blue-600">
              ← Back to Job Details
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Briefcase className="w-7 h-7 text-blue-600" /> Edit Position
          </h1>
        </div>

        {/* EDIT FORM */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6 sm:p-8 space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Job / Fellowship Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                >
                  <option value="JRF">Junior Research Fellow (JRF)</option>
                  <option value="SRF">Senior Research Fellow (SRF)</option>
                  <option value="PhD">PhD / Doctoral Fellowship</option>
                  <option value="government">Government / Industry VLSI</option>
                  <option value="internship">Semiconductor Internship</option>
                  <option value="fellowship">Post-Doc Fellowship</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Location / Lab Site
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Stipend / Salary
                </label>
                <input
                  type="text"
                  value={formData.stipend}
                  onChange={(e) => setFormData({ ...formData, stipend: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Application Deadline
                </label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Eligibility &amp; GATE/NET Criteria
              </label>
              <input
                type="text"
                value={formData.eligibility}
                onChange={(e) => setFormData({ ...formData, eligibility: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Skill Tags (Comma separated)
              </label>
              <input
                type="text"
                value={formData.tagsInput}
                onChange={(e) => setFormData({ ...formData, tagsInput: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Detailed Scope of Work &amp; Project Description
              </label>
              <textarea
                rows={5}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <Button variant="ghost" type="button" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving} size="lg">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Changes</span>
              </Button>
            </div>
          </Card>
        </form>

      </div>
    </div>
  );
}
