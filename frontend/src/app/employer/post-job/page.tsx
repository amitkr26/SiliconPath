"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, ArrowLeft, Loader2 } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

export default function PostJobPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useUser();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    organization: "",
    category: "JRF",
    location: "",
    stipend: "",
    deadline: "",
    eligibility: "",
    description: "",
    apply_link: "",
    tagsInput: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirectTo=/employer/post-job");
      return;
    }
    const role = user?.user_metadata?.role;
    if (user && role !== "employer" && role !== "admin") {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.organization) {
      toast.error("Please fill in the title and organization.");
      return;
    }

    try {
      setLoading(true);
      const tags = formData.tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const jobData = {
        title: formData.title,
        organization: formData.organization,
        category: formData.category,
        location: formData.location || null,
        stipend: formData.stipend || null,
        deadline: formData.deadline || null,
        eligibility: formData.eligibility || null,
        description: formData.description || null,
        apply_link: formData.apply_link || null,
        tags,
      };

      await api.post("/api/employer/jobs", jobData);
      toast.success("Job posted successfully and is pending admin verification!");
      router.push("/employer/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Failed to post job");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary text-sm font-medium mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="bg-surface border border-border rounded-xl p-6 sm:p-8">
          <h1 className="font-display text-2xl font-bold text-text-primary flex items-center gap-2 mb-2">
            <Briefcase className="w-6 h-6 text-accent" /> Post an Opportunity
          </h1>
          <p className="text-text-secondary text-sm mb-8">
            Create a JRF position, fellowship, or industry job opening. All posts are verified before going live.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Job Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Junior Research Fellow (JRF)"
                  className="w-full bg-bg-primary border border-border text-text-primary text-sm rounded-lg px-3 py-2.5 outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Organization *</label>
                <input
                  type="text"
                  required
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  placeholder="e.g. CEERI Pilani"
                  className="w-full bg-bg-primary border border-border text-text-primary text-sm rounded-lg px-3 py-2.5 outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-bg-primary border border-border text-text-primary text-sm rounded-lg px-3 py-2.5 outline-none focus:border-accent"
                >
                  <option value="JRF">JRF</option>
                  <option value="PhD">PhD</option>
                  <option value="Govt Job">Govt Job</option>
                  <option value="Private Job">Private Job</option>
                  <option value="Fellowship">Fellowship</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Pilani, Rajasthan"
                  className="w-full bg-bg-primary border border-border text-text-primary text-sm rounded-lg px-3 py-2.5 outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Stipend / Salary</label>
                <input
                  type="text"
                  value={formData.stipend}
                  onChange={(e) => setFormData({ ...formData, stipend: e.target.value })}
                  placeholder="e.g. ₹37,000 + HRA"
                  className="w-full bg-bg-primary border border-border text-text-primary text-sm rounded-lg px-3 py-2.5 outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Application Link (URL)</label>
                <input
                  type="url"
                  value={formData.apply_link}
                  onChange={(e) => setFormData({ ...formData, apply_link: e.target.value })}
                  placeholder="https://example.com/apply"
                  className="w-full bg-bg-primary border border-border text-text-primary text-sm rounded-lg px-3 py-2.5 outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Deadline Date</label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full bg-bg-primary border border-border text-text-primary text-sm rounded-lg px-3 py-2.5 outline-none focus:border-accent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Key Tags (comma separated)</label>
              <input
                type="text"
                value={formData.tagsInput}
                onChange={(e) => setFormData({ ...formData, tagsInput: e.target.value })}
                placeholder="e.g. VLSI, FPGA, Verilog, Digital Electronics"
                className="w-full bg-bg-primary border border-border text-text-primary text-sm rounded-lg px-3 py-2.5 outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Eligibility Criteria</label>
              <textarea
                value={formData.eligibility}
                onChange={(e) => setFormData({ ...formData, eligibility: e.target.value })}
                placeholder="M.Tech/M.E. in Microelectronics/VLSI with qualified GATE score..."
                rows={2}
                className="w-full bg-bg-primary border border-border text-text-primary text-sm rounded-lg px-3 py-2.5 outline-none focus:border-accent resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Job Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Provide details about the research project, requirements, or duties..."
                rows={5}
                className="w-full bg-bg-primary border border-border text-text-primary text-sm rounded-lg px-3 py-2.5 outline-none focus:border-accent resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-accent text-bg-primary hover:bg-accent-hover py-3 rounded-lg font-semibold shadow-glow-btn transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Post Opportunity"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
