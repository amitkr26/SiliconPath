"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, ArrowLeft, Loader2 } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";

export default function PostJobPage() {
  const router = useRouter();
  const { user, isEmployer, isAdmin, loading: authLoading } = useUser();
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
    if (!authLoading && user && !isEmployer && !isAdmin) {
      router.push("/dashboard");
    }
  }, [user, isEmployer, isAdmin, authLoading, router]);

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

        <Card className="p-6 sm:p-8">
          <h1 className="font-display text-2xl font-bold text-text-primary flex items-center gap-2 mb-2">
            <Briefcase className="w-6 h-6 text-accent" /> Post an Opportunity
          </h1>
          <p className="text-text-secondary text-sm mb-8">
            Create a JRF position, fellowship, or industry job opening. All posts are verified before going live.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Input
                label="Job Title *"
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Junior Research Fellow (JRF)"
              />

              <Input
                label="Organization *"
                type="text"
                required
                value={formData.organization}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                placeholder="e.g. CEERI Pilani"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <Select
                label="Category *"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="JRF">JRF</option>
                <option value="PhD">PhD</option>
                <option value="Govt Job">Govt Job</option>
                  <option value="Private Job">Private Job</option>
                <option value="Fellowship">Fellowship</option>
              </Select>

              <Input
                label="Location"
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Pilani, Rajasthan"
              />

              <Input
                label="Stipend / Salary"
                type="text"
                value={formData.stipend}
                onChange={(e) => setFormData({ ...formData, stipend: e.target.value })}
                placeholder="e.g. ₹37,000 + HRA"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Input
                label="Application Link (URL)"
                type="url"
                value={formData.apply_link}
                onChange={(e) => setFormData({ ...formData, apply_link: e.target.value })}
                placeholder="https://example.com/apply"
              />

              <Input
                label="Deadline Date"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>

            <Input
              label="Key Tags (comma separated)"
              type="text"
              value={formData.tagsInput}
              onChange={(e) => setFormData({ ...formData, tagsInput: e.target.value })}
              placeholder="e.g. VLSI, FPGA, Verilog, Digital Electronics"
            />

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">Eligibility Criteria</label>
              <textarea
                value={formData.eligibility}
                onChange={(e) => setFormData({ ...formData, eligibility: e.target.value })}
                placeholder="M.Tech/M.E. in Microelectronics/VLSI with qualified GATE score..."
                rows={2}
                className="w-full bg-white border-2 border-slate-900 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 shadow-brutal-sm focus:outline-none focus:border-accent resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">Job Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Provide details about the research project, requirements, or duties..."
                rows={5}
                className="w-full bg-white border-2 border-slate-900 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 shadow-brutal-sm focus:outline-none focus:border-accent resize-none"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full justify-center"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Post Opportunity"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
